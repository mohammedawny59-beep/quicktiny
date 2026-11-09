// QuickTiny مصحح لوحة المفاتيح — fixes text typed with the wrong keyboard language
// (Arabic 101 layout ↔ US QWERTY), e.g. "hgsghl ugd;l" → "السلام عليكم".

var QT_KB_EN = "`qwertyuiop[]asdfghjkl;'zxcvbnm,./~QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>?";
var QT_KB_AR = ["ذ", "ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د", "ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط", "ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ",
  "ّ", "َ", "ً", "ُ", "ٌ", "لإ", "إ", "‘", "÷", "×", "؛", "<", ">", "ِ", "ٍ", "]", "[", "لأ", "أ", "ـ", "،", "/", ":", "\"", "~", "ْ", "}", "{", "لآ", "آ", "’", ",", ".", "؟"];

var QT_EN2AR = {}, QT_AR2EN = {};
Array.from(QT_KB_EN).forEach(function (ch, i) { QT_EN2AR[ch] = QT_KB_AR[i]; if (!(QT_KB_AR[i] in QT_AR2EN)) QT_AR2EN[QT_KB_AR[i]] = ch; });
// Arabic keyboards type "لا" as one key (b); also accept the ligature characters.
QT_AR2EN["ﻻ"] = "b"; QT_AR2EN["ﻷ"] = "G"; QT_AR2EN["ﻹ"] = "T"; QT_AR2EN["ﻵ"] = "B";

function qtKbToArabic(s) { return Array.from(s).map(function (c) { return QT_EN2AR[c] !== undefined ? QT_EN2AR[c] : c; }).join(""); }
function qtKbToEnglish(s) {
  var out = "", i = 0, arr = Array.from(s);
  while (i < arr.length) {
    var two = arr[i] + (arr[i + 1] || "");
    if (QT_AR2EN[two] !== undefined && two.length === 2 && /^ل[اأإآ]$/.test(two)) { out += QT_AR2EN[two]; i += 2; continue; }
    out += QT_AR2EN[arr[i]] !== undefined ? QT_AR2EN[arr[i]] : arr[i]; i++;
  }
  return out;
}
// Decide direction from the dominant script.
function qtKbAuto(s) {
  var ar = (s.match(/[؀-ۿ]/g) || []).length, en = (s.match(/[A-Za-z]/g) || []).length;
  return ar > en ? { dir: "en", text: qtKbToEnglish(s) } : { dir: "ar", text: qtKbToArabic(s) };
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  function run() {
    var s = $("kbIn").value, mode = $("kbMode").value, r;
    if (!s) { $("kbOut").value = ""; $("kbDir").textContent = ""; return; }
    if (mode === "ar") r = { dir: "ar", text: qtKbToArabic(s) };
    else if (mode === "en") r = { dir: "en", text: qtKbToEnglish(s) };
    else r = qtKbAuto(s);
    $("kbOut").value = r.text; $("kbOut").dir = r.dir === "ar" ? "rtl" : "ltr";
    $("kbDir").textContent = r.dir === "ar" ? "حُوِّل إلى العربية ←" : "حُوِّل إلى الإنجليزية →";
  }
  document.addEventListener("DOMContentLoaded", function () {
    $("kbIn").addEventListener("input", run); $("kbMode").addEventListener("change", run);
    $("kbCopy").addEventListener("click", function () { qtCopy($("kbOut").value, $("kbStatus"), "تم النسخ"); qtTrack("keyboard_fix_copy"); });
    $("kbSwap").addEventListener("click", function () { $("kbIn").value = $("kbOut").value; run(); });
    document.querySelectorAll("[data-ex]").forEach(function (b) { b.addEventListener("click", function () { $("kbIn").value = b.getAttribute("data-ex"); run(); }); });
    run();
  });
})();

if (typeof module !== "undefined") module.exports = { qtKbToArabic: qtKbToArabic, qtKbToEnglish: qtKbToEnglish, qtKbAuto: qtKbAuto };
