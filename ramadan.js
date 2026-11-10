// QuickTiny Ramadan pack: zakat al-fitr + fidya calculator, and a Ramadan / iftar / suhoor countdown.
// The countdown page also loads hijri.js (qtToHijri, qtFromHijri), prayer-cities.js and prayer-times.js.

// Zakat al-fitr: persons × kilograms of staple food each, optionally priced per kg.
function qtFitr(persons, kgEach, pricePerKg) {
  var p = Math.max(0, Math.floor(+persons || 0)), kg = p * (+kgEach || 0);
  return { persons: p, kg: kg, cash: pricePerKg > 0 ? kg * pricePerKg : NaN };
}
// Fidya for days not fasted (for those permanently unable): one meal for a poor person per day.
function qtFidya(days, mealCost) {
  var d = Math.max(0, Math.floor(+days || 0));
  return { days: d, total: mealCost > 0 ? d * mealCost : NaN };
}
// The Ramadan relevant to `date` (UTC noon Date): the current one if we're in it, otherwise the next.
// Returns {year (AH), start: Date of 1 Ramadan, eid: Date of 1 Shawwal, inRamadan, day (1-30 or 0)}.
// Dates follow the Umm al-Qura calendar; the real start depends on the moon sighting.
function qtRamadanInfo(date, cal) {
  var h = qtToHijri(date, cal), inR = h.m === 9;
  var y = h.m <= 9 ? h.y : h.y + 1;                    // after Ramadan (incl. Eid day): next year's
  var start = qtFromHijri(y, 9, 1, cal), eid = qtFromHijri(y, 10, 1, cal);
  return { year: y, start: start, eid: eid, inRamadan: inR, day: inR ? h.d : 0, days: Math.round((eid - start) / 86400000) };
}
function qtSplit(ms) {
  ms = Math.max(0, ms);
  var s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var num = function (v) { v = String(v == null ? "" : v).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[,،\s]/g, "").replace("٫", "."); return v === "" ? NaN : +v; };
  var fmt = function (v, d) { return isFinite(v) ? (+v.toFixed(d)).toLocaleString("en-US", { maximumFractionDigits: d }) : "—"; };
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function pop(e) { if (!e) return; e.classList.remove("rm-pop"); void e.offsetWidth; e.classList.add("rm-pop"); }

  /* ---------- Zakat al-fitr + fidya ---------- */
  function initFitr() {
    if (!$("zfPersons")) return;
    var saved = store("qtFitr") || {};
    ["zfPersons", "zfKg", "zfPrice", "zfCash", "fdDays", "fdMeal"].forEach(function (id) { if (saved[id] != null && saved[id] !== "") $(id).value = saved[id]; $(id).addEventListener("input", run); });
    $("zfMinus").addEventListener("click", function () { $("zfPersons").value = Math.max(1, (num($("zfPersons").value) || 1) - 1); run(); });
    $("zfPlus").addEventListener("click", function () { $("zfPersons").value = (num($("zfPersons").value) || 0) + 1; run(); });
    document.querySelectorAll("#zfKgChips .chip").forEach(function (b) { b.addEventListener("click", function () { $("zfKg").value = b.getAttribute("data-kg"); run(); }); });
    var last = "";
    function run() {
      var p = num($("zfPersons").value), kg = num($("zfKg").value), price = num($("zfPrice").value), cashEach = num($("zfCash").value);
      var r = qtFitr(p, kg, price);
      document.querySelectorAll("#zfKgChips .chip").forEach(function (b) { b.classList.toggle("active", +b.getAttribute("data-kg") === kg); });
      $("zfKgOut").textContent = fmt(r.kg, 2) + (AR ? " كغ" : " kg");
      $("zfCashOut").textContent = isFinite(r.cash) ? fmt(r.cash, 2) : "—";
      $("zfOfficial").textContent = cashEach > 0 && r.persons ? fmt(cashEach * r.persons, 2) : "—";
      $("zfWho").textContent = r.persons + " × " + fmt(kg, 2) + (AR ? " كغ" : " kg") + (isFinite(r.cash) ? " × " + fmt(price, 2) : "");
      // A row of little people, one per person (up to 12), so the family size is visible at a glance.
      var ppl = ""; for (var i = 0; i < Math.min(r.persons, 12); i++) ppl += '<span class="zf-p" style="animation-delay:' + i * 40 + 'ms"></span>';
      if (r.persons > 12) ppl += '<span class="zf-more">+' + (r.persons - 12) + "</span>";
      $("zfPeople").innerHTML = ppl;
      if ($("zfKgOut").textContent !== last) { pop($("zfKgOut")); last = $("zfKgOut").textContent; }
      var f = qtFidya(num($("fdDays").value), num($("fdMeal").value));
      $("fdOut").textContent = isFinite(f.total) ? fmt(f.total, 2) : "—";
      $("fdF").textContent = f.days && isFinite(f.total) ? f.days + " × " + fmt(num($("fdMeal").value), 2) : "";
      var st = {}; ["zfPersons", "zfKg", "zfPrice", "zfCash", "fdDays", "fdMeal"].forEach(function (id) { st[id] = $(id).value; }); store("qtFitr", st);
    }
    run();
  }

  /* ---------- Ramadan / iftar countdown ---------- */
  function initCountdown() {
    if (!$("rcCity") || typeof qtToHijri !== "function" || typeof qtPrayerTimes !== "function") return;
    var CITIES = window.QT_PT_CITIES || [], sel = $("rcCity");
    CITIES.forEach(function (c) { var o = document.createElement("option"); o.value = c.slug; o.textContent = AR ? c.ar + " — " + c.cAr : c.en + ", " + c.cEn; sel.appendChild(o); });
    var guess = null;
    try { var tz = Intl.DateTimeFormat().resolvedOptions().timeZone; guess = CITIES.filter(function (c) { return c.tz === tz; })[0]; } catch (e) {}
    sel.value = store("qtRcCity") || (guess ? guess.slug : (AR ? "mecca" : "london"));
    if (!sel.value) sel.value = CITIES[0].slug;
    sel.addEventListener("change", function () { store("qtRcCity", sel.value); tick(true); });
    var now = function () { return window.QT_NOW ? new Date(window.QT_NOW + (Date.now() - T0)) : new Date(); }, T0 = Date.now();
    // Wall-clock parts of an instant in a time zone.
    function parts(d, tz) { var p = {}; new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; }); return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second }; }
    // Instant of a local wall-clock time (fractional hours) on a city's date.
    function instant(c, y, m, d, hours) { return new Date(Date.UTC(y, m - 1, d) + (hours - qtTzOffset(c.tz, y, m, d)) * 3600000); }
    function times(c, y, m, d) { return qtPrayerTimes({ date: { y: y, m: m, d: d }, lat: c.lat, lng: c.lng, tz: qtTzOffset(c.tz, y, m, d), method: c.method, asr: 1, ramadan: true }); }
    function hm(x) { return qtHm(x, false); }
    var dateFmt = function (dt) { return dt.toLocaleDateString(AR ? "ar-u-nu-latn" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); };
    var mode = null, lastSec = -1;
    function setDigits(ms) {
      var t = qtSplit(ms);
      [["rcD", t.d], ["rcH", t.h], ["rcM", t.m], ["rcS", t.s]].forEach(function (x) {
        var e = $(x[0]), v = x[0] === "rcD" ? String(x[1]) : String(x[1]).padStart(2, "0");
        if (e.textContent !== v) { e.textContent = v; e.classList.remove("rm-flip"); void e.offsetWidth; e.classList.add("rm-flip"); }
      });
      $("rcDBox").hidden = mode !== "ramadan";
    }
    function tick(force) {
      var c = CITIES.filter(function (x) { return x.slug === sel.value; })[0] || CITIES[0], n = now(), lp = parts(n, c.tz);
      var info = qtRamadanInfo(new Date(Date.UTC(lp.y, lp.m - 1, lp.d, 12)));
      var t = times(c, lp.y, lp.m, lp.d), fajrAt = instant(c, lp.y, lp.m, lp.d, t.fajr), magAt = instant(c, lp.y, lp.m, lp.d, t.maghrib);
      var target, label, sub = "", prog = null;
      if (info.inRamadan && n < fajrAt) {
        mode = "suhoor"; target = fajrAt; label = AR ? "باقي على الإمساك (أذان الفجر)" : "Until suhoor ends (Fajr)";
      } else if (info.inRamadan && n < magAt) {
        mode = "iftar"; target = magAt; label = AR ? "باقي على الإفطار (أذان المغرب)" : "Until iftar (Maghrib)";
        prog = (n - fajrAt) / (magAt - fajrAt);
      } else if (info.inRamadan && info.day < info.days) {
        // After iftar: count to tomorrow's Fajr.
        var tm = new Date(Date.UTC(lp.y, lp.m - 1, lp.d + 1)), t2 = times(c, tm.getUTCFullYear(), tm.getUTCMonth() + 1, tm.getUTCDate());
        mode = "suhoor"; target = instant(c, tm.getUTCFullYear(), tm.getUTCMonth() + 1, tm.getUTCDate(), t2.fajr); label = AR ? "باقي على الإمساك غدًا" : "Until tomorrow's suhoor ends";
      } else {
        // Counting to Ramadan (or to Eid on the last evening).
        var to = info.inRamadan ? info.eid : info.start;
        mode = info.inRamadan ? "eid" : "ramadan";
        target = instant(c, to.getUTCFullYear(), to.getUTCMonth() + 1, to.getUTCDate(), 0);
        label = info.inRamadan ? (AR ? "باقي على عيد الفطر" : "Until Eid al-Fitr") : (AR ? "باقي على رمضان " + info.year + " هـ" : "Until Ramadan " + info.year + " AH");
      }
      setDigits(target - n);
      $("rcLabel").textContent = label;
      $("rcCard").className = "rc-card rc-" + mode;
      if (force || n.getSeconds() === 0 || lastSec < 0) {
        var ramStart = dateFmt(info.start), eid = dateFmt(info.eid);
        $("rcStart").textContent = ramStart; $("rcEid").textContent = eid;
        $("rcToday").textContent = info.inRamadan ? (AR ? "اليوم " + info.day + " من رمضان" : "Day " + info.day + " of Ramadan") : "";
        $("rcFajr").textContent = hm(t.fajr); $("rcImsak").textContent = hm(t.imsak); $("rcMaghrib").textContent = hm(t.maghrib);
        $("rcFast").textContent = (function (h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); return AR ? hh + " ساعة و" + mm + " دقيقة" : hh + " h " + mm + " min"; })(t.maghrib - t.fajr);
        $("rcLink").href = (AR ? "/ar/prayer-times/" : "/prayer-times/") + c.slug;
        $("rcLink").textContent = AR ? "مواقيت الصلاة وإمساكية رمضان في " + c.ar : "Prayer times & Ramadan timetable for " + c.en;
      }
      var bar = $("rcBar");
      bar.hidden = prog === null;
      if (prog !== null) { $("rcBarFill").style.width = (Math.max(0, Math.min(1, prog)) * 100).toFixed(2) + "%"; $("rcBarTxt").textContent = (AR ? "مضى من الصيام " : "Fast completed ") + Math.floor(prog * 100) + "%"; }
      lastSec = n.getSeconds();
    }
    tick(true);
    setInterval(tick, 1000);
    $("rcShare").addEventListener("click", function () {
      var text = $("rcLabel").textContent + ": " + ($("rcDBox").hidden ? "" : $("rcD").textContent + (AR ? " يوم " : " days ")) + $("rcH").textContent + ":" + $("rcM").textContent + ":" + $("rcS").textContent;
      var data = { title: document.title.split("|")[0].trim(), text: text, url: location.href.split("#")[0] };
      if (navigator.share) navigator.share(data).catch(function () {});
      else if (typeof qtCopy === "function") qtCopy(text + " — " + data.url, $("rcStatus"), AR ? "تم نسخ الرابط" : "Link copied");
      if (typeof qtEvent === "function") qtEvent("ramadan_share");
    });
  }

  document.addEventListener("DOMContentLoaded", function () { initFitr(); initCountdown(); });
})();

if (typeof module !== "undefined") module.exports = { qtFitr: qtFitr, qtFidya: qtFidya, qtRamadanInfo: qtRamadanInfo, qtSplit: qtSplit };
