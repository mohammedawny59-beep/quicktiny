// QuickTiny Percentage Calculator — four everyday modes, live results with the formula shown.
function qtPctOf(p, x) { return (p / 100) * x; }                    // p% of x
function qtPctIs(a, b) { return b === 0 ? NaN : (a / b) * 100; }      // a is what % of b
function qtPctChange(a, b) { return a === 0 ? NaN : ((b - a) / a) * 100; } // % change from a to b
function qtPctApply(x, p, up) { return up ? x * (1 + p / 100) : x * (1 - p / 100); } // x plus/minus p%
function qtPctFmt(v, d) {
  if (!isFinite(v)) return "—";
  var r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return r.toLocaleString("en-US", { maximumFractionDigits: d });
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var S = window.QT_STRINGS || {}, L = function (k, d) { return S[k] || d; };
  var num = function (id) { var v = String($(id).value || "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[,،\s]/g, "").replace("٫", "."); return v === "" ? NaN : +v; };
  function run() {
    var a1 = num("pc1p"), b1 = num("pc1x");
    $("pc1r").textContent = qtPctFmt(qtPctOf(a1, b1), 4);
    $("pc1f").textContent = isFinite(a1) && isFinite(b1) ? a1 + " ÷ 100 × " + b1 : "";
    var a2 = num("pc2a"), b2 = num("pc2b");
    var r2 = qtPctIs(a2, b2);
    $("pc2r").textContent = isFinite(r2) ? qtPctFmt(r2, 4) + "%" : "—";
    $("pc2f").textContent = isFinite(a2) && isFinite(b2) && b2 ? a2 + " ÷ " + b2 + " × 100" : "";
    var a3 = num("pc3a"), b3 = num("pc3b"), r3 = qtPctChange(a3, b3);
    $("pc3r").textContent = isFinite(r3) ? (r3 > 0 ? "+" : "") + qtPctFmt(r3, 4) + "%" : "—";
    $("pc3r").className = "pc-r " + (r3 > 0 ? "pc-up" : r3 < 0 ? "pc-down" : "");
    $("pc3f").textContent = isFinite(r3) ? "(" + b3 + " − " + a3 + ") ÷ " + a3 + " × 100 · " + (r3 >= 0 ? L("increase", "increase") : L("decrease", "decrease")) : "";
    var x4 = num("pc4x"), p4 = num("pc4p"), up = $("pc4dir").value === "up", r4 = qtPctApply(x4, p4, up);
    $("pc4r").textContent = qtPctFmt(r4, 2);
    $("pc4f").textContent = isFinite(r4) ? (up ? L("added", "added") : L("saved", "you save")) + " " + qtPctFmt(Math.abs(r4 - x4), 2) : "";
  }
  document.addEventListener("DOMContentLoaded", function () {
    if (!$("pc1p")) return;
    document.querySelectorAll("#tool input, #tool select").forEach(function (el) { el.addEventListener(el.tagName === "SELECT" ? "change" : "input", run); });
    document.querySelectorAll("[data-copy]").forEach(function (b) { b.addEventListener("click", function () { qtCopy($(b.getAttribute("data-copy")).textContent, $("pcStatus"), L("copied", "Copied")); qtTrack("percent_copy"); }); });
    var P = window.QT_PRESET || {};
    if (P.focus && $(P.focus)) { $(P.focus).closest(".pc-card").classList.add("pc-focus"); setTimeout(function () { $(P.focus).focus({ preventScroll: true }); }, 50); }
    run();
  });
})();

if (typeof module !== "undefined") module.exports = { qtPctOf: qtPctOf, qtPctIs: qtPctIs, qtPctChange: qtPctChange, qtPctApply: qtPctApply, qtPctFmt: qtPctFmt };
