const ROOT = require("path").join(__dirname, "..");
const C = require(ROOT + "/cron-explainer.js");
const exprs = ["* * * * *", "*/15 * * * *", "0 * * * *", "0 0 * * *", "0 9 * * 1-5", "30 8 * * MON", "0 9,21 * * *", "0 0 1 * *", "0 18 L * *",
  "0 0 1 */3 *", "0 10 * * 1#1", "*/30 * * * * *", "*/10 9-17 * * 1-5", "5 4 * * sun", "0 22 * * 1-5", "23 0-20/2 * * *", "0 0,12 1 */2 *",
  "0 4 8-14 * *", "0 0 1,15 * 3", "15 14 1 * *", "0 12 * JAN-MAR *", "@weekly", "@reboot", "0 0 29 2 *", "0 17 * * 5L", "* 9 * * *", "0,30 9 * * *", "15 10 * * * *"];
for (const e of exprs) { const c = C.qtCronParse(e); console.log(e.padEnd(20), "→", C.qtCronDescribe(c)); }
for (const bad of ["* * * *", "61 * * * *", "* 24 * * *", "* * 0 * *", "* * * 13 *", "* * * * 8", "@foo", "5-1 * * * *", "* * * * MOX"]) {
  try { C.qtCronParse(bad); { console.log("NO ERROR for", bad); process.exitCode = 1; } } catch (e) { console.log("err ok:", bad.padEnd(14), e.message); }
}
// Brute-force cross-check of next runs (UTC), independent matcher written from the spec
function bruteMatch(c, d) {
  const f = c.f, y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1, day = d.getUTCDate(), dow = d.getUTCDay(), dim = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  if (!f.sec.set[d.getUTCSeconds()] || !f.min.set[d.getUTCMinutes()] || !f.hour.set[d.getUTCHours()] || !f.mon.set[mo]) return false;
  const domOk = f.dom.set[day] || (f.dom.extra.last && day === dim);
  const dowOk = f.dow.set[dow] || f.dow.extra.nth.some(([w, n]) => w === dow && Math.floor((day - 1) / 7) + 1 === n) || f.dow.extra.lastDow.some((w) => w === dow && day > dim - 7);
  if (f.dom.star && f.dow.star) return true; if (f.dom.star) return dowOk; if (f.dow.star) return domOk; return domOk || dowOk;
}
let ok = 0, bad = 0;
const from = new Date(Date.UTC(2026, 10, 9, 13, 37, 12));
for (const e of exprs.filter((x) => x !== "@reboot" && !x.startsWith("*/30") && x.split(" ").length !== 6 && x !== "0 0 29 2 *")) {
  const c = C.qtCronParse(e), got = C.qtCronNext(c, from, 6, true).map((d) => d.getTime());
  const exp = []; let t = Math.floor(from.getTime() / 60000) * 60000 + 60000;
  for (let i = 0; i < 60 * 24 * 1100 && exp.length < 6; i++, t += 60000) if (bruteMatch(c, new Date(t))) exp.push(t);
  if (JSON.stringify(got) === JSON.stringify(exp)) ok++; else { bad++; console.log("MISMATCH", e, got.map((x) => new Date(x).toISOString()), exp.map((x) => new Date(x).toISOString())); }
}
const leap = C.qtCronNext(C.qtCronParse("0 0 29 2 *"), from, 2, true).map((d) => d.toISOString());
const secs = C.qtCronNext(C.qtCronParse("*/30 * * * * *"), from, 3, true).map((d) => d.toISOString());
console.log("next-run cross-check:", ok, "ok,", bad, "bad | leap:", leap.join(" "), "| seconds:", secs.join(" "));
if (bad) process.exitCode = 1;
