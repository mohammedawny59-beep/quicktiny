// Homepage engagement (EN "/" and AR "/ar"): drop a file anywhere to pick a tool, favourite tools, recently used tools.
// Everything stays in this browser: files go to the chosen tool through IndexedDB (see qtFileHandoffSet in site.js).
(function(){
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? {
    drop: "اسحب صورة أو ملف PDF هنا", or: "أو", choose: "اختر ملفًا", hint: "سنقترح الأداة المناسبة — الملف لا يُرفع إلى أي خادم.",
    over: "أفلت الملف لنختار له الأداة المناسبة", image: "صورة", images: "صور", heic: "صورة HEIC (آيفون)", pdf: "ملف PDF", pdfs: "ملفات PDF",
    unknown: "هذا النوع غير مدعوم بعد. جرّب صورة أو PDF.", what: "ماذا تريد أن تفعل؟", fav: "المفضلة", recent: "استخدمتها مؤخرًا",
    yours: "أدواتك", yoursSub: "مفضلتك وآخر ما استخدمت — محفوظة على هذا الجهاز فقط.", star: "أضف إلى المفضلة", unstar: "أزل من المفضلة", clear: "مسح السجل"
  } : {
    drop: "Drop an image or PDF here", or: "or", choose: "Choose a file", hint: "We'll suggest the right tool — the file never leaves your browser.",
    over: "Drop to pick the right tool", image: "Image", images: "images", heic: "HEIC photo (iPhone)", pdf: "PDF", pdfs: "PDFs",
    unknown: "That file type isn't supported yet. Try an image or a PDF.", what: "What do you want to do?", fav: "Favorites", recent: "Recently used",
    yours: "Your tools", yoursSub: "Favorites and recently used — saved on this device only.", star: "Add to favorites", unstar: "Remove from favorites", clear: "Clear history"
  };
  var P = AR ? "/ar" : "";
  var A = AR ? {
    image: [["ضغط الصورة", P + "/compress-image", "img"], ["ضغط لحجم محدد (KB)", P + "/compress-image-to-kb", "tsFile"], ["تحويل الصيغة", P + "/image-converter", "icFile"], ["مقاسات السوشال ميديا", P + "/social-image-resizer", "srFile"], ["تحويل إلى PDF", P + "/jpg-to-pdf", "imgFiles"], ["إزالة الخلفية", "/remove-background-from-image", "studioFile"]],
    images: [["تحويل الصيغة للكل", P + "/image-converter", "icFile"], ["دمجها في PDF", P + "/jpg-to-pdf", "imgFiles"], ["ضغط الأولى", P + "/compress-image", "img"]],
    heic: [["تحويل HEIC إلى JPG", P + "/heic-to-jpg", "icFile"], ["تحويل لصيغة أخرى", P + "/image-converter", "icFile"]],
    pdf: [["ضغط PDF", P + "/compress-pdf", "cmpFile"], ["تقسيم أو استخراج صفحات", P + "/split-pdf", "pagesFile"], ["تحويل PDF إلى صور", P + "/pdf-to-jpg", "toimgFile"], ["تدوير الصفحات", P + "/pdf-tools#rotate", "rotateFile"]],
    pdfs: [["دمج ملفات PDF", P + "/merge-pdf", "mergeFiles"], ["ضغط الأول", P + "/compress-pdf", "cmpFile"]]
  } : {
    image: [["Compress image", "/compress-image", "img"], ["Compress to exact KB", "/compress-image-to-kb", "tsFile"], ["Convert format", "/image-converter", "icFile"], ["Resize for social", "/social-image-resizer", "srFile"], ["Make a PDF", "/jpg-to-pdf", "imgFiles"], ["Remove background", "/remove-background-from-image", "studioFile"]],
    images: [["Convert all", "/image-converter", "icFile"], ["Combine into PDF", "/jpg-to-pdf", "imgFiles"], ["Compress the first", "/compress-image", "img"]],
    heic: [["HEIC to JPG", "/heic-to-jpg", "icFile"], ["Convert to another format", "/image-converter", "icFile"]],
    pdf: [["Compress PDF", "/compress-pdf", "cmpFile"], ["Split / extract pages", "/split-pdf", "pagesFile"], ["PDF to JPG", "/pdf-to-jpg", "toimgFile"], ["Rotate pages", "/rotate-pdf", "rotateFile"]],
    pdfs: [["Merge PDFs", "/merge-pdf", "mergeFiles"], ["Compress the first", "/compress-pdf", "cmpFile"]]
  };

  function el(tag, cls, text){ var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function size(b){ return b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / 1048576).toFixed(1) + " MB"; }
  function kind(f){
    var n = (f.name || "").toLowerCase();
    if (f.type === "application/pdf" || /\.pdf$/.test(n)) return "pdf";
    if (/\.(heic|heif)$/.test(n) || /hei[cf]/.test(f.type)) return "heic";
    if (/^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|avif|bmp)$/.test(n)) return "image";
    return null;
  }

  /* ---------- Drop zone ---------- */
  var host = document.getElementById("smart-actions") || document.querySelector(".hero .search-row");
  if (host && window.indexedDB) {
    var box = el("div", "home-drop");
    box.innerHTML = '<input type="file" id="homeFile" class="sr-only" tabindex="-1" aria-label="' + T.choose + '" multiple accept="image/*,.heic,.heif,application/pdf,.pdf">';
    var row = el("div", "hd-row");
    var ico = el("span", "hd-ico"); ico.setAttribute("aria-hidden", "true"); ico.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>';
    var txt = el("span", "hd-text"); txt.appendChild(el("strong", "", T.drop)); txt.appendChild(document.createTextNode(" " + T.or + " "));
    var pick = el("button", "btn btn-secondary hd-pick", T.choose); pick.type = "button";
    row.appendChild(ico); row.appendChild(txt); row.appendChild(pick);
    var hint = el("p", "privacy-note hd-hint", T.hint);
    var out = el("div", "hd-out"); out.setAttribute("aria-live", "polite");
    box.appendChild(row); box.appendChild(hint); box.appendChild(out);
    if (host.id === "smart-actions") host.appendChild(box); else { box.style.maxWidth = "640px"; box.style.margin = "14px auto 0"; host.parentNode.insertBefore(box, host.nextSibling); }
    var input = box.querySelector("#homeFile");
    pick.addEventListener("click", function(){ input.click(); });
    input.addEventListener("change", function(){ if (input.files.length) handle([].slice.call(input.files)); input.value = ""; });

    var overlay = el("div", "home-overlay"); overlay.setAttribute("aria-hidden", "true");
    overlay.appendChild(el("div", "ho-card", T.over)); document.body.appendChild(overlay);
    var depth = 0;
    function hasFiles(e){ return e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], "Files") !== -1; }
    window.addEventListener("dragenter", function(e){ if (!hasFiles(e)) return; depth++; overlay.classList.add("on"); });
    window.addEventListener("dragleave", function(e){ if (!hasFiles(e)) return; if (--depth <= 0) { depth = 0; overlay.classList.remove("on"); } });
    window.addEventListener("dragover", function(e){ if (hasFiles(e)) e.preventDefault(); });
    window.addEventListener("drop", function(e){
      if (!hasFiles(e)) return;
      e.preventDefault(); depth = 0; overlay.classList.remove("on");
      if (e.dataTransfer.files.length) handle([].slice.call(e.dataTransfer.files));
    });

    function handle(files){
      var k = null;
      files.forEach(function(f){ if (!k) k = kind(f); });
      out.innerHTML = "";
      if (!k) { out.appendChild(el("p", "result error", T.unknown)); return; }
      files = files.filter(function(f){ return kind(f) === k; });
      var group = k === "pdf" ? (files.length > 1 ? "pdfs" : "pdf") : k === "heic" ? "heic" : (files.length > 1 ? "images" : "image");
      var card = el("div", "hd-file");
      if (k === "image") { var img = el("img", "hd-thumb"); img.alt = ""; img.src = URL.createObjectURL(files[0]); img.onload = function(){ URL.revokeObjectURL(img.src); }; card.appendChild(img); }
      else card.appendChild(el("span", "hd-thumb hd-badge", k === "pdf" ? "PDF" : "HEIC"));
      var meta = el("div", "hd-meta");
      var label = files.length > 1 ? files.length + " " + (k === "pdf" ? T.pdfs : T.images) : files[0].name;
      meta.appendChild(el("strong", "", label));
      var total = files.reduce(function(s, f){ return s + f.size; }, 0);
      meta.appendChild(el("span", "", (files.length > 1 ? "" : (k === "pdf" ? T.pdf : k === "heic" ? T.heic : T.image) + " · ") + size(total)));
      card.appendChild(meta);
      out.appendChild(card);
      out.appendChild(el("p", "hd-q", T.what));
      var btns = el("div", "btn-row hd-actions");
      A[group].forEach(function(a, i){
        var b = el("button", "btn" + (i ? " btn-secondary" : ""), a[0]); b.type = "button";
        b.style.animationDelay = (i * 55) + "ms";
        b.addEventListener("click", function(){
          b.disabled = true;
          var path = a[1].split("#")[0];
          qtEvent("home_file_" + group);
          qtFileHandoffSet(path, a[2], files).then(function(){ location.href = a[1]; }, function(){ location.href = a[1]; });
        });
        btns.appendChild(b);
      });
      out.appendChild(btns);
      qtEvent("home_file_dropped");
    }
  }

  /* ---------- Favorites + recently used ---------- */
  var grid = document.getElementById("toolsGrid") || document.getElementById("arGrid");
  if (!grid) return;
  function read(k){ try { var v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function write(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function mine(p){ return AR ? p.indexOf("/ar/") === 0 : p.indexOf("/ar/") !== 0; }
  function cardFor(p){ return grid.querySelector('.tool-card[href="' + p + '"]'); }

  [].forEach.call(grid.querySelectorAll(".tool-card"), function(c){
    var s = el("span", "fav-star"); s.setAttribute("role", "button"); s.tabIndex = 0;
    s.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>';
    function sync(){ var on = read("qtFav").indexOf(c.getAttribute("href")) !== -1; s.classList.toggle("on", on); s.setAttribute("aria-pressed", on ? "true" : "false"); s.setAttribute("aria-label", on ? T.unstar : T.star); s.title = on ? T.unstar : T.star; }
    function toggle(e){
      e.preventDefault(); e.stopPropagation();
      var p = c.getAttribute("href"), f = read("qtFav"), i = f.indexOf(p);
      if (i === -1) { f.unshift(p); qtEvent("fav_added"); } else f.splice(i, 1);
      write("qtFav", f.slice(0, 24)); sync(); s.classList.remove("pop"); void s.offsetWidth; s.classList.add("pop"); render();
    }
    s.addEventListener("click", toggle);
    s.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " ") toggle(e); });
    (c.querySelector(".tc-head") || c).appendChild(s); sync();
  });

  var section = el("section", "section yours"); section.id = "yours"; section.hidden = true;
  var head = el("div", "section-head"); var hd = el("div");
  hd.appendChild(el("h2", "section-title", T.yours)); hd.appendChild(el("p", "section-sub", T.yoursSub)); head.appendChild(hd);
  var clr = el("button", "btn btn-secondary yours-clear", T.clear); clr.type = "button"; head.appendChild(clr);
  var body = el("div", "yours-body"); section.appendChild(head); section.appendChild(body);
  var toolsSection = document.getElementById("tools");
  toolsSection.parentNode.insertBefore(section, toolsSection);
  clr.addEventListener("click", function(){ write("qtRecent", read("qtRecent").filter(function(r){ return !mine(r.p); })); render(); });

  function chip(p, name){
    var a = el("a", "yours-chip"); a.href = p;
    var c = cardFor(p), img = c && c.querySelector(".tc-icon img");
    if (img) { var i = el("img"); i.src = img.getAttribute("src"); i.alt = ""; i.width = 28; i.height = 28; a.appendChild(i); }
    a.appendChild(el("span", "", name || (c ? c.querySelector("h3").textContent : p)));
    return a;
  }
  function render(){
    var favs = read("qtFav").filter(mine);
    var recent = read("qtRecent").filter(function(r){ return r && r.p && mine(r.p) && favs.indexOf(r.p) === -1; }).slice(0, 6);
    body.innerHTML = "";
    if (favs.length) {
      body.appendChild(el("h3", "yours-h", "★ " + T.fav));
      var r1 = el("div", "yours-row"); favs.forEach(function(p){ r1.appendChild(chip(p)); }); body.appendChild(r1);
    }
    if (recent.length) {
      body.appendChild(el("h3", "yours-h", "↺ " + T.recent));
      var r2 = el("div", "yours-row"); recent.forEach(function(r){ r2.appendChild(chip(r.p, cardFor(r.p) ? null : r.n)); }); body.appendChild(r2);
    }
    clr.hidden = !recent.length;
    section.hidden = !favs.length && !recent.length;
  }
  render();
})();
