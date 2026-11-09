// QuickTiny JWT Decoder — decode header/payload, explain claims and times, flag risky tokens,
// verify signatures (HS/RS/PS/ES) with WebCrypto, and sign HS256 test tokens. Nothing leaves the browser.

function qtB64uToBytes(s) {
  s = String(s).replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  while (s.length % 4) s += "=";
  var bin = atob(s), out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function qtBytesToB64u(bytes) {
  var bin = ""; bytes = new Uint8Array(bytes);
  for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function qtUtf8(bytes) { return new TextDecoder().decode(bytes); }

// Parses a compact JWT/JWS/JWE. Throws with a helpful message.
function qtJwtParse(token) {
  var t = String(token).trim().replace(/^Bearer\s+/i, "");
  var parts = t.split(".");
  if (parts.length === 5) {
    var h5 = JSON.parse(qtUtf8(qtB64uToBytes(parts[0])));
    return { kind: "jwe", header: h5, parts: parts, token: t };
  }
  if (parts.length !== 3) throw new Error("A JWT has 3 parts separated by dots — this has " + parts.length + ".");
  var header, payload, payloadText;
  try { header = JSON.parse(qtUtf8(qtB64uToBytes(parts[0]))); } catch (e) { throw new Error("The header (part 1) is not valid Base64URL JSON."); }
  try { payloadText = qtUtf8(qtB64uToBytes(parts[1])); } catch (e) { throw new Error("The payload (part 2) is not valid Base64URL."); }
  try { payload = JSON.parse(payloadText); } catch (e) { payload = null; }
  return { kind: "jws", header: header, payload: payload, payloadText: payloadText, parts: parts, token: t, signature: parts[2] };
}

var QT_JWT_CLAIMS = {
  iss: "Issuer — who created and signed the token", sub: "Subject — who the token is about (usually the user ID)",
  aud: "Audience — who the token is meant for", exp: "Expires at", nbf: "Not valid before", iat: "Issued at",
  jti: "JWT ID — unique ID, used to prevent replay", azp: "Authorized party — the client the token was issued to",
  scope: "Scopes — what the token is allowed to do", scp: "Scopes", roles: "Roles", groups: "Groups", email: "Email address",
  email_verified: "Whether the email was verified", name: "Full name", given_name: "First name", family_name: "Last name",
  preferred_username: "Username", nonce: "Nonce — links the token to a login request", auth_time: "Time the user authenticated",
  sid: "Session ID", tid: "Tenant ID (Azure AD)", oid: "Object ID (Azure AD)", amr: "Authentication methods used", acr: "Authentication context class",
  at_hash: "Access-token hash", c_hash: "Code hash", client_id: "Client ID", typ: "Token type", alg: "Signing algorithm",
  kid: "Key ID — which key signed this token", cty: "Content type", jku: "URL of the signing key set", x5u: "URL of the signing certificate", x5t: "Certificate thumbprint"
};
var QT_JWT_TIME = { exp: 1, nbf: 1, iat: 1, auth_time: 1, updated_at: 1 };

function qtRel(sec) {
  var a = Math.abs(sec), s;
  if (a < 60) s = Math.round(a) + " s"; else if (a < 3600) s = Math.round(a / 60) + " min"; else if (a < 86400) s = (a / 3600).toFixed(a < 36000 ? 1 : 0) + " h"; else if (a < 86400 * 365) s = Math.round(a / 86400) + " days"; else s = (a / 86400 / 365).toFixed(1) + " years";
  return sec >= 0 ? "in " + s : s + " ago";
}

// Status + human-friendly warnings for a parsed token at `now` (seconds).
function qtJwtAnalyze(p, now) {
  var w = [], st = { state: "nodates", text: "No expiry (exp) — this token never expires" };
  if (p.kind === "jwe") return { status: { state: "jwe", text: "Encrypted token (JWE) — the payload can only be read with the private key" }, warnings: [] };
  var h = p.header || {}, c = p.payload || {}, alg = String(h.alg || "");
  if (!alg || alg.toLowerCase() === "none") w.push(["bad", 'Algorithm is "none" — the token is unsigned and anyone can forge it. Never accept it on a server.']);
  if (alg.toLowerCase() === "none" && p.signature) w.push(["bad", "alg is none but a signature is present — a classic tampering sign."]);
  if (p.payload === null) w.push(["warn", "The payload is not JSON — shown as text."]);
  if (typeof c.exp === "number") {
    if (c.exp < now) st = { state: "expired", text: "Expired " + qtRel(c.exp - now).replace(" ago", "") + " ago" };
    else st = { state: "valid", text: "Not expired — expires " + qtRel(c.exp - now) };
    if (typeof c.iat === "number" && c.exp - c.iat > 86400 * 30) w.push(["warn", "Long lifetime: valid for " + Math.round((c.exp - c.iat) / 86400) + " days. Access tokens are usually minutes to hours."]);
  } else if (p.payload) w.push(["warn", "No exp claim — if this token leaks it works forever unless the server revokes it."]);
  if (typeof c.nbf === "number" && c.nbf > now) st = { state: "early", text: "Not valid yet — becomes valid " + qtRel(c.nbf - now) };
  if (typeof c.iat === "number" && c.iat > now + 300) w.push(["warn", "Issued in the future (iat) — the issuer's clock may be wrong."]);
  ["exp", "nbf", "iat"].forEach(function (k) { if (typeof c[k] === "number" && c[k] > 1e11) w.push(["warn", k + " looks like milliseconds — JWT times must be in seconds."]); if (k in c && typeof c[k] !== "number") w.push(["warn", k + " should be a number (seconds since 1970)."]); });
  var sens = Object.keys(c).filter(function (k) { return /pass(word)?|secret|ssn|card|cvv|iban|private/i.test(k); });
  if (sens.length) w.push(["bad", "Sensitive-looking field" + (sens.length > 1 ? "s" : "") + " in the payload: " + sens.join(", ") + ". JWT payloads are only encoded, not encrypted — anyone with the token can read them."]);
  if (/^HS/.test(alg) && p.signature && p.signature.length < 40) w.push(["warn", "Unusually short signature."]);
  if (h.jku || h.x5u) w.push(["warn", "Header points to a remote key URL (" + (h.jku ? "jku" : "x5u") + "). Servers must only trust allow-listed URLs."]);
  return { status: st, warnings: w };
}

var QT_JWT_ALGS = {
  HS256: { name: "HMAC", hash: "SHA-256" }, HS384: { name: "HMAC", hash: "SHA-384" }, HS512: { name: "HMAC", hash: "SHA-512" },
  RS256: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, RS384: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-384" }, RS512: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" },
  PS256: { name: "RSA-PSS", hash: "SHA-256", saltLength: 32 }, PS384: { name: "RSA-PSS", hash: "SHA-384", saltLength: 48 }, PS512: { name: "RSA-PSS", hash: "SHA-512", saltLength: 64 },
  ES256: { name: "ECDSA", hash: "SHA-256", namedCurve: "P-256" }, ES384: { name: "ECDSA", hash: "SHA-384", namedCurve: "P-384" }, ES512: { name: "ECDSA", hash: "SHA-512", namedCurve: "P-521" }
};

function qtPemToDer(pem) {
  var b = pem.replace(/-----BEGIN [^-]+-----/, "").replace(/-----END [^-]+-----/, "").replace(/\s+/g, "");
  var bin = atob(b), out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

// Verify signature. key: secret string (HS*, optionally base64) or PEM/JWK public key text.
async function qtJwtVerify(p, keyText, opts) {
  opts = opts || {};
  var alg = String(p.header.alg || ""), spec = QT_JWT_ALGS[alg];
  if (!spec) throw new Error(alg && alg.toLowerCase() !== "none" ? "Algorithm " + alg + " isn't supported by browser crypto." : "Unsigned token (alg none) — nothing to verify.");
  var subtle = (typeof crypto !== "undefined" && crypto.subtle) || require("crypto").webcrypto.subtle;
  var data = new TextEncoder().encode(p.parts[0] + "." + p.parts[1]), sig = qtB64uToBytes(p.parts[2]), key;
  if (spec.name === "HMAC") {
    var raw = opts.b64 ? qtB64uToBytes(keyText.trim()) : new TextEncoder().encode(keyText);
    key = await subtle.importKey("raw", raw, { name: "HMAC", hash: spec.hash }, false, ["verify"]);
    return subtle.verify("HMAC", key, sig, data);
  }
  var imp = { name: spec.name, hash: spec.hash }; if (spec.namedCurve) imp.namedCurve = spec.namedCurve;
  var kt = keyText.trim();
  if (kt.charAt(0) === "{") {
    var jwk = JSON.parse(kt); if (jwk.keys) jwk = jwk.keys.filter(function (k) { return !p.header.kid || k.kid === p.header.kid; })[0] || jwk.keys[0];
    jwk = Object.assign({}, jwk); delete jwk.alg; delete jwk.use; delete jwk.key_ops;
    key = await subtle.importKey("jwk", jwk, imp, false, ["verify"]);
  } else if (/BEGIN (RSA )?PUBLIC KEY|BEGIN CERTIFICATE/.test(kt)) {
    if (/BEGIN RSA PUBLIC KEY/.test(kt)) throw new Error('This is a PKCS#1 "RSA PUBLIC KEY". Convert it to "PUBLIC KEY" (SPKI) or paste the JWK.');
    if (/BEGIN CERTIFICATE/.test(kt)) throw new Error("Paste the public key, not the certificate (or the JWK from the issuer's jwks_uri).");
    key = await subtle.importKey("spki", qtPemToDer(kt), imp, false, ["verify"]);
  } else throw new Error("Paste a PEM public key (-----BEGIN PUBLIC KEY-----) or a JWK / JWKS JSON.");
  var params = { name: spec.name }; if (spec.saltLength) params.saltLength = spec.saltLength; if (spec.name === "ECDSA") params.hash = spec.hash;
  return subtle.verify(params, key, sig, data);
}

async function qtJwtSignHS(header, payload, secret, b64) {
  var subtle = (typeof crypto !== "undefined" && crypto.subtle) || require("crypto").webcrypto.subtle;
  var spec = QT_JWT_ALGS[header.alg]; if (!spec || spec.name !== "HMAC") throw new Error("Test tokens can be signed with HS256, HS384 or HS512.");
  var enc = function (o) { return qtBytesToB64u(new TextEncoder().encode(JSON.stringify(o))); };
  var input = enc(header) + "." + enc(payload);
  var key = await subtle.importKey("raw", b64 ? qtB64uToBytes(secret.trim()) : new TextEncoder().encode(secret), { name: "HMAC", hash: spec.hash }, false, ["sign"]);
  return input + "." + qtBytesToB64u(await subtle.sign("HMAC", key, new TextEncoder().encode(input)));
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var cur = null, tick = null;
  var SAMPLE_SECRET = "your-256-bit-secret";

  function jsonHtml(o) {
    return esc(JSON.stringify(o, null, 2)).replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi, function (m, s, colon, lit, num) {
      if (s) return colon ? '<span class="jw-k">' + s + "</span>" + colon : '<span class="jw-s">' + s + "</span>";
      if (lit) return '<span class="jw-l">' + lit + "</span>";
      return '<span class="jw-n">' + num + "</span>";
    });
  }
  function claimRows(obj, isHeader) {
    var now = Date.now() / 1000;
    return Object.keys(obj).map(function (k) {
      var v = obj[k], val = typeof v === "object" ? JSON.stringify(v) : String(v), extra = "";
      if (!isHeader && QT_JWT_TIME[k] && typeof v === "number") {
        var d = new Date(v * 1000);
        extra = '<div class="jw-time">' + esc(d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" })) + " · " + esc(d.toISOString().replace(".000", "")) + ' · <b>' + qtRel(v - now) + "</b></div>";
      }
      return "<tr><td><code>" + esc(k) + "</code></td><td><div class=\"jw-v\">" + esc(val.length > 300 ? val.slice(0, 300) + "…" : val) + "</div>" + extra + "</td><td>" + esc(QT_JWT_CLAIMS[k] || "") + "</td></tr>";
    }).join("");
  }
  function render() {
    var t = $("jwIn").value.trim();
    $("jwVerifyOut").textContent = ""; $("jwVerifyOut").className = "jw-verify";
    if (!t) { cur = null; $("jwOut").hidden = true; $("jwErr").textContent = ""; $("jwColor").innerHTML = ""; return; }
    try { cur = qtJwtParse(t); } catch (e) { cur = null; $("jwOut").hidden = true; $("jwErr").textContent = e.message; $("jwColor").innerHTML = ""; return; }
    $("jwErr").textContent = "";
    var ps = cur.parts;
    $("jwColor").innerHTML = cur.kind === "jwe" ? ps.map(function (x, i) { return '<span class="jw-p' + Math.min(i, 2) + '">' + esc(x) + "</span>"; }).join('<span class="jw-dot">.</span>')
      : '<span class="jw-p0">' + esc(ps[0]) + '</span><span class="jw-dot">.</span><span class="jw-p1">' + esc(ps[1]) + '</span><span class="jw-dot">.</span><span class="jw-p2">' + esc(ps[2]) + "</span>";
    $("jwOut").hidden = false;
    var a = qtJwtAnalyze(cur, Date.now() / 1000);
    $("jwStatus").className = "jw-status jw-" + a.status.state; $("jwStatus").textContent = a.status.text;
    $("jwWarn").innerHTML = a.warnings.map(function (w) { return '<li class="jw-' + w[0] + '">' + esc(w[1]) + "</li>"; }).join("");
    $("jwHeader").innerHTML = jsonHtml(cur.header);
    $("jwHeaderTable").innerHTML = claimRows(cur.header, true);
    if (cur.kind === "jwe") { $("jwPayload").textContent = "(encrypted)"; $("jwClaims").innerHTML = ""; $("jwVerifyBox").hidden = true; return; }
    $("jwVerifyBox").hidden = false;
    $("jwPayload").innerHTML = cur.payload ? jsonHtml(cur.payload) : esc(cur.payloadText);
    $("jwClaims").innerHTML = cur.payload && typeof cur.payload === "object" ? claimRows(cur.payload) : "";
    var alg = String(cur.header.alg || "");
    $("jwAlg").textContent = alg || "none";
    var hs = /^HS/.test(alg);
    $("jwKeyLabel").textContent = hs ? "Secret" : "Public key (PEM) or JWK / JWKS";
    $("jwKey").placeholder = hs ? "The shared secret the token was signed with" : "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----\n\nor {\"kty\":\"RSA\",\"n\":\"…\",\"e\":\"AQAB\"}";
    $("jwB64Wrap").hidden = !hs;
    if ($("jwKey").value) verify();
    $("jwEditHeader").value = JSON.stringify(Object.assign({}, cur.header, /^HS/.test(alg) ? {} : { alg: "HS256" }), null, 2);
    $("jwEditPayload").value = cur.payload ? JSON.stringify(cur.payload, null, 2) : "{}";
  }
  function verify() {
    if (!cur || cur.kind !== "jws") return;
    var k = $("jwKey").value; if (!k) { $("jwVerifyOut").textContent = ""; return; }
    qtJwtVerify(cur, k, { b64: $("jwB64").checked }).then(function (ok) {
      $("jwVerifyOut").className = "jw-verify " + (ok ? "jw-ok" : "jw-bad");
      $("jwVerifyOut").textContent = ok ? "✓ Signature verified — this token was signed with this key and hasn't been changed." : "✗ Invalid signature — wrong key, or the token was modified.";
      qtTrack("jwt_verify", { ok: ok ? 1 : 0 });
    }).catch(function (e) { $("jwVerifyOut").className = "jw-verify jw-bad"; $("jwVerifyOut").textContent = e.message || String(e); });
  }
  function sign() {
    var h, pl;
    try { h = JSON.parse($("jwEditHeader").value); pl = JSON.parse($("jwEditPayload").value); } catch (e) { $("jwSignErr").textContent = "Header and payload must be valid JSON."; return; }
    $("jwSignErr").textContent = "";
    qtJwtSignHS(h, pl, $("jwSignSecret").value, false).then(function (tok) { $("jwIn").value = tok; $("jwKey").value = $("jwSignSecret").value; $("jwB64").checked = false; render(); window.scrollTo({ top: $("tool").offsetTop - 20, behavior: "smooth" }); qtTrack("jwt_sign"); })
      .catch(function (e) { $("jwSignErr").textContent = e.message; });
  }
  function demo() {
    var now = Math.floor(Date.now() / 1000);
    qtJwtSignHS({ alg: "HS256", typ: "JWT" }, { sub: "1234567890", name: "Ada Lovelace", email: "ada@example.com", roles: ["admin"], iat: now - 600, exp: now + 3000, iss: "https://auth.example.com", aud: "quicktiny-demo" }, SAMPLE_SECRET)
      .then(function (t) { $("jwIn").value = t; $("jwKey").value = SAMPLE_SECRET; render(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("jwIn").addEventListener("input", render);
    $("jwKey").addEventListener("input", verify);
    $("jwB64").addEventListener("change", verify);
    $("jwDemo").addEventListener("click", demo);
    $("jwClear").addEventListener("click", function () { $("jwIn").value = ""; $("jwKey").value = ""; render(); $("jwIn").focus(); });
    $("jwCopyPayload").addEventListener("click", function () { if (cur) qtCopy(cur.payload ? JSON.stringify(cur.payload, null, 2) : cur.payloadText || "", $("jwCopyStatus"), "Payload copied"); });
    $("jwCopyHeader").addEventListener("click", function () { if (cur) qtCopy(JSON.stringify(cur.header, null, 2), $("jwCopyStatus"), "Header copied"); });
    $("jwSign").addEventListener("click", sign);
    var hand = typeof qtHandoffConsume === "function" ? qtHandoffConsume("/jwt-decoder") : null;
    if (hand && hand.value) $("jwIn").value = hand.value;
    if ($("jwIn").value) render(); else demo();
    tick = setInterval(function () { if (cur && cur.payload && typeof cur.payload.exp === "number") { var a = qtJwtAnalyze(cur, Date.now() / 1000); $("jwStatus").textContent = a.status.text; $("jwStatus").className = "jw-status jw-" + a.status.state; } }, 15000);
  });
})();

if (typeof module !== "undefined") module.exports = { qtJwtParse: qtJwtParse, qtJwtAnalyze: qtJwtAnalyze, qtJwtVerify: qtJwtVerify, qtJwtSignHS: qtJwtSignHS, qtB64uToBytes: qtB64uToBytes, qtBytesToB64u: qtBytesToB64u };
