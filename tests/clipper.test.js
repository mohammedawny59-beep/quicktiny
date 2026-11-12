// Tests for clipper.js: hook scoring, sentences, candidate scoring/picking, titles, split points, virtual camera.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const C = require(ROOT + "/clipper.js");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(C.qtClHook("Why do most creators fail?") > C.qtClHook("The weather was fine yesterday."), "question + hook words beat filler");
ok(C.qtClHook("ليش أغلب صناع المحتوى يفشلون؟") >= 3, "Arabic hook");
ok(C.qtClHook("and then we went home") < 0, "leading connector penalised");
ok(C.qtClHook("The 3 biggest mistakes") > C.qtClHook("The big mistakes"), "numbers help");
// build words: sentence timeline with a pause
const mk = (text, t0, pace) => text.split(" ").map((w, i) => ({ w, start: t0 + i / pace, end: t0 + (i + .9) / pace }));
let words = [].concat(mk("Hello and welcome everyone.", 0, 2.5), mk("So today we talk about money.", 2.2, 2.5), mk("Why do most creators fail in their first year?", 6, 2.8), mk("The biggest mistake is posting without a hook.", 10, 2.8), mk("Here is the simple fix that works every time.", 14, 2.8), mk("and that was it.", 19, 2.5));
const s = C.qtClSentences(words);
assert.strictEqual(s.length, 6); n++;
ok(s[2].text.startsWith("Why"), "sentence text");
const cands = C.qtClCandidates(s, { min: 6, max: 14, target: 10, energy: null });
ok(cands.length > 0 && cands.every((c) => c.dur >= 6 && c.dur <= 14), "candidate lengths in range");
const best = cands.slice().sort((a, b) => b.score - a.score)[0];
assert.strictEqual(s[best.s].text.split(" ")[0], "Why", "best clip starts on the hook"); n++;
const picked = C.qtClRate(C.qtClPick(cands, 3));
ok(picked.length >= 1 && picked.every((p, i) => i === 0 || p.start >= picked[i - 1].end), "non-overlapping, sorted by time");
ok(picked.every((p) => p.rating >= 72 && p.rating <= 98), "rating range");
const title = C.qtClTitle(s, best);
ok(/^Why do most creators fail/.test(title) && title.split(" ").length <= 10, "title from hook sentence: " + title);
// split points land in the quietest spot near each mark
const lv = new Array(5000).fill(-20); lv[3100] = -80; lv[6000 - 1000 - 1] = -20; // win .02 → 100 s; quiet at 62 s
const pts = C.qtClSplits(lv, .02, 100, 60);
ok(pts.length === 3 && Math.abs(pts[1] - 62) < .05 && pts[0] === 0 && pts[2] === 100, "split at quiet point: " + pts);
// virtual camera: ignores jitter inside the dead zone, follows big moves smoothly, holds through missing faces
const samples = [0, .33, .66, 1, 1.33, 1.66, 2, 2.33].map((t, i) => ({ t, x: [.5, .52, .49, .51, null, .8, .8, .8][i] }));
const cam = C.qtClCamera(samples, { dead: .05, k: .5 });
ok(cam.slice(0, 5).every((c) => Math.abs(c.x - .5) < 1e-9), "jitter + missing face: camera stays put");
ok(cam[5].x > .5 && cam[5].x < .8 && cam[7].x > cam[5].x, "moves towards the new position smoothly");
ok(Math.abs(C.qtClCamAt(cam, 0) - .5) < 1e-9 && C.qtClCamAt(cam, 99) === cam[7].x, "clamped lookup");
const mid = C.qtClCamAt(cam, 1.66 + .165); ok(mid > cam[5].x && mid < cam[6].x, "interpolates between keyframes");
console.log("clipper tests:", n, "passed");
