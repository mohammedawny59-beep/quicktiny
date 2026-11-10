// QuickTiny student calculators: GPA (4- and 5-point scales, cumulative, target) and weighted grades
// (generic weighted average, the final exam you need, and the Saudi admission "weighted percentage").
var QT_GPA_SCALES = {
  "4": [["A+", 4], ["A", 4], ["A-", 3.7], ["B+", 3.3], ["B", 3], ["B-", 2.7], ["C+", 2.3], ["C", 2], ["C-", 1.7], ["D+", 1.3], ["D", 1], ["D-", 0.7], ["F", 0]],
  // Saudi universities' 5-point scale: F (هـ) is worth 1 point and still counts.
  "5": [["A+", 5], ["A", 4.75], ["B+", 4.5], ["B", 4], ["C+", 3.5], ["C", 3], ["D+", 2.5], ["D", 2], ["F", 1]]
};
var QT_GPA_AR_LETTERS = { "A+": "أ+", "A": "أ", "A-": "أ-", "B+": "ب+", "B": "ب", "B-": "ب-", "C+": "ج+", "C": "ج", "C-": "ج-", "D+": "د+", "D": "د", "D-": "د-", "F": "هـ" };

function qtGpaPoints(scale, letter) {
  var s = QT_GPA_SCALES[scale] || [];
  for (var i = 0; i < s.length; i++) if (s[i][0] === letter) return s[i][1];
  return NaN;
}
// courses: [{credits, letter}] -> {gpa, credits, points}; rows without credits or grade are ignored.
function qtGpa(courses, scale) {
  var cr = 0, pts = 0;
  courses.forEach(function (c) {
    var h = +c.credits, p = qtGpaPoints(scale, c.letter);
    if (h > 0 && isFinite(p)) { cr += h; pts += h * p; }
  });
  return { gpa: cr ? pts / cr : NaN, credits: cr, points: pts };
}
function qtGpaCumulative(prevGpa, prevCredits, semPoints, semCredits) {
  var pc = prevCredits > 0 && isFinite(prevGpa) ? prevCredits : 0, total = pc + semCredits;
  return total ? (pc * (pc ? prevGpa : 0) + semPoints) / total : NaN;
}
// Semester GPA needed over nextCredits to bring the cumulative GPA to target.
function qtGpaNeeded(curGpa, curCredits, target, nextCredits) {
  if (!(nextCredits > 0)) return NaN;
  return (target * (curCredits + nextCredits) - curGpa * curCredits) / nextCredits;
}
// Saudi 5-point rating bands (ممتاز ≥ 4.5, جيد جدًا ≥ 3.75, جيد ≥ 2.75, مقبول ≥ 2).
function qtGpaRating5(g) {
  if (!isFinite(g)) return null;
  return g >= 4.5 ? 0 : g >= 3.75 ? 1 : g >= 2.75 ? 2 : g >= 2 ? 3 : 4;
}
// Saudi percentage-to-letter bands used with the 5-point scale.
function qtLetterFromPercent5(p) {
  return p >= 95 ? "A+" : p >= 90 ? "A" : p >= 85 ? "B+" : p >= 80 ? "B" : p >= 75 ? "C+" : p >= 70 ? "C" : p >= 65 ? "D+" : p >= 60 ? "D" : "F";
}
// items: [{score, max, weight}] -> weighted percentage (0-100) and the weight total.
function qtWeighted(items) {
  var w = 0, s = 0;
  items.forEach(function (it) {
    var sc = +it.score, mx = it.max === undefined || it.max === "" ? 100 : +it.max, wt = +it.weight;
    if (isFinite(sc) && mx > 0 && wt > 0 && it.score !== "") { w += wt; s += (sc / mx) * 100 * wt; }
  });
  return { pct: w ? s / w : NaN, weight: w };
}
// Score needed on the final (0-100) to finish with `target`, given the grade so far and the final's weight (%).
function qtFinalNeeded(current, finalWeight, target) {
  var fw = finalWeight / 100;
  if (!(fw > 0 && fw <= 1)) return NaN;
  return (target - current * (1 - fw)) / fw;
}
// Saudi admission weighted percentage: high school %, Qudurat (GAT) and Tahsili (SAAT), weights in %.
function qtSaudiWeighted(hs, gat, saat, w) {
  var parts = [[hs, w[0]], [gat, w[1]], [saat, w[2]]], t = 0, wt = 0;
  for (var i = 0; i < 3; i++) {
    if (!(parts[i][1] > 0)) continue;
    if (!isFinite(parts[i][0])) return NaN;
    t += parts[i][0] * parts[i][1]; wt += parts[i][1];
  }
  return wt ? t / wt : NaN;
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var num = function (v) { v = String(v == null ? "" : v).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[,،\s]/g, "").replace("٫", "."); return v === "" ? NaN : +v; };
  var fmt = function (v, d) { return isFinite(v) ? (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d) : "—"; };
  var T = AR ? {
    course: "المادة", credits: "الساعات", grade: "التقدير", remove: "حذف", add: "+ أضف مادة", ratings: ["ممتاز", "جيد جدًا", "جيد", "مقبول", "أقل من مقبول"],
    needOk: "تحتاج معدلًا فصليًا قدره", needNo: "غير ممكن في فصل واحد بهذه الساعات — يلزمك", needDone: "معدلك الحالي يحقق الهدف بالفعل ✓", needOver: "من", item: "البند", score: "الدرجة", outOf: "من", weight: "الوزن %",
    wSum: "مجموع الأوزان", wWarn: "لا يساوي 100% — النتيجة محسوبة كمتوسط موزون على ما أدخلته.", finalNeed: "تحتاج في الاختبار النهائي", finalNo: "غير ممكن حتى بالدرجة الكاملة", finalDone: "مضمون حتى لو حصلت على صفر ✓",
    saved: "تُحفظ بياناتك على هذا الجهاز فقط", copied: "تم النسخ"
  } : {
    course: "Course", credits: "Credits", grade: "Grade", remove: "Remove", add: "+ Add course", ratings: ["Excellent", "Very good", "Good", "Pass", "Below pass"],
    needOk: "You need a semester GPA of", needNo: "Not possible in one semester with these credits — you'd need", needDone: "Your current GPA already meets the target ✓", needOver: "of", item: "Item", score: "Score", outOf: "Out of", weight: "Weight %",
    wSum: "Weights total", wWarn: "isn't 100% — the result is a weighted average of what you entered.", finalNeed: "You need on the final", finalNo: "Not possible even with a perfect score", finalDone: "Guaranteed even with a zero ✓",
    saved: "Saved on this device only", copied: "Copied"
  };
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function el(tag, attrs, text) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; }
  function ring(id, frac) {
    var r = $(id); if (!r) return;
    r.style.setProperty("--p", Math.max(0, Math.min(1, isFinite(frac) ? frac : 0)));
  }
  function pop(e) { if (!e) return; e.classList.remove("st-pop"); void e.offsetWidth; e.classList.add("st-pop"); }

  /* ---------- GPA ---------- */
  function initGpa() {
    var body = $("gpRows"); if (!body) return;
    var scaleSel = $("gpScale"), KEY = "qtGpa" + (AR ? "Ar" : "");
    var saved = store(KEY) || {};
    if (saved.scale) scaleSel.value = saved.scale;
    function letters() { return QT_GPA_SCALES[scaleSel.value]; }
    function label(l) { return AR ? QT_GPA_AR_LETTERS[l] + " " + l : l; }
    function addRow(d) {
      d = d || {};
      var tr = el("div", { "class": "gp-row" });
      var name = el("input", { type: "text", "class": "gp-name", placeholder: T.course + " " + (body.children.length + 1), "aria-label": T.course });
      var cr = el("input", { type: "text", inputmode: "decimal", "class": "gp-cr", placeholder: "3", "aria-label": T.credits });
      var gr = el("select", { "class": "gp-gr", "aria-label": T.grade });
      var rm = el("button", { type: "button", "class": "gp-rm", "aria-label": T.remove, title: T.remove }, "×");
      fill(gr, d.letter);
      name.value = d.name || ""; cr.value = d.credits != null ? d.credits : "";
      [name, cr, gr].forEach(function (x) { x.addEventListener("input", run); x.addEventListener("change", run); });
      rm.addEventListener("click", function () { tr.classList.add("gp-out"); setTimeout(function () { tr.remove(); run(); }, 180); });
      tr.appendChild(name); tr.appendChild(cr); tr.appendChild(gr); tr.appendChild(rm);
      body.appendChild(tr);
      return tr;
    }
    function fill(sel, keep) {
      sel.innerHTML = '<option value="">—</option>';
      letters().forEach(function (l) { var o = el("option", { value: l[0] }, label(l[0]) + " · " + l[1]); sel.appendChild(o); });
      if (keep && letters().some(function (l) { return l[0] === keep; })) sel.value = keep;
    }
    var rows = saved.rows && saved.rows.length ? saved.rows : [{ credits: 3, letter: "A" }, { credits: 3, letter: "B+" }, { credits: 2, letter: "A+" }, { credits: 4, letter: "C+" }];
    rows.forEach(addRow);
    if (saved.prev) { $("gpPrev").value = saved.prev; $("gpPrevCr").value = saved.prevCr || ""; }
    if (saved.target) { $("gpTarget").value = saved.target; $("gpNextCr").value = saved.nextCr || ""; }
    $("gpAdd").addEventListener("click", function () { var r = addRow({}); r.classList.add("gp-in"); r.querySelector(".gp-cr").focus(); run(); });
    scaleSel.addEventListener("change", function () { body.querySelectorAll(".gp-gr").forEach(function (s) { fill(s, s.value); }); run(); });
    ["gpPrev", "gpPrevCr", "gpTarget", "gpNextCr"].forEach(function (id) { $(id).addEventListener("input", run); });
    var last = "";
    function run() {
      var sc = scaleSel.value, max = +sc, list = [];
      body.querySelectorAll(".gp-row").forEach(function (r) { list.push({ name: r.querySelector(".gp-name").value, credits: num(r.querySelector(".gp-cr").value), letter: r.querySelector(".gp-gr").value }); });
      var g = qtGpa(list, sc), prev = num($("gpPrev").value), prevCr = num($("gpPrevCr").value);
      var hasPrev = isFinite(prev) && prevCr > 0;
      var cum = hasPrev ? qtGpaCumulative(prev, prevCr, g.points, g.credits) : g.gpa;
      var totalCr = g.credits + (hasPrev ? prevCr : 0);
      var shown = fmt(g.gpa, 2) + "|" + fmt(cum, 2);
      $("gpSem").textContent = fmt(g.gpa, 2); $("gpSemCr").textContent = g.credits || 0;
      $("gpCum").textContent = fmt(cum, 2); $("gpCumCr").textContent = totalCr || 0;
      $("gpMax").textContent = "/ " + max; ring("gpRing", cum / max);
      var rt = sc === "5" ? qtGpaRating5(cum) : null;
      $("gpRate").textContent = rt === null ? "" : T.ratings[rt];
      $("gpRate").hidden = rt === null;
      // Celebrate when the cumulative GPA reaches the top band (Excellent / 3.5+ on the 4.0 scale).
      var top = sc === "5" ? rt === 0 : cum >= 3.5;
      if (top && !initGpa.cheered && last && typeof qtCelebrate === "function") qtCelebrate($("gpCum"));
      initGpa.cheered = top;
      if (shown !== last) { pop($("gpCum")); last = shown; }
      // Target
      var target = num($("gpTarget").value), nextCr = num($("gpNextCr").value), out = $("gpNeed");
      out.className = "st-note"; out.textContent = "";
      if (isFinite(target) && nextCr > 0 && isFinite(cum)) {
        var need = qtGpaNeeded(cum, totalCr, target, nextCr);
        if (need <= 0 || cum >= target) { out.textContent = T.needDone; out.classList.add("ok"); }
        else if (need > max) { out.textContent = T.needNo + " " + fmt(need, 2) + " " + T.needOver + " " + max + "."; out.classList.add("bad"); }
        else { out.textContent = T.needOk + " " + fmt(need, 2) + " " + T.needOver + " " + max + "."; out.classList.add("mid"); }
      }
      store(KEY, { scale: sc, rows: list.map(function (r) { return { name: r.name, credits: isFinite(r.credits) ? r.credits : "", letter: r.letter }; }), prev: $("gpPrev").value, prevCr: $("gpPrevCr").value, target: $("gpTarget").value, nextCr: $("gpNextCr").value });
    }
    $("gpReset").addEventListener("click", function () { store(KEY, {}); body.innerHTML = ""; for (var i = 0; i < 4; i++) addRow({}); ["gpPrev", "gpPrevCr", "gpTarget", "gpNextCr"].forEach(function (id) { $(id).value = ""; }); run(); });
    run();
  }

  /* ---------- Weighted grades ---------- */
  function initWeighted() {
    var body = $("wtRows"); if (!body) return;
    var KEY = "qtWeighted" + (AR ? "Ar" : ""), saved = store(KEY) || {};
    function addRow(d) {
      d = d || {};
      var r = el("div", { "class": "wt-row" });
      var n = el("input", { type: "text", "class": "wt-name", placeholder: T.item + " " + (body.children.length + 1), "aria-label": T.item });
      var s = el("input", { type: "text", inputmode: "decimal", "class": "wt-s", placeholder: T.score, "aria-label": T.score });
      var m = el("input", { type: "text", inputmode: "decimal", "class": "wt-m", placeholder: "100", "aria-label": T.outOf });
      var w = el("input", { type: "text", inputmode: "decimal", "class": "wt-w", placeholder: "%", "aria-label": T.weight });
      var rm = el("button", { type: "button", "class": "gp-rm", "aria-label": T.remove, title: T.remove }, "×");
      n.value = d.name || ""; s.value = d.score != null ? d.score : ""; m.value = d.max != null ? d.max : ""; w.value = d.weight != null ? d.weight : "";
      [n, s, m, w].forEach(function (x) { x.addEventListener("input", run); });
      rm.addEventListener("click", function () { r.classList.add("gp-out"); setTimeout(function () { r.remove(); run(); }, 180); });
      [n, s, m, w, rm].forEach(function (x) { r.appendChild(x); });
      body.appendChild(r); return r;
    }
    var rows = saved.rows && saved.rows.length ? saved.rows : (AR
      ? [{ name: "أعمال السنة", score: 18, max: 20, weight: 20 }, { name: "الاختبار النصفي", score: 25, max: 30, weight: 30 }, { name: "الاختبار النهائي", score: 41, max: 50, weight: 50 }]
      : [{ name: "Homework", score: 92, max: 100, weight: 20 }, { name: "Midterm", score: 78, max: 100, weight: 30 }, { name: "Final exam", score: 85, max: 100, weight: 50 }]);
    rows.forEach(addRow);
    $("wtAdd").addEventListener("click", function () { var r = addRow({}); r.classList.add("gp-in"); r.querySelector(".wt-s").focus(); run(); });
    ["fnCur", "fnW", "fnTarget"].forEach(function (id) { if ($(id)) { if (saved[id]) $(id).value = saved[id]; $(id).addEventListener("input", run); } });
    var last = "";
    function run() {
      var list = [];
      body.querySelectorAll(".wt-row").forEach(function (r) { list.push({ name: r.querySelector(".wt-name").value, score: r.querySelector(".wt-s").value === "" ? "" : num(r.querySelector(".wt-s").value), max: r.querySelector(".wt-m").value === "" ? "" : num(r.querySelector(".wt-m").value), weight: num(r.querySelector(".wt-w").value) }); });
      var res = qtWeighted(list);
      $("wtPct").textContent = isFinite(res.pct) ? fmt(res.pct, 2) + "%" : "—";
      ring("wtRing", res.pct / 100);
      if ($("wtPct").textContent !== last) { pop($("wtPct")); last = $("wtPct").textContent; }
      $("wtLetter").textContent = isFinite(res.pct) ? qtLetterFromPercent5(res.pct) : "";
      var ws = $("wtSum"); ws.textContent = res.weight ? T.wSum + ": " + fmt(res.weight, 0) + "%" + (Math.abs(res.weight - 100) > 0.01 ? " — " + T.wWarn : " ✓") : "";
      ws.className = "st-note" + (res.weight && Math.abs(res.weight - 100) > 0.01 ? " mid" : res.weight ? " ok" : "");
      // Final exam needed
      if ($("fnCur")) {
        var cur = num($("fnCur").value), fw = num($("fnW").value), tg = num($("fnTarget").value), o = $("fnOut");
        o.className = "st-note"; o.textContent = "";
        if (isFinite(cur) && isFinite(fw) && isFinite(tg)) {
          var need = qtFinalNeeded(cur, fw, tg);
          if (!isFinite(need)) o.textContent = "";
          else if (need > 100) { o.textContent = T.finalNo + " (" + fmt(need, 1) + "%)."; o.classList.add("bad"); }
          else if (need <= 0) { o.textContent = T.finalDone; o.classList.add("ok"); }
          else { o.textContent = T.finalNeed + ": " + fmt(need, 1) + "%"; o.classList.add("mid"); }
        }
      }
      var st = { rows: list.map(function (r) { return { name: r.name, score: isFinite(r.score) ? r.score : "", max: isFinite(r.max) ? r.max : "", weight: isFinite(r.weight) ? r.weight : "" }; }) };
      ["fnCur", "fnW", "fnTarget"].forEach(function (id) { if ($(id)) st[id] = $(id).value; });
      store(KEY, st);
    }
    $("wtReset").addEventListener("click", function () { store(KEY, {}); body.innerHTML = ""; for (var i = 0; i < 3; i++) addRow({}); run(); });
    run();
  }

  /* ---------- Saudi weighted percentage (النسبة الموزونة) ---------- */
  function initSaudi() {
    if (!$("swHs")) return;
    var saved = store("qtSaudiW") || {};
    ["swHs", "swGat", "swSaat", "swW1", "swW2", "swW3"].forEach(function (id) { if (saved[id] != null && saved[id] !== "") $(id).value = saved[id]; $(id).addEventListener("input", run); });
    document.querySelectorAll("#swPresets .chip").forEach(function (b) {
      b.addEventListener("click", function () {
        var w = b.getAttribute("data-w").split(",");
        $("swW1").value = w[0]; $("swW2").value = w[1]; $("swW3").value = w[2]; run();
      });
    });
    function run() {
      var hs = num($("swHs").value), gat = num($("swGat").value), saat = num($("swSaat").value);
      var w = [num($("swW1").value) || 0, num($("swW2").value) || 0, num($("swW3").value) || 0];
      $("swRow3").classList.toggle("sw-off", !(w[2] > 0));
      var v = qtSaudiWeighted(hs, gat, saat, w), sum = w[0] + w[1] + w[2];
      var prev = $("swOut").textContent;
      $("swOut").textContent = isFinite(v) ? fmt(v, 2) + "%" : "—";
      if ($("swOut").textContent !== prev) pop($("swOut"));
      ring("swRing", v / 100);
      $("swF").textContent = isFinite(v) ? [[hs, w[0]], [gat, w[1]], [saat, w[2]]].filter(function (p) { return p[1] > 0; }).map(function (p) { return p[0] + " × " + p[1] + "%"; }).join(" + ") + " = " + fmt(v, 2) + "%" : "";
      document.querySelectorAll("#swPresets .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-w") === w.join(",")); });
      var n = $("swSum"); n.className = "st-note"; n.textContent = "";
      if (Math.abs(sum - 100) > 0.01) { n.textContent = (AR ? "مجموع الأوزان " : "Weights total ") + fmt(sum, 0) + "% — " + T.wWarn; n.classList.add("mid"); }
      var st = {}; ["swHs", "swGat", "swSaat", "swW1", "swW2", "swW3"].forEach(function (id) { st[id] = $(id).value; }); store("qtSaudiW", st);
    }
    run();
  }

  document.addEventListener("DOMContentLoaded", function () { initGpa(); initWeighted(); initSaudi(); });
})();

if (typeof module !== "undefined") module.exports = { QT_GPA_SCALES: QT_GPA_SCALES, qtGpaPoints: qtGpaPoints, qtGpa: qtGpa, qtGpaCumulative: qtGpaCumulative, qtGpaNeeded: qtGpaNeeded, qtGpaRating5: qtGpaRating5, qtLetterFromPercent5: qtLetterFromPercent5, qtWeighted: qtWeighted, qtFinalNeeded: qtFinalNeeded, qtSaudiWeighted: qtSaudiWeighted };
