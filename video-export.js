// QuickTiny video engine shared by the video tools (vertical converter, silence remover, clip maker):
// decode a local video's audio, find silences, and export an MP4 (H.264 + AAC/Opus via WebCodecs + mp4-muxer)
// made of chosen time segments, with every frame drawn by the caller. Everything runs on the device.

/* ---------- pure helpers (tests/video-export.test.js) ---------- */
// RMS level in dBFS for consecutive windows of `win` seconds.
function qtVxLevels(samples, rate, win) {
  var n = Math.max(1, Math.round(rate * (win || .02))), out = [];
  for (var i = 0; i < samples.length; i += n) {
    var e = Math.min(samples.length, i + n), s = 0;
    for (var j = i; j < e; j++) s += samples[j] * samples[j];
    var rms = Math.sqrt(s / Math.max(1, e - i));
    out.push(rms > 1e-9 ? 20 * Math.log10(rms) : -120);
  }
  return out;
}
// Segments to KEEP: everything except silences (level < threshold dB) lasting at least minSil seconds,
// with `pad` seconds of breathing room left around speech. Returns [[start, end], ...] in seconds.
function qtVxKeep(levels, win, duration, threshold, minSil, pad) {
  var sil = [], i = 0, L = levels.length;
  while (i < L) {
    if (levels[i] < threshold) { var j = i; while (j < L && levels[j] < threshold) j++; var a = i * win, b = Math.min(duration, j * win); if (b - a >= minSil) sil.push([a, b]); i = j; }
    else i++;
  }
  var keep = [], t = 0;
  sil.forEach(function (s) {
    var cutA = s[0] === 0 ? 0 : s[0] + pad, cutB = s[1] >= duration - 1e-6 ? duration : s[1] - pad;
    if (cutB - cutA <= .05) return;
    if (cutA > t + 1e-6) keep.push([t, cutA]);
    t = cutB;
  });
  if (duration - t > .05) keep.push([t, duration]);
  return keep.length ? keep : [[0, duration]];
}
function qtVxTotal(segs) { return segs.reduce(function (a, s) { return a + Math.max(0, s[1] - s[0]); }, 0); }
// Map an output time to the source time inside the kept segments.
function qtVxSrcTime(segs, outT) {
  var acc = 0;
  for (var i = 0; i < segs.length; i++) { var d = segs[i][1] - segs[i][0]; if (outT < acc + d || i === segs.length - 1) return segs[i][0] + Math.min(d, Math.max(0, outT - acc)); acc += d; }
  return 0;
}
// Concatenate the kept parts of planar channel data, with a short fade at each join (no clicks).
function qtVxCutAudio(channels, rate, segs, fade) {
  var f = Math.round(rate * (fade == null ? .008 : fade)), total = 0;
  segs.forEach(function (s) { total += Math.max(0, Math.round(s[1] * rate) - Math.round(s[0] * rate)); });
  return channels.map(function (ch) {
    var out = new Float32Array(total), o = 0;
    segs.forEach(function (s, k) {
      var a = Math.round(s[0] * rate), b = Math.min(ch.length, Math.round(s[1] * rate)), n = Math.max(0, b - a);
      out.set(ch.subarray(a, a + n), o);
      if (segs.length > 1) for (var i = 0; i < f && i < n; i++) { var g = i / f; if (k > 0) out[o + i] *= g; if (k < segs.length - 1) out[o + n - 1 - i] *= g; }
      o += n;
    });
    return out;
  });
}
// Rectangle for drawing a w×h source into a W×H frame: "fit" (letterbox) or "fill" (crop) with a 0..1 focus point.
function qtVxPlace(w, h, W, H, mode, fx, fy) {
  var k = mode === "fill" ? Math.max(W / w, H / h) : Math.min(W / w, H / h), dw = w * k, dh = h * k;
  var x = (W - dw) * (fx == null ? .5 : fx), y = (H - dh) * (fy == null ? .5 : fy);
  return { x: x, y: y, w: dw, h: dh };
}
function qtVxFit(w, h, maxSide) {
  var k = Math.min(1, (maxSide || 1920) / Math.max(w, h));
  return [Math.max(2, Math.round(w * k / 2) * 2), Math.max(2, Math.round(h * k / 2) * 2)];
}

// Box-filter resample (good enough for speech recognition, no aliasing from plain decimation).
function qtVxResample(src, from, to) {
  if (from === to) return src;
  var n = Math.max(1, Math.floor(src.length * to / from)), out = new Float32Array(n), r = from / to;
  for (var i = 0; i < n; i++) {
    var a = i * r, b = Math.min(src.length, a + r), i0 = Math.floor(a), i1 = Math.max(i0 + 1, Math.floor(b)), s = 0;
    for (var j = i0; j < i1 && j < src.length; j++) s += src[j];
    out[i] = s / Math.max(1, Math.min(i1, src.length) - i0);
  }
  return out;
}
// The best MediaRecorder container this browser offers (Safari: MP4 with H.264/AAC).
function qtVxRecMime(withAudio) {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return null;
  var list = withAudio ? ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"] : ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  for (var i = 0; i < list.length; i++) if (MediaRecorder.isTypeSupported(list[i])) return list[i];
  return null;
}

/* ---------- browser engine ---------- */
// Decode a file's audio at `rate`. Some browsers (older Safari) refuse low sample rates for OfflineAudioContext,
// so on failure decode at 48 kHz and resample ourselves. Returns an AudioBuffer-like object.
async function qtVxDecode(file, rate, channels) {
  var buf = await file.arrayBuffer();
  try { return await new OfflineAudioContext(channels, 1, rate).decodeAudioData(buf.slice(0)); }
  catch (e) {
    var ab = await new OfflineAudioContext(channels, 1, 48000).decodeAudioData(buf);
    var ch = []; for (var c = 0; c < ab.numberOfChannels; c++) ch.push(qtVxResample(ab.getChannelData(c), ab.sampleRate, rate));
    return { sampleRate: rate, length: ch[0].length, duration: ch[0].length / rate, numberOfChannels: ch.length, getChannelData: function (i) { return ch[i]; } };
  }
}
// iOS only lets audio start inside a tap: call this synchronously at the start of an export click.
function qtVxUnlockAudio() {
  try { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; if (!window.__qtAC || window.__qtAC.state === "closed") window.__qtAC = new AC(); if (window.__qtAC.state === "suspended") window.__qtAC.resume(); } catch (e) {}
}
// Real-time fallback (no WebCodecs, or no audio encoder — e.g. older iPhones): plays the cut audio through Web Audio
// into a MediaRecorder together with the canvas; the audio clock drives which source frame is drawn.
async function qtVxRecord(opts) {
  var mime = qtVxRecMime(opts.audio !== false); if (!mime) return null;
  var W = opts.W, H = opts.H, v = opts.video, segs = opts.segs || [[0, v.duration]], total = qtVxTotal(segs);
  var cv = document.createElement("canvas"); cv.width = W; cv.height = H; var x = cv.getContext("2d");
  var stream = cv.captureStream(opts.fps || 30), ac = null, src = null, hasAudio = false;
  if (opts.audio !== false) {
    try {
      qtVxUnlockAudio(); ac = window.__qtAC; if (ac.state === "suspended") await ac.resume();
      var ab = await qtVxDecode(opts.file, ac.sampleRate, 2), chans = [ab.getChannelData(0), ab.numberOfChannels > 1 ? ab.getChannelData(1) : ab.getChannelData(0)];
      var cut = qtVxCutAudio(chans, ab.sampleRate, segs), buffer = ac.createBuffer(2, Math.max(1, cut[0].length), ab.sampleRate);
      buffer.getChannelData(0).set(cut[0]); buffer.getChannelData(1).set(cut[1]);
      var dest = ac.createMediaStreamDestination(); src = ac.createBufferSource(); src.buffer = buffer; src.connect(dest);
      dest.stream.getAudioTracks().forEach(function (t) { stream.addTrack(t); }); hasAudio = true;
    } catch (e) { src = null; }
  }
  var rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Math.min(12e6, Math.max(4e6, W * H * 4)), audioBitsPerSecond: 160000 }), chunks = [];
  rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
  var stopped = new Promise(function (r) { rec.onstop = r; });
  var wasMuted = v.muted; v.muted = true; v.pause(); await qtVxSeek(v, segs[0][0]);
  x.drawImage(v, 0, 0, 1, 1); opts.draw(x, segs[0][0], 0, W, H);
  rec.start(500);
  var clock = hasAudio ? function () { return ac.currentTime; } : function () { return performance.now() / 1000; };
  var t0 = clock() + .08; if (src) src.start(ac.currentTime + .08);
  try { await v.play(); } catch (e) {}
  await new Promise(function (done) {
    (function step() {
      var outT = clock() - t0;
      if (outT >= total) return done();
      if (outT >= 0) {
        var srcT = qtVxSrcTime(segs, outT);
        if (Math.abs(v.currentTime - srcT) > .25) v.currentTime = srcT; // jump the cuts
        if (v.paused) v.play().catch(function () {});
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = "none";
        opts.draw(x, srcT, outT, W, H);
        if (opts.onProgress) opts.onProgress(outT / total);
      }
      requestAnimationFrame(step);
    })();
  });
  v.pause(); v.muted = wasMuted; if (src) try { src.stop(); } catch (e) {}
  rec.stop(); await stopped;
  return { blob: new Blob(chunks, { type: mime.split(";")[0] }), audio: hasAudio ? "recorder" : null, via: "recorder" };
}
async function qtVxMono16k(file) {
  var ab = await qtVxDecode(file, 16000, 1), mono = new Float32Array(ab.length);
  for (var c = 0; c < ab.numberOfChannels; c++) { var d = ab.getChannelData(c); for (var i = 0; i < d.length; i++) mono[i] += d[i] / ab.numberOfChannels; }
  return { samples: mono, rate: 16000, duration: ab.duration };
}
function qtVxSeek(v, t) {
  return new Promise(function (r) {
    var done = function () { v.removeEventListener("seeked", done); r(); };
    v.addEventListener("seeked", done); v.currentTime = t;
    setTimeout(done, 1500); // never hang on a frame the decoder refuses to land on
  });
}
// opts: {file, video, W, H, fps, segs, draw(ctx, srcT, outT, W, H), onProgress(p), audio:true}
// Route: WebCodecs (fast, frame-exact) when it can encode both picture and sound; otherwise real-time MediaRecorder
// with sound (Safari/iPhone); WebCodecs without sound only as a last resort.
// Returns {blob, audio: "aac"|"opus"|"recorder"|null, via: "webcodecs"|"recorder"} or null when nothing can export.
async function qtVxExport(opts) {
  var hasWC = typeof VideoEncoder !== "undefined" && typeof Mp4Muxer !== "undefined";
  if (!hasWC) return await qtVxRecord(opts);
  var W = opts.W, H = opts.H, fps = opts.fps || 30, v = opts.video, segs = opts.segs || [[0, v.duration]];
  var mbps = Math.min(16e6, Math.max(3e6, W * H * fps * .11)), vcfg = null;
  for (var c of (W * H > 2228224 ? ["avc1.640033"] : ["avc1.640028", "avc1.4d0028", "avc1.640033"])) { var o = { codec: c, width: W, height: H, bitrate: mbps, framerate: fps }; try { if ((await VideoEncoder.isConfigSupported(o)).supported) { vcfg = o; break; } } catch (e) {} }
  if (!vcfg) return await qtVxRecord(opts);
  var ab = null, acfg = null;
  if (opts.audio !== false) {
    try { ab = await qtVxDecode(opts.file, 48000, 2); } catch (e) { ab = null; }
    if (ab && typeof AudioEncoder !== "undefined") for (var a of [["mp4a.40.2", "aac"], ["opus", "opus"]]) { var ao = { codec: a[0], sampleRate: 48000, numberOfChannels: 2, bitrate: 160000 }; try { if ((await AudioEncoder.isConfigSupported(ao)).supported) { acfg = { cfg: ao, mux: a[1] }; break; } } catch (e) {} }
    // the video has sound but this browser can't encode it → record in real time instead of losing the sound
    if (ab && !acfg && qtVxRecMime(true)) { var rr = await qtVxRecord(opts); if (rr) return rr; }
  }
  var mux = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), fastStart: "in-memory", firstTimestampBehavior: "offset",
    video: { codec: "avc", width: W, height: H }, audio: acfg ? { codec: acfg.mux, sampleRate: 48000, numberOfChannels: 2 } : undefined });
  var err = null;
  if (acfg) {
    var chans = [ab.getChannelData(0), ab.numberOfChannels > 1 ? ab.getChannelData(1) : ab.getChannelData(0)], cut = qtVxCutAudio(chans, 48000, segs);
    var aenc = new AudioEncoder({ output: function (ch, meta) { mux.addAudioChunk(ch, meta); }, error: function (e) { err = e; } }); aenc.configure(acfg.cfg);
    for (var p = 0, N = 4800; p < cut[0].length; p += N) {
      var n = Math.min(N, cut[0].length - p), pl = new Float32Array(n * 2); pl.set(cut[0].subarray(p, p + n), 0); pl.set(cut[1].subarray(p, p + n), n);
      var ad = new AudioData({ format: "f32-planar", sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(p / 48000 * 1e6), data: pl }); aenc.encode(ad); ad.close();
      if (aenc.encodeQueueSize > 24) await new Promise(function (r) { setTimeout(r, 0); });
    }
    await aenc.flush();
  }
  var cv = document.createElement("canvas"); cv.width = W; cv.height = H; var x = cv.getContext("2d");
  var venc = new VideoEncoder({ output: function (ch, meta) { mux.addVideoChunk(ch, meta); }, error: function (e) { err = e; } }); venc.configure(vcfg);
  var total = qtVxTotal(segs), frames = Math.max(1, Math.floor(total * fps)), wasMuted = v.muted; v.pause(); v.muted = true;
  for (var f = 0; f < frames; f++) {
    var outT = f / fps, srcT = qtVxSrcTime(segs, outT);
    await qtVxSeek(v, Math.min(srcT + .001, v.duration - .001));
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = "none";
    opts.draw(x, srcT, outT, W, H);
    var vf = new VideoFrame(cv, { timestamp: Math.round(outT * 1e6), duration: Math.round(1e6 / fps) }); venc.encode(vf, { keyFrame: f % 60 === 0 }); vf.close();
    if (opts.onProgress && f % 5 === 0) opts.onProgress(f / frames);
    if (venc.encodeQueueSize > 6) await new Promise(function (r) { setTimeout(r, 2); });
    if (err) throw err;
  }
  await venc.flush(); mux.finalize(); v.muted = wasMuted;
  return { blob: new Blob([mux.target.buffer], { type: "video/mp4" }), audio: acfg ? acfg.mux : null, via: "webcodecs" };
}
function qtVxDownload(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 8000); }
// Open another QuickTiny video tool with this file already loaded (IndexedDB handoff in site.js).
function qtVxSendTo(blob, name, path, inputId) {
  var f = new File([blob], name, { type: blob.type || "video/mp4" });
  if (typeof qtFileHandoffSet !== "function") { location.href = path; return; }
  qtFileHandoffSet(path, inputId, [f]).then(function () { location.href = path; }, function () { location.href = path; });
}
if (typeof module !== "undefined") module.exports = { qtVxResample: qtVxResample, qtVxLevels: qtVxLevels, qtVxKeep: qtVxKeep, qtVxTotal: qtVxTotal, qtVxSrcTime: qtVxSrcTime, qtVxCutAudio: qtVxCutAudio, qtVxPlace: qtVxPlace, qtVxFit: qtVxFit };
