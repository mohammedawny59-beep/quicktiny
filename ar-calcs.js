// QuickTiny Arabic calculators: VAT (ضريبة القيمة المضافة), Zakat (الزكاة), End of service (مكافأة نهاية الخدمة).
// Pure functions first (tested in Node), then one UI block per page. Totals are written out in words via tafqeet.js.

var QT_VAT = [
  { id: "SA", name: "السعودية", rate: 15, cur: "SAR" }, { id: "AE", name: "الإمارات", rate: 5, cur: "AED" },
  { id: "BH", name: "البحرين", rate: 10, cur: "BHD" }, { id: "OM", name: "عُمان", rate: 5, cur: "OMR" },
  { id: "JO", name: "الأردن (ضريبة المبيعات العامة)", rate: 16, cur: "JOD" }, { id: "EG", name: "مصر", rate: 14, cur: "EGP" },
  { id: "MA", name: "المغرب", rate: 20, cur: "MAD" }, { id: "TN", name: "تونس", rate: 19, cur: "TND" },
  { id: "DZ", name: "الجزائر", rate: 19, cur: "DZD" }, { id: "LB", name: "لبنان", rate: 11, cur: "LBP" },
  { id: "XX", name: "نسبة أخرى", rate: 15, cur: "USD" }
];
function qtRound(x, dec) { var p = Math.pow(10, dec); return Math.round((x + Number.EPSILON) * p) / p; }

// items: [{qty, price}], rate %, inclusive: prices already include VAT
function qtVat(items, rate, inclusive, dec) {
  dec = dec === undefined ? 2 : dec;
  var sum = 0; (items || []).forEach(function (it) { var q = +it.qty, p = +it.price; if (isFinite(q) && isFinite(p)) sum += q * p; });
  var r = (+rate || 0) / 100, net, vat, total;
  if (inclusive) { total = qtRound(sum, dec); net = qtRound(sum / (1 + r), dec); vat = qtRound(total - net, dec); }
  else { net = qtRound(sum, dec); vat = qtRound(net * r, dec); total = qtRound(net + vat, dec); }
  return { net: net, vat: vat, total: total };
}

var QT_NISAB_GOLD_G = 85, QT_NISAB_SILVER_G = 595;
// a: {cash, goldG:{24,22,21,18}, silverG, goldPrice24, silverPrice, trade, receivables, investments, debts, basis:"gold"|"silver"}
function qtZakat(a) {
  var n = function (v) { v = +v; return isFinite(v) && v > 0 ? v : 0; };
  var g = a.goldG || {}, pure = 0;
  [24, 22, 21, 18].forEach(function (k) { pure += n(g[k]) * k / 24; });
  var goldValue = pure * n(a.goldPrice24), silverValue = n(a.silverG) * n(a.silverPrice);
  var assets = n(a.cash) + goldValue + silverValue + n(a.trade) + n(a.receivables) + n(a.investments);
  var net = Math.max(0, assets - n(a.debts));
  var nisab = a.basis === "silver" ? QT_NISAB_SILVER_G * n(a.silverPrice) : QT_NISAB_GOLD_G * n(a.goldPrice24);
  var due = nisab > 0 && net >= nisab;
  return { pureGold: pure, goldValue: goldValue, silverValue: silverValue, assets: assets, net: net, nisab: nisab, nisabKnown: nisab > 0, due: due, zakat: due ? net * 0.025 : 0 };
}

// Calendar difference in years/months/days (end date counted as the last working day).
function qtServiceSpan(start, end) {
  var s = new Date(start + "T00:00:00Z"), e = new Date(end + "T00:00:00Z");
  if (isNaN(s) || isNaN(e) || e < s) return null;
  e = new Date(e.getTime() + 86400000);
  var y = e.getUTCFullYear() - s.getUTCFullYear(), m = e.getUTCMonth() - s.getUTCMonth(), d = e.getUTCDate() - s.getUTCDate();
  if (d < 0) { m--; d += new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), 0)).getUTCDate(); }
  if (m < 0) { y--; m += 12; }
  return { y: y, m: m, d: d, days: Math.round((e - s) / 86400000) };
}
// Arabic counted noun: 1 سنة، 2 سنتان، 3–10 سنوات، 11+ سنة؛ decimals use the singular.
var QT_AR_UNITS = { y: ["سنة", "سنتان", "سنوات", "سنة"], m: ["شهر", "شهران", "أشهر", "شهرًا"], d: ["يوم", "يومان", "أيام", "يومًا"] };
function qtArCount(n, u) {
  var f = QT_AR_UNITS[u];
  if (Math.round(n) !== n) return String(Math.round(n * 1000) / 1000) + " " + f[0];
  if (n === 1) return f[0] + " واحد" + (u === "y" ? "ة" : "");
  if (n === 2) return f[1];
  if (n >= 3 && n <= 10) return n + " " + f[2];
  return n + " " + f[3];
}
function qtArSpan(sp) {
  var parts = [];
  if (sp.y) parts.push(qtArCount(sp.y, "y")); if (sp.m) parts.push(qtArCount(sp.m, "m")); if (sp.d) parts.push(qtArCount(sp.d, "d"));
  return parts.length ? parts.join(" و") : "أقل من يوم";
}
// o: {country:"SA"|"AE", start, end, wage, reason, unpaidDays}
// SA reasons: "end" (contract end / employer termination), "resign", "art87", "art80"
// AE: any reason; nothing under 1 year of continuous service.
function qtEndOfService(o) {
  var span = qtServiceSpan(o.start, o.end);
  if (!span) return { error: "تأكد من تاريخ البداية والنهاية." };
  var yrs = Math.max(0, span.y + span.m / 12 + span.d / 365 - Math.max(0, +o.unpaidDays || 0) / 365), wage = Math.max(0, +o.wage || 0), steps = [], award = 0, full;
  if (o.country === "AE") {
    var daily = wage * 12 / 365;
    if (yrs < 1) return { span: span, years: yrs, award: 0, steps: ["مدة الخدمة أقل من سنة كاملة، فلا تستحق مكافأة وفق المادة 51."] };
    var f5 = Math.min(yrs, 5) * 21 * daily, after = Math.max(yrs - 5, 0) * 30 * daily;
    full = f5 + after;
    steps.push("الأجر اليومي = الأجر الأساسي × 12 ÷ 365 = " + qtRound(daily, 2));
    steps.push("أول 5 سنوات: " + qtArCount(qtRound(Math.min(yrs, 5), 3), "y") + " × 21 يومًا = " + qtRound(f5, 2));
    if (yrs > 5) steps.push("ما بعد 5 سنوات: " + qtArCount(qtRound(yrs - 5, 3), "y") + " × 30 يومًا = " + qtRound(after, 2));
    var cap = wage * 24;
    if (full > cap) { steps.push("المكافأة لا تتجاوز أجر سنتين (" + qtRound(cap, 2) + ")، فطُبّق الحد الأقصى."); full = cap; }
    award = full;
  } else {
    var a5 = Math.min(yrs, 5) * wage / 2, rest = Math.max(yrs - 5, 0) * wage;
    full = a5 + rest;
    steps.push("أول 5 سنوات: " + qtArCount(qtRound(Math.min(yrs, 5), 3), "y") + " × نصف أجر شهر = " + qtRound(a5, 2));
    if (yrs > 5) steps.push("ما بعد 5 سنوات: " + qtArCount(qtRound(yrs - 5, 3), "y") + " × أجر شهر كامل = " + qtRound(rest, 2));
    var f = 1;
    if (o.reason === "art80") { f = 0; steps.push("الفصل وفق المادة 80 يُسقط المكافأة."); }
    else if (o.reason === "resign") {
      f = yrs < 2 ? 0 : yrs < 5 ? 1 / 3 : yrs < 10 ? 2 / 3 : 1;
      steps.push(yrs < 2 ? "الاستقالة قبل سنتين: لا مكافأة (المادة 85)." : yrs < 5 ? "الاستقالة بين سنتين و5 سنوات: ثلث المكافأة (المادة 85)." : yrs < 10 ? "الاستقالة بين 5 و10 سنوات: ثلثا المكافأة (المادة 85)." : "الاستقالة بعد 10 سنوات: المكافأة كاملة (المادة 85).");
    } else if (o.reason === "art87") steps.push("حالات المادة 87 (القوة القاهرة، أو استقالة العاملة خلال 6 أشهر من الزواج أو 3 أشهر من الوضع): المكافأة كاملة.");
    else steps.push("انتهاء العقد أو إنهاؤه من صاحب العمل: المكافأة كاملة (المادة 84).");
    award = full * f;
  }
  return { span: span, years: yrs, full: full, award: award, steps: steps };
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var dec = function (code) { return (typeof QT_CURRENCIES !== "undefined" && QT_CURRENCIES[code] && QT_CURRENCIES[code].dec) || 2; };
  var fmt = function (x, d) { return Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); };
  var words = function (x, code) { if (typeof qtTafqeet !== "function") return ""; var d = dec(code); return qtTafqeet(qtRound(x, d).toFixed(d), code, { only: true }).text || ""; };
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem("qt_" + k) || "null"); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem("qt_" + k, JSON.stringify(v)); } catch (e) {} } };
  var num = function (id) { var v = String($(id).value || "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[,،\s]/g, "").replace("٫", "."); return v === "" ? 0 : +v; };

  // ---------------- VAT ----------------
  function vatPage() {
    var sel = $("vtCountry");
    QT_VAT.forEach(function (c) { var o = document.createElement("option"); o.value = c.id; o.textContent = c.name + (c.id !== "XX" ? " — " + c.rate + "%" : ""); sel.appendChild(o); });
    var saved = store.get("vat") || {};
    if (saved.country) sel.value = saved.country;
    function country() { return QT_VAT.filter(function (c) { return c.id === sel.value; })[0] || QT_VAT[0]; }
    function addRow(desc, qty, price) {
      var tr = document.createElement("tr");
      tr.innerHTML = '<td><input type="text" class="vt-desc" placeholder="وصف البند (اختياري)" value="' + esc(desc || "") + '"></td><td><input type="text" inputmode="decimal" class="vt-qty" value="' + (qty || 1) + '"></td><td><input type="text" inputmode="decimal" class="vt-price" placeholder="0.00" value="' + (price || "") + '"></td><td class="vt-line"></td><td><button type="button" class="vt-del" aria-label="حذف البند">×</button></td>';
      tr.querySelector(".vt-del").addEventListener("click", function () { if ($("vtRows").children.length > 1) tr.remove(); run(); });
      tr.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", run); });
      $("vtRows").appendChild(tr);
    }
    function items() { return Array.prototype.map.call($("vtRows").children, function (tr) { var g = function (c) { return String(tr.querySelector(c).value).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[,،\s]/g, ""); }; return { desc: tr.querySelector(".vt-desc").value, qty: g(".vt-qty") || 0, price: g(".vt-price") || 0, tr: tr }; }); }
    function run() {
      var c = country(), rate = c.id === "XX" ? num("vtRate") : c.rate, d = dec(c.cur), inc = $("vtMode").value === "inc";
      $("vtRateWrap").hidden = c.id !== "XX"; $("vtCurWrap").hidden = c.id !== "XX";
      var cur = c.id === "XX" ? $("vtCur").value : c.cur;
      d = dec(cur);
      var its = items();
      its.forEach(function (it) { var l = (+it.qty || 0) * (+it.price || 0); it.tr.querySelector(".vt-line").textContent = l ? fmt(l, d) : ""; });
      var r = qtVat(its, rate, inc, d);
      $("vtNet").textContent = fmt(r.net, d); $("vtVat").textContent = fmt(r.vat, d); $("vtTotal").textContent = fmt(r.total, d);
      $("vtRateLbl").textContent = rate + "%"; document.querySelectorAll(".vt-cur").forEach(function (e) { e.textContent = cur; });
      $("vtWords").textContent = r.total ? words(r.total, cur) : "";
      $("vtHint").textContent = inc ? "الأسعار المدخلة شاملة الضريبة — استخرجنا الضريبة منها (السعر ÷ " + (1 + rate / 100).toFixed(2) + ")." : "الأسعار المدخلة قبل الضريبة — أضفنا " + rate + "% عليها.";
      store.set("vat", { country: sel.value });
      return { r: r, cur: cur, rate: rate, d: d, its: its };
    }
    addRow("", 1, "1000");
    $("vtAdd").addEventListener("click", function () { addRow(); run(); });
    ["vtCountry", "vtMode", "vtRate", "vtCur"].forEach(function (id) { $(id).addEventListener(id === "vtRate" ? "input" : "change", run); });
    if (typeof QT_CURRENCIES !== "undefined") Object.keys(QT_CURRENCIES).forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = QT_CURRENCIES[k].name + " (" + k + ")"; $("vtCur").appendChild(o); });
    $("vtCopy").addEventListener("click", function () {
      var x = run(), lines = [];
      x.its.forEach(function (it) { if (+it.price) lines.push((it.desc || "بند") + ": " + it.qty + " × " + fmt(+it.price, x.d)); });
      lines.push("المبلغ قبل الضريبة: " + fmt(x.r.net, x.d) + " " + x.cur, "ضريبة القيمة المضافة (" + x.rate + "%): " + fmt(x.r.vat, x.d) + " " + x.cur, "الإجمالي شامل الضريبة: " + fmt(x.r.total, x.d) + " " + x.cur, words(x.r.total, x.cur));
      qtCopy(lines.join("\n"), $("vtStatus"), "تم النسخ"); qtTrack("vat_copy");
    });
    run();
  }

  // ---------------- Zakat ----------------
  function zakatPage() {
    var ids = ["zkCash", "zkG24", "zkG22", "zkG21", "zkG18", "zkSilver", "zkGoldPrice", "zkSilverPrice", "zkTrade", "zkRecv", "zkInvest", "zkDebts"];
    var saved = store.get("zakat_prices") || {};
    if (saved.g) $("zkGoldPrice").value = saved.g; if (saved.s) $("zkSilverPrice").value = saved.s; if (saved.c) $("zkCur").value = saved.c;
    function run() {
      var cur = $("zkCur").value, d = dec(cur);
      var r = qtZakat({ cash: num("zkCash"), goldG: { 24: num("zkG24"), 22: num("zkG22"), 21: num("zkG21"), 18: num("zkG18") }, silverG: num("zkSilver"),
        goldPrice24: num("zkGoldPrice"), silverPrice: num("zkSilverPrice"), trade: num("zkTrade"), receivables: num("zkRecv"), investments: num("zkInvest"), debts: num("zkDebts"), basis: $("zkBasis").value });
      document.querySelectorAll(".zk-cur").forEach(function (e) { e.textContent = cur; });
      $("zkAssets").textContent = fmt(r.assets, d); $("zkNetV").textContent = fmt(r.net, d);
      $("zkNisab").textContent = r.nisabKnown ? fmt(r.nisab, d) : "أدخل سعر " + ($("zkBasis").value === "silver" ? "الفضة" : "الذهب");
      $("zkPure").textContent = r.pureGold ? "ذهبك يعادل " + qtRound(r.pureGold, 2) + " غرام ذهب عيار 24 بقيمة " + fmt(r.goldValue, d) + " " + cur : "";
      var box = $("zkResult");
      if (!r.nisabKnown) { box.className = "zk-res"; $("zkAmount").textContent = "—"; $("zkMsg").textContent = "أدخل سعر غرام الذهب (أو الفضة) اليوم لنحسب النصاب."; $("zkWords").textContent = ""; }
      else if (r.due) { box.className = "zk-res zk-due"; $("zkAmount").textContent = fmt(r.zakat, d) + " " + cur; $("zkMsg").textContent = "مالك بلغ النصاب — الزكاة الواجبة 2.5% من صافي المال بعد مرور حول هجري كامل."; $("zkWords").textContent = words(r.zakat, cur); }
      else { box.className = "zk-res"; $("zkAmount").textContent = "0"; $("zkMsg").textContent = "مالك لم يبلغ النصاب (" + fmt(r.nisab, d) + " " + cur + ")، فلا زكاة فيه."; $("zkWords").textContent = ""; }
      store.set("zakat_prices", { g: $("zkGoldPrice").value, s: $("zkSilverPrice").value, c: cur });
      return r;
    }
    ids.concat(["zkBasis", "zkCur"]).forEach(function (id) { $(id).addEventListener(/Basis|Cur/.test(id) ? "change" : "input", run); });
    $("zkCopy").addEventListener("click", function () { var r = run(); qtCopy("الزكاة الواجبة: " + $("zkAmount").textContent + "\nصافي المال: " + $("zkNetV").textContent + " " + $("zkCur").value + "\nالنصاب: " + $("zkNisab").textContent, $("zkStatus"), "تم النسخ"); qtTrack("zakat_copy", { due: r.due ? 1 : 0 }); });
    run();
  }

  // ---------------- End of service ----------------
  function eosPage() {
    function sync() {
      var ae = $("esCountry").value === "AE";
      $("esReasonSA").hidden = ae; $("esWageLbl").textContent = ae ? "الأجر الأساسي الشهري الأخير" : "الأجر الشهري الأخير (الأساسي + البدلات الثابتة)";
      $("esCur").value = ae ? "AED" : "SAR";
    }
    function run() {
      var cur = $("esCur").value, d = dec(cur);
      var r = qtEndOfService({ country: $("esCountry").value, start: $("esStart").value, end: $("esEnd").value, wage: num("esWage"), reason: $("esReason").value, unpaidDays: num("esUnpaid") });
      if (r.error) { $("esAmount").textContent = "—"; $("esSpan").textContent = r.error; $("esSteps").innerHTML = ""; $("esWords").textContent = ""; return; }
      $("esSpan").textContent = "مدة الخدمة: " + qtArSpan(r.span) + (Math.round(r.years * 1000) / 1000 !== r.span.y || r.span.m || r.span.d ? " (" + qtArCount(qtRound(r.years, 3), "y") + " محسوبة)" : "");
      $("esAmount").textContent = fmt(r.award, d) + " " + cur;
      $("esWords").textContent = r.award ? words(r.award, cur) : "";
      $("esSteps").innerHTML = r.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + (r.full !== undefined && r.award !== r.full ? "<li>المكافأة الكاملة قبل التخفيض: " + fmt(r.full, d) + "</li>" : "");
      return r;
    }
    var today = new Date().toISOString().slice(0, 10);
    if (!$("esEnd").value) $("esEnd").value = today;
    $("esCountry").addEventListener("change", function () { sync(); run(); });
    ["esStart", "esEnd", "esWage", "esReason", "esUnpaid", "esCur"].forEach(function (id) { $(id).addEventListener(/Reason|Cur/.test(id) ? "change" : "input", run); });
    $("esCopy").addEventListener("click", function () { qtCopy($("esSpan").textContent + "\nالمكافأة المقدرة: " + $("esAmount").textContent + "\n" + $("esWords").textContent, $("esStatus"), "تم النسخ"); qtTrack("eos_copy"); });
    sync(); run();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if ($("vtRows")) vatPage();
    if ($("zkCash")) zakatPage();
    if ($("esStart")) eosPage();
  });
})();

if (typeof module !== "undefined") module.exports = { qtArCount: qtArCount, qtArSpan: qtArSpan, qtVat: qtVat, qtZakat: qtZakat, qtEndOfService: qtEndOfService, qtServiceSpan: qtServiceSpan, QT_VAT: QT_VAT };
