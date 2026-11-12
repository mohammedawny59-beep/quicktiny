// Tests for thumbnail.js title parsing and fitting.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const T = require(ROOT + "/thumbnail.js");
let n = 0;
assert.deepStrictEqual(T.qtThTokens("I made *$10,000* in 30 days"), [{ w: "I", hi: false }, { w: "made", hi: false }, { w: "$10,000", hi: true }, { w: "in", hi: false }, { w: "30", hi: false }, { w: "days", hi: false }]); n++;
assert.deepStrictEqual(T.qtThTokens("*very big* win").map((t) => t.hi), [true, true, false], "highlight spans words"); n++;
assert.deepStrictEqual(T.qtThTokens("  a   b ").map((t) => t.w), ["a", "b"]); n++;
const mono = (s, fs) => s.length * fs * .6; // fake monospace measure
const lines = T.qtThLines(T.qtThTokens("one two three four"), 55, (s) => mono(s, 10));
assert.deepStrictEqual(lines.map((l) => l.map((t) => t.w).join(" ")), ["one two", "three", "four"]); n++;
const fit = T.qtThFit(T.qtThTokens("hello big world"), 600, 400, 3, mono, 40, 200);
assert.ok(fit.fs >= 40 && fit.fs <= 200 && fit.lines.length <= 3, "fits"); n++;
assert.ok(fit.lines.length * fit.fs * 1.08 <= 400, "height respected"); n++;
assert.ok(fit.lines.every((l) => mono(l.map((t) => t.w).join(" "), fit.fs) <= 600), "width respected"); n++;
assert.strictEqual(T.qtThFit(T.qtThTokens("x"), 600, 400, 3, mono, 40, 200).fs, 200, "short title gets the max size"); n++;
assert.ok(T.qtThAr("ربحت") && !T.qtThAr("win")); n++;
assert.strictEqual(T.qtThInk("#ffe600"), "#111111"); n++;
assert.strictEqual(Object.keys(T.QT_TH_THEMES).length, 7); n++;
console.log("thumbnail tests:", n, "passed");
