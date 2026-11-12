// Tests for gta-map.js terrain helpers.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const M = require(ROOT + "/gta-map.js");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(M.qtMapInside(.7, .5), "mainland is land"); ok(!M.qtMapInside(.1, .8), "gulf is sea"); ok(M.qtMapInside(.6, .962), "a key is land");
ok(M.qtMapHeight(.1, .8) < 0, "sea below water"); ok(M.qtMapHeight(.55, .22) > M.qtMapHeight(.75, .45), "Mount Kalaga is the high ground");
ok(M.qtMapHeight(.62, .53) < M.qtMapHeight(.66, .45), "the lake is a depression");
// region pins used on the page sit on land
for (const [u, v] of [[.8, .7], [.60, .962], [.63, .76], [.18, .16], [.6, .5], [.55, .22]]) ok(M.qtMapInside(u, v) || M.qtMapInside(u, v - .015), "pin on land " + u + "," + v);
console.log("gta map tests:", n, "passed");
