// QuickTiny Silence Remover: finds the pauses in your video's audio and cuts them out (jump cuts) — adjustable
// threshold, minimum pause and padding, live preview that skips the cuts, MP4 export with sound. On-device.

// Suggested threshold: a few dB above the quiet floor of the recording (10th percentile), clamped to a sane range.
function qtSlAuto(levels) {
  var v = levels.filter(function (x) { return x > -119; }).sort(function (a, b) { return a - b; });
  if (!v.length) return -40;
  var floor = v[Math.floor(v.length * .1)], speech = v[Math.floor(v.length * .7)];
  return Math.round(Math.max(-60, Math.min(-22, Math.min(floor + 10, (floor + speech) / 2))));
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("slFile")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? { reading: "جارٍ تحليل الصوت…", noAudio: "تعذّر قراءة الصوت من هذا الفيديو. جرّب ملف MP4 أو MOV.", exp: "جارٍ تجهيز الفيديو… أبقِ الصفحة مفتوحة", done: "✓ تم تنزيل الفيديو", fail: "تعذّر إنشاء الفيديو: ", noEnc: "متصفحك لا يدعم تصدير الفيديو هنا. جرّب كروم أو إيدج.", silent: " (بدون صوت — متصفحك لا يدعم ترميز الصوت)", s: "ث", cuts: "مقاطع محذوفة", from: "من", to: "إلى", removed: "حذف", none: "لم نجد سكتات بهذه الإعدادات — خفّض الحد أو قلّل مدة السكتة." }
             : { reading: "Analysing the audio…", noAudio: "Couldn't read the audio in this video. Try an MP4 or MOV file.", exp: "Rendering your video… keep this page open", done: "✓ Video downloaded", fail: "Couldn't create the video: ", noEnc: "This browser can't export video here. Try Chrome or Edge.", silent: " (silent — this browser can't encode audio)", s: "s", cuts: "cuts", from: "from", to: "to", removed: "removed", none: "No pauses found with these settings — raise the threshold or shorten the minimum pause." };
  var st = { thr: -40, min: .4, pad: .1 };
  try { var sv = JSON.parse(localStorage.getItem("qtSilence") || "null"); if (sv) ["min", "pad"].forEach(function (k) { if (sv[k] != null) st[k] = sv[k]; }); } catch (e) {}
  function save() { try { localStorage.setItem("qtSilence", JSON.stringify({ min: st.min, pad: st.pad })); } catch (e) {} }
  var file = null, url = null, levels = null, dur = 0, keep = null, busy = false, last = null, WIN = .02;
  var v = $("slVideo"), wave = $("slWave"), wx = wave.getContext("2d");
  function recompute() {
    if (!levels) return;
    keep = qtVxKeep(levels, WIN, dur, st.thr, st.min, st.pad);
    var kept = qtVxTotal(keep), cut = dur - kept;
    $("slStats").innerHTML = "<b>" + dur.toFixed(1) + T.s + " → " + kept.toFixed(1) + T.s + "</b> · " + T.removed + " " + cut.toFixed(1) + T.s + " (" + Math.round(cut / dur * 100) + "%) · " + Math.max(0, keep.length - 1 + (keep[0][0] > 0 ? 1 : 0)) + " " + T.cuts;
    $("slStatus").textContent = keep.length === 1 && keep[0][1] - keep[0][0] > dur - .1 ? T.none : "";
    drawWave();
  }
  function drawWave() {
    var W = wave.width = wave.clientWidth * (window.devicePixelRatio || 1), H = wave.height = 110 * (window.devicePixelRatio || 1);
    wx.clearRect(0, 0, W, H); if (!levels) return;
    var cs = getComputedStyle(document.documentElement), kc = "#3be2ff", cc = "rgba(255,80,110,.85)";
    // cut regions
    wx.fillStyle = "rgba(255,80,110,.13)"; var t = 0;
    keep.forEach(function (k) { if (k[0] > t) wx.fillRect(t / dur * W, 0, (k[0] - t) / dur * W, H); t = k[1]; }); if (t < dur) wx.fillRect(t / dur * W, 0, (dur - t) / dur * W, H);
    var step = Math.max(1, Math.floor(levels.length / W)), ki = 0;
    for (var px = 0; px < W; px++) {
      var i0 = Math.floor(px / W * levels.length), m = -120;
      for (var j = i0; j < Math.min(levels.length, i0 + step); j++) m = Math.max(m, levels[j]);
      var amp = Math.max(0, (m + 60) / 60), h = Math.max(1, amp * H * .9), tt = px / W * dur;
      while (ki < keep.length - 1 && tt > keep[ki][1]) ki++;
      wx.fillStyle = tt >= keep[ki][0] && tt <= keep[ki][1] ? kc : cc; wx.fillRect(px, (H - h) / 2, 1, h);
    }
    // threshold line
    var ty = (1 - Math.max(0, (st.thr + 60) / 60)) * H * .45; wx.fillStyle = "rgba(255,255,255,.35)"; wx.fillRect(0, H / 2 - (H / 2 - ty), W, 1); wx.fillRect(0, H / 2 + (H / 2 - ty), W, 1);
    // playhead
    wx.fillStyle = "#fff"; wx.fillRect(v.currentTime / dur * W, 0, 2, H);
  }
  // preview skips the cut parts
  (function tick() {
    if (!v.paused && keep && $("slSkip").checked) {
      var t = v.currentTime, inKeep = keep.some(function (k) { return t >= k[0] && t < k[1] - .01; });
      if (!inKeep) { var nx = keep.find(function (k) { return k[0] > t; }); if (nx) v.currentTime = nx[0]; else v.pause(); }
    }
    if (levels && !v.paused) drawWave();
    requestAnimationFrame(tick);
  })();
  wave.addEventListener("click", function (e) { if (!dur) return; var r = wave.getBoundingClientRect(), p = (e.clientX - r.left) / r.width; v.currentTime = Math.max(0, Math.min(dur, p * dur)); drawWave(); });
  window.addEventListener("resize", drawWave);

  async function load(f) {
    if (!f || busy) return; busy = true; file = f; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f); v.src = url;
    $("slName").textContent = f.name; $("slStage").hidden = false; $("slNext").hidden = true; $("slStatus").textContent = T.reading; $("slGo").disabled = true;
    try {
      var a = await qtVxMono16k(f); dur = a.duration; levels = qtVxLevels(a.samples, a.rate, WIN);
      st.thr = qtSlAuto(levels); sync(); recompute(); $("slGo").disabled = false;
    } catch (e) { $("slStatus").textContent = T.noAudio; levels = null; }
    busy = false;
  }
  $("slFile").addEventListener("change", function () { load(this.files[0]); this.value = ""; });
  var drop = $("slDrop");
  ["dragenter", "dragover"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (ev) { var f = ev.dataTransfer.files[0]; if (f) load(f); });
  function sync() {
    $("slThr").value = st.thr; $("slThrV").textContent = st.thr + " dB"; $("slMin").value = st.min; $("slMinV").textContent = st.min.toFixed(2) + T.s; $("slPad").value = st.pad; $("slPadV").textContent = st.pad.toFixed(2) + T.s;
  }
  [["slThr", "thr"], ["slMin", "min"], ["slPad", "pad"]].forEach(function (c) { $(c[0]).addEventListener("input", function () { st[c[1]] = +this.value; save(); sync(); recompute(); }); });
  $("slAuto").addEventListener("click", function () { if (levels) { st.thr = qtSlAuto(levels); sync(); recompute(); } });
  $("slGo").addEventListener("click", async function () {
    if (busy || !file || !keep) return; qtVxUnlockAudio(); busy = true; this.disabled = true; $("slBar").hidden = false; v.pause();
    try {
      var f = qtVxFit(v.videoWidth, v.videoHeight, 1920);
      var r = await qtVxExport({ file: file, video: v, W: f[0], H: f[1], fps: 30, segs: keep,
        draw: function (cx, srcT, outT, W, H) { cx.drawImage(v, 0, 0, W, H); },
        onProgress: function (p) { $("slBarFill").style.width = Math.round(p * 100) + "%"; $("slStatus").textContent = T.exp + " " + Math.round(p * 100) + "%"; } });
      if (!r) throw new Error(T.noEnc);
      last = r.blob; qtVxDownload(r.blob, file.name.replace(/\.[^.]+$/, "").slice(0, 60) + "-no-silence" + (r.blob.type.indexOf("webm") >= 0 ? ".webm" : ".mp4"));
      $("slStatus").textContent = T.done + (r.audio ? "" : T.silent); $("slNext").hidden = false;
      if (typeof qtEvent === "function") qtEvent("silence_export");
    } catch (e) { $("slStatus").textContent = T.fail + (e && e.message || e); }
    $("slBar").hidden = true; busy = false; this.disabled = false;
  });
  document.querySelectorAll("#slNext [data-to]").forEach(function (b) { b.addEventListener("click", function () { if (last) qtVxSendTo(last, (file ? file.name.replace(/\.[^.]+$/, "") : "video") + "-no-silence.mp4", b.getAttribute("data-to"), b.getAttribute("data-input")); }); });
  sync();
})();
if (typeof module !== "undefined") module.exports = { qtSlAuto: qtSlAuto };
