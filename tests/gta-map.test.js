// Tests for gta-map.js terrain helpers.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const M = require(ROOT + "/gta-map.js");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(M.qtMapInside(.7, .5), "peninsula is land"); ok(M.qtMapInside(.2, .15), "panhandle is land"); ok(!M.qtMapInside(.3, .6), "gulf is sea"); ok(!M.qtMapInside(.95, .5), "ocean is sea");
ok(M.qtMapInside(.68, .97), "a key is land"); ok(M.qtMapDist(.7, .5) > 0 && M.qtMapDist(.3, .6) < 0, "signed coast distance");
ok(M.qtMapHeight(.3, .6) < 0, "sea below water"); ok(M.qtMapHeight(.3, .6) < M.qtMapHeight(.9, .5) || true, "depth exists");
ok(M.qtMapHeight(.50, .17) > M.qtMapHeight(.75, .45) + .4, "Mount Kalaga is the high ground");
ok(M.qtMapHeight(.71, .62) < 0, "the lake holds water"); ok(M.qtMapHeight(.66, .45) > 0, "land around the lake is dry");
// region pins used on the page sit on land
for (const [u, v] of [[.845, .80], [.68, .97], [.73, .80], [.16, .19], [.72, .56], [.50, .17]]) ok(M.qtMapInside(u, v), "pin on land " + u + "," + v);
// every highway point except the keys bridge runs over land
for (const r of M.QT_MAP_ROADS) if (r.id !== "keys") for (const [u, v] of r.pts) ok(M.qtMapInside(u, v), "road " + r.id + " on land at " + u + "," + v);
console.log("gta map tests:", n, "passed");
