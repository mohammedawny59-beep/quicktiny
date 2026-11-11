// QuickTiny unit converter: length, weight, temperature, area (incl. feddan / dunam), volume, speed, data.
// Each unit is a factor to the category's base unit (metre, kilogram, square metre, litre, m/s, byte); temperature is special.
var QT_UNITS = {
  length: { base: "m", units: {
    mm: [0.001, "Millimetre", "مليمتر"], cm: [0.01, "Centimetre", "سنتيمتر"], m: [1, "Metre", "متر"], km: [1000, "Kilometre", "كيلومتر"],
    in: [0.0254, "Inch", "إنش (بوصة)"], ft: [0.3048, "Foot", "قدم"], yd: [0.9144, "Yard", "ياردة"], mi: [1609.344, "Mile", "ميل"], nmi: [1852, "Nautical mile", "ميل بحري"] } },
  weight: { base: "kg", units: {
    mg: [1e-6, "Milligram", "مليغرام"], g: [0.001, "Gram", "غرام"], kg: [1, "Kilogram", "كيلوغرام"], t: [1000, "Tonne", "طن"],
    oz: [0.028349523125, "Ounce", "أونصة"], lb: [0.45359237, "Pound", "رطل (باوند)"], st: [6.35029318, "Stone", "ستون"], ozt: [0.0311034768, "Troy ounce (gold)", "أونصة ذهب (تروي)"] } },
  temperature: { base: "c", units: { c: [null, "Celsius", "مئوية (سيلسيوس)"], f: [null, "Fahrenheit", "فهرنهايت"], k: [null, "Kelvin", "كلفن"] } },
  area: { base: "m2", units: {
    cm2: [1e-4, "Square centimetre", "سنتيمتر مربع"], m2: [1, "Square metre", "متر مربع"], km2: [1e6, "Square kilometre", "كيلومتر مربع"], ha: [10000, "Hectare", "هكتار"],
    dunam: [1000, "Dunam", "دونم"], feddan: [4200.83, "Feddan", "فدان"], acre: [4046.8564224, "Acre", "إيكر (فدان إنجليزي)"],
    ft2: [0.09290304, "Square foot", "قدم مربع"], yd2: [0.83612736, "Square yard", "ياردة مربعة"] } },
  volume: { base: "l", units: {
    ml: [0.001, "Millilitre", "مليلتر"], l: [1, "Litre", "لتر"], m3: [1000, "Cubic metre", "متر مكعب"], tsp: [0.00492892159, "Teaspoon (US)", "ملعقة صغيرة"],
    tbsp: [0.0147867648, "Tablespoon (US)", "ملعقة كبيرة"], cup: [0.24, "Cup (metric 240 ml)", "كوب (240 مل)"], floz: [0.0295735296, "Fluid ounce (US)", "أونصة سائلة"],
    galus: [3.785411784, "Gallon (US)", "جالون أمريكي"], galuk: [4.54609, "Gallon (UK)", "جالون بريطاني"], bbl: [158.987294928, "Oil barrel", "برميل نفط"] } },
  speed: { base: "ms", units: { ms: [1, "Metres per second", "متر/ثانية"], kmh: [1 / 3.6, "Kilometres per hour", "كم/ساعة"], mph: [0.44704, "Miles per hour", "ميل/ساعة"], kn: [1852 / 3600, "Knot", "عقدة"] } },
  data: { base: "b", units: {
    b: [1, "Byte", "بايت"], kb: [1000, "Kilobyte (KB)", "كيلوبايت"], mb: [1e6, "Megabyte (MB)", "ميجابايت"], gb: [1e9, "Gigabyte (GB)", "جيجابايت"], tb: [1e12, "Terabyte (TB)", "تيرابايت"],
    kib: [1024, "Kibibyte (KiB)", "كيبيبايت"], mib: [1048576, "Mebibyte (MiB)", "ميبيبايت"], gib: [1073741824, "Gibibyte (GiB)", "جيبيبايت"] } }
};
function qtTempToC(v, u) { return u === "c" ? v : u === "f" ? (v - 32) * 5 / 9 : v - 273.15; }
function qtTempFromC(c, u) { return u === "c" ? c : u === "f" ? c * 9 / 5 + 32 : c + 273.15; }
function qtConvert(cat, v, from, to) {
  if (!isFinite(v)) return NaN;
  if (cat === "temperature") return qtTempFromC(qtTempToC(v, from), to);
  var U = QT_UNITS[cat].units;
  return v * U[from][0] / U[to][0];
}
// Human-friendly number: up to 6 significant digits, no exponent for everyday sizes.
function qtUnitFmt(x) {
  if (!isFinite(x)) return "—";
  if (x === 0) return "0";
  var a = Math.abs(x);
  if (a >= 1e15 || a < 1e-6) return x.toExponential(4).replace("e+", "e");
  var d = a >= 1000 ? 2 : a >= 1 ? 4 : 6;
  var r = +x.toFixed(d);
  return r.toLocaleString("en-US", { maximumFractionDigits: d });
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("ucValue")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0, L = AR ? 2 : 1;
  var CATS = AR ? { length: "الطول", weight: "الوزن", temperature: "الحرارة", area: "المساحة", volume: "الحجم", speed: "السرعة", data: "حجم البيانات" }
                : { length: "Length", weight: "Weight", temperature: "Temperature", area: "Area", volume: "Volume", speed: "Speed", data: "Data" };
  var DEF = { length: ["cm", "in"], weight: ["kg", "lb"], temperature: ["c", "f"], area: ["feddan", "m2"], volume: ["l", "galus"], speed: ["kmh", "mph"], data: ["gb", "gib"] };
  var num = function (v) { v = String(v || "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[,،\s]/g, "").replace("٫", "."); return v === "" || v === "-" ? NaN : +v; };
  var P = window.QT_PRESET || {}, saved = {};
  try { saved = JSON.parse(localStorage.getItem("qtUnits") || "{}") || {}; } catch (e) {}
  var cat = P.cat || saved.cat || "length";
  var tabs = $("ucCats");
  Object.keys(CATS).forEach(function (k) {
    var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = CATS[k]; b.setAttribute("data-cat", k); b.setAttribute("role", "tab");
    b.addEventListener("click", function () { setCat(k, true); });
    tabs.appendChild(b);
  });
  function fill(sel, val) {
    sel.innerHTML = "";
    var U = QT_UNITS[cat].units;
    Object.keys(U).forEach(function (u) { var o = document.createElement("option"); o.value = u; o.textContent = U[u][L]; sel.appendChild(o); });
    sel.value = val;
  }
  function setCat(k, user) {
    cat = k;
    tabs.querySelectorAll(".chip").forEach(function (b) { var on = b.getAttribute("data-cat") === k; b.classList.toggle("active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    var d = (!user && P.from && P.cat === k) ? [P.from, P.to] : (saved.cat === k && saved.from ? [saved.from, saved.to] : DEF[k]);
    fill($("ucFrom"), d[0]); fill($("ucTo"), d[1]);
    if (user) $("ucValue").value = k === "temperature" ? "37" : "1";
    run();
  }
  function run() {
    var v = num($("ucValue").value), from = $("ucFrom").value, to = $("ucTo").value, U = QT_UNITS[cat].units;
    var r = qtConvert(cat, v, from, to);
    var out = $("ucOut"), prev = out.textContent;
    out.textContent = qtUnitFmt(r);
    if (out.textContent !== prev) { out.classList.remove("rm-pop"); void out.offsetWidth; out.classList.add("rm-pop"); }
    $("ucOutUnit").textContent = U[to][L];
    $("ucLine").textContent = isFinite(r) ? qtUnitFmt(v) + " " + U[from][L] + " = " + qtUnitFmt(r) + " " + U[to][L] : "";
    // Every unit of the category at once.
    var rows = "";
    Object.keys(U).forEach(function (u) {
      if (u === from) return;
      rows += '<tr' + (u === to ? ' class="on"' : "") + '><td>' + U[u][L] + '</td><td dir="ltr">' + qtUnitFmt(qtConvert(cat, v, from, u)) + "</td></tr>";
    });
    $("ucAll").innerHTML = rows;
    try { localStorage.setItem("qtUnits", JSON.stringify({ cat: cat, from: from, to: to })); } catch (e) {}
    saved = { cat: cat, from: from, to: to };
  }
  $("ucValue").addEventListener("input", run);
  $("ucFrom").addEventListener("change", run);
  $("ucTo").addEventListener("change", run);
  $("ucSwap").addEventListener("click", function () {
    var a = $("ucFrom").value; $("ucFrom").value = $("ucTo").value; $("ucTo").value = a;
    var r = $("ucOut").textContent; if (r !== "—") $("ucValue").value = r.replace(/,/g, "");
    $("ucSwap").classList.remove("spin"); void $("ucSwap").offsetWidth; $("ucSwap").classList.add("spin");
    run();
  });
  $("ucCopy").addEventListener("click", function () { if (typeof qtCopy === "function") qtCopy($("ucLine").textContent, $("ucStatus"), AR ? "تم النسخ" : "Copied"); });
  if (P.value) $("ucValue").value = P.value;
  setCat(cat, false);
})();

if (typeof module !== "undefined") module.exports = { QT_UNITS: QT_UNITS, qtConvert: qtConvert, qtUnitFmt: qtUnitFmt };
