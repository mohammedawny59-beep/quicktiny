// Tests for brand.js: validation and applying a brand to studio state.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const { qtBrand } = require(ROOT + "/brand.js");
let n = 0;
assert.deepStrictEqual(qtBrand.valid({ accent: "#FF2D55", font: "sans", name: "  My Channel ", tagline: "" }), { accent: "#ff2d55", font: "sans", name: "My Channel" }); n++;
assert.strictEqual(qtBrand.valid({ accent: "red", font: "comic" }), null, "invalid fields dropped"); n++;
assert.strictEqual(qtBrand.valid(null), null); n++;
assert.strictEqual(qtBrand.valid({ name: "x".repeat(80) }).name.length, 40, "name capped"); n++;
const st = { accent: "#000000", font: "bold", a: "Default" };
assert.strictEqual(qtBrand.apply(st, { accent: "accent", name: "a" }, { accent: "#123abc", name: "Sara" }), true); n++;
assert.deepStrictEqual(st, { accent: "#123abc", font: "bold", a: "Sara" }, "only mapped fields change"); n++;
assert.strictEqual(qtBrand.apply(st, { accent: "accent" }, null), false, "no brand, no change"); n++;
assert.strictEqual(qtBrand.get(), null, "no storage in node"); n++;
console.log("brand tests:", n, "passed");
