// Guards the pinned AI models: every model in asr-worker.js has an exact 40-char commit, and the daily
// health check (tools/check_assets.mjs) verifies that same commit — so the two can't drift apart.
const fs = require("fs"), path = require("path"), assert = require("assert");
const ROOT = path.join(__dirname, "..");
const worker = fs.readFileSync(path.join(ROOT, "asr-worker.js"), "utf8");
const checker = fs.readFileSync(path.join(ROOT, "tools/check_assets.mjs"), "utf8");
let n = 0;
const pins = [...worker.matchAll(/id:\s*"([^"]+)",\s*rev:\s*"([^"]*)"/g)].map((m) => ({ id: m[1], rev: m[2] }));
assert.ok(pins.length >= 2, "models listed with id + rev"); n++;
for (const p of pins) {
  assert.ok(/^[0-9a-f]{40}$/.test(p.rev), p.id + " is pinned to a full commit hash"); n++;
  assert.ok(checker.includes(`"${p.id}", "${p.rev}"`), p.id + "@" + p.rev + " is health-checked"); n++;
}
assert.ok(/revision:\s*m\.rev/.test(worker), "revision is passed to the pipeline"); n++;
// every versioned CDN library the browser code imports is checked daily
for (const f of ["asr-worker.js", "clipper.js"]) {
  const src = fs.readFileSync(path.join(ROOT, f), "utf8");
  for (const m of src.matchAll(/https:\/\/cdn\.jsdelivr\.net\/npm\/([^"'\s]+?\.(?:m?js))/g)) { assert.ok(checker.includes(m[1].replace(/^/, "")), f + ": " + m[1] + " is health-checked"); n++; }
}
console.log("asset pin tests:", n, "passed");
