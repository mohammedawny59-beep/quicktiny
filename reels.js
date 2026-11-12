// QuickTiny Horizontal → Vertical: turn a 16:9 video into 9:16 / 1:1 / 4:5 for Reels, TikTok and Shorts — blurred fill,
// smart crop or a colour background, optional headline, trim — exported as MP4 with the original sound, on-device.

// Headline tokens: *word* is highlighted.
function qtRvTokens(text) {
  var out = [], hi = false;
  String(text || "").replace(/\s+/g, " ").trim().split(" ").forEach(function (raw) {
    if (!raw) return; var w = raw, st = w.charAt(0) === "*"; if (st) { hi = true; w = w.slice(1); }
    var en = w.length > 0 && w.charAt(w.length - 1) === "*"; if (en) w = w.slice(0, -1);
    if (w) out.push({ w: w, hi: hi }); if (en) hi = false;
  });
  return out;
}
// Layout of the source video inside the frame (top space is reserved for a headline when there is one).
function qtRvLayout(vw, vh, W, H, s) {
  if (s.mode === "crop") return qtVxPlace(vw, vh, W, H, "fill", s.focus, .5);
  var r = qtVxPlace(vw, vh, W, H, "fit"), z = s.zoom || 1, w = r.w * z, h = r.h * z;
  var head = s.title && s.title.trim() ? H * .2 : 0, y = (H - h) / 2;
  if (head && y < head + H * .02) y = Math.min(H - h, head + H * .02); else if (head) y = Math.max(y, head + (H - head - h) / 2 - H * .02);
  return { x: w > W ? (W - w) * s.focus : (W - w) / 2, y: y, w: w, h: h };
}
function qtRvDraw(x, W, H, v, s, low) {
  var vw = v.videoWidth || 16, vh = v.videoHeight || 9, r = qtRvLayout(vw, vh, W, H, s);
  if (s.mode === "color") { x.fillStyle = s.bg; x.fillRect(0, 0, W, H); }
  else if (s.mode === "blur") {
    // cheap, smooth blur: draw tiny then scale up
    var lx = low.getContext("2d"), f = qtVxPlace(vw, vh, low.width, low.height, "fill");
    lx.drawImage(v, f.x, f.y, f.w, f.h);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
    x.drawImage(low, 0, 0, W, H); x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(0, 0, W, H);
  } else { x.fillStyle = "#000"; x.fillRect(0, 0, W, H); }
  x.save();
  if (s.mode !== "crop" && s.round) {
    var rad = Math.min(W, H) * .035; x.beginPath(); if (x.roundRect) x.roundRect(r.x, r.y, r.w, r.h, rad); else x.rect(r.x, r.y, r.w, r.h); x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = W * .04; x.fillStyle = "#000"; x.fill(); x.restore(); x.clip();
  }
  x.drawImage(v, r.x, r.y, r.w, r.h); x.restore();
  if (s.title && s.title.trim() && s.mode !== "crop") qtRvTitle(x, W, H, s, r);
}
function qtRvTitle(x, W, H, s, r) {
  var toks = qtRvTokens(s.title), ar = /[؀-ۿ]/.test(s.title), fam = ar ? '"QT Lalezar", "QT Arabic", sans-serif' : 'Sora, "Arial Black", sans-serif', wt = ar ? "400 " : "800 ";
  var maxW = W * .88, room = Math.max(H * .1, r.y - H * .04), fs = Math.min(W * .095, room * .6), lines;
  var measure = function (t, f) { x.font = wt + f + "px " + fam; return x.measureText(t).width; };
  for (; fs > W * .04; fs -= 2) {
    lines = []; var cur = [], cw = 0, sp = measure(" ", fs);
    toks.forEach(function (t) { var w = measure(t.w, fs); if (cur.length && cw + sp + w > maxW) { lines.push(cur); cur = []; cw = 0; } cw += (cur.length ? sp : 0) + w; cur.push(t); });
    if (cur.length) lines.push(cur);
    if (lines.length * fs * 1.15 <= room && lines.length <= 3) break;
  }
  var lh = fs * 1.15, y0 = (r.y - lines.length * lh) / 2 + lh / 2;
  x.textBaseline = "middle"; x.lineJoin = "round";
  lines.forEach(function (line, li) {
    var sp = measure(" ", fs), ws = line.map(function (t) { return measure(t.w, fs); }), tw = ws.reduce(function (a, b) { return a + b; }, 0) + sp * (line.length - 1);
    var cx = ar ? (W + tw) / 2 : (W - tw) / 2, y = y0 + li * lh;
    line.forEach(function (t, i) {
      var w = ws[i], mx = ar ? cx - w : cx; cx += (ar ? -1 : 1) * (w + sp);
      x.save(); x.font = wt + fs + "px " + fam; x.direction = ar ? "rtl" : "ltr"; x.textAlign = ar ? "right" : "left";
      var tx = ar ? mx + w : mx;
      x.lineWidth = fs * .14; x.strokeStyle = "rgba(0,0,0,.85)"; x.strokeText(t.w, tx, y);
      x.fillStyle = t.hi ? s.accent : "#ffffff"; x.fillText(t.w, tx, y); x.restore();
    });
  });
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("rvFile")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? { exp: "جارٍ تجهيز الفيديو… أبقِ الصفحة مفتوحة", done: "✓ تم تنزيل الفيديو", fail: "تعذّر إنشاء الفيديو: ", noEnc: "متصفحك لا يدعم تصدير الفيديو هنا. جرّب كروم أو إيدج.", silent: " (بدون صوت — متصفحك لا يدعم ترميز الصوت)", sec: "ث" }
             : { exp: "Rendering your video… keep this page open", done: "✓ Video downloaded", fail: "Couldn't create the video: ", noEnc: "This browser can't export video here. Try Chrome or Edge.", silent: " (silent — this browser can't encode audio)", sec: "s" };
  var SIZES = { "9:16": [1080, 1920], "1:1": [1080, 1080], "4:5": [1080, 1350] };
  var st = { ratio: "9:16", mode: "blur", focus: .5, zoom: 1, bg: "#111827", accent: "#ffd400", title: "", round: true, a: 0, b: 0 };
  try { var sv = JSON.parse(localStorage.getItem("qtReels") || "null"); if (sv) ["ratio", "mode", "zoom", "bg", "accent", "round"].forEach(function (k) { if (sv[k] != null) st[k] = sv[k]; }); } catch (e) {}
  if (window.qtBrand) qtBrand.apply(st, { accent: "accent" });
  function save() { try { localStorage.setItem("qtReels", JSON.stringify({ ratio: st.ratio, mode: st.mode, zoom: st.zoom, bg: st.bg, accent: st.accent, round: st.round })); } catch (e) {} }
  var file = null, url = null, busy = false, last = null;
  var v = $("rvVideo"), cv = $("rvCanvas"), x = cv.getContext("2d"), low = document.createElement("canvas");
  function size() { var z = SIZES[st.ratio]; cv.width = z[0] / 2; cv.height = z[1] / 2; low.width = Math.ceil(cv.width / 14); low.height = Math.ceil(cv.height / 14); $("rvScreen").style.aspectRatio = z[0] + " / " + z[1]; }
  function draw() { if (!v.videoWidth) return; x.setTransform(1, 0, 0, 1, 0, 0); qtRvDraw(x, cv.width, cv.height, v, st, low); }
  (function tick() { if (!v.paused) { if (st.b > st.a && v.currentTime >= st.b) v.currentTime = st.a; draw(); } requestAnimationFrame(tick); })();
  v.addEventListener("seeked", draw); v.addEventListener("loadeddata", draw);
  v.addEventListener("loadedmetadata", function () {
    st.a = 0; st.b = v.duration; $("rvA").max = $("rvB").max = v.duration.toFixed(1); $("rvA").value = 0; $("rvB").value = v.duration.toFixed(1); trimLabel();
    $("rvStage").hidden = false; $("rvGo").disabled = false; v.currentTime = .01;
  });
  function trimLabel() { $("rvTrim").textContent = st.a.toFixed(1) + " – " + st.b.toFixed(1) + T.sec + " (" + (st.b - st.a).toFixed(1) + T.sec + ")"; }
  function load(f) { if (!f || busy) return; file = f; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f); v.src = url; $("rvName").textContent = f.name; $("rvNext").hidden = true; $("rvStatus").textContent = ""; }
  $("rvFile").addEventListener("change", function () { load(this.files[0]); this.value = ""; });
  var drop = $("rvDrop");
  ["dragenter", "dragover"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (ev) { var f = ev.dataTransfer.files[0]; if (f) load(f); });
  function sync() {
    [["#rvRatio", "data-r", "ratio"], ["#rvMode", "data-m", "mode"]].forEach(function (g) { document.querySelectorAll(g[0] + " .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute(g[1]) === st[g[2]]); b.setAttribute("aria-pressed", b.getAttribute(g[1]) === st[g[2]] ? "true" : "false"); }); });
    $("rvFocus").value = Math.round(st.focus * 100); $("rvZoom").value = Math.round(st.zoom * 100); $("rvBg").value = st.bg; $("rvAccent").value = st.accent; $("rvRound").checked = st.round; $("rvTitle").value = st.title;
    $("rvBgRow").hidden = st.mode !== "color"; $("rvZoomRow").hidden = st.mode === "crop"; $("rvTitleRow").hidden = st.mode === "crop";
  }
  [["#rvRatio", "data-r", "ratio"], ["#rvMode", "data-m", "mode"]].forEach(function (g) { document.querySelectorAll(g[0] + " .chip").forEach(function (b) { b.addEventListener("click", function () { st[g[2]] = b.getAttribute(g[1]); if (g[2] === "ratio") size(); save(); sync(); draw(); }); }); });
  $("rvFocus").addEventListener("input", function () { st.focus = this.value / 100; draw(); });
  $("rvZoom").addEventListener("input", function () { st.zoom = this.value / 100; save(); draw(); });
  $("rvBg").addEventListener("input", function () { st.bg = this.value; save(); draw(); });
  $("rvAccent").addEventListener("input", function () { st.accent = this.value; save(); draw(); });
  $("rvRound").addEventListener("change", function () { st.round = this.checked; save(); draw(); });
  $("rvTitle").addEventListener("input", function () { st.title = this.value.slice(0, 90); draw(); });
  $("rvA").addEventListener("input", function () { st.a = Math.min(+this.value, st.b - .5); this.value = st.a; v.currentTime = st.a; trimLabel(); });
  $("rvB").addEventListener("input", function () { st.b = Math.max(+this.value, st.a + .5); this.value = st.b; v.currentTime = Math.max(st.a, st.b - .1); trimLabel(); });
  $("rvPlay").addEventListener("click", function () { if (v.paused) { if (v.currentTime < st.a || v.currentTime >= st.b) v.currentTime = st.a; v.play(); this.textContent = "❚❚"; } else { v.pause(); this.textContent = "▶"; } });
  $("rvGo").addEventListener("click", async function () {
    if (busy || !file) return; qtVxUnlockAudio(); busy = true; this.disabled = true; $("rvBar").hidden = false; $("rvStatus").textContent = T.exp; v.pause(); $("rvPlay").textContent = "▶";
    try {
      var z = SIZES[st.ratio], big = document.createElement("canvas"); big.width = Math.ceil(z[0] / 14); big.height = Math.ceil(z[1] / 14);
      var r = await qtVxExport({ file: file, video: v, W: z[0], H: z[1], fps: 30, segs: [[st.a, st.b]],
        draw: function (cx, srcT, outT, W, H) { qtRvDraw(cx, W, H, v, st, big); },
        onProgress: function (p) { $("rvBarFill").style.width = Math.round(p * 100) + "%"; $("rvStatus").textContent = T.exp + " " + Math.round(p * 100) + "%"; } });
      if (!r) throw new Error(T.noEnc);
      last = r.blob; qtVxDownload(r.blob, file.name.replace(/\.[^.]+$/, "").slice(0, 60) + "-" + st.ratio.replace(":", "x") + (r.blob.type.indexOf("webm") >= 0 ? ".webm" : ".mp4"));
      $("rvStatus").textContent = T.done + (r.audio ? "" : T.silent); $("rvNext").hidden = false;
      if (typeof qtEvent === "function") qtEvent("vertical_export");
    } catch (e) { $("rvStatus").textContent = T.fail + (e && e.message || e); }
    $("rvBar").hidden = true; busy = false; this.disabled = false; draw();
  });
  document.querySelectorAll("#rvNext [data-to]").forEach(function (b) { b.addEventListener("click", function () { if (last) qtVxSendTo(last, (file ? file.name.replace(/\.[^.]+$/, "") : "video") + "-vertical.mp4", b.getAttribute("data-to"), b.getAttribute("data-input")); }); });
  size(); sync();
  if (document.fonts && document.fonts.load) Promise.all(['400 60px "QT Lalezar"', '800 60px Sora'].map(function (f) { return document.fonts.load(f, "Ab ابج").catch(function () {}); })).then(draw);
})();
if (typeof module !== "undefined") module.exports = { qtRvTokens: qtRvTokens, qtRvLayout: qtRvLayout };
