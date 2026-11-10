// Cross-checks our prayer times against api.aladhan.com for several cities, methods and dates.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const P = require(process.argv[2] + "/prayer-times.js");
const cases = [
  ["Riyadh", 24.7136, 46.6753, "Asia/Riyadh", "makkah", 4],
  ["Makkah", 21.4225, 39.8262, "Asia/Riyadh", "makkah", 4],
  ["Amman", 31.9539, 35.9106, "Asia/Amman", "jordan", 23],
  ["Cairo", 30.0444, 31.2357, "Africa/Cairo", "egypt", 5],
  ["Dubai", 25.2048, 55.2708, "Asia/Dubai", "dubai", 16],
  ["Kuwait", 29.3759, 47.9774, "Asia/Kuwait", "kuwait", 9],
  ["Doha", 25.2854, 51.531, "Asia/Qatar", "qatar", 10],
  ["Istanbul", 41.0082, 28.9784, "Europe/Istanbul", "turkey", 13],
  ["London", 51.5074, -0.1278, "Europe/London", "mwl", 3],
  ["New York", 40.7128, -74.006, "America/New_York", "isna", 2],
  ["Karachi", 24.8607, 67.0011, "Asia/Karachi", "karachi", 1],
  ["Casablanca", 33.5731, -7.5898, "Africa/Casablanca", "morocco", 21],
];
const dates = [[2026, 11, 10], [2027, 2, 20], [2027, 6, 21]];
const keys = [["fajr", "Fajr"], ["sunrise", "Sunrise"], ["dhuhr", "Dhuhr"], ["asr", "Asr"], ["maghrib", "Maghrib"], ["isha", "Isha"]];
const toMin = (s) => { const [h, m] = s.slice(0, 5).split(":").map(Number); return h * 60 + m; };
let worst = {}, total = 0, within2 = 0, rows = [];
for (const [name, lat, lng, tz, method, aid] of cases) {
  for (const [y, m, d] of dates) {
    const url = `https://api.aladhan.com/v1/timings/${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${y}?latitude=${lat}&longitude=${lng}&method=${aid}&school=0&timezonestring=${encodeURIComponent(tz)}`;
    let ref;
    try { ref = (await (await fetch(url)).json()).data.timings; } catch (e) { console.log("fetch failed", name, e.message); continue; }
    const ours = P.qtPrayerTimes({ date: { y, m, d }, lat, lng, tz: P.qtTzOffset(tz, y, m, d), method, asr: 1, ramadan: (y === 2027 && m === 2 && d === 20) });
    const diffs = keys.map(([k, rk]) => { const a = toMin(P.qtHm(ours[k])), b = toMin(ref[rk]); let df = a - b; if (df > 720) df -= 1440; if (df < -720) df += 1440; return df; });
    diffs.forEach((df, i) => { total++; if (Math.abs(df) <= 2) within2++; const k = keys[i][0]; worst[k] = Math.max(worst[k] || 0, Math.abs(df)); });
    rows.push(name.padEnd(11) + `${y}-${m}-${d}`.padEnd(11) + diffs.map((x) => String(x).padStart(3)).join(" "));
    await new Promise((r) => setTimeout(r, 150));
  }
}
console.log("city       date        fajr rise dhuhr asr magh isha  (our minus AlAdhan, minutes)");
rows.forEach((r) => console.log(r));
console.log(`within ±2 min: ${within2}/${total}; worst by prayer:`, worst);
