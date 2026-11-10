// QuickTiny تفقيط — converts amounts to Arabic words for invoices and cheques.
// Counted-noun grammar (accounting convention used across the Gulf and Levant):
//   1 → "ريال واحد", 2 → "ريالان", 3–10 → plural ("ثلاثة ريالات"), 11–99 → singular accusative ("أحد عشر ريالاً"),
//   100+ → decided by the last two digits (00/01/02 → singular "ريال"). Numbers 1, 2 agree with the noun's gender;
//   3–10 and the units of 13–19 / 23–99 take the opposite gender.

var QT_CURRENCIES = {
  SAR: { name: "ريال سعودي", main: { s: "ريال", d: "ريالان", p: "ريالات", a: "ريالاً", f: false }, adj: ["سعودي", "سعودياً", "سعوديان", "سعودية"], sub: { s: "هللة", d: "هللتان", p: "هللات", a: "هللة", f: true }, dec: 2 },
  AED: { name: "درهم إماراتي", main: { s: "درهم", d: "درهمان", p: "دراهم", a: "درهماً", f: false }, adj: ["إماراتي", "إماراتياً", "إماراتيان", "إماراتية"], sub: { s: "فلس", d: "فلسان", p: "فلوس", a: "فلساً", f: false }, dec: 2 },
  KWD: { name: "دينار كويتي", main: { s: "دينار", d: "ديناران", p: "دنانير", a: "ديناراً", f: false }, adj: ["كويتي", "كويتياً", "كويتيان", "كويتية"], sub: { s: "فلس", d: "فلسان", p: "فلوس", a: "فلساً", f: false }, dec: 3 },
  QAR: { name: "ريال قطري", main: { s: "ريال", d: "ريالان", p: "ريالات", a: "ريالاً", f: false }, adj: ["قطري", "قطرياً", "قطريان", "قطرية"], sub: { s: "درهم", d: "درهمان", p: "دراهم", a: "درهماً", f: false }, dec: 2 },
  BHD: { name: "دينار بحريني", main: { s: "دينار", d: "ديناران", p: "دنانير", a: "ديناراً", f: false }, adj: ["بحريني", "بحرينياً", "بحرينيان", "بحرينية"], sub: { s: "فلس", d: "فلسان", p: "فلوس", a: "فلساً", f: false }, dec: 3 },
  OMR: { name: "ريال عماني", main: { s: "ريال", d: "ريالان", p: "ريالات", a: "ريالاً", f: false }, adj: ["عماني", "عمانياً", "عمانيان", "عمانية"], sub: { s: "بيسة", d: "بيستان", p: "بيسات", a: "بيسة", f: true }, dec: 3 },
  JOD: { name: "دينار أردني", main: { s: "دينار", d: "ديناران", p: "دنانير", a: "ديناراً", f: false }, adj: ["أردني", "أردنياً", "أردنيان", "أردنية"], sub: { s: "فلس", d: "فلسان", p: "فلوس", a: "فلساً", f: false }, dec: 3 },
  EGP: { name: "جنيه مصري", main: { s: "جنيه", d: "جنيهان", p: "جنيهات", a: "جنيهاً", f: false }, adj: ["مصري", "مصرياً", "مصريان", "مصرية"], sub: { s: "قرش", d: "قرشان", p: "قروش", a: "قرشاً", f: false }, dec: 2 },
  IQD: { name: "دينار عراقي", main: { s: "دينار", d: "ديناران", p: "دنانير", a: "ديناراً", f: false }, adj: ["عراقي", "عراقياً", "عراقيان", "عراقية"], sub: { s: "فلس", d: "فلسان", p: "فلوس", a: "فلساً", f: false }, dec: 3 },
  LBP: { name: "ليرة لبنانية", main: { s: "ليرة", d: "ليرتان", p: "ليرات", a: "ليرة", f: true }, adj: ["لبنانية", "لبنانية", "لبنانيتان", "لبنانية"], sub: { s: "قرش", d: "قرشان", p: "قروش", a: "قرشاً", f: false }, dec: 2 },
  SYP: { name: "ليرة سورية", main: { s: "ليرة", d: "ليرتان", p: "ليرات", a: "ليرة", f: true }, adj: ["سورية", "سورية", "سوريتان", "سورية"], sub: { s: "قرش", d: "قرشان", p: "قروش", a: "قرشاً", f: false }, dec: 2 },
  MAD: { name: "درهم مغربي", main: { s: "درهم", d: "درهمان", p: "دراهم", a: "درهماً", f: false }, adj: ["مغربي", "مغربياً", "مغربيان", "مغربية"], sub: { s: "سنتيم", d: "سنتيمان", p: "سنتيمات", a: "سنتيماً", f: false }, dec: 2 },
  TND: { name: "دينار تونسي", main: { s: "دينار", d: "ديناران", p: "دنانير", a: "ديناراً", f: false }, adj: ["تونسي", "تونسياً", "تونسيان", "تونسية"], sub: { s: "مليم", d: "مليمان", p: "مليمات", a: "مليماً", f: false }, dec: 3 },
  DZD: { name: "دينار جزائري", main: { s: "دينار", d: "ديناران", p: "دنانير", a: "ديناراً", f: false }, adj: ["جزائري", "جزائرياً", "جزائريان", "جزائرية"], sub: { s: "سنتيم", d: "سنتيمان", p: "سنتيمات", a: "سنتيماً", f: false }, dec: 2 },
  LYD: { name: "دينار ليبي", main: { s: "دينار", d: "ديناران", p: "دنانير", a: "ديناراً", f: false }, adj: ["ليبي", "ليبياً", "ليبيان", "ليبية"], sub: { s: "درهم", d: "درهمان", p: "دراهم", a: "درهماً", f: false }, dec: 3 },
  YER: { name: "ريال يمني", main: { s: "ريال", d: "ريالان", p: "ريالات", a: "ريالاً", f: false }, adj: ["يمني", "يمنياً", "يمنيان", "يمنية"], sub: { s: "فلس", d: "فلسان", p: "فلوس", a: "فلساً", f: false }, dec: 2 },
  USD: { name: "دولار أمريكي", main: { s: "دولار", d: "دولاران", p: "دولارات", a: "دولاراً", f: false }, adj: ["أمريكي", "أمريكياً", "أمريكيان", "أمريكية"], sub: { s: "سنت", d: "سنتان", p: "سنتات", a: "سنتاً", f: false }, dec: 2 },
  EUR: { name: "يورو", main: { s: "يورو", d: "يورو", p: "يورو", a: "يورو", f: false }, adj: null, sub: { s: "سنت", d: "سنتان", p: "سنتات", a: "سنتاً", f: false }, dec: 2 },
  NONE: { name: "رقم فقط (بدون عملة)", main: null, adj: null, sub: null, dec: 0 }
};

var QT_ONES_M = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
var QT_ONES_F = ["", "واحدة", "اثنتان", "ثلاث", "أربع", "خمس", "ست", "سبع", "ثماني", "تسع"];
var QT_TENS = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];

// Words for 0–999 counting a noun of the given gender (fem = true for a feminine noun).
function qtBelow1000(n, fem, opt) {
  var hundredWord = opt.modern ? "مئة" : "مائة";
  var h = Math.floor(n / 100), r = n % 100, parts = [];
  if (h) parts.push(h === 1 ? hundredWord : h === 2 ? (opt.modern ? "مئتان" : "مائتان") : QT_ONES_M[h].replace(/ة$/, "").replace("ثماني", "ثمان") + hundredWord);
  if (r) parts.push(qtBelow100(r, fem));
  return parts.join(" و");
}
function qtBelow100(n, fem) {
  // QT_ONES_M already holds the forms used WITH a masculine noun (واحد، اثنان، ثلاثة…ريالات),
  // QT_ONES_F the forms used with a feminine noun (واحدة، اثنتان، ثلاث…ليرات).
  var w = fem ? QT_ONES_F : QT_ONES_M;
  if (n < 10) return w[n];
  if (n === 10) return fem ? "عشر" : "عشرة";
  if (n === 11) return fem ? "إحدى عشرة" : "أحد عشر";
  if (n === 12) return fem ? "اثنتا عشرة" : "اثنا عشر";
  if (n < 20) return w[n - 10] + (fem ? " عشرة" : " عشر");
  var u = n % 10, t = Math.floor(n / 10);
  if (!u) return QT_TENS[t];
  var unit = u === 1 ? (fem ? "إحدى" : "واحد") : w[u];
  return unit + " و" + QT_TENS[t];
}

// Form of a counted noun for amount n: {s, d, p, a} entries.
function qtNounForm(n, noun) {
  var r = n % 100;
  if (n === 2) return noun.d;
  if (n >= 3 && n <= 10) return noun.p;
  if (r >= 11 && r <= 99) return noun.a;
  if (n > 100 && r >= 3 && r <= 10) return noun.p;
  return noun.s;
}
function qtAdjForm(n, adj) {
  if (!adj) return "";
  var r = n % 100;
  if (n === 2) return adj[2];
  if ((n >= 3 && n <= 10) || (n > 100 && r >= 3 && r <= 10)) return adj[3];
  if (r >= 11 && r <= 99) return adj[1];
  return adj[0];
}

var QT_SCALES = [
  { s: "ألف", d: "ألفان", p: "آلاف", a: "ألفاً" },
  { s: "مليون", d: "مليونان", p: "ملايين", a: "مليوناً" },
  { s: "مليار", d: "ملياران", p: "مليارات", a: "ملياراً" },
  { s: "تريليون", d: "تريليونان", p: "تريليونات", a: "تريليوناً" }
];

// Whole number → words (counting a noun of gender `fem`; scales themselves are masculine).
// nounFollows: a counted noun (the currency) comes right after the number. Then a trailing
// scale word is in idafa — "أحد عشر ألف ريال" — instead of the accusative "أحد عشر ألفاً".
function qtNumberWords(n, fem, opt, nounFollows) {
  opt = opt || {};
  if (n === 0) return "صفر";
  var groups = [];
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }
  var parts = [];
  for (var i = groups.length - 1; i >= 0; i--) {
    var g = groups[i]; if (!g) continue;
    if (i === 0) { parts.push(qtBelow1000(g, fem, opt)); continue; }
    var sc = QT_SCALES[i - 1];
    var lowerZero = groups.slice(0, i).every(function (x) { return !x; });
    if (g === 1) parts.push(sc.s);
    else if (g === 2) parts.push(sc.d);
    else {
      var form = qtNounForm(g, sc);
      if (form === sc.a && lowerZero && nounFollows) form = sc.s;
      parts.push(qtBelow1000(g, false, opt) + " " + form);
    }
  }
  return parts.join(" و");
}

// Full amount with currency. Returns { text, error }.
function qtTafqeet(input, code, opt) {
  opt = opt || {};
  var cur = QT_CURRENCIES[code] || QT_CURRENCIES.SAR;
  var raw = String(input || "").trim().replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[,،\s]/g, "").replace("٫", ".");
  if (!raw) return { text: "", error: "" };
  if (!/^\d+(\.\d+)?$/.test(raw)) return { text: "", error: "اكتب رقمًا صحيحًا، مثل 1250.75" };
  var ip = raw.split(".")[0].replace(/^0+(?=\d)/, ""), fp = (raw.split(".")[1] || "");
  if (ip.length > 15) return { text: "", error: "الرقم كبير جدًا (الحد الأقصى 15 خانة)." };
  var whole = Number(ip);
  var frac = 0;
  if (cur.dec && fp) frac = Math.round(Number("0." + fp) * Math.pow(10, cur.dec));
  if (cur.dec && frac === Math.pow(10, cur.dec)) { whole += 1; frac = 0; }

  if (!cur.main) {
    var t = qtNumberWords(whole, false, opt);
    if (fp) t += " فاصلة " + fp.split("").map(function (d) { return d === "0" ? "صفر" : QT_ONES_M[Number(d)]; }).join(" ");
    return { text: t, error: "" };
  }

  function amount(n, noun, adj) {
    var adjText = opt.adj && adj ? " " + qtAdjForm(n, adj) : "";
    if (n === 1) return noun.s + adjText + " " + (noun.f ? "واحدة" : "واحد");
    if (n === 2) return noun.d + adjText;
    return qtNumberWords(n, noun.f, opt, true) + " " + qtNounForm(n, noun) + adjText;
  }
  var parts = [];
  if (whole || !frac) parts.push(whole ? amount(whole, cur.main, cur.adj) : "صفر " + cur.main.s);
  if (frac) parts.push(amount(frac, cur.sub, null));
  var text = parts.join(" و");
  if (opt.only) text = "فقط " + text + " لا غير";
  return { text: text, error: "" };
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  function fmt(n, dec) { try { return Number(n).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }); } catch (e) { return n; } }
  function run() {
    var code = $("tfCur").value, res = qtTafqeet($("tfNum").value, code, { only: $("tfOnly").checked, adj: $("tfAdj").checked, modern: $("tfModern").checked });
    $("tfOut").textContent = res.text || "";
    $("tfErr").textContent = res.error; $("tfErr").className = res.error ? "result error" : "result";
    var raw = $("tfNum").value.replace(/[,،\s]/g, "");
    $("tfFig").textContent = res.text && /^\d+(\.\d+)?$/.test(raw) ? fmt(raw, QT_CURRENCIES[code].dec) + " " + (QT_CURRENCIES[code].main ? code : "") : "";
    $("tfCopy").disabled = !res.text;
  }
  document.addEventListener("DOMContentLoaded", function () {
    var sel = $("tfCur");
    if (!sel) return; // tafqeet.js is also loaded as a library by the calculators
    Object.keys(QT_CURRENCIES).forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = QT_CURRENCIES[k].name + (k !== "NONE" ? " (" + k + ")" : ""); sel.appendChild(o); });
    ["tfNum", "tfCur", "tfOnly", "tfAdj", "tfModern"].forEach(function (id) { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
    $("tfCopy").addEventListener("click", function () { qtCopy($("tfOut").textContent, $("tfStatus"), "تم النسخ"); qtTrack("tafqeet_copy"); });
    document.querySelectorAll("[data-ex]").forEach(function (b) { b.addEventListener("click", function () { $("tfNum").value = b.getAttribute("data-ex"); run(); }); });
    run();
  });
})();

if (typeof module !== "undefined") module.exports = { qtTafqeet: qtTafqeet, qtNumberWords: qtNumberWords };
