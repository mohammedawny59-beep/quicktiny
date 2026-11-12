// GTA 6 Zone — Clip Studio: drop in a long gameplay recording, get the best moments as ready-to-post vertical Reels.
// Highlights are found on the device from the sound (loudness + sudden hits like crashes, shots, explosions) and
// the picture (how fast the frame changes). Each clip: 1080×1920, blurred fill, the gameplay framed in neon, a punch
// zoom + shake + flash on the peak, a hook title, the creator's @handle, a progress bar and an animated end stamp
// (our own "mission passed"-style design from gta.js). Export via video-export.js (WebCodecs → MP4 with sound).

/* ---------- pure helpers (tests/gta-clips.test.js) ---------- */
function qtGcMedian(a) { var s = Array.prototype.slice.call(a).sort(function (x, y) { return x - y; }), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; }
function qtGcRobust(a) { // robust z-scores (median / MAD), so one huge explosion doesn't flatten everything else
  var m = qtGcMedian(a), mad = qtGcMedian(a.map(function (v) { return Math.abs(v - m); })) * 1.4826 || 1;
  return a.map(function (v) { return (v - m) / mad; });
}
// levels: dB per step; motion: frame-change per step (same length, optional). -> action score per step
function qtGcScore(levels, motion) {
  var n = levels.length; if (!n) return [];
  var lv = levels.map(function (v) { return Math.max(-70, v); }), zl = qtGcRobust(lv);
  var on = lv.map(function (v, i) { return Math.max(0, v - Math.max(lv[Math.max(0, i - 1)], lv[Math.max(0, i - 2)])); }), zo = qtGcRobust(on);
  var zm = motion && motion.length === n ? qtGcRobust(motion) : null, raw = [];
  var soft = function (z) { return z > 3 ? 3 + Math.log(1 + z - 3) : z; }; // compress outliers but keep their order
  for (var i = 0; i < n; i++) raw.push(.5 * soft(zl[i]) + .3 * soft(zo[i]) + (zm ? .2 * soft(zm[i]) : 0));
  var out = []; for (var j = 0; j < n; j++) { var s = 0, c = 0; for (var k = Math.max(0, j - 2); k <= Math.min(n - 1, j + 2); k++) { s += raw[k]; c++; } out.push(s / c); }
  return out;
}
// best non-overlapping windows of `len` seconds; the peak sits ~65% in, so each clip builds up to its payoff
function qtGcPick(score, step, dur, len, n) {
  if (dur <= len + .5) return score.length ? [{ a: 0, b: dur, peak: score.indexOf(Math.max.apply(null, score)) * step, score: Math.max.apply(null, score), rank: 1 }] : [];
  var idx = score.map(function (_, i) { return i; }).sort(function (x, y) { return score[y] - score[x]; }), out = [];
  for (var q = 0; q < idx.length && out.length < n; q++) {
    var t = idx[q] * step + step / 2, a = Math.max(0, Math.min(dur - len, t - len * .65)), b = a + len;
    if (out.some(function (c) { return a < c.b + 1 && b > c.a - 1; })) continue;
    out.push({ a: +a.toFixed(2), b: +b.toFixed(2), peak: +t.toFixed(2), score: score[idx[q]] });
  }
  return out.map(function (c, i) { c.rank = i + 1; return c; });
}
// punch zoom + shake around the peak (t, peak in clip seconds)
function qtGcZoom(t, peak) {
  var d = t - peak; if (d < -.15 || d > 1.2) return { s: 1, dx: 0, dy: 0 };
  var s = d < 0 ? 1 + .14 * (d + .15) / .15 : 1 + .14 * Math.pow(1 - Math.min(1, d / 1.2), 2), sh = d > 0 && d < .45 ? 16 * (1 - d / .45) : 0;
  return { s: s, dx: Math.sin(d * 90) * sh, dy: Math.cos(d * 77) * sh };
}
function qtGcFmt(t) { t = Math.max(0, t); var m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ":" + (s < 10 ? "0" : "") + s; }

/* ---------- frame renderer ---------- */
function qtGcDraw(x, W, H, v, t, total, clip, o, small) {
  var u = W / 1080, vw = v.videoWidth || 16, vh = v.videoHeight || 9, ar = /[؀-ۿ]/.test(o.title || "");
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
  // blurred fill: draw tiny, scale up
  var sx = small.getContext("2d"), cw = Math.min(vw, vh * small.width / small.height); sx.drawImage(v, (vw - cw) / 2, 0, cw, vh, 0, 0, small.width, small.height);
  x.imageSmoothingEnabled = true; x.drawImage(small, 0, 0, W, H);
  var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(11,4,32,.55)"); g.addColorStop(.5, "rgba(60,8,70,.35)"); g.addColorStop(1, "rgba(11,4,32,.75)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
  // the gameplay, framed
  var fw = W, fh = fw * vh / vw; if (fh > H * .62) { fh = H * .62; fw = fh * vw / vh; }
  var cx = W / 2, cy = H * .5, z = qtGcZoom(t, clip.peak - clip.a), r = 26 * u;
  x.save(); x.beginPath(); if (x.roundRect) x.roundRect(cx - fw / 2 + 18 * u, cy - fh / 2, fw - 36 * u, fh, r); else x.rect(cx - fw / 2 + 18 * u, cy - fh / 2, fw - 36 * u, fh); x.clip();
  x.translate(cx + z.dx * u, cy + z.dy * u); x.scale(z.s, z.s); x.drawImage(v, -fw / 2, -fh / 2, fw, fh); x.restore();
  var fl = t - (clip.peak - clip.a); if (fl >= 0 && fl < .3) { x.globalAlpha = (1 - fl / .3) * .55; x.fillStyle = "#fff"; x.fillRect(cx - fw / 2 + 18 * u, cy - fh / 2, fw - 36 * u, fh); x.globalAlpha = 1; }
  x.save(); x.lineWidth = 6 * u; x.strokeStyle = "#ff2d95"; x.shadowColor = "#ff2d95"; x.shadowBlur = 30 * u; x.beginPath(); if (x.roundRect) x.roundRect(cx - fw / 2 + 18 * u, cy - fh / 2, fw - 36 * u, fh, r); else x.rect(cx - fw / 2 + 18 * u, cy - fh / 2, fw - 36 * u, fh); x.stroke(); x.restore();
  // hook title: big for the first 2.2 s, then parks at the top
  if (o.title) {
    var fam = ar ? '"QT Lalezar", "QT Arabic", sans-serif' : 'Sora, "Arial Black", sans-serif', wt = ar ? "400 " : "800 ";
    var k = Math.min(1, t / .45), park = Math.min(1, Math.max(0, (t - 2.2) / .5)), e = 1 - Math.pow(1 - park, 3);
    var fs = (118 - 46 * e) * u, y = H * (.2 - .075 * e);
    x.font = wt + fs + "px " + fam; var mw = x.measureText(o.title).width; if (mw > W * .9) { fs *= W * .9 / mw; x.font = wt + fs + "px " + fam; }
    x.save(); x.translate(W / 2, y); var sc = .6 + .4 * (1 - Math.pow(1 - k, 3)) + (k < 1 ? 0 : 0); x.scale(sc, sc); x.globalAlpha = k;
    x.textAlign = "center"; x.textBaseline = "middle"; x.direction = ar ? "rtl" : "ltr"; x.lineJoin = "round";
    x.lineWidth = fs * .14; x.strokeStyle = "#12042c"; x.strokeText(o.title, 0, 0);
    var tg = x.createLinearGradient(0, -fs / 2, 0, fs / 2); tg.addColorStop(0, "#fff6a8"); tg.addColorStop(.5, "#ffb347"); tg.addColorStop(1, "#ff2d95");
    x.shadowColor = "#ff2d95"; x.shadowBlur = 30 * u; x.fillStyle = tg; x.fillText(o.title, 0, 0); x.restore();
  }
  // handle + progress
  if (o.handle) { x.save(); x.font = "700 " + 46 * u + "px Sora, \"QT Arabic\", sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#fff"; x.shadowColor = "#3cf0ff"; x.shadowBlur = 18 * u; x.fillText("@" + o.handle.replace(/^@/, ""), W / 2, H * .82); x.restore(); }
  var bw = W * .78, bx = (W - bw) / 2, by = H * .885; x.fillStyle = "rgba(255,255,255,.18)"; x.fillRect(bx, by, bw, 10 * u);
  var pg = x.createLinearGradient(bx, 0, bx + bw, 0); pg.addColorStop(0, "#ff2d95"); pg.addColorStop(1, "#3cf0ff"); x.fillStyle = pg; x.fillRect(bx, by, bw * Math.min(1, t / Math.max(.01, total)), 10 * u);
  // end stamp
  if (o.stamp && o.stamp !== "none" && typeof qtGtaOverlay === "function" && typeof QT_GTA_OVL !== "undefined" && t > total - 3.6) {
    var K = QT_GTA_OVL[o.stamp], L = o.lang === "ar" ? "ar" : "en"; qtGtaOverlay(x, W, H, t - (total - 3.6), { title: K[L][0], sub: K[L][1], color: K.color, glow: K.glow, bg: "none" });
  }
}

(function () {
  if (typeof document === "undefined") return;
  var root = document.getElementById("gcStudio"); if (!root) return;
  var $ = function (id) { return document.getElementById(id); }, AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? { reading: "جارٍ قراءة الصوت…", motion: "جارٍ تحليل الحركة", found: function (n) { return "✓ لقينا " + n + " لحظات قوية — شوفها تحت."; }, none: "ما لقينا لحظات واضحة. جرّب فيديو أطول أو أعلى صوتًا.", exp: "جارٍ تجهيز المقطع", done: "✓ تم التنزيل", fail: "تعذّر التصدير: ", noexp: "متصفحك ما بيدعم التصدير. جرّب Chrome أو Edge.", pick: "اختر فيديو اللعب أولًا", bad: "ما قدرنا نفتح هالفيديو. جرّب MP4.", prev: "▶ معاينة", dl: "⬇ تنزيل", hook: "استنى للأخير… 🔥" }
               : { reading: "Reading the audio…", motion: "Analysing motion", found: function (n) { return "✓ Found " + n + " big moments — see below."; }, none: "No clear moments found. Try a longer or louder recording.", exp: "Rendering clip", done: "✓ Downloaded", fail: "Couldn't export: ", noexp: "Your browser can't export video. Try Chrome or Edge.", pick: "Choose a gameplay video first", bad: "Couldn't open this video. Try an MP4.", prev: "▶ Preview", dl: "⬇ Download", hook: "WAIT FOR IT… 🔥" };
  var st = { len: 30, n: 3, stamp: "passed" }, v = $("gcVid"), file = null, clips = [], busy = false, small = document.createElement("canvas"); small.width = 36; small.height = 64;
  var cv = $("gcStage"), cx = cv.getContext("2d"); $("gcTitle").value = T.hook;
  function msg(t, p) { $("gcMsg").textContent = t || ""; $("gcBar").style.width = (p == null ? 0 : Math.round(p * 100)) + "%"; }
  function opts() { return { title: $("gcTitle").value.trim(), handle: $("gcHandle").value.trim(), stamp: st.stamp, lang: AR ? "ar" : "en" }; }
  [["gcLen", "len", Number], ["gcCount", "n", Number], ["gcStamp", "stamp", String]].forEach(function (d) {
    var g = $(d[0]); g.addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return; st[d[1]] = d[2](b.getAttribute("data-v")); g.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("active", c === b); }); });
  });
  $("gcFile").addEventListener("change", function () {
    var f = this.files && this.files[0]; if (!f) return; file = f; clips = []; $("gcList").textContent = ""; $("gcStageBox").hidden = true;
    if (v.src) URL.revokeObjectURL(v.src); v.src = URL.createObjectURL(f); v.load(); $("gcName").textContent = f.name; msg("");
  });
  function seek(t) { return typeof qtVxSeek === "function" ? qtVxSeek(v, t) : new Promise(function (r) { v.addEventListener("seeked", r, { once: true }); v.currentTime = t; }); }
  function ready() { // never hang: fail fast on a broken file, give up after 15 s
    if (v.error) return Promise.reject(v.error); if (v.readyState >= 1 && isFinite(v.duration)) return Promise.resolve();
    return new Promise(function (ok, bad) { var to = setTimeout(function () { bad(new Error("timeout")); }, 15000); v.addEventListener("loadedmetadata", function () { clearTimeout(to); ok(); }, { once: true }); v.addEventListener("error", function () { clearTimeout(to); bad(v.error); }, { once: true }); });
  }
  $("gcFind").addEventListener("click", async function () {
    if (busy) return; if (!file) { msg(T.pick); return; } busy = true; this.disabled = true;
    try {
      await ready(); var dur = v.duration, step = .25;
      msg(T.reading, .05); var mono = await qtVxMono16k(file), levels = qtVxLevels(mono.samples, mono.rate, step);
      // motion: sample the picture every ~1 s (max 300 looks), compare tiny greyscale frames
      var mc = document.createElement("canvas"); mc.width = 48; mc.height = 27; var mx = mc.getContext("2d", { willReadFrequently: true }), looks = Math.min(300, Math.ceil(dur)), prev = null, mv = [];
      v.muted = true; v.pause();
      for (var i = 0; i < looks; i++) {
        var tt = (i + .5) * dur / looks; await seek(Math.min(tt, dur - .05)); mx.drawImage(v, 0, 0, 48, 27);
        var d = mx.getImageData(0, 0, 48, 27).data, cur = new Float32Array(48 * 27), diff = 0;
        for (var p = 0, q = 0; p < d.length; p += 4, q++) { cur[q] = d[p] * .3 + d[p + 1] * .59 + d[p + 2] * .11; if (prev) diff += Math.abs(cur[q] - prev[q]); }
        mv.push(prev ? diff / cur.length : 0); prev = cur; if (i % 6 === 0) msg(T.motion + " " + Math.round(i / looks * 100) + "%", .15 + .8 * i / looks);
      }
      var motion = levels.map(function (_, j) { return mv[Math.min(mv.length - 1, Math.floor(j * step / dur * looks))] || 0; });
      clips = qtGcPick(qtGcScore(levels, motion), step, dur, Math.min(st.len, dur), st.n);
      await renderList(); msg(clips.length ? T.found(clips.length) : T.none, clips.length ? 1 : 0);
      if (typeof qtEvent === "function") qtEvent("gta_clip_find");
    } catch (e) { msg(T.bad); }
    busy = false; this.disabled = false;
  });
  async function renderList() {
    var list = $("gcList"); list.textContent = "";
    for (var i = 0; i < clips.length; i++) {
      var c = clips[i], card = document.createElement("div"); card.className = "gc-card";
      var th = document.createElement("canvas"); th.width = 216; th.height = 384; await seek(Math.min(c.peak + .2, v.duration - .05)); qtGcDraw(th.getContext("2d"), 216, 384, v, c.peak - c.a + .8, c.b - c.a, c, opts(), small);
      var meta = document.createElement("div"); meta.className = "gc-meta";
      var b = document.createElement("b"); b.textContent = "#" + c.rank + " · ⁦" + qtGcFmt(c.a) + " – " + qtGcFmt(c.b) + "⁩"; // isolate keeps start → end order in Arabic
      var bar = document.createElement("span"); bar.className = "gc-score"; var fill = document.createElement("i"); fill.style.width = Math.round(Math.min(1, Math.max(.15, c.score / (clips[0].score || 1))) * 100) + "%"; bar.appendChild(fill);
      var row = document.createElement("div"); row.className = "gc-btns";
      var pv = document.createElement("button"); pv.type = "button"; pv.className = "chip"; pv.textContent = T.prev; pv.addEventListener("click", preview.bind(null, c));
      var dl = document.createElement("button"); dl.type = "button"; dl.className = "btn"; dl.textContent = T.dl; dl.addEventListener("click", function () { exportClip(this.c); }); dl.c = c;
      row.appendChild(pv); row.appendChild(dl); meta.appendChild(b); meta.appendChild(bar); meta.appendChild(row); card.appendChild(th); card.appendChild(meta); list.appendChild(card);
    }
    $("gcAll").hidden = clips.length < 2;
  }
  var playing = null;
  function preview(c) {
    if (busy) return; $("gcStageBox").hidden = false; $("gcStageBox").scrollIntoView({ behavior: "smooth", block: "center" });
    v.currentTime = c.a; v.muted = false; playing = c; v.play().catch(function () { v.muted = true; v.play().catch(function () {}); });
  }
  (function tick() {
    if (playing && !v.paused) { if (v.currentTime >= playing.b) { v.pause(); } cx.setTransform(1, 0, 0, 1, 0, 0); qtGcDraw(cx, cv.width, cv.height, v, v.currentTime - playing.a, playing.b - playing.a, playing, opts(), small); }
    requestAnimationFrame(tick);
  })();
  async function exportClip(c, silent) {
    if (busy && !silent) return; if (!silent && typeof qtVxUnlockAudio === "function") qtVxUnlockAudio(); busy = true; v.pause(); playing = null;
    try {
      var o = opts(), total = c.b - c.a, big = document.createElement("canvas"); big.width = 36; big.height = 64;
      var r = await qtVxExport({ file: file, video: v, W: 1080, H: 1920, fps: 30, segs: [[c.a, c.b]],
        draw: function (x, srcT, outT, W, H) { qtGcDraw(x, W, H, v, outT, total, c, o, big); },
        onProgress: function (p) { msg(T.exp + " #" + c.rank + " · " + Math.round(p * 100) + "%", p); } });
      if (!r) throw new Error(T.noexp);
      qtVxDownload(r.blob, "gta6-clip-" + c.rank + (r.blob.type.indexOf("webm") >= 0 ? ".webm" : ".mp4")); msg(T.done, 1);
      if (typeof qtEvent === "function") qtEvent("gta_clip_export");
    } catch (e) { msg(T.fail + (e && e.message || e)); }
    if (!silent) busy = false;
  }
  $("gcAll").addEventListener("click", async function () {
    if (busy || !clips.length) return; if (typeof qtVxUnlockAudio === "function") qtVxUnlockAudio(); this.disabled = true; busy = true;
    for (var i = 0; i < clips.length; i++) { await exportClip(clips[i], true); await new Promise(function (r) { setTimeout(r, 600); }); }
    busy = false; this.disabled = false;
  });
})();
if (typeof module !== "undefined") module.exports = { qtGcScore: qtGcScore, qtGcPick: qtGcPick, qtGcZoom: qtGcZoom, qtGcFmt: qtGcFmt, qtGcRobust: qtGcRobust, qtGcMedian: qtGcMedian };
