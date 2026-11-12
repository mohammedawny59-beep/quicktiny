// Tests for gta-gear.js (setup advisor + affiliate links).
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const G = require(ROOT + "/gta-gear.js");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const ids = (p) => p.map((x) => x.id);
// links
ok(G.qtGearLink("sa", "PS5 SSD 2TB", {}) === "https://www.amazon.sa/s?k=PS5+SSD+2TB", "plain search link without a tag");
ok(G.qtGearLink("ae", "x y", { ae: "mytag-21" }) === "https://www.amazon.ae/s?k=x+y&tag=mytag-21", "tag appended for that store");
ok(G.qtGearLink("eg", "a", { sa: "only-sa" }).indexOf("tag=") < 0, "another store's tag is not leaked");
ok(G.qtGearLink("zz", "a", {}).indexOf("www.amazon.com") > 0, "unknown store falls back to .com");
ok(G.qtGearLink("com", "a&b=c", {}).indexOf("a%26b%3Dc") > 0, "query is encoded");
// store detection
ok(G.qtGearStoreFor("Asia/Riyadh", "ar") === "sa" && G.qtGearStoreFor("Asia/Dubai", "en") === "ae" && G.qtGearStoreFor("Africa/Cairo", "ar") === "eg", "Gulf / Egypt stores");
ok(G.qtGearStoreFor("Asia/Amman", "ar") === "ae", "Jordan uses amazon.ae");
ok(G.qtGearStoreFor("Europe/London", "en") === "com" && G.qtGearStoreFor("Europe/London", "ar") === "sa", "fallbacks");
// plans
let p = G.qtGearPlan({ console: "ps5", freeGb: 100, uses: ["play"] });
ok(p[0].id === "ssd_ps" && p[0].pri === 1 && p[0].short === 134 && p[0].size === "1TB", "PS5 short on space -> must-have SSD with GB missing");
ok(G.qtGearPlan({ console: "ps5", freeGb: 300, uses: ["play"] }).every((x) => x.id !== "ssd_ps"), "enough space -> no SSD");
ok(G.qtGearPlan({ console: "ps5", freeGb: "", uses: ["play"] }).find((x) => x.id === "ssd_ps").pri === 2, "unknown space -> SSD only recommended");
p = G.qtGearPlan({ console: "xsx", freeGb: 50, uses: ["play"] });
ok(p[0].id === "card_xb" && /Seagate/.test(p[0].q), "Xbox short -> official expansion card, not a USB drive");
ok(G.qtGearPlan({ console: "xss", freeGb: 20, uses: ["play"] })[0].size === "2TB", "very short -> 2TB");
p = G.qtGearPlan({ console: "ps5pro", freeGb: 400, uses: ["play"] });
ok(/Edge/.test(p.find((x) => x.id === "pad").q), "PS5 Pro -> DualSense Edge suggestion");
p = G.qtGearPlan({ console: "xone", freeGb: 10, uses: ["play", "stream"] });
ok(ids(p)[0] === "net" && ids(p).indexOf("ssd_ps") < 0 && ids(p).indexOf("card_xb") < 0 && ids(p).indexOf("capture") < 0, "Xbox One cloud: network first, no storage, no capture card");
p = G.qtGearPlan({ console: "ps5", freeGb: 400, uses: ["play", "stream", "record"] });
ok(ids(p).filter((x) => x === "capture").length === 1 && p.find((x) => x.id === "capture").pri === 1, "streamers: capture card is a must, listed once");
ok(ids(p).indexOf("mic") >= 0 && ids(p).indexOf("clips") >= 0, "stream + record extras");
ok(p.every((x, i) => i === 0 || p[i - 1].pri <= x.pri), "sorted by priority");
ok(Object.values(G.QT_AFF_TAGS).every((t) => typeof t === "string"), "tag slots exist");
console.log("gta gear tests:", n, "passed");
