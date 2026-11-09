// QuickTiny أدوات النص العربي — remove tashkeel/tatweel, normalise letters for search,
// convert digits, clean spacing and punctuation. All local.

var QT_AR_TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭ]/g;
var QT_AR_OPS = {
  tashkeel: function (s) { return s.replace(QT_AR_TASHKEEL, ""); },
  tatweel: function (s) { return s.replace(/ـ/g, ""); },
  alef: function (s) { return s.replace(/[أإآٱ]/g, "ا"); },
  yaa: function (s) { return s.replace(/ى(?=\s|$|[.,،؛؟!])/g, "ي"); },
  taa: function (s) { return s.replace(/ة(?=\s|$|[.,،؛؟!])/g, "ه"); },
  hamza: function (s) { return s.replace(/ؤ/g, "و").replace(/ئ/g, "ي"); },
  toIndic: function (s) { return s.replace(/[0-9]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; }); },
  toLatin: function (s) { return s.replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }); },
  punct: function (s) { return s.replace(/,/g, "،").replace(/;/g, "؛").replace(/\?/g, "؟"); },
  spaces: function (s) { return s.replace(/[ \t ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").replace(/ ([،؛؟!.:,])/g, "$1").trim(); }
};
var QT_AR_ORDER = ["tashkeel", "tatweel", "alef", "yaa", "taa", "hamza", "toIndic", "toLatin", "punct", "spaces"];

function qtArClean(s, opts) {
  QT_AR_ORDER.forEach(function (k) { if (opts[k]) s = QT_AR_OPS[k](s); });
  return s;
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  function opts() { var o = {}; QT_AR_ORDER.forEach(function (k) { var el = $("at_" + k); o[k] = !!(el && el.checked); }); return o; }
  function run() {
    var src = $("atIn").value, out = qtArClean(src, opts());
    $("atOut").value = out;
    var removed = src.length - out.length;
    $("atStats").textContent = src ? ("الأحرف: " + src.length + " ← " + out.length + (removed > 0 ? " (أُزيل " + removed + ")" : "")) : "";
  }
  document.addEventListener("DOMContentLoaded", function () {
    $("atIn").addEventListener("input", run);
    QT_AR_ORDER.forEach(function (k) { var el = $("at_" + k); if (el) el.addEventListener("change", function () {
      if (k === "toIndic" && el.checked) $("at_toLatin").checked = false;
      if (k === "toLatin" && el.checked) $("at_toIndic").checked = false;
      run();
    }); });
    document.querySelectorAll("[data-preset]").forEach(function (b) { b.addEventListener("click", function () {
      var p = b.getAttribute("data-preset").split(","); QT_AR_ORDER.forEach(function (k) { var el = $("at_" + k); if (el) el.checked = p.indexOf(k) !== -1; }); run();
    }); });
    $("atCopy").addEventListener("click", function () { qtCopy($("atOut").value, $("atStatus"), "تم النسخ"); qtTrack("arabic_text_copy"); });
    run();
  });
})();

if (typeof module !== "undefined") module.exports = { qtArClean: qtArClean, QT_AR_OPS: QT_AR_OPS };
