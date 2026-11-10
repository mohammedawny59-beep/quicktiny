// QuickTiny everyday calculators: days between dates, BMI, pregnancy due date, loan / personal finance.
// Pure functions first (tested in Node), then one UI block per page. Strings go through window.QT_STRINGS.

var QT_DAY = 86400000;
function qtParseDay(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "")); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; }
function qtDayStr(t) { var d = new Date(t); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0"); }

// Difference between two YYYY-MM-DD dates. weekend: array of UTC weekday numbers (0 = Sunday).
function qtDateDiff(a, b, includeEnd, weekend) {
  var ta = qtParseDay(a), tb = qtParseDay(b);
  if (isNaN(ta) || isNaN(tb)) return null;
  var sign = tb >= ta ? 1 : -1, s = Math.min(ta, tb), e = Math.max(ta, tb);
  if (includeEnd) e += QT_DAY;
  var days = Math.round((e - s) / QT_DAY);
  var sd = new Date(s), ed = new Date(e);
  var y = ed.getUTCFullYear() - sd.getUTCFullYear(), m = ed.getUTCMonth() - sd.getUTCMonth(), d = ed.getUTCDate() - sd.getUTCDate();
  if (d < 0) { m--; d += new Date(Date.UTC(ed.getUTCFullYear(), ed.getUTCMonth(), 0)).getUTCDate(); }
  if (m < 0) { y--; m += 12; }
  var we = weekend || [0, 6], full = Math.floor(days / 7), work = full * (7 - we.length), startDow = sd.getUTCDay();
  for (var i = 0; i < days % 7; i++) if (we.indexOf((startDow + full * 7 + i) % 7) === -1) work++;
  return { sign: sign, days: days, weeks: Math.floor(days / 7), remDays: days % 7, y: y, m: m, d: d, workdays: work, hours: days * 24 };
}
function qtAddDays(a, n) { var t = qtParseDay(a); return isNaN(t) ? null : qtDayStr(t + Math.round(n) * QT_DAY); }

function qtBmi(kg, cm) {
  if (!(kg > 0) || !(cm > 0)) return null;
  var h = cm / 100, bmi = kg / (h * h), cat;
  if (bmi < 18.5) cat = "under"; else if (bmi < 25) cat = "normal"; else if (bmi < 30) cat = "over"; else if (bmi < 35) cat = "ob1"; else if (bmi < 40) cat = "ob2"; else cat = "ob3";
  return { bmi: bmi, cat: cat, min: 18.5 * h * h, max: 24.9 * h * h };
}

// o: {lmp, cycle} or {conception}; today: YYYY-MM-DD
function qtDueDate(o, today) {
  var lmp;
  if (o.conception) { var c = qtParseDay(o.conception); if (isNaN(c)) return null; lmp = c - 14 * QT_DAY; }
  else { lmp = qtParseDay(o.lmp); if (isNaN(lmp)) return null; lmp += ((+o.cycle || 28) - 28) * QT_DAY; }
  var due = lmp + 280 * QT_DAY, t = qtParseDay(today), ga = Math.floor((t - lmp) / QT_DAY);
  var at = function (w) { return qtDayStr(lmp + w * 7 * QT_DAY); };
  return {
    due: qtDayStr(due), lmp: qtDayStr(lmp), gaDays: ga, weeks: Math.floor(ga / 7), days: ((ga % 7) + 7) % 7,
    trimester: ga < 0 ? 0 : ga < 14 * 7 ? 1 : ga < 28 * 7 ? 2 : 3, daysLeft: Math.round((due - t) / QT_DAY),
    milestones: { t1End: at(14), scan20: at(20), t2End: at(28), term37: at(37), due: qtDayStr(due), late42: at(42) }
  };
}

// Monthly payment for an amortizing loan.
function qtPmt(P, annualPct, n) { var r = annualPct / 1200; return r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n)); }
// o: {amount, rate (% per year), months, method: "reducing" | "flat", fee}
function qtLoan(o) {
  var P = +o.amount, n = Math.round(+o.months), rate = +o.rate, fee = +o.fee || 0;
  if (!(P > 0) || !(n > 0) || !(rate >= 0)) return null;
  var monthly, total, interest, apr, schedule = [];
  if (o.method === "flat") {
    interest = P * rate / 100 * n / 12; total = P + interest; monthly = total / n;
    // Equivalent annual rate on a reducing balance (what the loan really costs).
    var lo = 0, hi = 200;
    for (var i = 0; i < 80; i++) { var mid = (lo + hi) / 2; if (qtPmt(P, mid, n) > monthly) hi = mid; else lo = mid; }
    apr = (lo + hi) / 2;
  } else {
    monthly = qtPmt(P, rate, n); total = monthly * n; interest = total - P; apr = rate;
  }
  if (fee) { var lo2 = 0, hi2 = 300; for (var j = 0; j < 80; j++) { var m2 = (lo2 + hi2) / 2; if (qtPmt(P - fee, m2, n) > monthly) hi2 = m2; else lo2 = m2; } apr = (lo2 + hi2) / 2; }
  // Yearly schedule on the effective reducing balance.
  var bal = P, r = apr / 1200, yr = { year: 1, paid: 0, principal: 0, interest: 0 };
  if (!fee) for (var k = 1; k <= n; k++) {
    var int = o.method === "flat" ? (P * rate / 100 / 12) : bal * r, prin = monthly - int;
    if (o.method === "flat") prin = P / n;
    bal = Math.max(0, bal - prin); yr.paid += monthly; yr.principal += prin; yr.interest += int;
    if (k % 12 === 0 || k === n) { yr.balance = bal; schedule.push(yr); yr = { year: yr.year + 1, paid: 0, principal: 0, interest: 0 }; }
  }
  return { monthly: monthly, total: total + fee, interest: interest, apr: apr, fee: fee, schedule: schedule };
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var S = window.QT_STRINGS || {}, L = function (k, d) { return S[k] || d; };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var num = function (id) { var v = String($(id).value || "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[,،\s]/g, "").replace("٫", "."); return v === "" ? NaN : +v; };
  var f = function (x, d) { return Number(x).toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var today = function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  var lang = document.documentElement.lang === "ar" ? "ar" : "en";
  var nice = function (s) { var t = qtParseDay(s); if (isNaN(t)) return ""; var d = new Date(t); var g = d.toLocaleDateString(lang === "ar" ? "ar-u-nu-latn-ca-gregory" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
    if (lang === "ar" && typeof qtToHijri === "function") { var h = qtToHijri(d); g += " · " + h.d + "/" + h.m + "/" + h.y + " هـ"; } return g; };
  var on = function (ids, fn) { ids.forEach(function (id) { var el = $(id); if (el) el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" || el.type === "date" ? "change" : "input", fn); if (el && el.type === "date") el.addEventListener("input", fn); }); };

  function datesPage() {
    if (!$("dtA").value) $("dtA").value = today();
    if (!$("dtB").value) $("dtB").value = (new Date().getFullYear() + 1) + "-01-01";
    if (!$("dtBase").value) $("dtBase").value = today();
    function run() {
      var we = $("dtWeekend").value.split(",").map(Number), r = qtDateDiff($("dtA").value, $("dtB").value, $("dtInc").checked, we);
      if (!r) { $("dtDays").textContent = "—"; return; }
      $("dtDays").textContent = f(r.days);
      var part = function (n, k, one, many) { return n ? n + " " + (n === 1 ? L(k + "1", one) : L(k, many)) : ""; };
      $("dtYmd").textContent = [part(r.y, "years", "year", "years"), part(r.m, "months", "month", "months"), part(r.d, "days", "day", "days")].filter(Boolean).join(L("and", ", ")) || "0 " + L("days", "days");
      $("dtWeeks").textContent = f(r.weeks) + " " + L("weeks", "weeks") + (r.remDays ? " + " + r.remDays + " " + L("days", "days") : "");
      $("dtWork").textContent = f(r.workdays);
      $("dtHours").textContent = f(r.hours);
      $("dtDir").textContent = r.sign < 0 ? L("past", "(the second date is earlier)") : "";
      var n = num("dtN"), out = qtAddDays($("dtBase").value, ($("dtOp").value === "sub" ? -1 : 1) * (isNaN(n) ? 0 : n));
      $("dtAdd").textContent = out ? nice(out) : "—";
    }
    on(["dtA", "dtB", "dtInc", "dtWeekend", "dtBase", "dtN", "dtOp"], run);
    document.querySelectorAll("[data-dt]").forEach(function (b) { b.addEventListener("click", function () { $("dtB").value = b.getAttribute("data-dt"); run(); }); });
    run();
  }
  function bmiPage() {
    function run() {
      var imp = $("bmUnits").value === "imp";
      $("bmMetric").hidden = imp; $("bmImperial").hidden = !imp;
      var kg = imp ? num("bmLb") * 0.45359237 : num("bmKg"), cm = imp ? (num("bmFt") * 12 + (num("bmIn") || 0)) * 2.54 : num("bmCm");
      var r = qtBmi(kg, cm);
      if (!r) { $("bmVal").textContent = "—"; $("bmCat").textContent = ""; return; }
      $("bmVal").textContent = r.bmi.toFixed(1);
      var names = { under: L("under", "Underweight"), normal: L("normal", "Healthy weight"), over: L("over", "Overweight"), ob1: L("ob1", "Obesity class I"), ob2: L("ob2", "Obesity class II"), ob3: L("ob3", "Obesity class III") };
      $("bmCat").textContent = names[r.cat]; $("bmCat").className = "bm-cat bm-" + r.cat;
      var u = imp ? function (k) { return f(k / 0.45359237, 0) + " lb"; } : function (k) { return f(k, 1) + " kg"; };
      $("bmRange").textContent = L("range", "Healthy range for your height:") + " " + u(r.min) + " – " + u(r.max);
      var pos = Math.max(0, Math.min(100, (r.bmi - 15) / (40 - 15) * 100));
      $("bmPin").style.insetInlineStart = pos + "%";
    }
    on(["bmUnits", "bmKg", "bmCm", "bmLb", "bmFt", "bmIn"], run); run();
  }
  function duePage() {
    if (!$("pgLmp").value) { var d = new Date(Date.now() - 70 * QT_DAY); $("pgLmp").value = d.toISOString().slice(0, 10); }
    function run() {
      var byC = $("pgMode").value === "conception";
      $("pgLmpWrap").hidden = byC; $("pgConWrap").hidden = !byC;
      var r = qtDueDate(byC ? { conception: $("pgCon").value } : { lmp: $("pgLmp").value, cycle: num("pgCycle") || 28 }, today());
      if (!r) { $("pgDue").textContent = "—"; return; }
      $("pgDue").textContent = nice(r.due);
      $("pgNow").textContent = r.gaDays < 0 ? "" : r.gaDays > 42 * 7 ? L("past42", "More than 42 weeks — check the date you entered.") :
        L("now", "Now:") + " " + r.weeks + " " + L("w", "weeks") + " " + r.days + " " + L("d", "days") + " · " + L("tri" + r.trimester, ["", "1st trimester", "2nd trimester", "3rd trimester"][r.trimester]) + (r.daysLeft >= 0 ? " · " + f(r.daysLeft) + " " + L("left", "days to go") : "");
      var pct = Math.max(0, Math.min(100, r.gaDays / 280 * 100)); $("pgBar").style.width = pct + "%";
      var ms = r.milestones, rows = [["t1End", "End of 1st trimester (week 13)"], ["scan20", "Anatomy scan (around week 20)"], ["t2End", "Start of 3rd trimester (week 28)"], ["term37", "Full term (week 37)"], ["due", "Due date (week 40)"], ["late42", "Week 42"]];
      $("pgMs").innerHTML = rows.map(function (x) { return "<tr><td>" + esc(L("ms_" + x[0], x[1])) + "</td><td>" + esc(nice(ms[x[0]])) + "</td></tr>"; }).join("");
    }
    on(["pgMode", "pgLmp", "pgCycle", "pgCon"], run); run();
  }
  function loanPage() {
    function run() {
      var r = qtLoan({ amount: num("lnAmt"), rate: num("lnRate"), months: (num("lnYears") || 0) * 12 + (num("lnMonths") || 0), method: $("lnMethod").value, fee: num("lnFee") || 0 });
      if (!r) { $("lnMonthly").textContent = "—"; return; }
      $("lnMonthly").textContent = f(r.monthly, 2);
      $("lnTotal").textContent = f(r.total, 2); $("lnInt").textContent = f(r.interest, 2);
      $("lnApr").textContent = r.apr.toFixed(2) + "%";
      $("lnAprNote").hidden = !($("lnMethod").value === "flat" || r.fee);
      $("lnSched").innerHTML = r.schedule.map(function (y) { return "<tr><td>" + y.year + "</td><td>" + f(y.paid, 2) + "</td><td>" + f(y.principal, 2) + "</td><td>" + f(y.interest, 2) + "</td><td>" + f(y.balance, 2) + "</td></tr>"; }).join("");
    }
    on(["lnAmt", "lnRate", "lnYears", "lnMonths", "lnMethod", "lnFee"], run); run();
  }
  document.addEventListener("DOMContentLoaded", function () {
    if ($("dtA")) datesPage();
    if ($("bmVal")) bmiPage();
    if ($("pgDue")) duePage();
    if ($("lnAmt")) loanPage();
    var P = window.QT_PRESET || {};
    Object.keys(P.set || {}).forEach(function (id) { var el = $(id); if (el) { el.value = P.set[id]; el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input")); } });
  });
})();

if (typeof module !== "undefined") module.exports = { qtDateDiff: qtDateDiff, qtAddDays: qtAddDays, qtBmi: qtBmi, qtDueDate: qtDueDate, qtLoan: qtLoan, qtPmt: qtPmt };
