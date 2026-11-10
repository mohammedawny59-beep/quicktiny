// QuickTiny Hijri ↔ Gregorian converter + age calculator.
// Uses the browser's built-in Umm al-Qura calendar (Intl "islamic-umalqura"), with the
// arithmetic "islamic-civil" calendar as an option. All local.

var QT_HIJRI_MONTHS = ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
var QT_GREG_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
var QT_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function qtUtc(y, m, d) { return new Date(Date.UTC(y, m - 1, d, 12)); }

// Gregorian Date → {y, m, d} in the chosen Islamic calendar.
function qtToHijri(date, cal) {
  var f = new Intl.DateTimeFormat("en-u-ca-" + (cal || "islamic-umalqura") + "-nu-latn", { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" });
  var p = {}; f.formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
  return { y: parseInt(p.year, 10), m: parseInt(p.month, 10), d: parseInt(p.day, 10) };
}

// Hijri y/m/d → Gregorian Date, by estimating and then walking to the exact day.
function qtFromHijri(y, m, d, cal) {
  if (!(y > 0 && m >= 1 && m <= 12 && d >= 1 && d <= 30)) return null;
  var approx = (y - 1) * 354.36707 + (m - 1) * 29.530589 + (d - 1); // days since 1 Muharram 1 AH
  var t = Date.UTC(622, 6, 19, 12) + approx * 86400000;             // 1/1/1 AH ≈ 19 Jul 622 (Julian→proleptic)
  var date = new Date(t);
  for (var i = 0; i < 80; i++) {
    var h = qtToHijri(date, cal);
    var diff = (y - h.y) * 354 + (m - h.m) * 29.5 + (d - h.d);
    if (h.y === y && h.m === m && h.d === d) return date;
    var step = Math.abs(diff) > 2 ? Math.round(diff) : (diff > 0 ? 1 : -1);
    date = new Date(date.getTime() + step * 86400000);
  }
  return null; // e.g. day 30 in a 29-day month
}

function qtAge(birth, today) {
  var y = today.getUTCFullYear() - birth.getUTCFullYear(), m = today.getUTCMonth() - birth.getUTCMonth(), d = today.getUTCDate() - birth.getUTCDate();
  if (d < 0) { m--; d += new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)).getUTCDate(); }
  if (m < 0) { y--; m += 12; }
  return { y: y, m: m, d: d, days: Math.round((today - birth) / 86400000) };
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  function cal() { return $("hjCal").value; }
  function hijriText(h) { return h.d + " " + QT_HIJRI_MONTHS[h.m - 1] + " " + h.y + " هـ"; }
  function gregText(g) { return g.getUTCDate() + " " + QT_GREG_MONTHS[g.getUTCMonth()] + " " + g.getUTCFullYear() + " م"; }
  function iso(g) { return g.toISOString().slice(0, 10); }
  function card(id, main, sub) { $(id).innerHTML = "<b>" + main + "</b><span>" + sub + "</span>"; }

  function fromGreg() {
    var v = $("hjG").value; if (!v) return;
    var p = v.split("-").map(Number), g = qtUtc(p[0], p[1], p[2]), h = qtToHijri(g, cal());
    card("hjGOut", hijriText(h), QT_DAYS[g.getUTCDay()] + " · " + h.d + "/" + h.m + "/" + h.y);
  }
  function fromHijri() {
    var y = Number($("hjHy").value), m = Number($("hjHm").value), d = Number($("hjHd").value);
    var g = qtFromHijri(y, m, d, cal());
    if (!g) { card("hjHOut", "تاريخ غير صحيح", "قد يكون الشهر 29 يومًا فقط في هذا التقويم"); return; }
    card("hjHOut", gregText(g), QT_DAYS[g.getUTCDay()] + " · " + iso(g));
  }
  function age() {
    var v = $("hjBirth").value; if (!v) { $("hjAgeOut").innerHTML = ""; return; }
    var p = v.split("-").map(Number), b = qtUtc(p[0], p[1], p[2]), now = new Date(), t = qtUtc(now.getFullYear(), now.getMonth() + 1, now.getDate());
    if (b > t) { $("hjAgeOut").innerHTML = '<p class="result error">تاريخ الميلاد في المستقبل.</p>'; return; }
    var a = qtAge(b, t), hb = qtToHijri(b, cal()), ht = qtToHijri(t, cal());
    var hy = ht.y - hb.y - ((ht.m < hb.m || (ht.m === hb.m && ht.d < hb.d)) ? 1 : 0);
    // next birthday
    var next = qtUtc(t.getUTCFullYear(), p[1], p[2]); if (next < t) next = qtUtc(t.getUTCFullYear() + 1, p[1], p[2]);
    var left = Math.round((next - t) / 86400000);
    $("hjAgeOut").innerHTML =
      '<div class="hj-stats"><div class="stat"><div class="n">' + a.y + '</div><div class="l">سنة ميلادية</div></div>' +
      '<div class="stat"><div class="n">' + a.m + '</div><div class="l">شهر</div></div>' +
      '<div class="stat"><div class="n">' + a.d + '</div><div class="l">يوم</div></div>' +
      '<div class="stat"><div class="n">' + hy + '</div><div class="l">سنة هجرية</div></div></div>' +
      '<p class="hj-note">وُلدت يوم ' + QT_DAYS[b.getUTCDay()] + " — " + hijriText(hb) + " · عشت " + a.days.toLocaleString("en-US") + " يومًا · " + (left === 0 ? "عيد ميلاد سعيد! 🎉" : "يبقى " + left + " يومًا على عيد ميلادك") + "</p>";
  }
  function today() {
    var n = new Date(), g = qtUtc(n.getFullYear(), n.getMonth() + 1, n.getDate()), h = qtToHijri(g, cal());
    $("hjToday").innerHTML = "اليوم: <b>" + QT_DAYS[g.getUTCDay()] + " " + hijriText(h) + "</b> — الموافق <b>" + gregText(g) + "</b>";
    return { g: g, h: h };
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("hjHm")) return; // hijri.js is also loaded as a library by other pages
    var sel = $("hjHm"); QT_HIJRI_MONTHS.forEach(function (n, i) { var o = document.createElement("option"); o.value = i + 1; o.textContent = (i + 1) + " — " + n; sel.appendChild(o); });
    var t = today();
    $("hjG").value = iso(t.g); $("hjHy").value = t.h.y; $("hjHm").value = t.h.m; $("hjHd").value = t.h.d;
    ["hjG"].forEach(function (id) { $(id).addEventListener("input", fromGreg); $(id).addEventListener("change", fromGreg); });
    ["hjHy", "hjHm", "hjHd"].forEach(function (id) { $(id).addEventListener("input", fromHijri); $(id).addEventListener("change", fromHijri); });
    $("hjBirth").addEventListener("change", age); $("hjBirth").addEventListener("input", age);
    $("hjCal").addEventListener("change", function () { today(); fromGreg(); fromHijri(); age(); });
    fromGreg(); fromHijri();
  });
})();

if (typeof module !== "undefined") module.exports = { qtToHijri: qtToHijri, qtFromHijri: qtFromHijri, qtAge: qtAge };

// Landing pages (e.g. /ar/age-calculator) can put the age calculator first.
if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", function () {
  var P = window.QT_PRESET || {}, birth = document.getElementById("hjBirth"), tool = document.getElementById("tool");
  if (P.focus !== "age" || !birth || !tool) return;
  var box = birth.closest(".hj-box");
  if (box) { tool.insertBefore(box, tool.firstChild); box.style.margin = "0 0 18px"; }
});
