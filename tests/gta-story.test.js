// Tests for gta-story.js: scroll progress, storage check, gradient map, posteriser, OBS params.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const S = require(ROOT + "/gta-story.js");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(S.qtGsProgress(1000, 500, 1000, false) === 0 && S.qtGsProgress(-500, 500, 1000, false) === 1, "viewport progress ends");
ok(Math.abs(S.qtGsProgress(-1000, 3000, 1000, true) - .5) < 1e-9, "pinned track halfway");
const a = S.qtGsSpace(300), b = S.qtGsSpace(220), c = S.qtGsSpace(100);
ok(a.ok && a.comfy, "300 GB is comfy"); ok(b.ok && !b.comfy, "220 GB is tight"); ok(!c.ok && c.short === 112, "100 GB short by 112");
ok(S.qtGsSpace(0).pct === 0 && S.qtGsSpace(9999).pct === 100, "bar clamps");
assert.deepStrictEqual(S.qtGsMap(S.QT_GS_POSTER.noir, 0), [8, 8, 12]); n++;
assert.deepStrictEqual(S.qtGsMap(S.QT_GS_POSTER.noir, 1), [255, 255, 255]); n++;
// posteriser: flat mid-grey image → a single palette colour, no edges
const w = 8, h = 8, px = new Uint8ClampedArray(w * h * 4).fill(200);
const out = S.qtGsPosterize(px, w, h, { palette: "vice", halftone: false });
const first = [out[0], out[1], out[2]]; let same = true; for (let i = 0; i < out.length; i += 4) if (out[i] !== first[0] || out[i + 1] !== first[1] || out[i + 2] !== first[2] || out[i + 3] !== 255) same = false;
ok(same, "flat image stays flat");
// a hard edge gets inked
const px2 = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = x < 4 ? 0 : 255, o = (y * w + x) * 4; px2[o] = px2[o + 1] = px2[o + 2] = v; px2[o + 3] = 255; }
const out2 = S.qtGsPosterize(px2, w, h, { palette: "vice", halftone: false }); const e = (3 * w + 4) * 4;
ok(out2[e] + out2[e + 1] + out2[e + 2] < 60, "edge pixel is dark ink");
assert.deepStrictEqual(S.qtGsObsParams("?obs=soon&name=Sara&m=10&lang=ar"), { widget: "soon", name: "Sara", mins: 10, lang: "ar" }); n++;
ok(S.qtGsObsParams("?obs=hack") === null && S.qtGsObsParams("") === null, "only known widgets");
ok(S.qtGsObsParams("?obs=soon&m=9999").mins === 120, "minutes capped");
console.log("gta story tests:", n, "passed");
