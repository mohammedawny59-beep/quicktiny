// QuickTiny Glass Slides — frosted "liquid glass" slides over a moving colour mesh (or your photo), with spring
// transitions, exported as a smooth 60 fps MP4 (WebCodecs + vendor/mp4-muxer.js). Every frame is a pure function of time.
var QT_GS_THEMES = {
  aurora: ["#0b1026", "#6b5bff", "#00d4ff", "#ff4fd8", "#38f2a5"],
  sunset: ["#1a0b1e", "#ff6a3d", "#ff2e74", "#ffc857", "#8a5cff"],
  ocean:  ["#03121f", "#0077ff", "#00e0c6", "#4dc3ff", "#1b3cff"],
  candy:  ["#1b1028", "#ff8ad8", "#a98bff", "#7ef0ff", "#ffd36e"],
  mono:   ["#0d0e12", "#5b6275", "#9aa3b8", "#2c3140", "#d6dbe7"]
};
function qtGsClamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
// Smooth spring with a soft settle (no visible bounce) — the "Apple" feel.
function qtGsSpring(k) { k = qtGsClamp(k); return 1 - Math.exp(-6.5 * k) * Math.cos(4.2 * k) * (1 - k * .02); }
function qtGsEaseIn(k) { k = qtGsClamp(k); return k * k * (3 - 2 * k); }
function qtGsAr(s) { return /[؀-ۿ]/.test(s || ""); }
// Which slide is on screen at time t, and how far into it (with the transition window at the start of each slide).
function qtGsTimeline(t, n, per, tr) {
  var i = Math.min(n - 1, Math.max(0, Math.floor(t / per))), local = t - i * per;
  return { i: i, local: local, inTr: i > 0 && local < tr, p: i > 0 ? qtGsClamp(local / tr) : qtGsClamp(local / tr) };
}

// Engine: draws the glass slides for state `st` ({slides, theme, per, photo, align}) onto canvas `cv`.
// Global so other pages (e.g. the creator hub previews) can reuse it. Call resize() after changing cv's size.
function qtGsEngine(cv, st) {
  var ctx = cv.getContext("2d");
  var canFilter = "filter" in ctx;
  var low = document.createElement("canvas"), lx = low.getContext("2d"); // background at 1/8 size (smooth when scaled up)
  var tiny = document.createElement("canvas"), tx = tiny.getContext("2d"); // 1/28 size for the frosted glass
  function resize() { low.width = Math.ceil(cv.width / 8); low.height = Math.ceil(cv.height / 8); tiny.width = Math.max(1, Math.ceil(cv.width / 28)); tiny.height = Math.max(1, Math.ceil(cv.height / 28)); }
  resize();
  // ---- background: drifting colour blobs (or the photo with a slow zoom) ----
  function drawBg(t) {
    var w = low.width, h = low.height, pal = QT_GS_THEMES[st.theme] || QT_GS_THEMES.aurora;
    if (st.photo) {
      var img = st.photo, z = 1.06 + .04 * Math.sin(t * .25), s = Math.max(w / img.width, h / img.height) * z;
      lx.fillStyle = "#000"; lx.fillRect(0, 0, w, h); lx.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
      lx.fillStyle = "rgba(0,0,0,.18)"; lx.fillRect(0, 0, w, h);
    } else {
      lx.fillStyle = pal[0]; lx.fillRect(0, 0, w, h);
      lx.globalCompositeOperation = "lighter";
      for (var b = 1; b < pal.length; b++) {
        var a = t * (.18 + b * .05) + b * 1.7, bx = w * (.5 + .38 * Math.cos(a)), by = h * (.5 + .34 * Math.sin(a * 1.3 + b)), r = Math.max(w, h) * (.42 + .08 * Math.sin(t * .4 + b));
        var g = lx.createRadialGradient(bx, by, 0, bx, by, r); g.addColorStop(0, pal[b] + "cc"); g.addColorStop(1, pal[b] + "00"); lx.fillStyle = g; lx.fillRect(0, 0, w, h);
      }
      lx.globalCompositeOperation = "source-over";
    }
    tx.drawImage(low, 0, 0, tiny.width, tiny.height);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(low, 0, 0, cv.width, cv.height);
    if (st.photo) { ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(0, 0, cv.width, cv.height); }
  }
  function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function wrap(text, maxW) {
    var words = String(text || "").split(/\s+/).filter(Boolean), lines = [], cur = "";
    words.forEach(function (w) { var tr = cur ? cur + " " + w : w; if (cur && ctx.measureText(tr).width > maxW) { lines.push(cur); cur = w; } else cur = tr; });
    if (cur) lines.push(cur); return lines;
  }
  // ---- one glass card: frosted backdrop, sheen, light sweep, glowing rim, staggered text ----
  function drawCard(slide, t, enter, exit, idx) {
    var W = cv.width, H = cv.height, u = Math.min(W, H) / 1080, ar = qtGsAr(slide.t + slide.s);
    var cw = Math.min(W * .86, 940 * u * (W > H ? 1.4 : 1)), pad = 84 * u;
    var tf = 124 * u, sf = 56 * u;
    ctx.font = "700 " + tf + "px Sora, \"QT Arabic\", system-ui, sans-serif"; ctx.direction = ar ? "rtl" : "ltr";
    var tl = wrap(slide.t, cw - pad * 2); ctx.font = "500 " + sf + "px Sora, \"QT Arabic\", system-ui, sans-serif"; var sl = wrap(slide.s, cw - pad * 2);
    var ch = pad * 2 + tl.length * tf * 1.12 - tf * .12 + (sl.length ? 24 * u + sl.length * sf * 1.35 : 0);
    var e = qtGsSpring(enter), x = qtGsEaseIn(exit);
    var floatY = Math.sin(t * 1.1 + idx) * 6 * u, tilt = Math.sin(t * .7 + idx) * .006;
    var cx = W / 2, cy = H / 2 + (1 - e) * 140 * u - x * 110 * u + floatY, sc = (.9 + .1 * e) * (1 - .05 * x), alpha = Math.min(1, e * 1.4) * (1 - x);
    if (alpha <= .001) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.rotate(tilt); ctx.scale(sc, sc);
    var X = -cw / 2, Y = -ch / 2, R = 56 * u;
    // soft shadow
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 80 * u; ctx.shadowOffsetY = 40 * u; rr(ctx, X, Y, cw, ch, R); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fill(); ctx.restore();
    // frosted backdrop: the very low-res background, sampled from where the card sits, slightly magnified (refraction)
    ctx.save(); rr(ctx, X, Y, cw, ch, R); ctx.clip();
    var m = 1.08, sx = (cx - cw / 2 * m) / W * tiny.width, sy = (cy - ch / 2 * m) / H * tiny.height, sw = cw * m / W * tiny.width, sh = ch * m / H * tiny.height;
    ctx.drawImage(tiny, sx, sy, sw, sh, X, Y, cw, ch);
    ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fillRect(X, Y, cw, ch);
    var sheen = ctx.createLinearGradient(X, Y, X + cw * .6, Y + ch); sheen.addColorStop(0, "rgba(255,255,255,.30)"); sheen.addColorStop(.45, "rgba(255,255,255,.05)"); sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen; ctx.fillRect(X, Y, cw, ch);
    // light sweep across the glass
    var sw2 = ((t * .35 + idx * .3) % 1.6) - .3, bx = X - cw * .3 + sw2 * cw * 1.6;
    var lg = ctx.createLinearGradient(bx - 120 * u, 0, bx + 120 * u, 0); lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(.5, "rgba(255,255,255,.16)"); lg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save(); ctx.transform(1, 0, -.35, 1, 0, 0); ctx.fillStyle = lg; ctx.fillRect(X - ch, Y, cw + ch * 2, ch); ctx.restore();
    // text
    ctx.textAlign = st.align === "start" ? (ar ? "right" : "left") : "center"; ctx.textBaseline = "alphabetic";
    var tx0 = st.align === "start" ? (ar ? X + cw - pad : X + pad) : 0, yy = Y + pad + tf * .9;
    var line = function (txt, font, size, color, k, y0) {
      var lp = qtGsSpring(qtGsClamp((enter - k) / .75)); if (lp <= 0) return;
      ctx.save(); ctx.globalAlpha = alpha * Math.min(1, lp * 1.3); ctx.font = font;
      if (canFilter && lp < .98) ctx.filter = "blur(" + ((1 - lp) * 14 * u).toFixed(1) + "px)";
      ctx.fillStyle = color; ctx.fillText(txt, tx0, y0 + (1 - lp) * 34 * u); ctx.restore();
    };
    tl.forEach(function (l, i) { line(l, "700 " + tf + "px Sora, \"QT Arabic\", system-ui, sans-serif", tf, "#ffffff", .12 + i * .08, yy); yy += tf * 1.12; });
    yy = Y + pad + tl.length * tf * 1.12 + 24 * u + sf * .95;
    sl.forEach(function (l, i) { line(l, "500 " + sf + "px Sora, \"QT Arabic\", system-ui, sans-serif", sf, "rgba(255,255,255,.82)", .28 + (tl.length + i) * .07, yy); yy += sf * 1.35; });
    ctx.restore();
    // glowing rim + top highlight
    var rim = ctx.createLinearGradient(0, Y, 0, Y + ch); rim.addColorStop(0, "rgba(255,255,255,.85)"); rim.addColorStop(.5, "rgba(255,255,255,.18)"); rim.addColorStop(1, "rgba(255,255,255,.45)");
    rr(ctx, X + 1, Y + 1, cw - 2, ch - 2, R); ctx.lineWidth = 3 * u; ctx.strokeStyle = rim; ctx.stroke();
    rr(ctx, X + 6 * u, Y + 6 * u, cw - 12 * u, ch - 12 * u, R - 6 * u); ctx.lineWidth = 1 * u; ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.stroke();
    ctx.restore();
  }
  function render(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; drawBg(t);
    var n = st.slides.length; if (!n) return;
    var tr = Math.min(.8, st.per * .45), tl = qtGsTimeline(t, n, st.per, tr);
    if (tl.inTr) {
      drawCard(st.slides[tl.i - 1], t, 1, tl.p, tl.i - 1);
      drawCard(st.slides[tl.i], t, Math.max(0, (tl.local - tr * .25) / (tr * 1.1)), 0, tl.i);
    } else {
      var enter = tl.i === 0 ? qtGsClamp(t / 1.0) : qtGsClamp((tl.local - tr * .25) / (tr * 1.1));
      var exit = tl.i === n - 1 ? qtGsClamp((t - (n * st.per - .45)) / .45) : 0;
      drawCard(st.slides[tl.i], t, enter, exit, tl.i);
    }
    // page dots
    var W = cv.width, H = cv.height, u = Math.min(W, H) / 1080, gap = 26 * u, x0 = W / 2 - (n - 1) * gap / 2;
    for (var d = 0; d < n; d++) { var on = d === tl.i; ctx.fillStyle = on ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0 + d * gap - (on ? 18 : 6) * u, H - 90 * u, (on ? 36 : 12) * u, 12 * u, 6 * u) : ctx.rect(x0 + d * gap - 6 * u, H - 90 * u, 12 * u, 12 * u); ctx.fill(); }
  }
  return { render: render, resize: resize, dur: function () { return st.slides.length * st.per + .4; } };
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("gsCanvas")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var cv = $("gsCanvas"), ctx = cv.getContext("2d");
  var SIZES = { "9:16": [1080, 1920], "16:9": [1920, 1080], "1:1": [1080, 1080] };
  var SAMPLE = AR ? [{ t: "مرحبًا 👋", s: "هذه سلايدات زجاجية بحركة ناعمة" }, { t: "بسيط وأنيق", s: "اكتب نصك واختر الألوان" }, { t: "جاهز للنشر", s: "فيديو MP4 بسلاسة 60 إطارًا" }]
                   : [{ t: "Hello 👋", s: "Smooth liquid-glass slides" }, { t: "Simple & elegant", s: "Type your text, pick a colour mood" }, { t: "Ready to post", s: "A silky 60 fps MP4" }];
  var st = { slides: SAMPLE.slice(), theme: "aurora", ratio: "9:16", per: 2.6, fps: 60, photo: null, align: "center" };
  try { var sv = JSON.parse(localStorage.getItem("qtGlass") || "null"); if (sv && sv.slides && sv.slides.length) ["slides", "theme", "ratio", "per", "fps", "align"].forEach(function (k) { if (sv[k] != null) st[k] = sv[k]; }); } catch (e) {}
  function save() { try { localStorage.setItem("qtGlass", JSON.stringify({ slides: st.slides, theme: st.theme, ratio: st.ratio, per: st.per, fps: st.fps, align: st.align })); } catch (e) {} }
  function dur() { return st.slides.length * st.per + .4; }
  var eng = qtGsEngine(cv, st), render = eng.render;
  function size() { var z = SIZES[st.ratio]; cv.width = z[0]; cv.height = z[1]; eng.resize(); cv.parentNode.style.aspectRatio = z[0] + " / " + z[1]; }

  // ---- slide editor ----
  var T = AR ? { title: "العنوان", sub: "النص", up: "أعلى", down: "أسفل", del: "حذف", slide: "سلايد", done: "✓ تم تنزيل الفيديو", wait: "جارٍ تجهيز الفيديو…", webm: "سننزّل WebM لأن متصفحك لا يدعم MP4 هنا.", fail: "تعذّر إنشاء الفيديو: " }
             : { title: "Title", sub: "Text", up: "Up", down: "Down", del: "Delete", slide: "Slide", done: "✓ Video downloaded", wait: "Rendering video…", webm: "Downloading WebM (this browser can't encode MP4 here).", fail: "Couldn't create the video: " };
  function editor() {
    var box = $("gsList"); box.innerHTML = "";
    st.slides.forEach(function (s, i) {
      var row = document.createElement("div"); row.className = "gs-slide";
      row.innerHTML = '<div class="gs-n">' + (i + 1) + '</div><div class="gs-f"><input type="text" maxlength="60" dir="auto"><textarea rows="2" maxlength="140" dir="auto"></textarea></div><div class="gs-b"><button type="button" data-a="up">↑</button><button type="button" data-a="down">↓</button><button type="button" data-a="del">×</button></div>';
      var ti = row.querySelector("input"), sb = row.querySelector("textarea");
      ti.value = s.t; sb.value = s.s; ti.setAttribute("aria-label", T.slide + " " + (i + 1) + " — " + T.title); sb.setAttribute("aria-label", T.slide + " " + (i + 1) + " — " + T.sub);
      ti.addEventListener("input", function () { s.t = ti.value; save(); seek(i); }); sb.addEventListener("input", function () { s.s = sb.value; save(); seek(i); });
      row.querySelectorAll("[data-a]").forEach(function (b) {
        b.setAttribute("aria-label", T[b.getAttribute("data-a")] + " — " + T.slide + " " + (i + 1));
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-a");
          if (a === "del" && st.slides.length > 1) st.slides.splice(i, 1);
          if (a === "up" && i > 0) st.slides.splice(i - 1, 0, st.slides.splice(i, 1)[0]);
          if (a === "down" && i < st.slides.length - 1) st.slides.splice(i + 1, 0, st.slides.splice(i, 1)[0]);
          save(); editor(); restart();
        });
      });
      box.appendChild(row);
    });
    $("gsAdd").disabled = st.slides.length >= 10;
  }
  var t0 = performance.now(), playing = true, exporting = false;
  function restart() { t0 = performance.now(); }
  function seek(i) { t0 = performance.now() - (i * st.per + st.per * .5) * 1000; }
  function loop(now) { if (playing && !exporting) { var t = ((now - t0) / 1000) % (dur() + .6); render(Math.min(t, dur())); $("gsScrub").value = Math.min(t, dur()) / dur() * 1000; } requestAnimationFrame(loop); }
  function sync() {
    document.querySelectorAll("#gsThemes [data-th]").forEach(function (b) { var on = b.getAttribute("data-th") === st.theme && !st.photo; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    document.querySelectorAll("#gsRatio .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-r") === st.ratio); });
    document.querySelectorAll("#gsFps .chip").forEach(function (b) { b.classList.toggle("active", +b.getAttribute("data-f") === st.fps); });
    $("gsPer").value = st.per; $("gsPerV").textContent = st.per + "s"; $("gsAlign").value = st.align; $("gsPhotoClear").hidden = !st.photo;
  }
  $("gsAdd").addEventListener("click", function () { st.slides.push({ t: AR ? "سلايد جديد" : "New slide", s: "" }); save(); editor(); seek(st.slides.length - 1); });
  document.querySelectorAll("#gsThemes [data-th]").forEach(function (b) {
    var pal = QT_GS_THEMES[b.getAttribute("data-th")]; b.style.background = "linear-gradient(135deg," + pal[1] + "," + pal[2] + " 55%," + pal[3] + ")";
    b.addEventListener("click", function () { st.theme = b.getAttribute("data-th"); st.photo = null; save(); sync(); });
  });
  document.querySelectorAll("#gsRatio .chip").forEach(function (b) { b.addEventListener("click", function () { st.ratio = b.getAttribute("data-r"); size(); save(); sync(); restart(); }); });
  document.querySelectorAll("#gsFps .chip").forEach(function (b) { b.addEventListener("click", function () { st.fps = +b.getAttribute("data-f"); save(); sync(); }); });
  $("gsPer").addEventListener("input", function () { st.per = +this.value; $("gsPerV").textContent = st.per + "s"; save(); restart(); });
  $("gsAlign").addEventListener("change", function () { st.align = this.value; save(); });
  $("gsPhoto").addEventListener("change", function () {
    var f = this.files[0]; this.value = ""; if (!f || !/^image\//.test(f.type)) return;
    createImageBitmap(f).then(function (bmp) { st.photo = bmp; sync(); });
  });
  $("gsPhotoClear").addEventListener("click", function () { st.photo = null; sync(); });
  $("gsPlay").addEventListener("click", function () { playing = !playing; this.textContent = playing ? "❚❚" : "▶"; if (playing) t0 = performance.now() - $("gsScrub").value / 1000 * dur() * 1000; });
  $("gsScrub").addEventListener("input", function () { playing = false; $("gsPlay").textContent = "▶"; render(this.value / 1000 * dur()); });
  function download(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }
  async function mp4() {
    var W = cv.width, H = cv.height, fps = st.fps, D = dur(), frames = Math.round(D * fps), cfg = null;
    for (var c of ["avc1.640033", "avc1.640028", "avc1.4d0028", "avc1.42003e"]) { var o = { codec: c, width: W, height: H, bitrate: fps > 30 ? 12e6 : 8e6, framerate: fps }; try { if ((await VideoEncoder.isConfigSupported(o)).supported) { cfg = o; break; } } catch (e) {} }
    if (!cfg) throw new Error("no-h264");
    var mux = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H, frameRate: fps }, fastStart: "in-memory" }), err = null;
    var enc = new VideoEncoder({ output: function (ch, meta) { mux.addVideoChunk(ch, meta); }, error: function (e) { err = e; } }); enc.configure(cfg);
    for (var f = 0; f < frames; f++) {
      render(f / fps);
      var vf = new VideoFrame(cv, { timestamp: Math.round(f * 1e6 / fps), duration: Math.round(1e6 / fps) }); enc.encode(vf, { keyFrame: f % (fps * 2) === 0 }); vf.close();
      if (enc.encodeQueueSize > 8 || f % 10 === 0) { $("gsBarFill").style.width = Math.round(f / frames * 100) + "%"; await new Promise(function (r) { setTimeout(r, 0); }); }
      if (err) throw err;
    }
    await enc.flush(); mux.finalize(); return new Blob([mux.target.buffer], { type: "video/mp4" });
  }
  function webm() {
    return new Promise(function (res, rej) {
      var rec = new MediaRecorder(cv.captureStream(st.fps), { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm", videoBitsPerSecond: 10e6 }), ch = [];
      rec.ondataavailable = function (e) { if (e.data.size) ch.push(e.data); }; rec.onstop = function () { res(new Blob(ch, { type: "video/webm" })); }; rec.onerror = rej;
      var s0 = performance.now(); rec.start();
      (function step() { var t = (performance.now() - s0) / 1000; render(Math.min(t, dur())); if (t < dur() + .2) requestAnimationFrame(step); else rec.stop(); })();
    });
  }
  $("gsExport").addEventListener("click", async function () {
    if (exporting) return; exporting = true; this.disabled = true; $("gsBar").hidden = false; $("gsStatus").textContent = T.wait;
    try { var blob = null, ext = "mp4";
      if (typeof VideoEncoder !== "undefined" && typeof Mp4Muxer !== "undefined") { try { blob = await mp4(); } catch (e) { if (String(e.message) !== "no-h264") throw e; } }
      if (!blob) { $("gsStatus").textContent = T.webm; blob = await webm(); ext = "webm"; }
      download(blob, "glass-slides-" + st.ratio.replace(":", "x") + "-" + st.fps + "fps." + ext); $("gsStatus").textContent = T.done;
      if (typeof qtEvent === "function") qtEvent("glass_export");
    } catch (e) { $("gsStatus").textContent = T.fail + (e && e.message || e); }
    exporting = false; this.disabled = false; $("gsBar").hidden = true; restart();
  });
  size(); editor(); sync();
  var ready = document.fonts && document.fonts.load ? Promise.all(['700 40px Sora', '500 40px Sora', '700 40px "QT Arabic"', '500 40px "QT Arabic"'].map(function (f) { return document.fonts.load(f, "Ab ابج").catch(function () {}); })) : Promise.resolve();
  ready.then(function () { restart(); requestAnimationFrame(loop); });
})();
if (typeof module !== "undefined") module.exports = { qtGsSpring: qtGsSpring, qtGsTimeline: qtGsTimeline, QT_GS_THEMES: QT_GS_THEMES };
