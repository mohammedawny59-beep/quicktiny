// QuickTiny Auto Subtitles: speech-to-text with Whisper on the device (asr-worker.js), editable transcript,
// animated word-by-word captions (captions.js engine) burned into the video with its original sound — or an .srt file.
// Video and audio never leave the device.

/* ---------- pure helpers (tested in tests/subtitles.test.js) ---------- */
// Group timed words into subtitle cues: up to `max` words, split on pauses > .7 s and after sentence punctuation.
function qtSbCues(words, max) {
  var cues = [], cur = [];
  (words || []).forEach(function (w, i) {
    var prev = words[i - 1];
    if (cur.length && (cur.length >= max || w.start - prev.end > .7 || /[.!?؟]$/.test(prev.w))) { cues.push(cur); cur = []; }
    cur.push(w);
  });
  if (cur.length) cues.push(cur);
  return cues.map(function (c) { return { start: c[0].start, end: c[c.length - 1].end, text: c.map(function (w) { return w.w; }).join(" "), words: c }; });
}
function qtSbFmt(t) {
  t = Math.max(0, t); var ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, r = ms % 1000;
  var p = function (n, k) { n = String(n); while (n.length < k) n = "0" + n; return n; };
  return p(h, 2) + ":" + p(m, 2) + ":" + p(s, 2) + "," + p(r, 3);
}
function qtSbSrt(cues) {
  return cues.filter(function (c) { return c.text.trim(); }).map(function (c, i) { return (i + 1) + "\n" + qtSbFmt(c.start) + " --> " + qtSbFmt(Math.max(c.end, c.start + .3)) + "\n" + c.text.trim() + "\n"; }).join("\n");
}
// Words for a cue whose text the user edited: keep the original word timings when the word count is unchanged,
// otherwise spread the new words over the cue's time span.
function qtSbRetime(cue, text) {
  var ws = String(text || "").split(/\s+/).filter(Boolean);
  if (cue.words && ws.length === cue.words.length) return ws.map(function (w, i) { return { w: w, start: cue.words[i].start, end: cue.words[i].end }; });
  if (!ws.length) return [];
  return typeof qtCapWords === "function" ? qtCapWords([{ start: cue.start, end: cue.end, text: ws.join(" ") }]) : [];
}
// Fit the output inside 1920 px on the long side, even dimensions (H.264 needs them).
function qtSbFit(w, h, maxSide) {
  var k = Math.min(1, (maxSide || 1920) / Math.max(w, h)), W = Math.round(w * k / 2) * 2, H = Math.round(h * k / 2) * 2;
  return [Math.max(2, W), Math.max(2, H)];
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("sbFile")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? {
      pick: "اختر فيديو أو اسحبه هنا", tooLong: "الفيديو أطول من 20 دقيقة. قصّه أولًا ثم جرّب.", noAudio: "تعذّر قراءة الصوت من هذا الفيديو. جرّب ملف MP4 أو MOV.",
      reading: "جارٍ قراءة الصوت…", model: "تنزيل نموذج التعرّف على الكلام (مرة واحدة فقط)…", run: "جارٍ تحويل الكلام إلى نص… (قد يستغرق دقيقة أو أكثر)", done: "✓ جاهز! راجع النص وعدّل أي كلمة ثم نزّل الفيديو.",
      fail: "تعذّر التحويل: ", empty: "لم نسمع كلامًا واضحًا في هذا الفيديو.", exp: "جارٍ تجهيز الفيديو مع الترجمة… أبقِ هذه الصفحة مفتوحة.", expDone: "✓ تم تنزيل الفيديو", expFail: "تعذّر إنشاء الفيديو: ",
      noAudioOut: "متصفحك لا يدعم ترميز الصوت هنا — سيكون الفيديو بدون صوت. جرّب كروم أو إيدج.", words: "كلمة", sec: "ث", noEnc: "متصفحك لا يدعم تصدير الفيديو هنا. نزّل ملف SRT أو جرّب كروم أو إيدج." }
    : {
      pick: "Choose a video or drop it here", tooLong: "This video is longer than 20 minutes. Trim it first, then try again.", noAudio: "Couldn't read the audio in this video. Try an MP4 or MOV file.",
      reading: "Reading the audio…", model: "Downloading the speech model (one time only)…", run: "Turning speech into text… (this can take a minute or more)", done: "✓ Done! Check the text, fix any word, then download your video.",
      fail: "Couldn't transcribe: ", empty: "We couldn't hear clear speech in this video.", exp: "Rendering your video with captions… keep this page open.", expDone: "✓ Video downloaded", expFail: "Couldn't create the video: ",
      noAudioOut: "This browser can't encode audio here — the video will be silent. Try Chrome or Edge.", words: "words", sec: "s", noEnc: "This browser can't export video here. Download the .srt instead, or try Chrome or Edge." };
  var st = { style: "pop", accent: "#ffd400", font: "bold", size: 96, pos: "bottom", per: 3, upper: false, outline: true, bg: "none", lang: AR ? "arabic" : "english", model: "base" };
  try { var sv = JSON.parse(localStorage.getItem("qtSubtitles") || "null"); if (sv) ["style", "accent", "font", "size", "pos", "per", "upper", "outline", "model"].forEach(function (k) { if (sv[k] != null) st[k] = sv[k]; }); } catch (e) {}
  if (window.qtBrand) window.qtBrand.apply(st, { accent: "accent", font: "font" });
  function save() { try { var o = {}; ["style", "accent", "font", "size", "pos", "per", "upper", "outline", "model"].forEach(function (k) { o[k] = st[k]; }); localStorage.setItem("qtSubtitles", JSON.stringify(o)); } catch (e) {} }

  var file = null, url = null, cues = [], pages = [], busy = false, worker = null;
  var vid = $("sbVideo"), ov = $("sbOverlay"), ox = ov.getContext("2d");
  function status(msg, bar) { $("sbStatus").textContent = msg || ""; if (bar != null) { $("sbBar").hidden = false; $("sbBarFill").style.width = Math.round(bar * 100) + "%"; } }
  function rebuild() {
    var words = []; cues.forEach(function (c) { words = words.concat(c.words); });
    pages = qtCapPages(words, st.per);
    $("sbInfo").textContent = words.length + " " + T.words;
    draw();
  }
  function draw() {
    if (!vid.videoWidth) return;
    ox.setTransform(1, 0, 0, 1, 0, 0); ox.clearRect(0, 0, ov.width, ov.height);
    qtCapRender(ox, ov.width, ov.height, vid.currentTime, st, pages, false);
  }
  (function tick() { if (!vid.paused) draw(); requestAnimationFrame(tick); })();
  vid.addEventListener("seeked", draw); vid.addEventListener("pause", draw);
  vid.addEventListener("loadedmetadata", function () {
    var f = qtSbFit(vid.videoWidth, vid.videoHeight, 1280); ov.width = f[0]; ov.height = f[1];
    $("sbScreen").style.aspectRatio = vid.videoWidth + " / " + vid.videoHeight; draw();
  });

  // ---- editor ----
  function editor() {
    var box = $("sbCues"); box.innerHTML = "";
    cues.forEach(function (c, i) {
      var row = document.createElement("div"); row.className = "sb-cue";
      var tm = document.createElement("button"); tm.type = "button"; tm.className = "sb-tm"; tm.textContent = qtSbFmt(c.start).slice(3, 8); tm.setAttribute("aria-label", "▶ " + qtSbFmt(c.start).slice(3, 8));
      tm.addEventListener("click", function () { vid.currentTime = c.start + .01; vid.play().catch(function () {}); });
      var inp = document.createElement("input"); inp.type = "text"; inp.dir = "auto"; inp.value = c.text; inp.setAttribute("aria-label", qtSbFmt(c.start));
      inp.addEventListener("input", function () { c.text = inp.value; c.words = qtSbRetime(c, inp.value); rebuild(); });
      inp.addEventListener("focus", function () { vid.currentTime = c.start + .01; });
      row.appendChild(tm); row.appendChild(inp); box.appendChild(row);
    });
    ["sbFrom", "sbTo"].forEach(function (id, k) { var sel = $(id); sel.innerHTML = ""; cues.forEach(function (c, i) { var o = document.createElement("option"); o.value = i; o.textContent = qtSbFmt(c.start).slice(3, 8) + " · " + c.text.slice(0, 28); sel.appendChild(o); }); sel.value = k ? cues.length - 1 : 0; });
    $("sbClipRow").hidden = cues.length < 2; clipInfo();
    $("sbEdit").hidden = !cues.length; $("sbOut").hidden = !cues.length;
  }

  // ---- input ----
  function load(f) {
    if (!f || busy) return;
    file = f; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f);
    vid.src = url; $("sbStage").hidden = false; $("sbGo").disabled = false; cues = []; pages = []; editor(); status("");
    $("sbName").textContent = f.name;
  }
  $("sbFile").addEventListener("change", function () { load(this.files[0]); this.value = ""; });
  var drop = $("sbDrop");
  ["dragenter", "dragover"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (ev) { var f = ev.dataTransfer.files[0]; if (f) load(f); });

  async function decode(rate, channels) {
    var buf = await file.arrayBuffer();
    var ctx = new OfflineAudioContext(channels, 1, rate);
    return await ctx.decodeAudioData(buf);
  }
  $("sbGo").addEventListener("click", async function () {
    if (!file || busy) return; busy = true; this.disabled = true;
    try {
      status(T.reading, 0);
      var ab; try { ab = await decode(16000, 1); } catch (e) { throw new Error(T.noAudio); }
      if (ab.duration > 20 * 60 + 1) throw new Error(T.tooLong);
      var mono = new Float32Array(ab.length); for (var c = 0; c < ab.numberOfChannels; c++) { var d = ab.getChannelData(c); for (var i = 0; i < d.length; i++) mono[i] += d[i] / ab.numberOfChannels; }
      if (!worker) worker = new Worker("/asr-worker.js");
      var t0 = performance.now(), sizes = {};
      var res = await new Promise(function (resolve, reject) {
        worker.onmessage = function (ev) {
          var m = ev.data;
          if (m.type === "progress" && m.total) { sizes[m.file] = [m.loaded, m.total]; var L = 0, Tt = 0; for (var k in sizes) { L += sizes[k][0]; Tt += sizes[k][1]; } status(T.model + " " + Math.round(L / 1048576) + " / " + Math.round(Tt / 1048576) + " MB", L / Tt * .5); }
          else if (m.type === "status" && m.stage === "run") { t0 = performance.now(); status(T.run, .5); }
          else if (m.type === "done") resolve(m);
          else if (m.type === "error") reject(new Error(m.message));
        };
        worker.onerror = function (e) { reject(new Error(e.message || "worker")); };
        worker.postMessage({ type: "run", audio: mono, model: st.model, language: $("sbLang").value || null }, [mono.buffer]);
      });
      if (!res.words.length) throw new Error(T.empty);
      cues = qtSbCues(res.words, 7); editor(); rebuild();
      status(T.done, 1); $("sbBar").hidden = true;
      if (typeof qtEvent === "function") qtEvent("subtitles_transcribed");
      vid.currentTime = 0;
    } catch (e) { status((e && e.message && /^(Couldn|تعذّر|This video|الفيديو)/.test(e.message) ? "" : T.fail) + (e && e.message || e)); $("sbBar").hidden = true; }
    busy = false; this.disabled = false;
  });
  $("sbModel").value = st.model; $("sbModel").addEventListener("change", function () { st.model = this.value; save(); });
  $("sbLang").value = st.lang;

  // ---- look ----
  function sync() {
    document.querySelectorAll("#sbStyles [data-s]").forEach(function (b) { var on = b.getAttribute("data-s") === st.style; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    document.querySelectorAll("#sbPos .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-p") === st.pos); });
    $("sbPer").value = st.per; $("sbAccent").value = st.accent; $("sbFont").value = st.font; $("sbSize").value = st.size; $("sbUpper").checked = st.upper; $("sbOutline").checked = st.outline;
  }
  document.querySelectorAll("#sbStyles [data-s]").forEach(function (b) { b.addEventListener("click", function () { st.style = b.getAttribute("data-s"); save(); sync(); draw(); }); });
  document.querySelectorAll("#sbPos .chip").forEach(function (b) { b.addEventListener("click", function () { st.pos = b.getAttribute("data-p"); save(); sync(); draw(); }); });
  [["sbPer", "per", "change", Number], ["sbAccent", "accent", "input", String], ["sbFont", "font", "change", String], ["sbSize", "size", "input", Number]].forEach(function (c) {
    $(c[0]).addEventListener(c[2], function () { st[c[1]] = c[3](this.value); save(); if (c[1] === "per") rebuild(); else draw(); });
  });
  $("sbUpper").addEventListener("change", function () { st.upper = this.checked; save(); draw(); });
  $("sbOutline").addEventListener("change", function () { st.outline = this.checked; save(); draw(); });

  // ---- outputs ----
  function download(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 8000); }
  var base = function () { return (file && file.name || "video").replace(/\.[^.]+$/, "").slice(0, 60) + "-subtitled"; };
  $("sbSrt").addEventListener("click", function () { var rg = range(), cs = rg.whole ? cues : rg.cues.map(function (c) { return { start: c.start - rg.a, end: c.end - rg.a, text: c.text }; }); download(new Blob(["﻿" + qtSbSrt(cs)], { type: "application/x-subrip" }), base() + (rg.whole ? "" : "-clip") + ".srt"); });

  // Clip range: from line / to line (whole video by default). Returns the source segment and the cues inside it.
  function range() {
    var i = +($("sbFrom").value || 0), j = +($("sbTo").value || cues.length - 1); if (j < i) { var k = i; i = j; j = k; }
    var whole = i === 0 && j === cues.length - 1;
    var a = whole ? 0 : Math.max(0, cues[i].start - .15), b = whole ? vid.duration : Math.min(vid.duration, cues[j].end + .35);
    return { a: a, b: b, whole: whole, cues: cues.slice(i, j + 1) };
  }
  async function exportWebCodecs() {
    var f = qtSbFit(vid.videoWidth, vid.videoHeight, 1920), rg = range();
    var r = await qtVxExport({ file: file, video: vid, W: f[0], H: f[1], fps: 30, segs: [[rg.a, rg.b]],
      draw: function (x, srcT, outT, W, H) { x.drawImage(vid, 0, 0, W, H); qtCapRender(x, W, H, srcT, st, pages, false); },
      onProgress: function (p) { status(T.exp + " " + Math.round(p * 100) + "%", p); } });
    if (!r) return null;
    if (!r.audio) status(T.noAudioOut);
    return r.blob;
  }
  // Fallback for browsers without WebCodecs (e.g. older Safari): record the canvas + the video's own sound in real time.
  function exportRecorder() {
    return new Promise(function (resolve, reject) {
      if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) return reject(new Error(T.noEnc));
      var f = qtSbFit(vid.videoWidth, vid.videoHeight, 1280), cv = document.createElement("canvas"); cv.width = f[0]; cv.height = f[1]; var x = cv.getContext("2d");
      var stream = cv.captureStream(30);
      try { var ac = new AudioContext(), src = ac.createMediaElementSource(vid), dst = ac.createMediaStreamDestination(); src.connect(dst); dst.stream.getAudioTracks().forEach(function (t) { stream.addTrack(t); }); } catch (e) {}
      var mime = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find(function (m) { return MediaRecorder.isTypeSupported(m); });
      var rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6e6 }), chunks = [];
      rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
      rec.onstop = function () { resolve(new Blob(chunks, { type: mime.split(";")[0] })); };
      vid.currentTime = 0; vid.muted = false;
      var step = function () { x.drawImage(vid, 0, 0, cv.width, cv.height); qtCapRender(x, cv.width, cv.height, vid.currentTime, st, pages, false); status(T.exp + " " + Math.round(vid.currentTime / vid.duration * 100) + "%", vid.currentTime / vid.duration); if (!vid.ended) requestAnimationFrame(step); else rec.stop(); };
      vid.addEventListener("seeked", function go() { vid.removeEventListener("seeked", go); rec.start(1000); vid.play().then(step, reject); });
    });
  }
  $("sbExport").addEventListener("click", async function () {
    if (busy || !cues.length) return; busy = true; this.disabled = true; status(T.exp, 0);
    try {
      var blob = null;
      if (typeof VideoEncoder !== "undefined" && typeof Mp4Muxer !== "undefined") blob = await exportWebCodecs();
      if (!blob) blob = await exportRecorder();
      download(blob, base() + (range().whole ? "" : "-clip") + (blob.type.indexOf("webm") >= 0 ? ".webm" : ".mp4"));
      status(T.expDone); if (typeof qtEvent === "function") qtEvent("subtitles_export");
    } catch (e) { status(T.expFail + (e && e.message || e)); }
    $("sbBar").hidden = true; busy = false; this.disabled = false; draw();
  });
  function clipInfo() { if (!cues.length) return; var rg = range(); $("sbClipInfo").textContent = rg.whole ? "" : "✂ " + (rg.b - rg.a).toFixed(1) + T.sec; }
  ["sbFrom", "sbTo"].forEach(function (id) { $(id).addEventListener("change", function () { clipInfo(); var rg = range(); vid.currentTime = rg.a + .01; }); });
  sync();
  if (document.fonts && document.fonts.load) Promise.all(['400 40px "QT Lalezar"', '800 40px Sora', '700 40px "QT Arabic"'].map(function (f) { return document.fonts.load(f, "Ab ابج").catch(function () {}); })).then(draw);
})();
if (typeof module !== "undefined") module.exports = { qtSbCues: qtSbCues, qtSbFmt: qtSbFmt, qtSbSrt: qtSbSrt, qtSbRetime: qtSbRetime, qtSbFit: qtSbFit };
