const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const P = require(ROOT + "/prayer-times.js");
let n = 0; const near = (a, b, tol, m) => { assert.ok(Math.abs(a - b) <= tol, m + ": " + a + " vs " + b); n++; };
const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
// Reference values cross-checked against api.aladhan.com on 2026-11-10 (same methods; minutes).
const cases = [
  ["Riyadh / Umm al-Qura", { lat: 24.7136, lng: 46.6753, tz: 3, method: "makkah" }, { fajr: "04:45", sunrise: "06:06", dhuhr: "11:37", asr: "14:47", maghrib: "17:08", isha: "18:38" }],
  ["Cairo / Egyptian", { lat: 30.0444, lng: 31.2357, tz: 2, method: "egypt" }, null],
  ["Amman / Jordan (+5 Maghrib)", { lat: 31.9539, lng: 35.9106, tz: 3, method: "jordan" }, null],
];
const R = P.qtPrayerTimes({ date: { y: 2026, m: 11, d: 10 }, asr: 1, ...cases[0][1] });
for (const [k, v] of Object.entries(cases[0][2])) near(toMin(P.qtHm(R[k])), toMin(v), 1, "Riyadh " + k);
// Umm al-Qura: Isha = Maghrib + 90 min, + 120 min in Ramadan
near((R.isha - R.maghrib) * 60, 90, 0.01, "Isha +90");
const RR = P.qtPrayerTimes({ date: { y: 2027, m: 2, d: 20 }, lat: 24.7136, lng: 46.6753, tz: 3, method: "makkah", asr: 1, ramadan: true });
near((RR.isha - RR.maghrib) * 60, 120, 0.01, "Isha +120 in Ramadan");
// Order and Hanafi Asr later than standard
const A1 = P.qtPrayerTimes({ date: { y: 2026, m: 11, d: 10 }, lat: 30.0444, lng: 31.2357, tz: 2, method: "egypt", asr: 1 });
const A2 = P.qtPrayerTimes({ date: { y: 2026, m: 11, d: 10 }, lat: 30.0444, lng: 31.2357, tz: 2, method: "egypt", asr: 2 });
assert.ok(A1.fajr < A1.sunrise && A1.sunrise < A1.dhuhr && A1.dhuhr < A1.asr && A1.asr < A1.maghrib && A1.maghrib < A1.isha, "order"); n++;
assert.ok(A2.asr - A1.asr > 0.4, "Hanafi Asr later"); n++;
near((A1.fajr - A1.imsak) * 60, 10, 0.01, "Imsak = Fajr − 10 min");
// Jordan tune: Maghrib is 5 minutes after sunset-based maghrib of MWL-equivalent angles
const J = P.qtPrayerTimes({ date: { y: 2026, m: 11, d: 10 }, lat: 31.9539, lng: 35.9106, tz: 3, method: "jordan", asr: 1 });
const K = P.qtPrayerTimes({ date: { y: 2026, m: 11, d: 10 }, lat: 31.9539, lng: 35.9106, tz: 3, method: "karachi", asr: 1 });
near((J.maghrib - K.maghrib) * 60, 5, 0.01, "Jordan +5 Maghrib");
// High latitude summer (Oslo): Fajr/Isha still defined
const O = P.qtPrayerTimes({ date: { y: 2027, m: 6, d: 21 }, lat: 59.9139, lng: 10.7522, tz: 2, method: "mwl", asr: 1 });
assert.ok(!isNaN(O.fajr) && !isNaN(O.isha) && O.fajr < O.sunrise && O.isha > O.maghrib, "high latitude fallback"); n++;
// Qibla
near(P.qtQibla(51.5074, -0.1278), 118.99, 0.2, "Qibla London");
near(P.qtQibla(40.7128, -74.006), 58.48, 0.3, "Qibla New York");
near(P.qtQibla(24.7136, 46.6753), 244.0, 0.5, "Qibla Riyadh");
near(P.qtKaabaKm(31.9539, 35.9106), 1230, 20, "Amman → Kaaba km");
// Time zone offsets incl. DST
near(P.qtTzOffset("Europe/London", 2027, 6, 21), 1, 0, "London BST"); near(P.qtTzOffset("Europe/London", 2027, 1, 10), 0, 0, "London GMT");
near(P.qtTzOffset("Asia/Riyadh", 2026, 11, 10), 3, 0, "Riyadh");
assert.strictEqual(P.qtHm(13.5, true), "1:30 PM"); n++; assert.strictEqual(P.qtHm(0.25), "00:15"); n++;
console.log("prayer times tests:", n, "passed");
