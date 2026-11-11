// Tests for paper-studio.js text helpers (Arabic-safe cut-out pieces, deterministic randomness).
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const P = require(ROOT + "/paper-studio.js");
let n = 0;
assert.deepStrictEqual(P.qtPmPieces("Hi yo").map((p) => p.space ? " " : p.t), ["H", "i", " ", "y", "o"]); n++;
// Arabic words split only after non-joining letters, so every piece keeps its connected shape.
assert.deepStrictEqual(P.qtPmPieces("كويك").map((p) => p.t), ["كو", "يك"]); n++;
assert.deepStrictEqual(P.qtPmPieces("محمد").map((p) => p.t), ["محمد"]); n++;
assert.deepStrictEqual(P.qtPmPieces("رمضان كريم").map((p) => p.space ? " " : p.t), ["ر", "مضا", "ن", " ", "كر", "يم"]); n++;
assert.ok(P.qtPmIsArabic("مرحبا") && !P.qtPmIsArabic("Hello")); n += 1;
const a = P.qtPmRng(42), b = P.qtPmRng(42); assert.strictEqual(a(), b()); n++;
assert.strictEqual(P.qtPmHash("x"), P.qtPmHash("x")); assert.notStrictEqual(P.qtPmHash("x"), P.qtPmHash("y")); n++;
console.log("paper studio tests:", n, "passed");
