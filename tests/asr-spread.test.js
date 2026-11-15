// Tests for asr-worker.js qtAsrSpread (translated sentences -> word timings) used by "Subtitles in: English (translate)".
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const A = require(ROOT + "/asr-worker.js");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
let w = A.qtAsrSpread([{ text: " Hello my friend", timestamp: [1, 2.5] }, { text: "How are you", timestamp: [3, null] }]);
ok(w.map((x) => x.w).join(" ") === "Hello my friend How are you", "all words, in order");
ok(w[0].start === 1 && Math.abs(w[2].end - 2.5) < 1e-6, "a sentence fills exactly its time span");
ok(w[1].end - w[1].start < w[2].end - w[2].start, "longer words get more time");
ok(w.every((x, i) => x.end > x.start && (i === 0 || x.start >= w[i - 1].end - 1e-6)), "increasing, non-overlapping");
ok(w[3].start === 3 && w[5].end > 3, "missing end time gets a sensible length");
ok(A.qtAsrSpread([{ text: "  ", timestamp: [0, 1] }, null && {}].filter(Boolean)).length === 0, "empty text skipped");
ok(A.qtAsrSpread([{ text: "a b", timestamp: [5, 5] }]).every((x) => x.end > x.start), "zero-length span repaired");
ok(A.qtAsrSpread(undefined).length === 0, "no chunks");
console.log("asr spread tests:", n, "passed");
