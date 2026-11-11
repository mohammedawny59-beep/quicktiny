// Tests for glass-slides.js timing helpers.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const G = require(ROOT + "/glass-slides.js");
let n = 0;
assert.ok(Math.abs(G.qtGsSpring(0)) < 1e-9, "spring starts at 0"); n++;
assert.ok(Math.abs(G.qtGsSpring(1) - 1) < .03, "spring settles near 1"); n++;
let prev = 0, mono = true; for (let k = 0; k <= 1; k += .01) { const v = G.qtGsSpring(k); if (v < prev - 1e-6) mono = false; prev = v; }
assert.ok(G.qtGsSpring(.5) > .9, "spring is mostly there by halfway (snappy)"); n++;
const a = G.qtGsTimeline(0.2, 3, 2.5, .8); assert.deepStrictEqual([a.i, a.inTr], [0, false]); n++;
const b = G.qtGsTimeline(2.7, 3, 2.5, .8); assert.deepStrictEqual([b.i, b.inTr], [1, true]); n++;
const c = G.qtGsTimeline(99, 3, 2.5, .8); assert.strictEqual(c.i, 2, "clamped to last slide"); n++;
assert.strictEqual(Object.keys(G.QT_GS_THEMES).length, 5); n++;
console.log("glass slides tests:", n, "passed");
