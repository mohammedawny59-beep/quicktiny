// QuickTiny image compressor (/compress-image and /ar/compress-image): quality slider, JPG/WebP output,
// live re-encode with a before/after comparison. Everything runs in the browser.
(function(){
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? {
    notImage: "اختر ملف صورة من فضلك (JPG أو PNG).", working: "جارٍ الضغط...", done: "تم الضغط ✓", unreadable: "تعذّرت قراءة هذه الصورة. جرّب ملفًا آخر.",
    already: "بهذه الجودة يصبح الملف أكبر من الأصلي — خفّض الجودة أو نزّل الأصل كما هو.", orig: "الحجم الأصلي", comp: "بعد الضغط", saved: "نسبة التوفير",
    download: "تنزيل الصورة", downloadOrig: "تنزيل الأصل", quality: "الجودة", format: "الصيغة", small: "أصغر حجم", balanced: "متوازن", high: "جودة عالية",
    cta: "تريد ضغط صور كثيرة مرة واحدة؟ ", ctaLink: "Batch Image Compressor — ‎$4.99 دفعة واحدة", src: "compress-image-ar"
  } : {
    notImage: "Please choose an image file (JPG or PNG).", working: "Compressing...", done: "Done ✓", unreadable: "Could not read that image. Try a different file.",
    already: "At this quality the file is bigger than the original — lower the quality or keep the original.", orig: "Original", comp: "Compressed", saved: "Saved",
    download: "Download compressed image", downloadOrig: "Download original", quality: "Quality", format: "Format", small: "Smallest", balanced: "Balanced", high: "High quality",
    cta: "Need to compress many images at once? ", ctaLink: "Batch Image Compressor — $4.99 one-time", src: "compress-image"
  };
  var $ = function(id){ return document.getElementById(id); };
  var dz = $("dz"), input = $("img"), out = $("imgout"), stats = $("imgstats"), dl = $("imgdl");
  if (!dz || !input) return;

  // Controls: quality slider, presets and output format (shown once an image is loaded).
  var webp = (function(){ try { var c = document.createElement("canvas"); c.width = c.height = 1; return c.toDataURL("image/webp").indexOf("data:image/webp") === 0; } catch (e) { return false; } })();
  var ctl = document.createElement("div"); ctl.className = "cq"; ctl.hidden = true;
  ctl.innerHTML =
    '<div class="cq-top"><label for="imgQ">' + T.quality + ' <b id="imgQv" dir="ltr">72%</b></label>' +
    '<div class="cq-presets" role="group"><button type="button" class="chip" data-q="45">' + T.small + '</button><button type="button" class="chip active" data-q="72">' + T.balanced + '</button><button type="button" class="chip" data-q="88">' + T.high + '</button></div></div>' +
    '<input type="range" id="imgQ" min="10" max="95" step="1" value="72" dir="ltr">' +
    (webp ? '<div class="cq-fmt"><span>' + T.format + '</span><div role="group"><button type="button" class="chip active" data-f="jpeg">JPG</button><button type="button" class="chip" data-f="webp">WebP</button></div></div>' : "");
  out.parentNode.insertBefore(ctl, out);
  var range = $("imgQ"), qv = $("imgQv");
  var state = { file: null, canvas: null, q: 0.72, fmt: "jpeg", seq: 0, url: null, cmp: null };

  dz.addEventListener("click", function(){ input.click(); });
  dz.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
  ["dragover", "dragenter"].forEach(function(t){ dz.addEventListener(t, function(e){ e.preventDefault(); dz.classList.add("drag"); }); });
  ["dragleave", "drop"].forEach(function(t){ dz.addEventListener(t, function(e){ e.preventDefault(); dz.classList.remove("drag"); }); });
  dz.addEventListener("drop", function(e){ var f = e.dataTransfer.files[0]; if (f) load(f); });
  input.addEventListener("change", function(){ var f = input.files[0]; if (f) load(f); });

  var timer = null;
  range.addEventListener("input", function(){
    state.q = range.value / 100; qv.textContent = range.value + "%";
    ctl.querySelectorAll(".cq-presets .chip").forEach(function(b){ b.classList.toggle("active", +b.getAttribute("data-q") === +range.value); });
    clearTimeout(timer); timer = setTimeout(encode, 120);
  });
  ctl.querySelectorAll(".cq-presets .chip").forEach(function(b){
    b.addEventListener("click", function(){ range.value = b.getAttribute("data-q"); range.dispatchEvent(new Event("input")); });
  });
  ctl.querySelectorAll(".cq-fmt .chip").forEach(function(b){
    b.addEventListener("click", function(){
      state.fmt = b.getAttribute("data-f");
      ctl.querySelectorAll(".cq-fmt .chip").forEach(function(x){ x.classList.toggle("active", x === b); });
      encode();
    });
  });

  function kb(n){ return n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(2) + " MB"; }
  function statBox(n, label, cls){ return '<div class="stat' + (cls ? " " + cls : "") + '"><div class="n" dir="ltr">' + n + '</div><div class="l">' + label + "</div></div>"; }

  function load(f){
    stats.innerHTML = ""; dl.innerHTML = ""; state.cheered = false;
    if (state.cmp) { state.cmp.remove(); state.cmp = null; }
    if (!f.type || f.type.indexOf("image/") !== 0) { out.textContent = T.notImage; out.className = "result error"; ctl.hidden = true; return; }
    out.textContent = T.working; out.className = "result";
    var im = new Image(), u = URL.createObjectURL(f);
    im.onload = function(){
      var c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
      var x = c.getContext("2d"); x.fillStyle = "#ffffff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0);
      URL.revokeObjectURL(u);
      state.file = f; state.canvas = c; ctl.hidden = false;
      encode();
    };
    im.onerror = function(){ URL.revokeObjectURL(u); out.textContent = T.unreadable; out.className = "result error"; ctl.hidden = true; };
    im.src = u;
  }

  function encode(){
    if (!state.canvas) return;
    var my = ++state.seq, f = state.file, fmt = state.fmt;
    ctl.classList.add("busy");
    state.canvas.toBlob(function(blob){
      if (my !== state.seq || !blob) return;   // a newer setting already started
      ctl.classList.remove("busy");
      var bigger = blob.size >= f.size;
      var pct = Math.round((1 - blob.size / f.size) * 100);
      out.textContent = bigger ? T.already : T.done;
      out.className = "result " + (bigger ? "warn" : "success");
      if (!stats.querySelector(".cq-pct")) stats.innerHTML = statBox(kb(f.size), T.orig) + statBox(kb(blob.size), T.comp, "cq-live cq-size") + statBox("0%", T.saved, "cq-live cq-pct");
      stats.firstChild.querySelector(".n").textContent = kb(f.size);
      if (typeof qtCountTo === "function") {
        qtCountTo(stats.querySelector(".cq-size .n"), blob.size, kb);
        qtCountTo(stats.querySelector(".cq-pct .n"), Math.max(0, pct), function(v){ return Math.round(v) + "%"; });
      } else { stats.querySelector(".cq-size .n").textContent = kb(blob.size); stats.querySelector(".cq-pct .n").textContent = Math.max(0, pct) + "%"; }
      // Celebrate a big saving once per image.
      if (pct >= 50 && !state.cheered && typeof qtCelebrate === "function") { state.cheered = true; qtCelebrate(stats.querySelector(".cq-pct")); }
      if (state.url) URL.revokeObjectURL(state.url);
      state.url = URL.createObjectURL(blob);
      dl.innerHTML = "";
      var a = document.createElement("a"); a.className = "btn"; a.href = state.url;
      a.download = "quicktiny-" + f.name.replace(/\.[^.]+$/, "") + (fmt === "webp" ? ".webp" : ".jpg");
      a.textContent = T.download; dl.appendChild(a);
      if (bigger) {
        var o = document.createElement("a"); o.className = "btn btn-secondary"; o.style.marginInlineStart = "8px";
        o.href = URL.createObjectURL(f); o.download = f.name; o.textContent = T.downloadOrig; dl.appendChild(o);
      }
      if (typeof qtCompare === "function") {
        if (state.cmp && state.cmp.qtSetAfter) state.cmp.qtSetAfter(state.url);
        else { state.cmp = qtCompare(f, state.url); state.cmp.id = "imgcmp"; dl.parentNode.insertBefore(state.cmp, dl); }
      }
      cta();
      if (typeof qtTrack === "function") qtTrack("compress_quality", { q: Math.round(state.q * 100), fmt: fmt });
    }, "image/" + fmt, state.q);
  }

  function cta(){
    var box = $("imgProCta");
    if (!box || box.firstChild) return;
    var w = document.createElement("div"); w.className = "pro-inline-cta";
    var s = document.createElement("span"); s.textContent = T.cta;
    var l = document.createElement("a"); l.href = "/batch-image-compressor"; l.textContent = T.ctaLink;
    l.addEventListener("click", function(){ if (typeof qtTrack === "function") qtTrack("pro_cta_click", { source: T.src }); });
    w.appendChild(s); w.appendChild(l); box.appendChild(w);
  }
})();
