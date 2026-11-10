const ROOT = require("path").join(__dirname, "..");
const J = require(ROOT + "/jwt-decoder.js");
const nc = require("crypto");
const b64u = (b) => Buffer.from(b).toString("base64url");
const enc = (o) => b64u(JSON.stringify(o));
let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) pass++; else { fail++; console.log("FAIL", name); } };
(async () => {
  // Well-known jwt.io sample
  const io = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  const p = J.qtJwtParse("Bearer " + io);
  check("parse name", p.payload.name === "John Doe");
  check("hs256 good", await J.qtJwtVerify(p, "your-256-bit-secret"));
  check("hs256 bad", !(await J.qtJwtVerify(p, "wrong")));
  // Our signer vs node's HMAC
  const t = await J.qtJwtSignHS({ alg: "HS512", typ: "JWT" }, { a: "مرحبا" }, "s3cret");
  const [h, pl, sg] = t.split(".");
  check("hs512 matches node", sg === nc.createHmac("sha512", "s3cret").update(h + "." + pl).digest("base64url"));
  check("utf8 payload", J.qtJwtParse(t).payload.a === "مرحبا");
  // base64 secret
  const sec = nc.randomBytes(32);
  const t2h = enc({ alg: "HS256" }), t2p = enc({ x: 1 });
  const t2 = t2h + "." + t2p + "." + nc.createHmac("sha256", sec).update(t2h + "." + t2p).digest("base64url");
  check("hs256 b64 secret", await J.qtJwtVerify(J.qtJwtParse(t2), sec.toString("base64"), { b64: true }));
  // Asymmetric: sign with node, verify with ours (PEM and JWK)
  const algs = [["RS256", "rsa", {}, "sha256", {}], ["RS512", "rsa", {}, "sha512", {}], ["PS256", "rsa", {}, "sha256", { padding: nc.constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }],
    ["ES256", "ec", { namedCurve: "P-256" }, "sha256", { dsaEncoding: "ieee-p1363" }], ["ES384", "ec", { namedCurve: "P-384" }, "sha384", { dsaEncoding: "ieee-p1363" }], ["ES512", "ec", { namedCurve: "P-521" }, "sha512", { dsaEncoding: "ieee-p1363" }]];
  for (const [alg, type, kopt, hash, sopt] of algs) {
    const { publicKey, privateKey } = nc.generateKeyPairSync(type, type === "rsa" ? { modulusLength: 2048 } : kopt);
    const hh = enc({ alg, typ: "JWT", kid: "k1" }), pp = enc({ sub: "u1", exp: 2e9 });
    const sig = nc.sign(hash, Buffer.from(hh + "." + pp), { key: privateKey, ...sopt });
    const tok = J.qtJwtParse(hh + "." + pp + "." + b64u(sig));
    const pem = publicKey.export({ type: "spki", format: "pem" });
    const jwk = JSON.stringify({ keys: [{ ...publicKey.export({ format: "jwk" }), kid: "k1", alg, use: "sig" }] });
    check(alg + " pem", await J.qtJwtVerify(tok, pem));
    check(alg + " jwks", await J.qtJwtVerify(tok, jwk));
    const bad = J.qtJwtParse(hh + "." + enc({ sub: "admin", exp: 2e9 }) + "." + b64u(sig));
    check(alg + " tampered", !(await J.qtJwtVerify(bad, pem)));
  }
  // Analysis
  const now = 1_800_000_000;
  const A = (pl, hd = { alg: "HS256" }) => J.qtJwtAnalyze(J.qtJwtParse(enc(hd) + "." + enc(pl) + ".sig"), now);
  check("expired", A({ exp: now - 7200 }).status.state === "expired");
  check("valid", A({ exp: now + 60 }).status.state === "valid");
  check("nbf", A({ exp: now + 600, nbf: now + 300 }).status.state === "early");
  check("none alg", A({ exp: now + 60 }, { alg: "none" }).warnings.some((w) => w[0] === "bad"));
  check("ms times", A({ exp: now * 1000 }).warnings.some((w) => /milliseconds/.test(w[1])));
  check("sensitive", A({ password: "x", exp: now + 5 }).warnings.some((w) => /password/.test(w[1])));
  check("no exp", A({ sub: 1 }).warnings.some((w) => /No exp/.test(w[1])));
  check("jwe", J.qtJwtAnalyze(J.qtJwtParse(enc({ alg: "RSA-OAEP", enc: "A256GCM" }) + ".a.b.c.d"), now).status.state === "jwe");
  let threw = false; try { J.qtJwtParse("abc.def"); } catch (e) { threw = /3 parts/.test(e.message); } check("2 parts error", threw);
  console.log("JWT tests:", pass, "passed,", fail, "failed");
  if (fail) process.exitCode = 1;
})();
