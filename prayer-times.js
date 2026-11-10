// QuickTiny Prayer Times — astronomical prayer-time calculation (no external service), Qibla direction,
// monthly timetable, Ramadan imsakiya and countdowns. Written from the standard solar-position formulas.

var QT_PT_METHODS = {
  makkah:   { name: { en: "Umm al-Qura, Makkah", ar: "أم القرى (مكة المكرمة)" }, fajr: 18.5, ishaMin: 90, ishaRamadanMin: 120 },
  mwl:      { name: { en: "Muslim World League", ar: "رابطة العالم الإسلامي" }, fajr: 18, isha: 17 },
  egypt:    { name: { en: "Egyptian General Authority", ar: "الهيئة المصرية العامة للمساحة" }, fajr: 19.5, isha: 17.5 },
  karachi:  { name: { en: "University of Islamic Sciences, Karachi", ar: "جامعة العلوم الإسلامية، كراتشي" }, fajr: 18, isha: 18 },
  isna:     { name: { en: "ISNA (North America)", ar: "الجمعية الإسلامية لأمريكا الشمالية" }, fajr: 15, isha: 15 },
  dubai:    { name: { en: "UAE (Dubai)", ar: "الإمارات (دبي)" }, fajr: 18.2, isha: 18.2, tune: { dhuhr: 3, maghrib: 3 } },
  kuwait:   { name: { en: "Kuwait", ar: "الكويت" }, fajr: 18, isha: 17.5 },
  qatar:    { name: { en: "Qatar", ar: "قطر" }, fajr: 18, ishaMin: 90 },
  jordan:   { name: { en: "Jordan (Ministry of Awqaf)", ar: "الأردن (وزارة الأوقاف)" }, fajr: 18, isha: 18, tune: { maghrib: 5 } },
  turkey:   { name: { en: "Turkey (Diyanet)", ar: "تركيا (ديانت)" }, fajr: 18, isha: 17, tune: { sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7 } },
  morocco:  { name: { en: "Morocco", ar: "المغرب" }, fajr: 19, isha: 17, tune: { dhuhr: 5, maghrib: 5 } },
  algeria:  { name: { en: "Algeria", ar: "الجزائر" }, fajr: 18, isha: 17 },
  tunisia:  { name: { en: "Tunisia", ar: "تونس" }, fajr: 18, isha: 18 },
  singapore:{ name: { en: "Singapore / Malaysia / Indonesia", ar: "سنغافورة / ماليزيا / إندونيسيا" }, fajr: 20, isha: 18 },
  france:   { name: { en: "UOIF (France)", ar: "اتحاد المنظمات الإسلامية بفرنسا" }, fajr: 12, isha: 12 }
};
var QT_KAABA = { lat: 21.4225, lng: 39.8262 };

function qtRad(d) { return d * Math.PI / 180; }
function qtDeg(r) { return r * 180 / Math.PI; }
function qtFix(a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; }

// Sun declination (deg) and equation of time (hours) for a Julian date.
function qtSun(jd) {
  var D = jd - 2451545.0;
  var g = qtFix(357.529 + 0.98560028 * D, 360), q = qtFix(280.459 + 0.98564736 * D, 360);
  var L = qtFix(q + 1.915 * Math.sin(qtRad(g)) + 0.020 * Math.sin(qtRad(2 * g)), 360);
  var e = 23.439 - 0.00000036 * D;
  var RA = qtDeg(Math.atan2(Math.cos(qtRad(e)) * Math.sin(qtRad(L)), Math.cos(qtRad(L)))) / 15;
  var decl = qtDeg(Math.asin(Math.sin(qtRad(e)) * Math.sin(qtRad(L))));
  var eqt = q / 15 - qtFix(RA, 24);
  return { decl: decl, eqt: eqt };
}
function qtJulian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

// o: {date: {y,m,d}, lat, lng, tz (hours offset that day), method key, asr: 1|2, ramadan: bool, elevation}
// Returns fractional local hours (NaN when the sun never reaches the angle).
function qtPrayerTimes(o) {
  var M = QT_PT_METHODS[o.method] || QT_PT_METHODS.mwl;
  var jd = qtJulian(o.date.y, o.date.m, o.date.d) - o.lng / (15 * 24);
  var lat = o.lat, asrF = o.asr === 2 ? 2 : 1;
  var riseAngle = 0.833 + 0.0347 * Math.sqrt(Math.max(0, o.elevation || 0));
  function noon(t) { var s = qtSun(jd + t / 24); return qtFix(12 - s.eqt, 24); }
  function angleTime(angle, t, ccw) {
    var s = qtSun(jd + t / 24), n = noon(t);
    var c = (-Math.sin(qtRad(angle)) - Math.sin(qtRad(s.decl)) * Math.sin(qtRad(lat))) / (Math.cos(qtRad(s.decl)) * Math.cos(qtRad(lat)));
    if (c < -1 || c > 1) return NaN;
    var T = qtDeg(Math.acos(c)) / 15;
    return n + (ccw ? -T : T);
  }
  function asrTime(t) {
    var s = qtSun(jd + t / 24);
    var a = -qtDeg(Math.atan(1 / (asrF + Math.tan(qtRad(Math.abs(lat - s.decl))))));
    return angleTime(a, t, false);
  }
  // Two passes: first with rough times, then refined at each prayer's own moment.
  var t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
  for (var pass = 0; pass < 2; pass++) {
    t = {
      fajr: angleTime(M.fajr, t.fajr, true), sunrise: angleTime(riseAngle, t.sunrise, true), dhuhr: noon(t.dhuhr),
      asr: asrTime(t.asr), sunset: angleTime(riseAngle, t.sunset, false), isha: M.isha ? angleTime(M.isha, t.isha, false) : t.sunset
    };
  }
  var adj = function (v) { return v + o.tz - o.lng / 15; };
  var r = { fajr: adj(t.fajr), sunrise: adj(t.sunrise), dhuhr: adj(t.dhuhr), asr: adj(t.asr), maghrib: adj(t.sunset), isha: adj(t.isha) };
  if (M.ishaMin) r.isha = r.maghrib + ((o.ramadan && M.ishaRamadanMin) || M.ishaMin) / 60;
  // High latitudes: if Fajr/Isha don't occur, use the angle-based fraction of the night.
  var night = 24 - (r.maghrib - r.sunrise);
  if (isNaN(r.fajr) || r.sunrise - r.fajr > night * M.fajr / 60) r.fajr = r.sunrise - night * M.fajr / 60;
  if (!M.ishaMin && (isNaN(r.isha) || r.isha - r.maghrib > night * M.isha / 60)) r.isha = r.maghrib + night * M.isha / 60;
  // Official per-country minute adjustments (e.g. Jordan adds 5 minutes to Maghrib).
  Object.keys(M.tune || {}).forEach(function (k) { r[k] += M.tune[k] / 60; });
  r.imsak = r.fajr - 10 / 60;
  r.midnight = r.maghrib + night / 2;
  return r;
}
function qtHm(h, h12) {
  if (isNaN(h)) return "—";
  h = qtFix(h + 0.5 / 60, 24);
  var H = Math.floor(h), Mn = Math.floor((h - H) * 60);
  if (!h12) return String(H).padStart(2, "0") + ":" + String(Mn).padStart(2, "0");
  return ((H % 12) || 12) + ":" + String(Mn).padStart(2, "0") + (H < 12 ? " AM" : " PM");
}
// Initial bearing from a point to the Kaaba, degrees clockwise from true north.
function qtQibla(lat, lng) {
  var p1 = qtRad(lat), p2 = qtRad(QT_KAABA.lat), dl = qtRad(QT_KAABA.lng - lng);
  return qtFix(qtDeg(Math.atan2(Math.sin(dl), Math.cos(p1) * Math.tan(p2) - Math.sin(p1) * Math.cos(dl))), 360);
}
function qtKaabaKm(lat, lng) {
  var p1 = qtRad(lat), p2 = qtRad(QT_KAABA.lat), dp = p2 - p1, dl = qtRad(QT_KAABA.lng - lng);
  var a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// UTC offset (hours) of an IANA zone on a given calendar day, via Intl (handles DST).
function qtTzOffset(tz, y, m, d) {
  try {
    var dt = new Date(Date.UTC(y, m - 1, d, 12));
    var p = {}; new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(dt).forEach(function (x) { p[x.type] = x.value; });
    var local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    return Math.round((local - dt.getTime()) / 60000) / 60;
  } catch (e) { return -new Date(y, m - 1, d, 12).getTimezoneOffset() / 60; }
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var lang = document.documentElement.lang === "ar" ? "ar" : "en", AR = lang === "ar";
  var S = window.QT_STRINGS || {}, L = function (k, d) { return S[k] || d; };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var CITIES = window.QT_PT_CITIES || [];
  var NAMES = AR ? { fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء", imsak: "الإمساك" }
                 : { fajr: "Fajr", sunrise: "Sunrise", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha", imsak: "Imsak" };
  var ORDER = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem("qt_" + k) || "null"); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem("qt_" + k, JSON.stringify(v)); } catch (e) {} } };
  var loc = null, tick = null;

  function isRamadan(y, m, d) { return typeof qtToHijri === "function" && qtToHijri(new Date(Date.UTC(y, m - 1, d))).m === 9; }
  function timesFor(y, m, d) {
    return qtPrayerTimes({ date: { y: y, m: m, d: d }, lat: loc.lat, lng: loc.lng, tz: qtTzOffset(loc.tz, y, m, d), method: $("ptMethod").value, asr: +$("ptAsr").value, ramadan: isRamadan(y, m, d) });
  }
  function nowIn(tz) {
    var p = {}; new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour + +p.minute / 60 + +p.second / 3600 };
  }
  function hijriStr(y, m, d) {
    if (typeof qtToHijri !== "function") return "";
    var h = qtToHijri(new Date(Date.UTC(y, m - 1, d)));
    var months = ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
    var en = ["Muharram", "Safar", "Rabi I", "Rabi II", "Jumada I", "Jumada II", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qa'dah", "Dhu al-Hijjah"];
    return h.d + " " + (AR ? months : en)[h.m - 1] + " " + h.y + (AR ? " هـ" : " AH");
  }
  function render() {
    if (!loc) return;
    var h12 = $("ptH12").checked, n = nowIn(loc.tz), t = timesFor(n.y, n.m, n.d);
    $("ptPlace").textContent = loc.name;
    $("ptDate").textContent = new Date(Date.UTC(n.y, n.m - 1, n.d)).toLocaleDateString(AR ? "ar-u-nu-latn" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) + " · " + hijriStr(n.y, n.m, n.d);
    var next = null;
    ORDER.forEach(function (k) { if (k !== "sunrise" && !next && t[k] > n.h) next = k; });
    var nextT = next ? t[next] : null, nextName = next;
    if (!next) { var tm = new Date(Date.UTC(n.y, n.m - 1, n.d + 1)); var t2 = timesFor(tm.getUTCFullYear(), tm.getUTCMonth() + 1, tm.getUTCDate()); nextT = t2.fajr + 24; nextName = "fajr"; }
    $("ptGrid").innerHTML = ORDER.map(function (k) {
      return '<div class="pt-cell' + (k === nextName && next ? " pt-next" : "") + (k === "sunrise" ? " pt-sun" : "") + '"><span>' + NAMES[k] + "</span><b>" + qtHm(t[k], h12) + "</b></div>";
    }).join("");
    var left = (nextT - n.h) * 3600, hh = Math.floor(left / 3600), mm = Math.floor(left % 3600 / 60), ss = Math.floor(left % 60);
    $("ptNext").innerHTML = (AR ? "الصلاة القادمة: " : "Next: ") + "<b>" + NAMES[nextName] + "</b> " + (AR ? "بعد " : "in ") + '<span class="pt-cd">' + String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0") + "</span>";
    var q = qtQibla(loc.lat, loc.lng);
    $("ptQibla").textContent = q.toFixed(1) + "°"; $("ptNeedle").style.transform = "rotate(" + q + "deg)";
    $("ptKm").textContent = Math.round(qtKaabaKm(loc.lat, loc.lng)).toLocaleString("en-US") + (AR ? " كم" : " km");
    $("ptMeta").textContent = QT_PT_METHODS[$("ptMethod").value].name[lang] + " · " + loc.lat.toFixed(4) + ", " + loc.lng.toFixed(4) + " · " + loc.tz;
  }
  function monthTable() {
    if (!loc) return;
    var h12 = $("ptH12").checked, base = $("ptMonth").value.split("-"), y = +base[0], m = +base[1], days = new Date(Date.UTC(y, m, 0)).getUTCDate(), n = nowIn(loc.tz), rows = "";
    for (var d = 1; d <= days; d++) {
      var t = timesFor(y, m, d), today = y === n.y && m === n.m && d === n.d;
      rows += "<tr" + (today ? ' class="pt-today"' : "") + "><td>" + d + "</td><td>" + esc(hijriStr(y, m, d)) + "</td>" + ORDER.map(function (k) { return "<td>" + qtHm(t[k], h12) + "</td>"; }).join("") + "</tr>";
    }
    $("ptMonthBody").innerHTML = rows;
  }
  function ramadanTable() {
    if (!loc || typeof qtFromHijri !== "function") return;
    var n = nowIn(loc.tz), hNow = qtToHijri(new Date(Date.UTC(n.y, n.m - 1, n.d)));
    var hy = hNow.m > 9 ? hNow.y + 1 : hNow.y; // the coming (or current) Ramadan
    var h12 = $("ptH12").checked, rows = "", first = null;
    for (var i = 1; i <= 30; i++) {
      var g = qtFromHijri(hy, 9, i); if (!g) break;
      first = first || g;
      var y = g.getUTCFullYear(), m = g.getUTCMonth() + 1, d = g.getUTCDate(), t = timesFor(y, m, d);
      rows += "<tr><td>" + i + "</td><td>" + g.toLocaleDateString(AR ? "ar-u-nu-latn" : "en-US", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }) + "</td><td>" + qtHm(t.imsak, h12) + "</td><td>" + qtHm(t.fajr, h12) + "</td><td>" + qtHm(t.dhuhr, h12) + "</td><td>" + qtHm(t.asr, h12) + "</td><td><b>" + qtHm(t.maghrib, h12) + "</b></td><td>" + qtHm(t.isha, h12) + "</td></tr>";
    }
    $("ptRamadanTitle").textContent = (AR ? "إمساكية رمضان " : "Ramadan ") + hy + (AR ? " هـ — " : " AH timetable — ") + loc.name;
    $("ptRamadanBody").innerHTML = rows;
    // Countdowns to Ramadan and both Eids (Umm al-Qura calendar).
    var today = Date.UTC(n.y, n.m - 1, n.d), ev = [[9, 1, AR ? "رمضان" : "Ramadan"], [10, 1, AR ? "عيد الفطر" : "Eid al-Fitr"], [12, 10, AR ? "عيد الأضحى" : "Eid al-Adha"]];
    $("ptCount").innerHTML = ev.map(function (e) {
      var yy = hNow.y, g = qtFromHijri(yy, e[0], e[1]);
      if (g && g.getTime() < today) g = qtFromHijri(yy + 1, e[0], e[1]);
      if (!g) return "";
      var days = Math.round((g.getTime() - today) / 86400000);
      return '<div class="pt-ev"><span>' + e[2] + "</span><b>" + (days === 0 ? (AR ? "اليوم" : "Today") : days + (AR ? " يوم" : " days")) + "</b><small>" + g.toLocaleDateString(AR ? "ar-u-nu-latn" : "en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) + "</small></div>";
    }).join("");
  }
  function setLoc(l, save) {
    loc = l;
    if (l.method && $("ptMethod").querySelector('option[value="' + l.method + '"]') && !store.get("pt_method_manual")) $("ptMethod").value = l.method;
    if (save) store.set("pt_loc", l);
    var n = nowIn(l.tz); $("ptMonth").value = n.y + "-" + String(n.m).padStart(2, "0");
    render(); monthTable(); ramadanTable();
  }
  function cityLabel(c) { return AR ? c.ar + "، " + c.cAr : c.en + ", " + c.cEn; }
  function bySlug(s) { return CITIES.filter(function (c) { return c.slug === s; })[0]; }
  function geoName(near) { return (AR ? "موقعك الحالي" : "Your location") + (near ? (AR ? " (قرب " + near.ar + ")" : " (near " + near.en + ")") : ""); }
  // Saved locations keep slugs, so the name is rebuilt in the current page's language.
  function relabel(l) { if (!l) return l; if (l.slug && bySlug(l.slug)) l.name = cityLabel(bySlug(l.slug)); else if (l.geo) l.name = geoName(l.near ? bySlug(l.near) : null); return l; }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("ptGrid")) return;
    Object.keys(QT_PT_METHODS).forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = QT_PT_METHODS[k].name[lang]; $("ptMethod").appendChild(o); });
    var dl = $("ptCities"); CITIES.forEach(function (c) { var o = document.createElement("option"); o.value = cityLabel(c); dl.appendChild(o); });
    $("ptSearch").addEventListener("change", function () {
      var v = $("ptSearch").value.trim().toLowerCase(), c = CITIES.filter(function (x) { return cityLabel(x).toLowerCase() === v || x.en.toLowerCase() === v || x.ar === $("ptSearch").value.trim(); })[0];
      if (c) { setLoc({ slug: c.slug, name: cityLabel(c), lat: c.lat, lng: c.lng, tz: c.tz, method: c.method }, true); qtTrack("prayer_city", { city: c.slug }); }
    });
    $("ptGeo").addEventListener("click", function () {
      if (!navigator.geolocation) return;
      $("ptGeoMsg").textContent = AR ? "جارٍ تحديد موقعك…" : "Finding your location…";
      navigator.geolocation.getCurrentPosition(function (p) {
        $("ptGeoMsg").textContent = "";
        var lat = +p.coords.latitude.toFixed(4), lng = +p.coords.longitude.toFixed(4), tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        // Use the nearest known city's official method and time zone when it's close (< 400 km).
        var best = null, bd = Infinity;
        CITIES.forEach(function (c) { var d = Math.hypot((c.lat - lat) * 111, (c.lng - lng) * 111 * Math.cos(lat * Math.PI / 180)); if (d < bd) { bd = d; best = c; } });
        var near = best && bd < 400 ? best : null;
        store.set("pt_method_manual", 0);
        setLoc({ geo: true, near: near ? near.slug : null, name: geoName(near), lat: lat, lng: lng, tz: near ? near.tz : tz, method: near ? near.method : undefined }, true); qtTrack("prayer_geo");
      }, function () { $("ptGeoMsg").textContent = AR ? "تعذّر تحديد الموقع — اختر مدينتك من القائمة." : "Couldn't get your location — pick your city instead."; }, { timeout: 10000, maximumAge: 600000 });
    });
    $("ptMethod").addEventListener("change", function () { store.set("pt_method_manual", 1); store.set("pt_method", $("ptMethod").value); render(); monthTable(); ramadanTable(); });
    ["ptAsr", "ptH12"].forEach(function (id) { $(id).addEventListener("change", function () { store.set(id, id === "ptH12" ? $(id).checked : $(id).value); render(); monthTable(); ramadanTable(); }); });
    $("ptMonth").addEventListener("change", monthTable);
    document.querySelectorAll("[data-print]").forEach(function (b) { b.addEventListener("click", function () { document.body.setAttribute("data-print", b.getAttribute("data-print")); window.print(); setTimeout(function () { document.body.removeAttribute("data-print"); }, 500); }); });
    if (store.get("ptAsr")) $("ptAsr").value = store.get("ptAsr");
    if (store.get("ptH12") !== null) $("ptH12").checked = !!store.get("ptH12");
    if (store.get("pt_method_manual") && store.get("pt_method")) $("ptMethod").value = store.get("pt_method");
    var P = window.QT_PRESET || {}, preset = P.city && CITIES.filter(function (c) { return c.slug === P.city; })[0];
    if (preset) setLoc({ name: cityLabel(preset), lat: preset.lat, lng: preset.lng, tz: preset.tz, method: preset.method }, false);
    else { var saved = store.get("pt_loc"), def = CITIES.filter(function (c) { return c.slug === (AR ? "riyadh" : "mecca"); })[0] || CITIES[0]; setLoc(relabel(saved) || { slug: def.slug, name: cityLabel(def), lat: def.lat, lng: def.lng, tz: def.tz, method: def.method }, false); }
    if (P.tab === "ramadan" && $("ptRamadan")) setTimeout(function () { $("ptRamadan").scrollIntoView({ block: "start" }); }, 100);
    tick = setInterval(render, 1000);
  });
})();

if (typeof module !== "undefined") module.exports = { qtPrayerTimes: qtPrayerTimes, qtHm: qtHm, qtQibla: qtQibla, qtKaabaKm: qtKaabaKm, qtTzOffset: qtTzOffset, QT_PT_METHODS: QT_PT_METHODS };
