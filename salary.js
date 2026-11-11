// QuickTiny Saudi salary & GOSI calculator: net salary and employer cost from basic + allowances.
// Rates (verify with GOSI): annuities (pension) 9% + 9% for workers registered before 3 July 2024; for workers who
// joined the new system on/after that date the annuity rate starts at 9% each and rises 0.5 points every 3 July
// until 11% (2028). SANED unemployment insurance 0.75% + 0.75% (Saudis). Occupational hazards 2% (employer, all workers).
// Contribution wage = basic + housing allowance, capped at 45,000 SAR a month.
var QT_GOSI_CAP = 45000;

// Annuity rate (per side) for the new system on a given date.
function qtGosiNewAnnuity(date) {
  var y = date.getUTCFullYear(), afterJuly3 = date >= new Date(Date.UTC(y, 6, 3));
  var steps = (y - 2025) + (afterJuly3 ? 1 : 0); // 3 Jul 2025 -> 1 step
  return Math.min(11, Math.max(9, 9 + 0.5 * steps));
}
// o: {basic, housing, transport, other, saudi: bool, system: "old"|"new", date, annuity (optional override %)}
function qtSalary(o) {
  var basic = +o.basic || 0, housing = +o.housing || 0, transport = +o.transport || 0, other = +o.other || 0;
  var gross = basic + housing + transport + other;
  var base = Math.min(basic + housing, QT_GOSI_CAP);
  var ann = o.saudi ? (isFinite(o.annuity) && o.annuity !== null && o.annuity !== "" ? +o.annuity : (o.system === "new" ? qtGosiNewAnnuity(o.date || new Date()) : 9)) : 0;
  var saned = o.saudi ? 0.75 : 0, hazards = 2;
  var empDed = base * (ann + saned) / 100;
  var erCost = base * (ann + saned + hazards) / 100;
  return {
    gross: gross, base: base, annuity: ann, saned: saned, hazards: hazards,
    employee: { annuity: base * ann / 100, saned: base * saned / 100, total: empDed },
    employer: { annuity: base * ann / 100, saned: base * saned / 100, hazards: base * hazards / 100, total: erCost },
    net: gross - empDed, cost: gross + erCost
  };
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("slBasic")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var num = function (v) { v = String(v || "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[,،\s]/g, "").replace("٫", "."); return v === "" ? NaN : +v; };
  var money = function (v) { return isFinite(v) ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"; };
  var T = AR ? { ann: "المعاشات", saned: "ساند (التعطل عن العمل)", haz: "الأخطار المهنية", emp: "يُخصم من الموظف", er: "يدفعها صاحب العمل", total: "المجموع", note: "معدل المعاشات للنظام الجديد في هذا التاريخ" }
             : { ann: "Annuities (pension)", saned: "SANED (unemployment)", haz: "Occupational hazards", emp: "Deducted from employee", er: "Paid by employer", total: "Total", note: "New-system annuity rate on this date" };
  var ids = ["slBasic", "slHousing", "slTransport", "slOther", "slAnnuity"];
  var saved = {}; try { saved = JSON.parse(localStorage.getItem("qtSalary") || "{}") || {}; } catch (e) {}
  ids.forEach(function (id) { if (saved[id] != null && saved[id] !== "") $(id).value = saved[id]; $(id).addEventListener("input", run); });
  if (saved.nat) $("slNat").value = saved.nat; if (saved.sys) $("slSys").value = saved.sys;
  ["slNat", "slSys"].forEach(function (id) { $(id).addEventListener("change", run); });
  document.querySelectorAll("[data-pct]").forEach(function (b) {
    b.addEventListener("click", function () { var basic = num($("slBasic").value); if (isFinite(basic)) { $(b.getAttribute("data-for")).value = Math.round(basic * +b.getAttribute("data-pct")) / 100; run(); } });
  });
  var last = "", hint0 = $("slAnnHint").textContent;
  function run() {
    var saudi = $("slNat").value === "saudi";
    $("slSysRow").hidden = !saudi;
    var r = qtSalary({ basic: num($("slBasic").value), housing: num($("slHousing").value), transport: num($("slTransport").value), other: num($("slOther").value),
                       saudi: saudi, system: $("slSys").value, date: new Date(), annuity: $("slAnnuity").value === "" ? null : num($("slAnnuity").value) });
    $("slNet").textContent = money(r.net);
    if ($("slNet").textContent !== last) { $("slNet").classList.remove("rm-pop"); void $("slNet").offsetWidth; $("slNet").classList.add("rm-pop"); last = $("slNet").textContent; }
    $("slGross").textContent = money(r.gross); $("slBase").textContent = money(r.base); $("slDed").textContent = money(r.employee.total); $("slCost").textContent = money(r.cost);
    $("slAnnHint").textContent = saudi && $("slSys").value === "new" ? T.note + ": " + qtGosiNewAnnuity(new Date()) + "%" : hint0;
    var row = function (name, pct, a, b) { return "<tr><td>" + name + ' <span class="sl-pct">' + pct + "%</span></td><td>" + (a === null ? "—" : money(a)) + "</td><td>" + money(b) + "</td></tr>"; };
    $("slTable").innerHTML = "<thead><tr><th>" + (AR ? "البند" : "Item") + "</th><th>" + T.emp + "</th><th>" + T.er + "</th></tr></thead><tbody>" +
      (saudi ? row(T.ann, r.annuity, r.employee.annuity, r.employer.annuity) + row(T.saned, r.saned, r.employee.saned, r.employer.saned) : "") +
      row(T.haz, r.hazards, null, r.employer.hazards) +
      '<tr class="sl-tot"><td>' + T.total + "</td><td>" + money(r.employee.total) + "</td><td>" + money(r.employer.total) + "</td></tr></tbody>";
    // Share of gross going to net vs deductions, as a bar.
    var k = r.gross > 0 ? Math.max(0, Math.min(1, r.net / r.gross)) : 0;
    $("slBarNet").style.width = (k * 100).toFixed(1) + "%";
    $("slYear").textContent = money(r.net * 12);
    var st = { nat: $("slNat").value, sys: $("slSys").value }; ids.forEach(function (id) { st[id] = $(id).value; });
    try { localStorage.setItem("qtSalary", JSON.stringify(st)); } catch (e) {}
  }
  run();
})();

if (typeof module !== "undefined") module.exports = { qtSalary: qtSalary, qtGosiNewAnnuity: qtGosiNewAnnuity, QT_GOSI_CAP: QT_GOSI_CAP };
