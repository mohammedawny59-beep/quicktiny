// Tests for reels.js layout + headline tokens.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
global.qtVxPlace = require(ROOT + "/video-export.js").qtVxPlace;
const R = require(ROOT + "/reels.js");
let n = 0;
assert.deepStrictEqual(R.qtRvTokens("Watch *this* now").map((t) => [t.w, t.hi]), [["Watch", false], ["this", true], ["now", false]]); n++;
const base = { mode: "blur", focus: .5, zoom: 1, title: "" };
const a = R.qtRvLayout(1920, 1080, 1080, 1920, base);
assert.ok(Math.abs(a.w - 1080) < 1e-6 && Math.abs(a.y - (1920 - 607.5) / 2) < 1e-6, "fit centred"); n++;
const b = R.qtRvLayout(1920, 1080, 1080, 1920, Object.assign({}, base, { title: "Hello" }));
assert.ok(b.y >= 1920 * .2, "video moves below the headline area"); n++;
const c = R.qtRvLayout(1920, 1080, 1080, 1920, Object.assign({}, base, { zoom: 1.5, focus: 0 }));
assert.ok(Math.abs(c.x) < 1e-6, "zoomed + focus left starts at 0"); n++;
const d = R.qtRvLayout(1920, 1080, 1080, 1920, Object.assign({}, base, { zoom: 1.5, focus: 1 }));
assert.ok(Math.abs(d.x + d.w - 1080) < 1e-6, "focus right ends at the edge"); n++;
const e = R.qtRvLayout(1920, 1080, 1080, 1920, Object.assign({}, base, { mode: "crop", focus: .5 }));
assert.ok(Math.abs(e.h - 1920) < 1e-6 && Math.abs(e.x + (e.w - 1080) / 2) < 1e-6, "crop fills, centred"); n++;
console.log("reels tests:", n, "passed");
