// Tests for video-export.js: levels, silence detection, segment maths, audio cutting, placement.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const V = require(ROOT + "/video-export.js");
let n = 0; const near = (a, b, m, e) => { assert.ok(Math.abs(a - b) < (e || 1e-6), m + ": " + a + " vs " + b); n++; };
// 1 s tone, 1 s silence, 1 s tone at 1000 Hz sample rate
const rate = 1000, s = new Float32Array(3000);
for (let i = 0; i < 3000; i++) s[i] = (i < 1000 || i >= 2000) ? .5 * Math.sin(i / 3) : 0;
const lv = V.qtVxLevels(s, rate, .02);
assert.strictEqual(lv.length, 150); n++;
assert.ok(lv[10] > -12 && lv[75] === -120, "tone loud, gap silent"); n++;
const keep = V.qtVxKeep(lv, .02, 3, -40, .3, .1);
assert.strictEqual(keep.length, 2, "one gap removed"); n++;
near(keep[0][0], 0, "start"); near(keep[0][1], 1.1, "pad after speech"); near(keep[1][0], 1.9, "pad before speech"); near(keep[1][1], 3, "end");
assert.deepStrictEqual(V.qtVxKeep(lv, .02, 3, -40, 1.5, .1), [[0, 3]], "short gaps stay"); n++;
near(V.qtVxTotal(keep), 2.2, "total kept");
near(V.qtVxSrcTime(keep, .5), .5, "inside first"); near(V.qtVxSrcTime(keep, 1.2), 2.0, "jumps the cut"); near(V.qtVxSrcTime(keep, 99), 3, "clamped");
// leading/trailing silence fully removed
const s2 = new Float32Array(3000); for (let i = 1000; i < 2000; i++) s2[i] = .5 * Math.sin(i / 3);
const k2 = V.qtVxKeep(V.qtVxLevels(s2, rate, .02), .02, 3, -40, .3, .1);
assert.strictEqual(k2.length, 1); near(k2[0][0], .9, "lead trimmed"); near(k2[0][1], 2.1, "tail trimmed");
const ch = [Float32Array.from({ length: 1000 }, () => 1)];
const cut = V.qtVxCutAudio(ch, 100, [[0, 2], [5, 7]], .05);
assert.strictEqual(cut[0].length, 400); n++;
const ok = (c, m) => { assert.ok(c, m); n++; };
ok(cut[0][0] === 1 && cut[0][199] < .01 && cut[0][200] < .01 && cut[0][399] === 1, "fades only at the join");
const fit = V.qtVxPlace(1920, 1080, 1080, 1920, "fit"); near(fit.w, 1080, "fit width"); near(fit.y, (1920 - 607.5) / 2, "centred");
const fill = V.qtVxPlace(1920, 1080, 1080, 1920, "fill", 0); near(fill.h, 1920, "fill height"); near(fill.x, 0, "focus left");
assert.deepStrictEqual(V.qtVxFit(3840, 2160, 1920), [1920, 1080]); n++;
console.log("video export tests:", n, "passed");
// resampler: 48 kHz → 16 kHz keeps length ratio and a DC level, and averages (no plain decimation)
const src48 = new Float32Array(4800).fill(.5); const r16 = V.qtVxResample(src48, 48000, 16000);
assert.strictEqual(r16.length, 1600); assert.ok(r16.every((x) => Math.abs(x - .5) < 1e-6), "level kept");
const alt = Float32Array.from({ length: 4800 }, (_, i) => (i % 3 === 0 ? 1 : 0)); const ra = V.qtVxResample(alt, 48000, 16000);
assert.ok(ra.every((x) => Math.abs(x - 1 / 3) < 1e-6), "box filter averages each window");
assert.strictEqual(V.qtVxResample(src48, 16000, 16000), src48, "same rate is a no-op");
console.log("resample ok");
