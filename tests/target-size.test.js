const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const T = require(ROOT + "/target-size.js");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
// Synthetic JPEG size model: bytes ≈ pixels × (0.05 + 1.6 q²) + 600 header.
const model = (w, h, q) => Math.round(w * h * (0.05 + 1.6 * q * q) + 600);
(async () => {
  let calls = 0; const enc = async (w, h, q) => { calls++; return model(w, h, q); };
  // Fits at max quality already
  let r = await T.qtFitToSize(enc, 200, 200, 1e6);
  ok(r && r.q === 0.92 && r.w === 200, "small image keeps full quality");
  // Needs lower quality, same size
  r = await T.qtFitToSize(enc, 1000, 800, 500000);
  ok(r && r.w === 1000 && r.size <= 500000 && r.q < 0.92 && r.q >= 0.55, "quality search at full size: " + JSON.stringify(r));
  // Best quality is close to the limit (within one search step)
  ok(model(1000, 800, Math.min(0.92, r.q + 0.05)) > 500000, "binary search finds near-max quality");
  // Needs downscaling
  for (const kb of [20, 50, 100, 200]) {
    calls = 0;
    r = await T.qtFitToSize(enc, 4000, 3000, kb * 1000);
    ok(r && r.size <= kb * 1000, kb + "KB fits: " + JSON.stringify(r));
    ok(Math.abs(r.w / r.h - 4 / 3) < 0.02, "aspect ratio kept");
    ok(calls < 40, "bounded work (" + calls + " encodes)");
  }
  // Impossible target
  r = await T.qtFitToSize(enc, 4000, 3000, 100, { minSide: 48 });
  ok(r === null, "impossible target returns null");
  ok(T.qtKbLabel(98765) === "98.8 KB" && T.qtKbLabel(1500000) === "1.50 MB", "labels");
  console.log("target size tests:", n, "passed");
})().catch((e) => { console.error(e); process.exitCode = 1; });
