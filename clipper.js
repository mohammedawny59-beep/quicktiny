// QuickTiny AI Clip Maker: long video in → ready-to-post vertical Reels out. On the device:
// Whisper transcript (asr-worker.js) → the strongest self-contained moments are scored and picked → a virtual camera
// follows the speaker's face (MediaPipe face detector) → silences cut, animated captions + hook title burned in →
// MP4s with sound (video-export.js). Nothing is uploaded.

/* ================= pure helpers (tests/clipper.test.js) ================= */
var QT_CL_HOOK = {
  en: "how why what secret secrets mistake mistakes never always best worst nobody everyone stop truth actually biggest most you your imagine problem money million free tip tips trick hack important wrong lesson real reason must story crazy shocking simple easy fast proven nobody's don't",
  ar: "كيف ليش لماذا ليه شو ماذا سر أسرار اسرار خطأ أخطاء اخطاء غلط أبدا أبدًا ابدا أفضل افضل أسوأ اسوأ أهم اهم الكل توقف الحقيقة فعلا فعلًا أكبر اكبر أكثر اكثر أنت انت إنت تخيل مشكلة فلوس مال مليون مجاني مجانا نصيحة نصائح حيلة مهم درس أول اول صدق السبب لازم قصة سهل بسرعة جرب انتبه احذر"
};
var QT_CL_CONNECT = { and: 1, so: 1, but: 1, because: 1, then: 1, also: 1, or: 1, "و": 1, "ف": 1, "بس": 1, "لكن": 1, "ثم": 1, "يعني": 1, "لأن": 1, "لان": 1, "طيب": 1, "او": 1, "أو": 1 };
var qtClHookSet = null;
function qtClNorm(w) { return String(w || "").toLowerCase().replace(/[.,!?؟،:;"'“”«»()]/g, ""); }
function qtClHook(text) {
  if (!qtClHookSet) { qtClHookSet = {}; (QT_CL_HOOK.en + " " + QT_CL_HOOK.ar).split(/\s+/).forEach(function (w) { qtClHookSet[w] = 1; }); }
  var ws = String(text || "").split(/\s+/).filter(Boolean), s = 0, hits = 0;
  ws.forEach(function (w) { var n = qtClNorm(w), b = n.replace(/^(ال|و|ف|ب|ل)(?=..)/, ""); if (qtClHookSet[n] || qtClHookSet[b]) hits++; });
  s += Math.min(4, hits * 1.5);
  if (/[?؟]\s*$/.test(text) || (ws.length && qtClHookSet[qtClNorm(ws[0])] && /^(how|why|what|كيف|ليش|لماذا|ليه|شو|ماذا)$/.test(qtClNorm(ws[0])))) s += 2;
  if (/\d/.test(text)) s += 1;
  if (ws.length && QT_CL_CONNECT[qtClNorm(ws[0])]) s -= 2;
  return s;
}
// Words → sentences (split on end punctuation, long pauses, or very long runs).
function qtClSentences(words) {
  var out = [], cur = [];
  words.forEach(function (w, i) {
    cur.push(w); var nx = words[i + 1];
    if (!nx || /[.!?؟…]$/.test(w.w) || nx.start - w.end > .8 || cur.length >= 32) {
      out.push({ start: cur[0].start, end: cur[cur.length - 1].end, words: cur, text: cur.map(function (x) { return x.w; }).join(" ") }); cur = [];
    }
  });
  return out;
}
// Candidate clips = runs of whole sentences whose length is within [min, max]; scored for hook, completeness, pace, energy.
// opts: {min, max, target, energy(start,end)->z-score or null}
function qtClCandidates(sents, o) {
  var c = [];
  for (var s = 0; s < sents.length; s++) {
    for (var e = s; e < sents.length; e++) {
      var dur = sents[e].end - sents[s].start; if (dur > o.max) break; if (dur < o.min) continue;
      var nW = 0, hookMax = 0; for (var k = s; k <= e; k++) { nW += sents[k].words.length; if (k > s) hookMax = Math.max(hookMax, qtClHook(sents[k].text)); }
      var first = qtClHook(sents[s].text), pace = nW / Math.max(1, dur), complete = /[.!?؟…]$/.test(sents[e].text) ? 1 : 0;
      var paceScore = -Math.abs(Math.min(pace, 4) - 2.8) * .8, lenScore = -Math.abs(dur - o.target) / o.target * 2;
      var gapBefore = s > 0 ? sents[s].start - sents[s - 1].end : 2, cleanStart = gapBefore > .35 ? .6 : 0;
      var en = o.energy ? o.energy(sents[s].start, sents[e].end) : 0;
      var score = first * 1.4 + hookMax * .5 + complete * 1.2 + paceScore + lenScore + cleanStart + en * .6;
      c.push({ s: s, e: e, start: sents[s].start, end: sents[e].end, dur: dur, score: score, hook: first });
    }
  }
  return c;
}
// Greedy pick of the best candidates that don't overlap each other.
function qtClPick(cands, n) {
  var sorted = cands.slice().sort(function (a, b) { return b.score - a.score; }), out = [];
  for (var i = 0; i < sorted.length && out.length < n; i++) {
    var c = sorted[i]; if (out.some(function (o) { return Math.min(o.end, c.end) - Math.max(o.start, c.start) > 0; })) continue; out.push(c);
  }
  return out.sort(function (a, b) { return a.start - b.start; });
}
// 0–99 badge from scores relative to the best candidate in the video.
function qtClRate(picked) {
  if (!picked.length) return picked;
  var hi = Math.max.apply(null, picked.map(function (p) { return p.score; })), lo = Math.min.apply(null, picked.map(function (p) { return p.score; }));
  picked.forEach(function (p) { p.rating = Math.round(72 + (hi === lo ? 1 : (p.score - lo) / (hi - lo)) * 26); });
  return picked;
}
// Title: the most hook-y sentence of the clip, leading connectors removed, ≤ 9 words.
function qtClTitle(sents, clip) {
  var best = sents[clip.s], bs = -99;
  for (var k = clip.s; k <= clip.e; k++) { var h = qtClHook(sents[k].text) - (k - clip.s) * .3; if (h > bs) { bs = h; best = sents[k]; } }
  var ws = best.text.split(/\s+/); while (ws.length > 3 && QT_CL_CONNECT[qtClNorm(ws[0])]) ws.shift();
  var t = ws.slice(0, 9).join(" ").replace(/[,،;:]$/, ""); return ws.length > 9 ? t + "…" : t;
}
// Where to split long audio for transcription: near every `every` seconds, at the quietest point within ±8 s.
function qtClSplits(levels, win, dur, every) {
  var pts = [0];
  for (var t = every; t < dur - every * .3; t += every) {
    var a = Math.max(0, Math.floor((t - 8) / win)), b = Math.min(levels.length - 1, Math.floor((t + 8) / win)), mi = a;
    for (var i = a; i <= b; i++) if (levels[i] < levels[mi]) mi = i;
    pts.push(mi * win);
  }
  pts.push(dur); return pts;
}
// Virtual camera: face centre samples [{t, x}] (x in 0..1, null when no face) → smooth keyframes with a dead zone.
function qtClCamera(samples, o) {
  o = o || {}; var dead = o.dead == null ? .05 : o.dead, k = o.k == null ? .35 : o.k, out = [], cam = null, last = .5;
  samples.forEach(function (s) { if (s.x != null) { last = s.x; return; } }); // first known value
  var firstKnown = samples.find(function (s) { return s.x != null; }); cam = firstKnown ? firstKnown.x : .5; last = cam;
  samples.forEach(function (s) {
    var target = s.x == null ? last : s.x; last = target;
    var d = target - cam; if (Math.abs(d) > dead) cam += (d - Math.sign(d) * dead) * k;
    out.push({ t: s.t, x: cam });
  });
  return out;
}
function qtClCamAt(cam, t) {
  if (!cam || !cam.length) return .5;
  if (t <= cam[0].t) return cam[0].x; if (t >= cam[cam.length - 1].t) return cam[cam.length - 1].x;
  var lo = 0, hi = cam.length - 1; while (hi - lo > 1) { var m = (lo + hi) >> 1; if (cam[m].t <= t) lo = m; else hi = m; }
  var a = cam[lo], b = cam[hi], u = (t - a.t) / Math.max(1e-6, b.t - a.t), e = u * u * (3 - 2 * u);
  return a.x + (b.x - a.x) * e;
}
function qtClFmt(t) { t = Math.max(0, t); var m = Math.floor(t / 60), s = Math.floor(t % 60); return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }

/* ================= frame renderer ================= */
// Draws output frame for source time srcT: reframed video (face camera or blurred fill), captions, hook title, progress bar.
function qtClDraw(x, W, H, v, srcT, outT, total, clip, st, low) {
  var vw = v.videoWidth || 16, vh = v.videoHeight || 9;
  x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
  var portraitSrc = vh / vw >= H / W - .01;
  if (portraitSrc) { var f = qtVxPlace(vw, vh, W, H, "fill"); x.drawImage(v, f.x, f.y, f.w, f.h); }
  else if (st.frame === "face") {
    var cw = Math.min(vw, vh * W / H), cx = qtClCamAt(clip.cam, srcT) * vw, sx = Math.max(0, Math.min(vw - cw, cx - cw / 2));
    x.drawImage(v, sx, 0, cw, vh, 0, 0, W, H);
  } else {
    var lx = low.getContext("2d"), lf = qtVxPlace(vw, vh, low.width, low.height, "fill"); lx.drawImage(v, lf.x, lf.y, lf.w, lf.h);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; x.drawImage(low, 0, 0, W, H); x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(0, 0, W, H);
    var r = qtVxPlace(vw, vh, W, H, "fit"), z = 1.08; x.drawImage(v, (W - r.w * z) / 2, (H - r.h * z) / 2, r.w * z, r.h * z);
  }
  if (st.captions && clip.pages) qtCapRender(x, W, H, srcT, st.cap, clip.pages, false);
  // hook title for the first seconds, springs in, slides out
  if (st.hook && clip.title) {
    var p = Math.min(1, outT / .45), sp = 1 - Math.exp(-7 * p) * Math.cos(9.5 * p), out = Math.max(0, Math.min(1, (outT - st.hookFor) / .35));
    if (outT < st.hookFor + .4) {
      var ar = /[؀-ۿ]/.test(clip.title), fam = ar ? '"QT Lalezar", "QT Arabic", sans-serif' : 'Sora, "Arial Black", sans-serif', wt = ar ? "400 " : "800 ";
      var u = Math.min(W, H) / 1080, maxW = W * .84, fs = 74 * u; x.font = wt + fs + "px " + fam;
      var ws = clip.title.split(/\s+/), lines = [], cur = "";
      ws.forEach(function (w) { var tr = cur ? cur + " " + w : w; if (cur && x.measureText(tr).width > maxW) { lines.push(cur); cur = w; } else cur = tr; }); if (cur) lines.push(cur);
      lines = lines.slice(0, 3); var lh = fs * 1.2, bw = Math.max.apply(null, lines.map(function (l) { return x.measureText(l).width; })) + 60 * u, bh = lines.length * lh + 40 * u, by = H * .12;
      x.save(); x.translate(W / 2, by + bh / 2 - out * H * .3); x.scale(sp, sp); x.rotate(-.02);
      x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 30 * u; x.fillStyle = "#fff"; var R = 22 * u;
      x.beginPath(); if (x.roundRect) x.roundRect(-bw / 2, -bh / 2, bw, bh, R); else x.rect(-bw / 2, -bh / 2, bw, bh); x.fill(); x.shadowColor = "transparent";
      x.fillStyle = st.cap.accent; x.fillRect(-bw / 2, bh / 2 - 10 * u, bw, 10 * u);
      x.fillStyle = "#111"; x.textAlign = "center"; x.textBaseline = "middle"; x.direction = ar ? "rtl" : "ltr";
      lines.forEach(function (l, i) { x.fillText(l, 0, -bh / 2 + 20 * u + lh * (i + .5)); });
      x.restore();
    }
  }
  if (st.bar) { var u2 = Math.min(W, H) / 1080; x.fillStyle = "rgba(255,255,255,.25)"; x.fillRect(0, H - 10 * u2, W, 10 * u2); x.fillStyle = st.cap.accent; x.fillRect(0, H - 10 * u2, W * Math.min(1, outT / total), 10 * u2); }
}

/* ================= page ================= */
(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("clFile")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? {
      reading: "جارٍ قراءة الصوت…", model: "تنزيل نموذج التعرّف على الكلام (مرة واحدة)…", asr: "جارٍ تحويل الكلام إلى نص", finding: "جارٍ اختيار أقوى اللحظات…", found: "✓ وجدنا أفضل المقاطع — راجعها ونزّلها",
      none: "لم نجد مقاطع بهذا الطول — جرّب طولًا أقصر أو فيديو فيه كلام أكثر.", noAudio: "تعذّر قراءة الصوت من هذا الفيديو. جرّب MP4 أو MOV.", tooLong: "الفيديو أطول من 45 دقيقة — قصّه أولًا.", fail: "حدث خطأ: ",
      faces: "جارٍ تتبّع الوجه", exp: "جارٍ تجهيز المقطع", done: "✓ تم التنزيل", preview: "معاينة", download: "تنزيل", all: "تنزيل كل المقاطع", left: "متبقٍ تقريبًا", min: "د", s: "ث", noFaceLib: "تعذّر تحميل تتبّع الوجه — سنستخدم الخلفية المموّهة." }
    : {
      reading: "Reading the audio…", model: "Downloading the speech model (one time)…", asr: "Transcribing", finding: "Picking the strongest moments…", found: "✓ Your best clips are ready — review and download",
      none: "No clips of that length found — try a shorter length or a video with more talking.", noAudio: "Couldn't read the audio in this video. Try MP4 or MOV.", tooLong: "This video is longer than 45 minutes — trim it first.", fail: "Something went wrong: ",
      faces: "Tracking the speaker", exp: "Rendering clip", done: "✓ Downloaded", preview: "Preview", download: "Download", all: "Download all clips", left: "left", min: "min", s: "s", noFaceLib: "Couldn't load face tracking — using the blurred background instead." };
  var LENS = { short: [15, 35, 25], mid: [30, 60, 45], long: [55, 90, 70] };
  var st = { len: "mid", count: 5, frame: "face", captions: true, hook: true, hookFor: 3, bar: true, cut: true, lang: AR ? "arabic" : "english", model: "base",
             cap: { style: "box", accent: "#ffd400", font: "bold", size: 92, pos: "bottom", bg: "none", upper: false, outline: true }, per: 3 };
  try { var sv = JSON.parse(localStorage.getItem("qtClipper") || "null"); if (sv) { ["len", "count", "frame", "captions", "hook", "bar", "cut", "model", "per"].forEach(function (k) { if (sv[k] != null) st[k] = sv[k]; }); if (sv.cap) Object.assign(st.cap, sv.cap); } } catch (e) {}
  if (window.qtBrand) qtBrand.apply(st.cap, { accent: "accent", font: "font" });
  function save() { try { localStorage.setItem("qtClipper", JSON.stringify(st)); } catch (e) {} }
  var file = null, url = null, busy = false, words = [], sents = [], clips = [], levels = null, WIN = .02, dur = 0, worker = null, faceDet = null, faceFailed = false;
  var v = $("clVideo"), probe = document.createElement("video"), cv = $("clCanvas"), cx = cv.getContext("2d"), low = document.createElement("canvas"); low.width = 54; low.height = 96;
  probe.muted = true; probe.playsInline = true; probe.preload = "auto";
  function status(m, p) { $("clStatus").textContent = m || ""; if (p != null) { $("clBar").hidden = false; $("clBarFill").style.width = Math.round(p * 100) + "%"; } else $("clBar").hidden = true; }
  function sync() {
    [["#clLen", "data-l", "len"], ["#clFrame", "data-f", "frame"], ["#clStyle", "data-s", "cap.style"]].forEach(function (g) {
      document.querySelectorAll(g[0] + " .chip").forEach(function (b) { var val = g[2] === "cap.style" ? st.cap.style : st[g[2]], on = b.getAttribute(g[1]) === String(val); b.classList.toggle("active", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    });
    $("clCount").value = st.count; $("clLang").value = st.lang; $("clModel").value = st.model; $("clAccent").value = st.cap.accent;
    $("clCaps").checked = st.captions; $("clHook").checked = st.hook; $("clCut").checked = st.cut; $("clBarOn").checked = st.bar;
  }
  [["#clLen", "data-l", "len"], ["#clFrame", "data-f", "frame"], ["#clStyle", "data-s", "cap.style"]].forEach(function (g) {
    document.querySelectorAll(g[0] + " .chip").forEach(function (b) { b.addEventListener("click", function () { if (g[2] === "cap.style") st.cap.style = b.getAttribute(g[1]); else st[g[2]] = b.getAttribute(g[1]); save(); sync(); if (g[2] === "len" && sents.length) pick(); }); });
  });
  $("clCount").addEventListener("change", function () { st.count = +this.value; save(); if (sents.length) pick(); });
  $("clLang").addEventListener("change", function () { st.lang = this.value; });
  $("clModel").addEventListener("change", function () { st.model = this.value; save(); });
  $("clAccent").addEventListener("input", function () { st.cap.accent = this.value; save(); });
  [["clCaps", "captions"], ["clHook", "hook"], ["clCut", "cut"], ["clBarOn", "bar"]].forEach(function (c) { $(c[0]).addEventListener("change", function () { st[c[1]] = this.checked; save(); }); });

  function load(f) { if (!f || busy) return; file = f; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f); v.src = url; probe.src = url; $("clName").textContent = f.name; $("clGo").disabled = false; $("clResults").hidden = true; status(""); }
  $("clFile").addEventListener("change", function () { load(this.files[0]); this.value = ""; });
  var drop = $("clDrop");
  ["dragenter", "dragover"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (ev) { var f = ev.dataTransfer.files[0]; if (f) load(f); });

  function runAsr(chunk, offset) {
    return new Promise(function (resolve, reject) {
      var sizes = {};
      worker.onmessage = function (ev) {
        var m = ev.data;
        if (m.type === "progress" && m.total) { sizes[m.file] = [m.loaded, m.total]; var L = 0, Tt = 0; for (var k in sizes) { L += sizes[k][0]; Tt += sizes[k][1]; } status(T.model + " " + Math.round(L / 1048576) + " / " + Math.round(Tt / 1048576) + " MB", L / Tt * .2); }
        else if (m.type === "done") resolve(m.words.map(function (w) { return { w: w.w, start: w.start + offset, end: w.end + offset }; }));
        else if (m.type === "error") reject(new Error(m.message));
      };
      worker.onerror = function (e) { reject(new Error(e.message || "worker")); };
      worker.postMessage({ type: "run", audio: chunk, model: st.model, language: st.lang || null }, [chunk.buffer]);
    });
  }
  function energyFn() {
    var n = levels.length, mean = 0, sd = 0; for (var i = 0; i < n; i++) mean += levels[i]; mean /= n; for (var j = 0; j < n; j++) sd += (levels[j] - mean) * (levels[j] - mean); sd = Math.sqrt(sd / n) || 1;
    return function (a, b) { var i0 = Math.floor(a / WIN), i1 = Math.min(n, Math.ceil(b / WIN)), s = 0, c = 0; for (var i = i0; i < i1; i++) if (levels[i] > -60) { s += levels[i]; c++; } return c ? Math.max(-1.5, Math.min(1.5, (s / c - mean) / sd)) : 0; };
  }
  function pick() {
    var L = LENS[st.len], cands = qtClCandidates(sents, { min: L[0], max: L[1], target: L[2], energy: energyFn() }), picked = qtClRate(qtClPick(cands, st.count));
    clips = picked.map(function (c, i) {
      var inW = words.filter(function (w) { return w.start >= c.start - .01 && w.end <= c.end + .01; });
      return { i: i, start: Math.max(0, c.start - .12), end: Math.min(dur, c.end + .35), title: qtClTitle(sents, c), rating: c.rating, words: inW, cam: null, pages: qtCapPages(inW, st.per) };
    });
    render();
    status(clips.length ? T.found : T.none);
  }
  $("clGo").addEventListener("click", async function () {
    if (!file || busy) return; busy = true; this.disabled = true; $("clResults").hidden = true;
    try {
      status(T.reading, 0);
      var a; try { a = await qtVxMono16k(file); } catch (e) { throw new Error(T.noAudio); }
      dur = a.duration; if (dur > 45 * 60 + 5) throw new Error(T.tooLong);
      levels = qtVxLevels(a.samples, a.rate, WIN);
      if (!worker) worker = new Worker("/asr-worker.js");
      var pts = qtClSplits(levels, WIN, dur, 120); words = []; var t0 = performance.now(), done = 0;
      for (var k = 0; k < pts.length - 1; k++) {
        var s0 = Math.floor(pts[k] * a.rate), s1 = Math.floor(pts[k + 1] * a.rate), chunk = a.samples.slice(s0, s1);
        var w = await runAsr(chunk, pts[k]); words = words.concat(w); done += pts[k + 1] - pts[k];
        var el = (performance.now() - t0) / 1000, rate = el / done, left = Math.max(0, (dur - done) * rate);
        status(T.asr + " " + Math.round(done / dur * 100) + "% · " + (left > 90 ? Math.ceil(left / 60) + " " + T.min : Math.ceil(left) + " " + T.s) + " " + T.left, .2 + .75 * done / dur);
      }
      status(T.finding, .97); sents = qtClSentences(words); pick();
      if (typeof qtEvent === "function") qtEvent("clips_found");
    } catch (e) { status((/^(Couldn|تعذّر|This video|الفيديو)/.test(e && e.message) ? "" : T.fail) + (e && e.message || e)); }
    busy = false; this.disabled = false;
  });

  // ---- face tracking (MediaPipe, loaded on demand) ----
  async function detector() {
    if (faceDet || faceFailed) return faceDet;
    try {
      var mp = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/vision_bundle.mjs");
      var fs = await mp.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm");
      faceDet = await mp.FaceDetector.createFromOptions(fs, { baseOptions: { modelAssetPath: "/models/blaze_face_short_range.tflite" }, runningMode: "IMAGE", minDetectionConfidence: .45 });
    } catch (e) { faceFailed = true; }
    return faceDet;
  }
  function seek(vid, t) { return new Promise(function (r) { var d = function () { vid.removeEventListener("seeked", d); r(); }; vid.addEventListener("seeked", d); vid.currentTime = t; setTimeout(d, 1500); }); }
  async function track(c, onP) {
    if (c.cam) return c.cam;
    if (!probe.videoWidth) await new Promise(function (r) { probe.addEventListener("loadeddata", r, { once: true }); setTimeout(r, 3000); });
    if (probe.videoHeight / probe.videoWidth >= 1.7) return (c.cam = [{ t: c.start, x: .5 }]);
    var det = await detector(); if (!det) { status(T.noFaceLib); return (c.cam = [{ t: c.start, x: .5 }]); }
    var sc = document.createElement("canvas"), k = 320 / probe.videoWidth; sc.width = 320; sc.height = Math.round(probe.videoHeight * k); var sx = sc.getContext("2d", { willReadFrequently: true });
    var samples = [], step = 1 / 3, n = Math.ceil((c.end - c.start) / step);
    for (var i = 0; i <= n; i++) {
      var t = Math.min(c.end, c.start + i * step); await seek(probe, t); sx.drawImage(probe, 0, 0, sc.width, sc.height);
      var r = null; try { r = det.detect(sc); } catch (e) {}
      var best = null; (r && r.detections || []).forEach(function (d) { var b = d.boundingBox; if (b && (!best || b.width * b.height > best.width * best.height)) best = b; });
      samples.push({ t: t, x: best ? (best.originX + best.width / 2) / sc.width : null });
      if (onP && i % 3 === 0) onP(i / n);
    }
    c.cam = qtClCamera(samples, { dead: .05, k: .35 });
    await thumb(c);
    return c.cam;
  }

  // ---- results list ----
  function render() {
    var box = $("clList"); box.innerHTML = "";
    clips.forEach(function (c) {
      var card = document.createElement("div"); card.className = "cl-card";
      var th = document.createElement("canvas"); th.width = 180; th.height = 320; th.className = "cl-thumb"; th.setAttribute("aria-hidden", "true");
      var body = document.createElement("div"); body.className = "cl-body";
      var meta = document.createElement("div"); meta.className = "cl-meta"; meta.innerHTML = '<span class="cl-score">🔥 ' + c.rating + '</span><span>' + qtClFmt(c.start) + " – " + qtClFmt(c.end) + " · " + Math.round(c.end - c.start) + T.s + "</span>";
      var ti = document.createElement("input"); ti.type = "text"; ti.dir = "auto"; ti.value = c.title; ti.maxLength = 80; ti.className = "cl-title"; ti.setAttribute("aria-label", "Title");
      ti.addEventListener("input", function () { c.title = ti.value; });
      var tx = document.createElement("p"); tx.className = "cl-text"; tx.dir = "auto"; tx.textContent = c.words.map(function (w) { return w.w; }).join(" ").slice(0, 220) + (c.words.length > 40 ? "…" : "");
      var btns = document.createElement("div"); btns.className = "cl-btns";
      var pv = document.createElement("button"); pv.type = "button"; pv.className = "btn btn-secondary"; pv.textContent = "▶ " + T.preview; pv.addEventListener("click", function () { previewClip(c); });
      var dl = document.createElement("button"); dl.type = "button"; dl.className = "btn"; dl.textContent = "⬇ " + T.download; dl.addEventListener("click", function () { exportClip(c); });
      btns.appendChild(pv); btns.appendChild(dl);
      body.appendChild(meta); body.appendChild(ti); body.appendChild(tx); body.appendChild(btns);
      card.appendChild(th); card.appendChild(body); box.appendChild(card);
      c.thumb = th;
    });
    $("clResults").hidden = !clips.length;
    (async function () { for (var i = 0; i < clips.length; i++) await thumb(clips[i]); })();
  }
  var TH = { frame: "blur", captions: false, hook: false, bar: false, cap: st.cap }, thLow = document.createElement("canvas"); thLow.width = 45; thLow.height = 80;
  // Thumbnail = the reframed first second of the clip (face camera once tracked, blurred fill before that).
  async function thumb(c) {
    if (!c.thumb) return; await seek(probe, c.start + 1);
    var tx2 = c.thumb.getContext("2d"); qtClDraw(tx2, 180, 320, probe, c.start + 1, 1, 10, c, c.cam ? Object.assign({}, TH, { frame: "face" }) : TH, thLow);
  }
  function segsFor(c) {
    if (!st.cut || !levels) return [[c.start, c.end]];
    var i0 = Math.floor(c.start / WIN), i1 = Math.min(levels.length, Math.ceil(c.end / WIN)), lv = levels.slice(i0, i1);
    return qtVxKeep(lv, WIN, c.end - c.start, -42, .45, .12).map(function (s) { return [s[0] + c.start, s[1] + c.start]; });
  }
  var playing = null;
  async function previewClip(c) {
    if (busy) return; busy = true; v.pause();
    if (st.frame === "face") { status(T.faces + "…", 0); await track(c, function (p) { status(T.faces + " " + Math.round(p * 100) + "%", p); }); }
    status(""); busy = false;
    c.pages = qtCapPages(c.words, st.per); var segs = segsFor(c), total = qtVxTotal(segs);
    $("clStage").hidden = false; $("clStage").scrollIntoView({ behavior: "smooth", block: "center" });
    v.currentTime = segs[0][0]; v.muted = false; playing = { c: c, segs: segs, total: total }; v.play().catch(function () {});
  }
  (function tick() {
    if (playing && !v.paused) {
      var p = playing, t = v.currentTime, idx = p.segs.findIndex(function (s) { return t >= s[0] - .02 && t < s[1]; });
      if (idx < 0) { var nx = p.segs.find(function (s) { return s[0] > t; }); if (nx) v.currentTime = nx[0]; else { v.pause(); } }
      var outT = 0; for (var i = 0; i < p.segs.length; i++) { if (t >= p.segs[i][1]) outT += p.segs[i][1] - p.segs[i][0]; else { if (t > p.segs[i][0]) outT += t - p.segs[i][0]; break; } }
      cx.setTransform(1, 0, 0, 1, 0, 0); qtClDraw(cx, cv.width, cv.height, v, t, outT, p.total, p.c, st, low);
    }
    requestAnimationFrame(tick);
  })();
  async function exportClip(c, silent) {
    if (busy && !silent) return; busy = true; v.pause();
    try {
      if (st.frame === "face") await track(c, function (p) { status(T.faces + " " + Math.round(p * 100) + "%", p * .3); });
      c.pages = qtCapPages(c.words, st.per);
      var segs = segsFor(c), total = qtVxTotal(segs), big = document.createElement("canvas"); big.width = 54; big.height = 96;
      var r = await qtVxExport({ file: file, video: v, W: 1080, H: 1920, fps: 30, segs: segs,
        draw: function (x, srcT, outT, W, H) { qtClDraw(x, W, H, v, srcT, outT, total, c, st, big); },
        onProgress: function (p) { status(T.exp + " " + (c.i + 1) + " · " + Math.round(p * 100) + "%", .3 + p * .7); } });
      if (!r) throw new Error("WebCodecs");
      var name = "clip-" + String(c.i + 1).padStart(2, "0") + "-" + (c.title || "reel").replace(/[\\/:*?"<>|…]+/g, "").trim().slice(0, 40).replace(/\s+/g, "-") + ".mp4";
      qtVxDownload(r.blob, name); status(T.done); if (typeof qtEvent === "function") qtEvent("clip_export");
    } catch (e) { status(T.fail + (e && e.message || e)); }
    if (!silent) busy = false;
  }
  $("clAll").addEventListener("click", async function () {
    if (busy || !clips.length) return; this.disabled = true;
    for (var i = 0; i < clips.length; i++) { await exportClip(clips[i], true); await new Promise(function (r) { setTimeout(r, 600); }); }
    busy = false; this.disabled = false;
  });
  sync();
  if (document.fonts && document.fonts.load) ['400 60px "QT Lalezar"', '800 60px Sora', '700 60px "QT Arabic"'].forEach(function (f) { document.fonts.load(f, "Ab ابج").catch(function () {}); });
})();
if (typeof module !== "undefined") module.exports = { qtClHook: qtClHook, qtClSentences: qtClSentences, qtClCandidates: qtClCandidates, qtClPick: qtClPick, qtClRate: qtClRate, qtClTitle: qtClTitle, qtClSplits: qtClSplits, qtClCamera: qtClCamera, qtClCamAt: qtClCamAt };
