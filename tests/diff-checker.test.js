const ROOT = require("path").join(__dirname, "..");
const fs = require("fs"), path = require("path"), cp = require("child_process");
const D = require(ROOT + "/diff-checker.js");
const dir = fs.mkdtempSync(path.join(require("os").tmpdir(), "qt-diff-"));
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const words = ["alpha", "beta", "gamma", "delta", "x", "}", "{", "return 1;", "", "const a = 2;"];
function randText(n) { return Array.from({ length: n }, () => words[Math.floor(rnd() * words.length)]).join("\n") + "\n"; }
function mutate(t) {
  const l = t.split("\n"); l.pop();
  const k = Math.floor(rnd() * 8);
  for (let i = 0; i < k; i++) {
    const p = Math.floor(rnd() * (l.length + 1)), r = rnd();
    if (r < 0.33) l.splice(p, 1); else if (r < 0.66) l.splice(p, 0, words[Math.floor(rnd() * words.length)] + i); else l[p] = (l[p] || "") + " edited";
  }
  return l.join("\n") + "\n";
}
// minimality sanity: edit distance from ops vs DP LCS
function lcs(a, b) { const dp = Array.from({ length: a.length + 1 }, () => new Int32Array(b.length + 1)); for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]); return dp[a.length][b.length]; }
let ok = 0, fail = 0, minimal = 0;
for (let t = 0; t < 120; t++) {
  const A = randText(5 + Math.floor(rnd() * 60)), B = rnd() < 0.1 ? A : mutate(A);
  const r = D.qtDiffText(A, B, {});
  if (r.same === lcs(r.a, r.b)) minimal++;
  const patch = D.qtUnifiedPatch(r, "f.txt", "f.txt");
  fs.writeFileSync(path.join(dir, "f.txt"), A);
  if (!patch) { if (A === B) ok++; else { fail++; console.log("empty patch but differ", t); } continue; }
  fs.writeFileSync(path.join(dir, "p.patch"), patch);
  try { cp.execSync("git -c core.autocrlf=false apply p.patch", { cwd: dir, stdio: "pipe" }); } catch (e) { fail++; console.log("apply failed", t, String(e.stderr)); if (fail > 3) break; continue; }
  const got = fs.readFileSync(path.join(dir, "f.txt"), "utf8");
  if (got === B) ok++; else { fail++; console.log("mismatch", t); }
}
console.log("patch apply ok", ok, "fail", fail, "| minimal (LCS-optimal)", minimal, "/120");
console.log(JSON.stringify(D.qtWordDiff("The quick brown fox jumps", "The quick red fox leaps")));
const j = D.qtDiffText('{"b":1,"a":[1,2]}', '{"a":[1,2],"b":1}', { json: true });
console.log("json reorder diff:", j.added, j.removed);
const big = randText(20000), big2 = mutate(big); let t0 = Date.now(); const rb = D.qtDiffText(big, big2, {}); console.log("20k lines:", Date.now() - t0, "ms", rb.added, rb.removed);
if (fail || minimal !== 120 || j.added || j.removed) process.exitCode = 1;
