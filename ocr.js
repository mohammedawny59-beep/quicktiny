// QuickTiny image to text (OCR) for Arabic and English, using the self-hosted Tesseract engine in /vendor/tesseract/
// (tesseract.js 6.0.1 + tesseract.js-core 6.0.0, Apache-2.0; language data from tessdata "best_int"). The image never
// leaves the browser; the engine (~4 MB) and each language (~2-3 MB) download once and are cached.
(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("ocrFile")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? { load: "تحميل محرك القراءة (مرة واحدة)…", lang: "تحميل بيانات اللغة…", init: "تجهيز…", rec: "جارٍ قراءة النص…", done: "✓ تم استخراج النص", none: "لم يُعثر على نص واضح. جرّب صورة أوضح أو اختر اللغة الصحيحة.", fail: "تعذّرت القراءة: ", copy: "تم النسخ", conf: "دقة القراءة التقريبية", notImg: "اختر صورة (JPG أو PNG أو WebP)." }
             : { load: "Loading the OCR engine (once)…", lang: "Loading language data…", init: "Preparing…", rec: "Reading text…", done: "✓ Text extracted", none: "No clear text found. Try a sharper image or the right language.", fail: "Couldn't read the image: ", copy: "Copied", conf: "Approximate confidence", notImg: "Choose an image (JPG, PNG or WebP)." };
  var worker = null, workerLangs = "", busy = false, current = null, pending = false;
  function loadScript(src) { return new Promise(function (res, rej) { if (window.Tesseract) return res(); var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("script")); }; document.head.appendChild(s); }); }
  function status(text, p) {
    $("ocrStatus").textContent = text || "";
    var bar = $("ocrBar"); bar.hidden = p == null;
    if (p != null) $("ocrBarFill").style.width = Math.round(p * 100) + "%";
  }
  function langs() { return $("ocrLang").value; }
  function getWorker() {
    var want = langs();
    if (worker && workerLangs === want) return Promise.resolve(worker);
    var old = worker; worker = null;
    return (old ? old.terminate() : Promise.resolve()).then(function () { status(T.load, 0.02); return loadScript("/vendor/tesseract/tesseract.min.js"); }).then(function () {
      return Tesseract.createWorker(want.split("+"), 1, {
        workerPath: "/vendor/tesseract/worker.min.js", corePath: "/vendor/tesseract/", langPath: "/vendor/tesseract/lang", gzip: true, workerBlobURL: false,
        logger: function (m) {
          if (m.status === "recognizing text") status(T.rec, 0.4 + 0.6 * (m.progress || 0));
          else if (/loading language/.test(m.status)) status(T.lang, 0.1 + 0.25 * (m.progress || 0));
          else if (/loading tesseract core/.test(m.status)) status(T.load, 0.02 + 0.08 * (m.progress || 0));
          else if (/initializ/.test(m.status)) status(T.init, 0.36);
        }
      });
    }).then(function (w) { worker = w; workerLangs = want; return w; });
  }
  function run() {
    if (!current) return;
    if (busy) { pending = true; return; }
    busy = true; pending = false;
    $("ocrOut").value = ""; $("ocrMeta").textContent = "";
    getWorker().then(function (w) { return w.recognize(current); }).then(function (r) {
      var text = (r.data.text || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      $("ocrOut").value = text;
      status(text ? T.done : T.none, null);
      $("ocrMeta").textContent = text ? T.conf + ": " + Math.round(r.data.confidence) + "% · " + text.split(/\s+/).filter(Boolean).length + (AR ? " كلمة" : " words") : "";
      $("ocrCopy").disabled = $("ocrTxt").disabled = !text;
      if (typeof qtEvent === "function") qtEvent("ocr_done");
    }).catch(function (e) { status(T.fail + (e && e.message ? e.message : e), null); })
      .then(function () { busy = false; if (pending) run(); });
  }
  function take(f) {
    if (!f || !/^image\//.test(f.type)) { status(T.notImg, null); return; }
    current = f;
    var img = $("ocrImg"); if (img.src) URL.revokeObjectURL(img.src); img.src = URL.createObjectURL(f); img.hidden = false;
    run();
  }
  var dz = $("ocrDrop"), inp = $("ocrFile");
  dz.addEventListener("click", function () { inp.click(); });
  dz.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } });
  dz.addEventListener("dragover", function (e) { e.preventDefault(); dz.classList.add("drag"); });
  dz.addEventListener("dragleave", function () { dz.classList.remove("drag"); });
  dz.addEventListener("drop", function (e) { e.preventDefault(); dz.classList.remove("drag"); take(e.dataTransfer.files[0]); });
  inp.addEventListener("change", function () { take(inp.files[0]); inp.value = ""; });
  document.addEventListener("paste", function (e) { var f = [].filter.call((e.clipboardData && e.clipboardData.files) || [], function (x) { return /^image\//.test(x.type); })[0]; if (f) take(f); });
  $("ocrLang").addEventListener("change", function () { try { localStorage.setItem("qtOcrLang", langs()); } catch (e) {} run(); });
  try { var sl = localStorage.getItem("qtOcrLang"); if (sl && $("ocrLang").querySelector('option[value="' + sl + '"]')) $("ocrLang").value = sl; } catch (e) {}
  $("ocrCopy").addEventListener("click", function () { if (typeof qtCopy === "function") qtCopy($("ocrOut").value, $("ocrCopyStatus"), T.copy); });
  $("ocrTxt").addEventListener("click", function () {
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + $("ocrOut").value], { type: "text/plain;charset=utf-8" }));
    a.download = "text-quicktiny.txt"; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
  });
})();
