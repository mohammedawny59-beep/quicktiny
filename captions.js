// QuickTiny Animated Captions — word-by-word subtitles in the popular short-video style, from plain text (auto timing)
// or an .srt file (keeps your timings, e.g. exported from CapCut). Arabic + English. Green/blue-screen MP4 export via
// WebCodecs + vendor/mp4-muxer.js (WebM fallback). Every frame is a pure function of time.

/* ---------- timing ---------- */
// Parse SRT into [{start, end, text}] (seconds).
function qtCapParseSrt(src) {
  var out = [], blocks = String(src || "").replace(/\r/g, "").split(/\n\s*\n/);
  var ts = function (s) { var m = /(\d+):(\d+):(\d+)[,.](\d+)/.exec(s); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +("0." + m[4]) : NaN; };
  blocks.forEach(function (b) {
    var lines = b.trim().split("\n"), i = lines.findIndex(function (l) { return /-->/.test(l); });
    if (i < 0) return; var p = lines[i].split("-->"), text = lines.slice(i + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    var a = ts(p[0]), z = ts(p[1]); if (isFinite(a) && isFinite(z) && z > a && text) out.push({ start: a, end: z, text: text });
  });
  return out;
}
// Words with times. From SRT cues: spread each cue's time over its words by length. From plain text: wpm pace.
function qtCapWords(cues) {
  var words = [];
  cues.forEach(function (c, ci) {
    var ws = c.text.split(/\s+/).filter(Boolean), w8 = ws.map(function (w) { return 1 + w.length * .35; }), tot = w8.reduce(function (a, b) { return a + b; }, 0), t = c.start;
    ws.forEach(function (w, i) { var d = (c.end - c.start) * w8[i] / tot; words.push({ w: w, start: t, end: t + d, c: ci }); t += d; });
  });
  return words;
}
function qtCapFromText(text, wpm) {
  var cues = [], t = .3, per = 60 / Math.max(60, wpm || 160);
  String(text || "").split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean).forEach(function (line) {
    var n = line.split(/\s+/).length, d = n * per * 1.05; cues.push({ start: t, end: t + d, text: line }); t += d + per * .6;
  });
  return cues;
}
// Group words into on-screen pages of up to `max` words, never across a cue gap > 0.6 s.
function qtCapPages(words, max) {
  var pages = [], cur = [];
  words.forEach(function (w, i) {
    var prev = words[i - 1];
    if (cur.length >= max || (cur.length && prev && (w.c !== prev.c || w.start - prev.end > .6)) || (cur.length && /[.!?؟،,]$/.test(prev.w) && cur.length >= Math.ceil(max / 2))) { pages.push(cur); cur = []; }
    cur.push(w);
  });
  if (cur.length) pages.push(cur);
  return pages.map(function (p) { return { words: p, start: p[0].start, end: p[p.length - 1].end }; });
}

/* ---------- rendering ---------- */
var QT_CAP_F = { bold: '"QT Lalezar", "Arial Black", Impact, sans-serif', sans: 'Sora, "QT Arabic", "Segoe UI", Arial, sans-serif' };
// Text colour that reads on top of the highlight box: dark ink on bright colours, white on dark ones.
function qtCapInk(hex) { var m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return "#ffffff"; var n = parseInt(m[1], 16), l = .2126 * (n >> 16 & 255) + .7152 * (n >> 8 & 255) + .0722 * (n & 255); return l > 150 ? "#111111" : "#ffffff"; }
function qtCapClamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function qtCapBack(k) { k = qtCapClamp(k); var c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }
function qtCapRender(x, W, H, t, s, pages, preview) {
  x.setTransform(1, 0, 0, 1, 0, 0);
  if (s.bg === "none") { /* caller already drew the video frame underneath */ }
  else if (preview && s.bg === "photo") { var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#41507a"); g.addColorStop(1, "#151a2c"); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  else { x.fillStyle = { green: "#00ff00", blue: "#0047ff", black: "#000000" }[s.bg] || "#00ff00"; x.fillRect(0, 0, W, H); }
  var page = null; for (var i = 0; i < pages.length; i++) if (t >= pages[i].start - .05 && t < pages[i].end + .15) { page = pages[i]; break; }
  if (!page) return;
  var ar = /[؀-ۿ]/.test(page.words.map(function (w) { return w.w; }).join(" "));
  var u = Math.min(W, H) / 1080, fs = s.size * u, font = (s.font === "sans" ? "800 " : "400 ") + fs + "px " + QT_CAP_F[s.font === "sans" ? "sans" : "bold"];
  x.font = font; x.direction = ar ? "rtl" : "ltr"; x.textBaseline = "middle"; x.textAlign = "center"; x.lineJoin = "round";
  var txt = function (w) { return s.upper && !ar ? w.toUpperCase() : w; };
  // lay the page out in up to two lines
  var gap = fs * .38, maxW = W * .86, lines = [[]], lw = 0;
  page.words.forEach(function (w) { var ww = x.measureText(txt(w.w)).width; if (lines[lines.length - 1].length && lw + gap + ww > maxW) { lines.push([]); lw = 0; } lines[lines.length - 1].push({ w: w, width: ww }); lw += (lw ? gap : 0) + ww; });
  var lh = fs * 1.25, cy = (s.pos === "middle" ? H * .5 : s.pos === "top" ? H * .22 : H * .74) - (lines.length - 1) * lh / 2;
  var pin = qtCapBack((t - page.start) / .22);
  lines.forEach(function (line, li) {
    var tw = line.reduce(function (a, it) { return a + it.width; }, 0) + gap * (line.length - 1), xx = ar ? W / 2 + tw / 2 : W / 2 - tw / 2, y = cy + li * lh;
    line.forEach(function (it) {
      var w = it.w, cx = ar ? xx - it.width / 2 : xx + it.width / 2; xx += (ar ? -1 : 1) * (it.width + gap);
      var active = t >= w.start && t < w.end + .02, done = t >= w.end, k = qtCapClamp((t - w.start) / .14);
      var sc = 1, col = "#ffffff", show = true, boxA = 0;
      if (s.style === "pop") { sc = active ? 1 + .1 * qtCapBack(k) : 1; col = active ? s.accent : "#ffffff"; }
      else if (s.style === "box") { boxA = active ? qtCapClamp(k * 2) : 0; col = boxA > .5 ? qtCapInk(s.accent) : "#ffffff"; sc = active ? 1.04 : 1; }
      else if (s.style === "karaoke") { col = done || active ? s.accent : "rgba(255,255,255,.95)"; }
      else if (s.style === "bounce") { show = t >= w.start - .02; sc = show ? qtCapBack(k) : 0; col = active ? s.accent : "#ffffff"; }
      if (!show || sc <= 0) return;
      x.save(); x.translate(cx, y); x.scale(sc * (s.style === "bounce" ? 1 : pin), sc * (s.style === "bounce" ? 1 : pin));
      if (boxA > 0) { x.globalAlpha = boxA; x.fillStyle = s.accent; var pw = it.width + fs * .34, ph = fs * 1.12, r = fs * .2;
        x.beginPath(); x.moveTo(-pw / 2 + r, -ph / 2); x.arcTo(pw / 2, -ph / 2, pw / 2, ph / 2, r); x.arcTo(pw / 2, ph / 2, -pw / 2, ph / 2, r); x.arcTo(-pw / 2, ph / 2, -pw / 2, -ph / 2, r); x.arcTo(-pw / 2, -ph / 2, pw / 2, -ph / 2, r); x.fill(); x.globalAlpha = 1; }
      x.font = font; x.lineWidth = fs * .16; x.strokeStyle = "rgba(0,0,0,.9)"; x.shadowColor = "rgba(0,0,0,.55)"; x.shadowBlur = fs * .18; x.shadowOffsetY = fs * .06;
      if (s.outline && !(boxA > .5)) x.strokeText(txt(w.w), 0, fs * .03);
      x.shadowColor = "transparent"; x.fillStyle = col; x.fillText(txt(w.w), 0, fs * .03);
      x.restore();
    });
  });
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("capCanvas")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? { done: "✓ تم تنزيل الفيديو", wait: "جارٍ تجهيز الفيديو…", webm: "سننزّل WebM لأن متصفحك لا يدعم MP4 هنا.", fail: "تعذّر إنشاء الفيديو: ", srtOk: "✓ تم تحميل ملف الترجمة: ", srtBad: "الملف لا يحتوي ترجمة صالحة (SRT).", words: "كلمة", sec: "ث" }
             : { done: "✓ Video downloaded", wait: "Rendering video…", webm: "Downloading WebM (this browser can't encode MP4 here).", fail: "Couldn't create the video: ", srtOk: "✓ Subtitles loaded: ", srtBad: "That file has no valid SRT subtitles.", words: "words", sec: "s" };
  var SAMPLE = AR ? "هذه ترجمة متحركة لفيديوهاتك\nكل كلمة تظهر في وقتها بالضبط\nجرّبها مجانًا على كويك تايني" : "These are animated captions for your videos\nEvery word lights up right on time\nTry it free on QuickTiny";
  var KEY = AR ? "qtCaptionsAr" : "qtCaptions";
  var SIZES = { "9:16": [1080, 1920], "16:9": [1920, 1080], "1:1": [1080, 1080] };
  var st = { text: SAMPLE, srt: null, wpm: 150, per: 3, style: "pop", accent: "#ffd400", font: "bold", size: 112, pos: "bottom", bg: "photo", ratio: "9:16", upper: false, outline: true };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || "null"); if (sv) ["text", "wpm", "per", "style", "accent", "font", "size", "pos", "ratio", "upper", "outline"].forEach(function (k) { if (sv[k] != null) st[k] = sv[k]; }); } catch (e) {}
  if (window.qtBrand) qtBrand.apply(st, { accent: "accent", font: "font" });
  var cv = $("capCanvas"), ctx = cv.getContext("2d"), pages = [], D = 1, t0 = performance.now(), playing = true, exporting = false;
  function save() { try { var o = {}; ["text", "wpm", "per", "style", "accent", "font", "size", "pos", "ratio", "upper", "outline"].forEach(function (k) { o[k] = st[k]; }); localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function build() {
    var cues = st.srt || qtCapFromText(st.text, st.wpm), words = qtCapWords(cues);
    pages = qtCapPages(words, st.per); D = words.length ? words[words.length - 1].end + .6 : 1;
    $("capInfo").textContent = words.length + " " + T.words + " · " + D.toFixed(1) + T.sec;
  }
  function size() { var z = SIZES[st.ratio]; cv.width = z[0]; cv.height = z[1]; cv.parentNode.style.aspectRatio = z[0] + " / " + z[1]; }
  function sync() {
    document.querySelectorAll("#capStyles [data-s]").forEach(function (b) { var on = b.getAttribute("data-s") === st.style; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    [["#capRatio", "data-r", "ratio"], ["#capBg", "data-b", "bg"], ["#capPos", "data-p", "pos"]].forEach(function (g) { document.querySelectorAll(g[0] + " .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute(g[1]) === st[g[2]]); }); });
    $("capText").value = st.text; $("capWpm").value = st.wpm; $("capWpmV").textContent = st.wpm; $("capPer").value = st.per; $("capAccent").value = st.accent; $("capFont").value = st.font;
    $("capSize").value = st.size; $("capUpper").checked = st.upper; $("capOutline").checked = st.outline; $("capWpmRow").hidden = !!st.srt; $("capSrtClear").hidden = !st.srt; $("capText").disabled = !!st.srt;
  }
  function restart() { t0 = performance.now(); }
  function loop(now) { if (playing && !exporting) { var t = ((now - t0) / 1000) % (D + .5); qtCapRender(ctx, cv.width, cv.height, Math.min(t, D), st, pages, true); $("capScrub").value = Math.min(t, D) / D * 1000; } requestAnimationFrame(loop); }
  function on(id, ev, fn) { $(id).addEventListener(ev, fn); }
  on("capText", "input", function () { st.text = this.value.slice(0, 3000); build(); save(); restart(); });
  on("capWpm", "input", function () { st.wpm = +this.value; $("capWpmV").textContent = st.wpm; build(); save(); });
  on("capPer", "change", function () { st.per = +this.value; build(); save(); });
  on("capAccent", "input", function () { st.accent = this.value; save(); });
  on("capFont", "change", function () { st.font = this.value; save(); });
  on("capSize", "input", function () { st.size = +this.value; save(); });
  on("capUpper", "change", function () { st.upper = this.checked; save(); });
  on("capOutline", "change", function () { st.outline = this.checked; save(); });
  document.querySelectorAll("#capStyles [data-s]").forEach(function (b) { b.addEventListener("click", function () { st.style = b.getAttribute("data-s"); save(); sync(); restart(); }); });
  [["#capRatio", "data-r", "ratio"], ["#capBg", "data-b", "bg"], ["#capPos", "data-p", "pos"]].forEach(function (g) { document.querySelectorAll(g[0] + " .chip").forEach(function (b) { b.addEventListener("click", function () { st[g[2]] = b.getAttribute(g[1]); if (g[2] === "ratio") size(); save(); sync(); }); }); });
  on("capSrt", "change", function () {
    var f = this.files[0]; this.value = ""; if (!f) return;
    f.text().then(function (txt) { var cues = qtCapParseSrt(txt); if (!cues.length) { $("capStatus").textContent = T.srtBad; return; } st.srt = cues; $("capStatus").textContent = T.srtOk + f.name; build(); sync(); restart(); });
  });
  on("capSrtClear", "click", function () { st.srt = null; $("capStatus").textContent = ""; build(); sync(); restart(); });
  on("capPlay", "click", function () { playing = !playing; this.textContent = playing ? "❚❚" : "▶"; if (playing) t0 = performance.now() - $("capScrub").value / 1000 * D * 1000; });
  on("capScrub", "input", function () { playing = false; $("capPlay").textContent = "▶"; qtCapRender(ctx, cv.width, cv.height, this.value / 1000 * D, st, pages, true); });
  function download(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }
  async function mp4() {
    var W = cv.width, H = cv.height, fps = 30, frames = Math.round(D * fps), cfg = null;
    for (var c of ["avc1.640028", "avc1.4d0028", "avc1.42003e"]) { var o = { codec: c, width: W, height: H, bitrate: 6e6, framerate: fps }; try { if ((await VideoEncoder.isConfigSupported(o)).supported) { cfg = o; break; } } catch (e) {} }
    if (!cfg) throw new Error("no-h264");
    var mux = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" }), err = null;
    var enc = new VideoEncoder({ output: function (ch, meta) { mux.addVideoChunk(ch, meta); }, error: function (e) { err = e; } }); enc.configure(cfg);
    for (var f = 0; f < frames; f++) {
      qtCapRender(ctx, W, H, f / fps, st, pages, false);
      var vf = new VideoFrame(cv, { timestamp: Math.round(f * 1e6 / fps), duration: Math.round(1e6 / fps) }); enc.encode(vf, { keyFrame: f % 60 === 0 }); vf.close();
      if (enc.encodeQueueSize > 8 || f % 15 === 0) { $("capBarFill").style.width = Math.round(f / frames * 100) + "%"; await new Promise(function (r) { setTimeout(r, 0); }); }
      if (err) throw err;
    }
    await enc.flush(); mux.finalize(); return new Blob([mux.target.buffer], { type: "video/mp4" });
  }
  function webm() {
    return new Promise(function (res, rej) {
      var rec = new MediaRecorder(cv.captureStream(30), { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm", videoBitsPerSecond: 6e6 }), ch = [];
      rec.ondataavailable = function (e) { if (e.data.size) ch.push(e.data); }; rec.onstop = function () { res(new Blob(ch, { type: "video/webm" })); }; rec.onerror = rej;
      var s0 = performance.now(); rec.start();
      (function step() { var t = (performance.now() - s0) / 1000; qtCapRender(ctx, cv.width, cv.height, Math.min(t, D), st, pages, false); if (t < D) requestAnimationFrame(step); else rec.stop(); })();
    });
  }
  on("capExport", "click", async function () {
    if (exporting) return; exporting = true; this.disabled = true; $("capBar").hidden = false; $("capStatus").textContent = T.wait;
    try { var blob = null, ext = "mp4";
      if (typeof VideoEncoder !== "undefined" && typeof Mp4Muxer !== "undefined") { try { blob = await mp4(); } catch (e) { if (String(e.message) !== "no-h264") throw e; } }
      if (!blob) { $("capStatus").textContent = T.webm; blob = await webm(); ext = "webm"; }
      download(blob, "captions-" + st.style + "-" + (st.bg === "photo" ? "green" : st.bg) + "-" + st.ratio.replace(":", "x") + "." + ext); $("capStatus").textContent = T.done;
      if (typeof qtEvent === "function") qtEvent("captions_export");
    } catch (e) { $("capStatus").textContent = T.fail + (e && e.message || e); }
    exporting = false; this.disabled = false; $("capBar").hidden = true; restart();
    if (!playing) qtCapRender(ctx, cv.width, cv.height, $("capScrub").value / 1000 * D, st, pages, true);
  });
  size(); build(); sync();
  var ready = document.fonts && document.fonts.load ? Promise.all(['400 40px "QT Lalezar"', '800 40px Sora', '700 40px "QT Arabic"'].map(function (f) { return document.fonts.load(f, "Ab ابج").catch(function () {}); })) : Promise.resolve();
  ready.then(function () { restart(); requestAnimationFrame(loop); });
})();
if (typeof module !== "undefined") module.exports = { qtCapInk: qtCapInk, qtCapParseSrt: qtCapParseSrt, qtCapWords: qtCapWords, qtCapFromText: qtCapFromText, qtCapPages: qtCapPages };
