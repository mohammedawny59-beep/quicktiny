// GTA 6 Zone — cinematic layer: scroll-driven reveals and scrubbed scenes, pinned horizontal "places" track,
// tilt cards, storage calculator, Vice poster maker and an OBS stream kit (browser-source widgets).
// Unofficial fan section; all visuals here are original (AI-generated scenery, canvas/CSS effects).

/* ---------- pure helpers (tests/gta-story.test.js) ---------- */
function qtGsClamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
// Scroll progress of an element through the viewport: 0 when its top hits the bottom of the screen, 1 when its
// bottom leaves the top (or, for pinned tracks, across the element's own scrollable height).
function qtGsProgress(top, height, vh, pinned) {
  return pinned ? qtGsClamp01(-top / Math.max(1, height - vh)) : qtGsClamp01((vh - top) / (vh + height));
}
// Storage check for the 212 GB pre-load (+ ~10% headroom for day-one patches and temp files).
function qtGsSpace(freeGb, needGb) {
  var need = needGb || 212, comfy = Math.ceil(need * 1.1), f = Math.max(0, +freeGb || 0);
  return { ok: f >= need, comfy: f >= comfy, short: Math.max(0, Math.ceil(need - f)), pct: Math.min(100, Math.round(f / comfy * 100)), comfyGb: comfy };
}
// Poster palette: 5-stop neon gradient map (dark → bright).
var QT_GS_POSTER = {
  vice: [[18, 4, 44], [123, 16, 120], [255, 45, 149], [255, 168, 71], [255, 246, 168]],
  ocean: [[3, 10, 40], [8, 70, 140], [60, 200, 255], [140, 255, 230], [255, 255, 240]],
  sunset: [[30, 6, 20], [140, 20, 40], [255, 90, 60], [255, 190, 90], [255, 250, 220]],
  noir: [[8, 8, 12], [60, 60, 70], [150, 150, 160], [220, 220, 225], [255, 255, 255]]
};
function qtGsMap(pal, v) { var x = qtGsClamp01(v) * (pal.length - 1), i = Math.min(pal.length - 2, Math.floor(x)), k = x - i, a = pal[i], b = pal[i + 1]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
// Turn RGBA pixels into a comic-style neon poster: posterised luminance → gradient map, ink edges (Sobel), halftone.
function qtGsPosterize(px, w, h, opt) {
  var pal = QT_GS_POSTER[opt.palette] || QT_GS_POSTER.vice, levels = opt.levels || 5, lum = new Float32Array(w * h), out = new Uint8ClampedArray(px.length);
  for (var i = 0, j = 0; i < lum.length; i++, j += 4) lum[i] = (.299 * px[j] + .587 * px[j + 1] + .114 * px[j + 2]) / 255;
  var dot = Math.max(3, Math.round(Math.min(w, h) / 160));
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    var p = y * w + x, l = lum[p];
    // contrast boost, then posterise
    l = qtGsClamp01((l - .5) * (opt.contrast || 1.35) + .5); var q = Math.round(l * (levels - 1)) / (levels - 1);
    // halftone in the shadows
    if (opt.halftone !== false && q < .5) { var cx = (x % dot) - dot / 2, cy = (y % dot) - dot / 2, r = (1 - q * 2) * dot * .55; if (cx * cx + cy * cy < r * r) q = Math.max(0, q - .25); }
    var c = qtGsMap(pal, q);
    // Sobel edges → black ink
    if (x > 0 && y > 0 && x < w - 1 && y < h - 1) {
      var gx = -lum[p - w - 1] - 2 * lum[p - 1] - lum[p + w - 1] + lum[p - w + 1] + 2 * lum[p + 1] + lum[p + w + 1];
      var gy = -lum[p - w - 1] - 2 * lum[p - w] - lum[p - w + 1] + lum[p + w - 1] + 2 * lum[p + w] + lum[p + w + 1];
      var e = Math.sqrt(gx * gx + gy * gy); if (e > (opt.edge || .55)) { var k = Math.min(1, (e - (opt.edge || .55)) * 2.5); c = [c[0] * (1 - k), c[1] * (1 - k), c[2] * (1 - k)]; }
    }
    var o = p * 4; out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255;
  }
  return out;
}
function qtGsObsParams(search) {
  var q = new URLSearchParams(search || ""), w = q.get("obs");
  if (!/^(countdown|soon|live)$/.test(w || "")) return null;
  return { widget: w, name: (q.get("name") || "").slice(0, 40), mins: Math.max(1, Math.min(120, parseInt(q.get("m"), 10) || 5)), lang: q.get("lang") === "ar" ? "ar" : (q.get("lang") === "en" ? "en" : null) };
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("gtaZone")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var reduce = !!window.qtGsStill;
  var mBtn = $("gsMotion");
  if (mBtn) {
    mBtn.textContent = reduce ? (AR ? "▶ شغّل الحركة" : "▶ Motion on") : (AR ? "⏸ أوقف الحركة" : "⏸ Motion off");
    mBtn.setAttribute("aria-pressed", reduce ? "false" : "true");
    mBtn.addEventListener("click", function () { try { localStorage.setItem("qtGsMotion", reduce ? "on" : "off"); } catch (e) {} location.reload(); });
  }

  /* ===== OBS mode: the page becomes a single transparent browser-source widget ===== */
  var obs = qtGsObsParams(location.search);
  if (obs) { qtGsObs(obs, AR); return; }

  /* ===== reveals ===== */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (reduce || typeof IntersectionObserver === "undefined") revealEls.forEach(function (e) { e.classList.add("in"); });
  else { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .18 }); revealEls.forEach(function (e) { io.observe(e); }); }
  // split the hero title into letters for the staggered entrance
  document.querySelectorAll("[data-split]").forEach(function (el) {
    if (AR) return; // Arabic letters must stay joined — animate the whole word instead
    var txt = el.textContent; el.textContent = ""; el.setAttribute("aria-label", txt);
    Array.prototype.forEach.call(txt, function (ch, i) { var s = document.createElement("span"); s.className = "gs-ch"; s.setAttribute("aria-hidden", "true"); s.style.setProperty("--i", i); s.textContent = ch === " " ? "\u00a0" : ch; el.appendChild(s); });
  });
  // story text: one span per word so scroll can light them up
  var story = $("gsStory"), storyWords = [];
  if (story) { var words = story.textContent.trim().split(/\s+/); story.textContent = ""; words.forEach(function (w) { var s = document.createElement("span"); s.textContent = w + " "; story.appendChild(s); storyWords.push(s); }); }

  /* ===== scroll-scrubbed scenes (one rAF loop, only while something moves) ===== */
  var hero = $("gsHero"), heroImg = $("gsHeroImg"), track = $("gsPlaces"), rail = $("gsRail"), storyBox = $("gsStoryBox"), ticking = false;
  function frame() {
    ticking = false; var vh = innerHeight;
    if (hero && heroImg && !reduce) { var r = hero.getBoundingClientRect(), p = qtGsClamp01(-r.top / r.height); heroImg.style.transform = "translate3d(0," + (p * 18) + "%,0) scale(" + (1.12 - p * .08) + ")"; hero.style.setProperty("--gs-fade", (1 - p * 1.4).toFixed(3)); }
    if (storyBox && storyWords.length) { var sr = storyBox.getBoundingClientRect(), sp = qtGsClamp01((vh * .85 - sr.top) / (sr.height * .9)), lit = Math.round(sp * storyWords.length); storyWords.forEach(function (w, i) { w.classList.toggle("lit", reduce || i < lit); }); }
    if (track && rail && innerWidth > 760 && !reduce) { var tr = track.getBoundingClientRect(), tp = qtGsProgress(tr.top, tr.height, vh, true), max = rail.scrollWidth - innerWidth + 48; rail.style.transform = "translate3d(" + ((AR ? 1 : -1) * tp * Math.max(0, max)) + "px,0,0)"; $("gsPlacesBar").style.width = (tp * 100) + "%"; }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); frame();
  // mouse parallax on the hero layers
  if (hero && !reduce) hero.addEventListener("pointermove", function (e) { var r = hero.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5; hero.style.setProperty("--mx", dx.toFixed(3)); hero.style.setProperty("--my", dy.toFixed(3)); });

  /* ===== tilt cards ===== */
  if (!reduce) document.querySelectorAll("[data-tilt]").forEach(function (c) {
    c.addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = "perspective(800px) rotateY(" + (x * 14) + "deg) rotateX(" + (-y * 14) + "deg) translateZ(0)"; c.style.setProperty("--gx", (x + .5) * 100 + "%"); c.style.setProperty("--gy", (y + .5) * 100 + "%"); });
    c.addEventListener("pointerleave", function () { c.style.transform = ""; });
  });

  /* ===== storage calculator ===== */
  var sIn = $("gsFree");
  if (sIn) { var calc = function () { var r = qtGsSpace(sIn.value), m = $("gsSpaceMsg"); $("gsSpaceBar").style.width = r.pct + "%"; $("gsSpaceBar").className = r.comfy ? "ok" : r.ok ? "tight" : "bad";
      m.textContent = !sIn.value ? "" : r.comfy ? (AR ? "✓ مساحتك كافية مع هامش للتحديثات." : "✓ You have enough space, with room for updates.") : r.ok ? (AR ? "⚠ تكفي بالكاد — فضّي " + (r.comfyGb - Math.floor(+sIn.value)) + " غيغا إضافية للأمان." : "⚠ Just enough — free " + (r.comfyGb - Math.floor(+sIn.value)) + " GB more to be safe.") : (AR ? "✗ ناقصك " + r.short + " غيغا على الأقل." : "✗ You need at least " + r.short + " GB more."); };
    sIn.addEventListener("input", calc); calc(); }

  /* ===== Vice poster maker ===== */
  var pc = $("gsPoster");
  if (pc) {
    var px = pc.getContext("2d", { willReadFrequently: true }), pst = { img: null, palette: "vice", title: AR ? "فايس" : "VICE", sub: AR ? "أهلًا بك في ليونيدا" : "WELCOME TO LEONIDA", halftone: true };
    var draw = function () {
      var W = pc.width, H = pc.height; px.fillStyle = "#12042c"; px.fillRect(0, 0, W, H);
      if (pst.img) {
        var k = Math.max(W / pst.img.width, H * .82 / pst.img.height), iw = pst.img.width * k, ih = pst.img.height * k, tmp = document.createElement("canvas"); tmp.width = W; tmp.height = Math.round(H * .82);
        var tx = tmp.getContext("2d", { willReadFrequently: true }); tx.drawImage(pst.img, (W - iw) / 2, (tmp.height - ih) / 2, iw, ih);
        var id = tx.getImageData(0, 0, tmp.width, tmp.height); id.data.set(qtGsPosterize(id.data, tmp.width, tmp.height, { palette: pst.palette, halftone: pst.halftone })); tx.putImageData(id, 0, 0);
        px.drawImage(tmp, 0, 0);
      } else { var g = px.createLinearGradient(0, 0, 0, H * .82); g.addColorStop(0, "#2b0b5c"); g.addColorStop(1, "#ff2d95"); px.fillStyle = g; px.fillRect(0, 0, W, H * .82); px.fillStyle = "rgba(255,255,255,.75)"; px.font = "700 " + Math.round(W * .04) + "px Sora, \"QT Arabic\", sans-serif"; px.textAlign = "center"; px.fillText(AR ? "اختر صورة لتحويلها لبوستر" : "Choose a photo to turn into a poster", W / 2, H * .41); }
      // frame + title block
      var u = W / 1080; px.lineWidth = 18 * u; px.strokeStyle = "#fff"; px.strokeRect(9 * u, 9 * u, W - 18 * u, H - 18 * u);
      var band = H * .18, by = H - band; var bg = px.createLinearGradient(0, by, W, H); bg.addColorStop(0, "#ff2d95"); bg.addColorStop(1, "#ff8a3d"); px.fillStyle = bg; px.fillRect(18 * u, by, W - 36 * u, band - 18 * u);
      var arT = /[؀-ۿ]/.test(pst.title), fam = arT ? '"QT Lalezar", sans-serif' : 'Sora, "Arial Black", sans-serif', fs = band * .52;
      px.font = (arT ? "400 " : "800 ") + fs + "px " + fam; var mw = px.measureText(pst.title).width; if (mw > W * .86) { fs *= W * .86 / mw; px.font = (arT ? "400 " : "800 ") + fs + "px " + fam; }
      px.textAlign = "center"; px.textBaseline = "middle"; px.direction = arT ? "rtl" : "ltr"; px.lineWidth = fs * .1; px.strokeStyle = "#12042c"; px.strokeText(pst.title, W / 2, by + band * .38); px.fillStyle = "#fff6a8"; px.fillText(pst.title, W / 2, by + band * .38);
      var arS = /[؀-ۿ]/.test(pst.sub); px.font = (arS ? "400 " : "700 ") + band * .14 + "px " + (arS ? '"QT Lalezar", sans-serif' : "Sora, sans-serif"); px.direction = arS ? "rtl" : "ltr"; px.fillStyle = "#12042c"; px.fillText(pst.sub, W / 2, by + band * .74);
    };
    $("gsPosterFile").addEventListener("change", function () { var f = this.files[0]; if (!f) return; createImageBitmap(f).then(function (b) { var k = Math.min(1, 1100 / Math.max(b.width, b.height)), c = document.createElement("canvas"); c.width = Math.round(b.width * k); c.height = Math.round(b.height * k); c.getContext("2d").drawImage(b, 0, 0, c.width, c.height); pst.img = c; draw(); }); });
    document.querySelectorAll("#gsPosterPal .chip").forEach(function (b) { b.addEventListener("click", function () { pst.palette = b.getAttribute("data-p"); document.querySelectorAll("#gsPosterPal .chip").forEach(function (o) { o.classList.toggle("active", o === b); }); draw(); }); });
    $("gsPosterTitle").addEventListener("input", function () { pst.title = this.value.slice(0, 24) || " "; draw(); });
    $("gsPosterSub").addEventListener("input", function () { pst.sub = this.value.slice(0, 40); draw(); });
    $("gsPosterHalf").addEventListener("change", function () { pst.halftone = this.checked; draw(); });
    $("gsPosterGo").addEventListener("click", function () { pc.toBlob(function (b) { var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "vice-poster.png"; document.body.appendChild(a); a.click(); a.remove(); if (typeof qtEvent === "function") qtEvent("gta_poster"); }, "image/png"); });
    $("gsPosterTitle").value = pst.title; $("gsPosterSub").value = pst.sub;
    if (document.fonts && document.fonts.load) Promise.all(['400 60px "QT Lalezar"', '800 60px Sora'].map(function (f) { return document.fonts.load(f, "Ab ابج").catch(function () {}); })).then(draw); else draw();
  }

  /* ===== OBS kit builder ===== */
  if ($("gsObsUrl")) {
    var ob = { widget: "soon", name: "", m: 5 };
    var build = function () {
      var u = new URL(location.origin + location.pathname); u.searchParams.set("obs", ob.widget); if (ob.name) u.searchParams.set("name", ob.name); if (ob.widget === "soon") u.searchParams.set("m", ob.m); u.searchParams.set("lang", AR ? "ar" : "en");
      $("gsObsUrl").value = u.href; var fr = $("gsObsFrame"); if (fr.getAttribute("data-src") !== u.href) { fr.setAttribute("data-src", u.href); fr.src = u.href; }
    };
    document.querySelectorAll("#gsObsW .chip").forEach(function (b) { b.addEventListener("click", function () { ob.widget = b.getAttribute("data-w"); document.querySelectorAll("#gsObsW .chip").forEach(function (o) { o.classList.toggle("active", o === b); }); $("gsObsMinRow").hidden = ob.widget !== "soon"; build(); }); });
    $("gsObsName").addEventListener("change", function () { ob.name = this.value.trim().slice(0, 40); build(); });
    $("gsObsMin").addEventListener("change", function () { ob.m = Math.max(1, Math.min(120, +this.value || 5)); build(); });
    $("gsObsCopy").addEventListener("click", function () { var v = $("gsObsUrl").value, b = this; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { b.textContent = AR ? "✓ تم النسخ" : "✓ Copied"; setTimeout(function () { b.textContent = AR ? "نسخ الرابط" : "Copy link"; }, 1500); if (typeof qtEvent === "function") qtEvent("gta_obs"); }, function () { $("gsObsUrl").select(); }); });
    build();
  }
})();

/* ===== OBS widgets (browser source, 1920×1080, transparent where it makes sense) ===== */
function qtGsObs(o, pageAr) {
  var ar = o.lang ? o.lang === "ar" : pageAr;
  document.documentElement.classList.add("gs-obs", "gs-obs-" + o.widget);
  var cv = document.createElement("canvas"); cv.className = "gs-obs-canvas"; document.body.appendChild(cv);
  var x = cv.getContext("2d"), W = 1920, H = 1080; cv.width = W; cv.height = H;
  var launch = new Date(typeof QT_GTA_LAUNCH !== "undefined" ? QT_GTA_LAUNCH : "2026-11-19T00:00:00").getTime(), end = Date.now() + o.mins * 60000, t0 = performance.now();
  var famA = '"QT Lalezar", "QT Arabic", sans-serif', famE = 'Sora, "Arial Black", sans-serif';
  function txt(s, X, Y, size, color, glow, align) { var a = /[؀-ۿ]/.test(s); x.font = (a ? "400 " : "800 ") + size + "px " + (a ? famA : famE); x.textAlign = align || "center"; x.textBaseline = "middle"; x.direction = a ? "rtl" : "ltr"; x.shadowColor = glow || "transparent"; x.shadowBlur = glow ? size * .35 : 0; x.lineJoin = "round"; x.lineWidth = size * .08; x.strokeStyle = "rgba(0,0,0,.75)"; x.strokeText(s, X, Y); x.fillStyle = color; x.fillText(s, X, Y); x.shadowBlur = 0; }
  function two(n) { return String(n).padStart(2, "0"); }
  (function loop(now) {
    var t = (now - t0) / 1000; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
    if (o.widget === "soon") {
      if (typeof qtGtaWorld === "function") qtGtaWorld(x, W, H, t); else { x.fillStyle = "#12042c"; x.fillRect(0, 0, W, H); }
      var left = Math.max(0, end - Date.now()), mm = Math.floor(left / 60000), ss = Math.floor(left / 1000) % 60, pulse = 1 + .02 * Math.sin(t * 3);
      x.save(); x.translate(W / 2, H * .3); x.scale(pulse, pulse); txt(ar ? "البث يبدأ قريبًا" : "STREAM STARTING SOON", 0, 0, 104, "#fff6a8", "#ff2d95"); x.restore();
      if (o.name) txt(o.name, W / 2, H * .42, 56, "#3cf0ff", "#002b8a");
      txt(left > 0 ? two(mm) + ":" + two(ss) : (ar ? "يلا!" : "LET'S GO!"), W / 2, H * .82, 120, "#ffffff", "#ff2d95");
    } else if (o.widget === "countdown") {
      var l = Math.max(0, launch - Date.now()), s = Math.floor(l / 1000), d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, sc = s % 60;
      x.fillStyle = "rgba(10,2,25,.72)"; var bw = 1100, bh = 250, bx = (W - bw) / 2, by = H - bh - 60; if (x.roundRect) { x.beginPath(); x.roundRect(bx, by, bw, bh, 36); x.fill(); } else x.fillRect(bx, by, bw, bh);
      x.strokeStyle = "rgba(255,45,149,.8)"; x.lineWidth = 4; if (x.roundRect) { x.beginPath(); x.roundRect(bx, by, bw, bh, 36); x.stroke(); }
      txt(ar ? "GTA 6 تنزل خلال" : "GTA 6 DROPS IN", W / 2, by + 52, 44, "#3cf0ff");
      txt(l > 0 ? (d + (ar ? "ي " : "d ") + two(h) + ":" + two(m) + ":" + two(sc)) : (ar ? "نزلت! 🎮" : "OUT NOW 🎮"), W / 2, by + 150, 108, "#fff6a8", "#ff2d95");
    } else {
      var p = Math.min(1, t / .6), e = 1 - Math.pow(1 - p, 3), bx2 = -900 + e * 960, y = H - 230;
      x.save(); x.translate(bx2, 0); var g = x.createLinearGradient(0, y, 900, y + 140); g.addColorStop(0, "#ff2d95"); g.addColorStop(1, "#ff8a3d"); x.fillStyle = g; x.beginPath(); x.moveTo(0, y); x.lineTo(880, y); x.lineTo(840, y + 140); x.lineTo(0, y + 140); x.closePath(); x.fill();
      var dot = .5 + .5 * Math.sin(t * 6); x.fillStyle = "rgba(255,255,255," + (.4 + dot * .6) + ")"; x.beginPath(); x.arc(70, y + 70, 18, 0, 7); x.fill();
      txt(ar ? "مباشر الآن" : "LIVE NOW", 110, y + 52, 58, "#fff", null, "left"); txt((ar ? "نلعب GTA 6" : "PLAYING GTA 6") + (o.name ? " · " + o.name : ""), 110, y + 105, 34, "#12042c", null, "left");
      x.restore();
    }
    requestAnimationFrame(loop);
  })(performance.now());
}
if (typeof module !== "undefined") module.exports = { qtGsProgress: qtGsProgress, qtGsSpace: qtGsSpace, qtGsMap: qtGsMap, qtGsPosterize: qtGsPosterize, qtGsObsParams: qtGsObsParams, QT_GS_POSTER: QT_GS_POSTER };
