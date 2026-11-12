// Tests for gta-clips.js (Clip Studio highlight finding + punch zoom).
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const C = require(ROOT + "/gta-clips.js");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(C.qtGcMedian([3, 1, 2]) === 2 && C.qtGcMedian([4, 1, 2, 3]) === 2.5 && C.qtGcMedian([]) === 0, "median");
// 4 minutes of quiet-ish gameplay (-30 dB with noise) at 0.25 s steps, with an explosion at 60 s and a bigger one at 170 s
const step = .25, dur = 240, N = dur / step, lv = [], mo = [];
for (let i = 0; i < N; i++) { lv.push(-30 + Math.sin(i * 1.7) * 2); mo.push(5 + Math.cos(i) * 1); }
const boom = (t, db, m) => { for (let k = 0; k < 8; k++) { lv[t / step + k] = db - k; mo[t / step + k] = m; } };
boom(60, -6, 30); boom(170, -2, 40);
const sc = C.qtGcScore(lv, mo);
ok(sc.length === N, "score per step");
ok(sc[170 / step + 1] > sc[100 / step] + 1 && sc[60 / step + 1] > sc[100 / step] + 1, "explosions score high");
let p = C.qtGcPick(sc, step, dur, 30, 3);
ok(p.length === 3, "three clips");
ok(p[0].peak >= 169 && p[0].peak <= 172, "best clip is the bigger explosion");
ok(p[0].a < p[0].peak && p[0].b > p[0].peak && Math.abs((p[0].peak - p[0].a) / 30 - .65) < .05, "peak lands ~65% into the clip");
ok(p.some((c) => c.peak >= 59 && c.peak <= 62), "second explosion picked too");
ok(p.every((c, i) => p.every((d, j) => i === j || c.b + 1 <= d.a || d.b + 1 <= c.a)), "no overlapping clips");
ok(p.every((c) => c.a >= 0 && c.b <= dur && Math.abs(c.b - c.a - 30) < 1e-6), "clips stay inside the video and keep their length");
ok(p.map((c) => c.rank).join() === "1,2,3", "ranked");
// a peak near the start clamps to 0
const lv2 = lv.slice(), mo2 = mo.slice(); for (let k = 0; k < 8; k++) { lv2[4 + k] = 0; mo2[4 + k] = 60; }
ok(C.qtGcPick(C.qtGcScore(lv2, mo2), step, dur, 30, 1)[0].a === 0, "early peak clamps to the start");
// short video -> one clip covering everything
p = C.qtGcPick([1, 5, 2], 1, 3, 30, 3);
ok(p.length === 1 && p[0].a === 0 && p[0].b === 3 && p[0].peak === 1, "short video = one whole clip");
ok(C.qtGcPick([], 1, 0, 30, 3).length === 0, "empty input");
// works without motion data
ok(C.qtGcScore(lv).length === N, "audio-only scoring");
// zoom
let z = C.qtGcZoom(5, 10); ok(z.s === 1 && z.dx === 0, "no zoom far from the peak");
z = C.qtGcZoom(10, 10); ok(Math.abs(z.s - 1.14) < 1e-9, "full punch at the peak");
z = C.qtGcZoom(10.2, 10); ok(z.s > 1 && z.s < 1.14 && (z.dx !== 0 || z.dy !== 0), "eases out with shake");
z = C.qtGcZoom(11.5, 10); ok(z.s === 1, "back to normal");
ok(C.qtGcFmt(75.4) === "1:15" && C.qtGcFmt(-3) === "0:00", "time format");
console.log("gta clips tests:", n, "passed");
