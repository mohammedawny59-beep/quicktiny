// QuickTiny YouTube Thumbnail Maker: your photo (background removed on-device with U²-Net-p), a huge outlined title with
// highlighted words, colour themes, badge and arrow — 1280×720 JPG/PNG under YouTube's 2 MB limit. Nothing is uploaded.

var QT_TH_THEMES = {
  fire: { bg: ["#ff4d00", "#8a0b00"], ray: "#ffd000", accent: "#ffe600" },
  neon: { bg: ["#7b2bff", "#12002e"], ray: "#ff3df2", accent: "#3be2ff" },
  ocean: { bg: ["#00b4ff", "#002a6b"], ray: "#7dffef", accent: "#ffe600" },
  lime: { bg: ["#c6ff00", "#1f7a00"], ray: "#ffffff", accent: "#ff2d55" },
  dark: { bg: ["#2b2f3a", "#06070a"], ray: "#5b5bff", accent: "#ffd400" },
  sun: { bg: ["#ffe600", "#ff9500"], ray: "#ffffff", accent: "#e8001c" },
  vice: { bg: ["#ff2d95", "#2b0b5c"], ray: "#ffb347", accent: "#3cf0ff" }
};
function qtThAr(s) { return /[؀-ۿ]/.test(s || ""); }
// Split "Make *money* online" into words with a highlight flag; *...* may span several words.
function qtThTokens(text) {
  var out = [], hi = false;
  String(text || "").replace(/\s+/g, " ").trim().split(" ").forEach(function (raw) {
    if (!raw) return;
    var start = raw.charAt(0) === "*", w = raw;
    if (start) { hi = true; w = w.slice(1); }
    var end = w.length > 0 && w.charAt(w.length - 1) === "*";
    if (end) w = w.slice(0, -1);
    if (w) out.push({ w: w, hi: hi });
    if (end) hi = false;
  });
  return out;
}
// Greedy line breaking with a width function; returns arrays of tokens.
function qtThLines(tokens, maxW, width) {
  var lines = [], cur = [], cw = 0, space = width(" ");
  tokens.forEach(function (t) {
    var w = width(t.w);
    if (cur.length && cw + space + w > maxW) { lines.push(cur); cur = []; cw = 0; }
    cw += (cur.length ? space : 0) + w; cur.push(t);
  });
  if (cur.length) lines.push(cur);
  return lines;
}
// Largest font size (step 4) for which the title fits in boxW×boxH within maxLines.
function qtThFit(tokens, boxW, boxH, maxLines, measure, lo, hi) {
  for (var fs = hi; fs >= lo; fs -= 4) {
    var lines = qtThLines(tokens, boxW, function (s) { return measure(s, fs); });
    if (lines.length <= maxLines && lines.length * fs * 1.08 <= boxH && lines.every(function (l) { return l.length > 1 || measure(l[0].w, fs) <= boxW; })) return { fs: fs, lines: lines };
  }
  return { fs: lo, lines: qtThLines(tokens, boxW, function (s) { return measure(s, lo); }) };
}

function qtThRender(x, W, H, s, A) {
  var th = QT_TH_THEMES[s.theme] || QT_TH_THEMES.fire, accent = s.accent || th.accent, ar = qtThAr(s.title), u = W / 1280;
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
  // background
  if (A.bg) {
    var b = A.bg, k = Math.max(W / b.width, H / b.height);
    if (s.bgBlur && "filter" in x) x.filter = "blur(" + (8 * u) + "px)";
    x.drawImage(b, (W - b.width * k) / 2, (H - b.height * k) / 2, b.width * k, b.height * k); x.filter = "none";
    x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(0, 0, W, H);
  } else {
    var g = x.createRadialGradient(W * .5, H * .45, 0, W * .5, H * .5, W * .75); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    // sun rays
    x.save(); x.translate(W * (s.layout === "left" ? .3 : s.layout === "right" ? .7 : .5), H * .55); x.globalAlpha = .13; x.fillStyle = th.ray;
    for (var r = 0; r < 18; r++) { x.rotate(Math.PI * 2 / 18); x.beginPath(); x.moveTo(0, 0); x.lineTo(W, -60 * u); x.lineTo(W, 60 * u); x.closePath(); x.fill(); }
    x.restore();
  }
  var vg = x.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.45)"); x.fillStyle = vg; x.fillRect(0, 0, W, H);

  // where things go; Arabic titles mirror the side layouts so text sits on the reading-start side
  var lay = s.layout, flip = ar && (lay === "left" || lay === "right"); if (flip) lay = lay === "left" ? "right" : "left";
  var personBox = null, textBox;
  if (A.person && lay !== "center") {
    if (lay === "right") personBox = { x: W * .5, w: W * .5 }; else if (lay === "left") personBox = { x: 0, w: W * .5 }; else personBox = { x: W * .2, w: W * .6 };
  }
  if (lay === "right") textBox = { x: 46 * u, y: 60 * u, w: W * .52, h: H - 120 * u };
  else if (lay === "left") textBox = { x: W * .48, y: 60 * u, w: W * .52 - 46 * u, h: H - 120 * u };
  else if (lay === "bottom") textBox = { x: 50 * u, y: 36 * u, w: W - 100 * u, h: H * .42 };
  else textBox = { x: 70 * u, y: 70 * u, w: W - 140 * u, h: H - 140 * u };
  if (!A.person) { lay = "center"; textBox = { x: 70 * u, y: 70 * u, w: W - 140 * u, h: H - 140 * u }; }
  // the badge sits on the photo side for side layouts; otherwise the title moves down to make room for it
  var badgeLeft = lay === "left" ? true : lay === "right" ? false : !ar;
  if (s.badge && (lay === "center" || lay === "bottom")) { textBox.y += 70 * u; textBox.h -= 70 * u; }

  // person (sticker outline + glow)
  if (A.person && personBox) {
    var p = A.person, ph = lay === "bottom" ? H * .7 : H * 1.02, pk = Math.min(ph / p.height, personBox.w * 1.15 / p.width), pw = p.width * pk; ph = p.height * pk;
    var px = personBox.x + (personBox.w - pw) / 2, py = H - ph + (A.cut ? 0 : -30 * u);
    if (!A.cut) { // plain photo: framed card
      x.save(); x.shadowColor = "rgba(0,0,0,.5)"; x.shadowBlur = 40 * u; x.fillStyle = "#fff"; var fr = 10 * u; x.fillRect(px - fr, py - fr, pw + fr * 2, ph + fr * 2); x.restore(); x.drawImage(p, px, py, pw, ph);
    } else {
      var sil = qtThSilhouette(p, s.outline ? "#ffffff" : null);
      x.save(); x.shadowColor = accent; x.shadowBlur = 50 * u; var o = (s.outline ? 9 : 0) * u;
      if (s.outline) for (var a = 0; a < 16; a++) { var an = a / 16 * Math.PI * 2; x.drawImage(sil, px + Math.cos(an) * o, py + Math.sin(an) * o, pw, ph); }
      else x.drawImage(sil || p, px, py, pw, ph);
      x.restore(); x.drawImage(p, px, py, pw, ph);
    }
  }

  // title
  var toks = qtThTokens(s.upper && !ar ? String(s.title || "").toUpperCase() : s.title);
  var fam = ar ? '"QT Lalezar", "QT Arabic", sans-serif' : 'Sora, "Arial Black", Impact, sans-serif', wt = ar ? "400 " : "800 ";
  var measure = function (str, fs) { x.font = wt + fs + "px " + fam; return x.measureText(str).width; };
  var fit = qtThFit(toks, textBox.w, textBox.h, lay === "bottom" ? 2 : 4, measure, 56 * u, (ar ? 190 : 170) * u), fs = fit.fs, lh = fs * (ar ? 1.18 : 1.04);
  var total = fit.lines.length * lh, y0 = textBox.y + (textBox.h - total) / 2 + lh / 2;
  x.font = wt + fs + "px " + fam; x.textBaseline = "middle"; x.lineJoin = "round"; x.direction = ar ? "rtl" : "ltr";
  var align = lay === "center" || lay === "bottom" ? "center" : (ar ? "right" : "left");
  fit.lines.forEach(function (line, li) {
    var y = y0 + li * lh, sp = measure(" ", fs), widths = line.map(function (t) { return measure(t.w, fs); }), tw = widths.reduce(function (a, b) { return a + b; }, 0) + sp * (line.length - 1);
    var startX = align === "center" ? W / 2 - tw / 2 : align === "left" ? textBox.x : textBox.x + textBox.w - tw;
    if (lay === "center" || lay === "bottom") startX = textBox.x + (textBox.w - tw) / 2;
    var cx = ar ? startX + tw : startX;
    line.forEach(function (t, i) {
      var w = widths[i], mx = ar ? cx - w : cx; cx += (ar ? -1 : 1) * (w + sp);
      x.save(); x.textAlign = "left"; x.direction = "ltr";
      if (t.hi && s.hiStyle === "box") { x.fillStyle = accent; x.save(); x.translate(mx + w / 2, y); x.rotate(-.02); x.fillRect(-w / 2 - fs * .12, -fs * .55, w + fs * .24, fs * 1.08); x.restore(); }
      x.lineWidth = fs * .16; x.strokeStyle = "#000"; x.shadowColor = "rgba(0,0,0,.6)"; x.shadowBlur = 0; x.shadowOffsetX = fs * .05; x.shadowOffsetY = fs * .07;
      x.direction = ar ? "rtl" : "ltr"; x.textAlign = ar ? "right" : "left";
      var tx = ar ? mx + w : mx;
      if (!(t.hi && s.hiStyle === "box")) x.strokeText(t.w, tx, y);
      x.shadowColor = "transparent";
      x.fillStyle = t.hi ? (s.hiStyle === "box" ? qtThInk(accent) : accent) : "#ffffff"; x.fillText(t.w, tx, y);
      x.restore();
    });
  });

  // arrow from the title towards the person
  if (s.arrow && A.person && personBox && lay !== "bottom") {
    var toRight = personBox.x > W * .3, sx = toRight ? textBox.x + textBox.w * .78 : textBox.x + textBox.w * .22, sy = y0 + total - lh * .2 + 20 * u;
    var ex = toRight ? personBox.x + personBox.w * .25 : personBox.x + personBox.w * .75, ey = H * .62;
    x.save(); x.strokeStyle = accent; x.lineWidth = 16 * u; x.lineCap = "round"; x.shadowColor = "rgba(0,0,0,.55)"; x.shadowBlur = 0; x.shadowOffsetY = 6 * u;
    x.beginPath(); x.moveTo(sx, Math.min(sy, H - 60 * u)); x.quadraticCurveTo((sx + ex) / 2, H * .95, ex, ey); x.stroke();
    var ang = Math.atan2(ey - H * .95, ex - (sx + ex) / 2); x.beginPath(); x.moveTo(ex, ey); x.lineTo(ex - Math.cos(ang - .5) * 46 * u, ey - Math.sin(ang - .5) * 46 * u); x.moveTo(ex, ey); x.lineTo(ex - Math.cos(ang + .5) * 46 * u, ey - Math.sin(ang + .5) * 46 * u); x.stroke(); x.restore();
  }
  // badge
  if (s.badge) {
    var bf = 46 * u; x.font = "800 " + bf + "px Sora, \"QT Arabic\", sans-serif"; var bw = x.measureText(s.badge).width + bf * 1.1, bh = bf * 1.5;
    var bx = (badgeLeft ? 34 * u : W - bw - 34 * u) + bw / 2, by = 34 * u + bh / 2;
    x.save(); x.translate(bx, by); x.rotate(-.06); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 18 * u; x.fillStyle = "#e8001c";
    x.beginPath(); if (x.roundRect) x.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2); else x.rect(-bw / 2, -bh / 2, bw, bh); x.fill();
    x.shadowColor = "transparent"; x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(s.badge, 0, bf * .04); x.restore();
  }
  x.restore();
}
var qtThSilCache = new WeakMap();
function qtThSilhouette(img, color) {
  if (!color || typeof document === "undefined") return null;
  var c = qtThSilCache.get(img); if (c) return c;
  c = document.createElement("canvas"); c.width = img.width; c.height = img.height; var cx = c.getContext("2d");
  cx.drawImage(img, 0, 0); cx.globalCompositeOperation = "source-in"; cx.fillStyle = color; cx.fillRect(0, 0, c.width, c.height);
  qtThSilCache.set(img, c); return c;
}
function qtThInk(hex) { var m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return "#fff"; var n = parseInt(m[1], 16); return .2126 * (n >> 16 & 255) + .7152 * (n >> 8 & 255) + .0722 * (n & 255) > 150 ? "#111111" : "#ffffff"; }

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("thCanvas")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? { bgload: "جارٍ إزالة الخلفية… (أول مرة تتنزّل أداة الذكاء الاصطناعي)", ok: "✓ تمت إزالة الخلفية", fail: "تعذّرت إزالة الخلفية — سنستخدم الصورة كما هي.", saved: "✓ تم التنزيل", big: " (حجم الملف " } :
              { bgload: "Removing the background… (the AI model loads the first time)", ok: "✓ Background removed", fail: "Couldn't remove the background — using the photo as it is.", saved: "✓ Downloaded", big: " (file size " };
  var st = { title: AR ? "ربحت *10,000$* في شهر!" : "I made *$10,000* in 30 days", layout: "right", theme: "fire", accent: "", badge: AR ? "جديد" : "NEW", arrow: true, outline: true, upper: false, hiStyle: "color", bgBlur: true, cut: true };
  try { var sv = JSON.parse(localStorage.getItem("qtThumb") || "null"); if (sv) Object.keys(st).forEach(function (k) { if (sv[k] != null) st[k] = sv[k]; }); } catch (e) {}
  if (window.qtBrand) window.qtBrand.apply(st, { accent: "accent" });
  // presets from a link, e.g. /youtube-thumbnail-maker?theme=vice&title=...&badge=...
  try { var qp = new URLSearchParams(location.search); if (qp.get("theme") && QT_TH_THEMES[qp.get("theme")]) { st.theme = qp.get("theme"); st.accent = ""; } if (qp.get("title")) st.title = qp.get("title").slice(0, 120); if (qp.get("badge") != null) st.badge = qp.get("badge").slice(0, 16); } catch (e) {}
  function save() { try { localStorage.setItem("qtThumb", JSON.stringify(st)); } catch (e) {} }
  var A = { person: null, raw: null, cutImg: null, bg: null, cut: false };
  var cv = $("thCanvas"), x = cv.getContext("2d");
  function draw() {
    A.cut = !!(st.cut && A.cutImg); A.person = A.cut ? A.cutImg : A.raw;
    qtThRender(x, cv.width, cv.height, st, A);
    document.querySelectorAll(".th-mini canvas").forEach(function (m) { var mx = m.getContext("2d"); mx.imageSmoothingQuality = "high"; mx.drawImage(cv, 0, 0, m.width, m.height); });
  }
  function sync() {
    $("thTitle").value = st.title; $("thBadge").value = st.badge; $("thArrow").checked = st.arrow; $("thOutline").checked = st.outline; $("thUpper").checked = st.upper; $("thCut").checked = st.cut; $("thBlur").checked = st.bgBlur;
    $("thAccent").value = st.accent || QT_TH_THEMES[st.theme].accent; $("thHi").value = st.hiStyle;
    document.querySelectorAll("#thLayout .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-l") === st.layout); });
    document.querySelectorAll("#thThemes [data-t]").forEach(function (b) { var on = b.getAttribute("data-t") === st.theme && !A.bg; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    $("thBgClear").hidden = !A.bg; $("thPhotoClear").hidden = !A.raw;
  }
  $("thTitle").addEventListener("input", function () { st.title = this.value.slice(0, 120); save(); draw(); });
  $("thBadge").addEventListener("input", function () { st.badge = this.value.slice(0, 16); save(); draw(); });
  [["thArrow", "arrow"], ["thOutline", "outline"], ["thUpper", "upper"], ["thBlur", "bgBlur"]].forEach(function (c) { $(c[0]).addEventListener("change", function () { st[c[1]] = this.checked; save(); draw(); }); });
  $("thHi").addEventListener("change", function () { st.hiStyle = this.value; save(); draw(); });
  $("thAccent").addEventListener("input", function () { st.accent = this.value; save(); draw(); });
  document.querySelectorAll("#thLayout .chip").forEach(function (b) { b.addEventListener("click", function () { st.layout = b.getAttribute("data-l"); save(); sync(); draw(); }); });
  document.querySelectorAll("#thThemes [data-t]").forEach(function (b) { b.addEventListener("click", function () { st.theme = b.getAttribute("data-t"); st.accent = ""; A.bg = null; save(); sync(); draw(); }); });

  function toCanvas(f, lim) {
    return createImageBitmap(f).then(function (bmp) { var k = Math.min(1, lim / Math.max(bmp.width, bmp.height)), c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); return c; });
  }
  // same U²-Net-p model and pre-processing as the product photo studio / paper studio
  var ort = null, session = null;
  async function removeBg(img) {
    if (!session) {
      ort = await import("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.wasm.min.mjs");
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/"; ort.env.wasm.numThreads = 1;
      session = await ort.InferenceSession.create(new Uint8Array(await (await fetch("/models/u2netp.onnx")).arrayBuffer()), { executionProviders: ["wasm"] });
    }
    var S = 320, sm = document.createElement("canvas"); sm.width = sm.height = S; var sx = sm.getContext("2d", { willReadFrequently: true }); sx.drawImage(img, 0, 0, S, S);
    var px = sx.getImageData(0, 0, S, S).data, max = 1; for (var i = 0; i < px.length; i += 4) max = Math.max(max, px[i], px[i + 1], px[i + 2]);
    var mean = [.485, .456, .406], std = [.229, .224, .225], inp = new Float32Array(3 * S * S);
    for (var p = 0, k = 0; p < S * S; p++, k += 4) for (var c = 0; c < 3; c++) inp[c * S * S + p] = (px[k + c] / max - mean[c]) / std[c];
    var feeds = {}; feeds[session.inputNames[0]] = new ort.Tensor("float32", inp, [1, 3, S, S]);
    var pred = (await session.run(feeds))[session.outputNames[0]].data, lo = Infinity, hi = -Infinity;
    for (var q = 0; q < pred.length; q++) { lo = Math.min(lo, pred[q]); hi = Math.max(hi, pred[q]); }
    var md = sx.createImageData(S, S); for (var r = 0, m = 0; r < pred.length; r++, m += 4) { var a = Math.min(1, Math.max(0, ((pred[r] - lo) / (hi - lo || 1) - .12) / .76)); md.data[m + 3] = Math.round(a * a * (3 - 2 * a) * 255); }
    sx.putImageData(md, 0, 0);
    var out = document.createElement("canvas"); out.width = img.width; out.height = img.height; var ox = out.getContext("2d", { willReadFrequently: true });
    ox.drawImage(sm, 0, 0, img.width, img.height); var mask = ox.getImageData(0, 0, img.width, img.height).data; ox.clearRect(0, 0, img.width, img.height); ox.drawImage(img, 0, 0);
    var id = ox.getImageData(0, 0, img.width, img.height); for (var z = 3; z < id.data.length; z += 4) id.data[z] = mask[z]; ox.putImageData(id, 0, 0);
    // crop to the visible subject so it can be placed and scaled properly
    var b = { x0: out.width, y0: out.height, x1: 0, y1: 0 }, d = id.data;
    for (var yy = 0; yy < out.height; yy += 2) for (var xx = 0; xx < out.width; xx += 2) if (d[(yy * out.width + xx) * 4 + 3] > 40) { if (xx < b.x0) b.x0 = xx; if (yy < b.y0) b.y0 = yy; if (xx > b.x1) b.x1 = xx; if (yy > b.y1) b.y1 = yy; }
    if (b.x1 <= b.x0 || b.y1 <= b.y0) return out;
    var cc = document.createElement("canvas"); cc.width = b.x1 - b.x0 + 2; cc.height = out.height - b.y0; cc.getContext("2d").drawImage(out, b.x0, b.y0, cc.width, cc.height, 0, 0, cc.width, cc.height);
    return cc;
  }
  async function cutNow() {
    if (!A.raw || A.cutImg || !st.cut) { draw(); return; }
    $("thStatus").textContent = T.bgload;
    try { A.cutImg = await removeBg(A.raw); $("thStatus").textContent = T.ok; } catch (e) { $("thStatus").textContent = T.fail; st.cut = false; sync(); }
    draw();
  }
  $("thPhoto").addEventListener("change", function () { var f = this.files[0]; this.value = ""; if (!f) return; toCanvas(f, 1400).then(function (c) { A.raw = c; A.cutImg = null; sync(); cutNow(); }); });
  $("thPhotoClear").addEventListener("click", function () { A.raw = A.cutImg = null; sync(); draw(); });
  $("thCut").addEventListener("change", function () { st.cut = this.checked; save(); cutNow(); });
  $("thBg").addEventListener("change", function () { var f = this.files[0]; this.value = ""; if (!f) return; toCanvas(f, 1600).then(function (c) { A.bg = c; sync(); draw(); }); });
  $("thBgClear").addEventListener("click", function () { A.bg = null; sync(); draw(); });

  function dl(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }
  function blobOf(type, q) { return new Promise(function (r) { cv.toBlob(r, type, q); }); }
  $("thJpg").addEventListener("click", async function () {
    draw(); var q = .92, b = await blobOf("image/jpeg", q);
    while (b.size > 1.95 * 1048576 && q > .5) { q -= .08; b = await blobOf("image/jpeg", q); }
    dl(b, "thumbnail-1280x720.jpg"); $("thStatus").textContent = T.saved + T.big + Math.round(b.size / 1024) + " KB)";
    if (typeof qtEvent === "function") qtEvent("thumbnail_export");
  });
  $("thPng").addEventListener("click", async function () { draw(); var b = await blobOf("image/png"); dl(b, "thumbnail-1280x720.png"); $("thStatus").textContent = T.saved + T.big + Math.round(b.size / 1024) + " KB)"; if (typeof qtEvent === "function") qtEvent("thumbnail_export"); });
  sync(); draw();
  if (document.fonts && document.fonts.load) Promise.all(['400 80px "QT Lalezar"', '800 80px Sora', '700 80px "QT Arabic"'].map(function (f) { return document.fonts.load(f, "Ab ابج").catch(function () {}); })).then(draw);
})();
if (typeof module !== "undefined") module.exports = { qtThTokens: qtThTokens, qtThLines: qtThLines, qtThFit: qtThFit, qtThAr: qtThAr, qtThInk: qtThInk, QT_TH_THEMES: QT_TH_THEMES };
