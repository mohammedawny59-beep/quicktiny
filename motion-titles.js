// QuickTiny Motion Titles — animated overlays for video creators: lower thirds, subscribe button, big titles,
// hand-drawn arrows, 3-2-1 countdowns and like/comment reminders. Arabic and English. Green/blue-screen MP4 export
// (WebCodecs H.264 + vendor/mp4-muxer.js), WebM fallback. Each frame is a pure function of time.
var QT_MT_F = { bold: '"QT Lalezar", "Arial Black", Impact, sans-serif', ui: '"QT Arabic", "Segoe UI", Arial, sans-serif', hand: '"QT Rakkas", Georgia, serif' };
function qtMtClamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
var qtMtE = { out: function (k) { return 1 - Math.pow(1 - k, 3); }, inOut: function (k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
  back: function (k) { var c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }, inBack: function (k) { var c = 1.70158; return (c + 1) * k * k * k - c * k * k; } };
function qtMtAr(s) { return /[؀-ۿ]/.test(s || ""); }
// in/out envelope: 0→1 over `a` seconds at the start, 1→0 over `b` seconds at the end
function qtMtEnv(t, D, a, b) { return Math.min(qtMtClamp(t / a), qtMtClamp((D - t) / b)); }
function qtMtRound(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

/* 1. lower third */
function qtMtLower(x, W, H, t, s) {
  var ar = qtMtAr(s.a + s.b), D = s.duration, u = Math.min(W, H) / 1080, side = s.pos === "end" ? !ar : ar; // true = right side
  var fs = 64 * u, fs2 = 36 * u;
  x.font = "700 " + fs + "px " + QT_MT_F.bold; var w1 = x.measureText(s.a).width; x.font = "600 " + fs2 + "px " + QT_MT_F.ui; var w2 = x.measureText(s.b).width;
  var pw = Math.max(w1, w2) + 90 * u, ph = fs * 1.45, ph2 = fs2 * 1.6, mx = 90 * u, y = H - mx * 1.1 - ph - ph2;
  var bar = qtMtE.out(qtMtClamp(t / .35)) * qtMtClamp((D - t) / .3), slide = qtMtE.out(qtMtClamp((t - .15) / .5)), outk = qtMtE.inBack(qtMtClamp((t - (D - .55)) / .45));
  var X0 = side ? W - mx - pw : mx, dir = side ? 1 : -1;
  x.save(); x.translate(dir * outk * (pw + mx * 2), 0);
  // accent stripe
  x.fillStyle = s.accent; x.fillRect(side ? X0 + pw : X0 - 14 * u, y, 14 * u, (ph + ph2) * bar);
  // main panel
  x.save(); x.beginPath(); x.rect(X0, y, pw, ph); x.clip();
  x.translate(dir * (1 - slide) * pw, 0);
  x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 30 * u; x.fillStyle = "rgba(12,14,28,.92)"; x.fillRect(X0, y, pw, ph); x.shadowColor = "transparent";
  x.fillStyle = "#fff"; x.font = "700 " + fs + "px " + QT_MT_F.bold; x.textBaseline = "middle"; x.direction = ar ? "rtl" : "ltr"; x.textAlign = ar ? "right" : "left";
  x.fillText(s.a, ar ? X0 + pw - 45 * u : X0 + 45 * u, y + ph * .53); x.restore();
  // sub strip
  if (s.b) {
    var sl2 = qtMtE.out(qtMtClamp((t - .4) / .45)), pw2 = w2 + 70 * u;
    var X2 = side ? X0 + pw - pw2 : X0;
    x.save(); x.beginPath(); x.rect(X2, y + ph, pw2, ph2); x.clip(); x.translate(dir * (1 - sl2) * pw2, 0);
    x.fillStyle = s.accent; x.fillRect(X2, y + ph, pw2, ph2);
    x.fillStyle = "#fff"; x.font = "600 " + fs2 + "px " + QT_MT_F.ui; x.textBaseline = "middle"; x.textAlign = ar ? "right" : "left";
    x.fillText(s.b, ar ? X2 + pw2 - 35 * u : X2 + 35 * u, y + ph + ph2 * .52); x.restore();
  }
  x.restore();
}
/* 2. subscribe button with cursor click and bell */
function qtMtSubscribe(x, W, H, t, s) {
  var ar = qtMtAr(s.a + s.b), D = s.duration, u = Math.min(W, H) / 1080 * 1.3, env = qtMtEnv(t, D, .01, .4);
  var pop = qtMtE.back(qtMtClamp(t / .45)), click = 1.6, done = t > click;
  var label = done ? (s.b || (ar ? "تم الاشتراك" : "Subscribed")) : (s.a || (ar ? "اشترك" : "Subscribe"));
  var fs = 58 * u; x.font = "700 " + fs + "px " + QT_MT_F.bold; x.direction = ar ? "rtl" : "ltr";
  var bw = Math.max(x.measureText(s.a || "Subscribe").width, x.measureText(s.b || "Subscribed").width) + 150 * u, bh = fs * 1.75;
  var cx = W / 2 - 50 * u * (ar ? -1 : 1), cy = H * .76, press = t > click - .1 && t < click + .12 ? .93 : 1;
  x.save(); x.globalAlpha = env; x.translate(cx, cy); x.scale(pop * press, pop * press);
  x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 30 * u; x.shadowOffsetY = 10 * u;
  qtMtRound(x, -bw / 2, -bh / 2, bw, bh, bh / 2); x.fillStyle = done ? "#3a3d4d" : s.accent; x.fill(); x.shadowColor = "transparent";
  x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "700 " + fs + "px " + QT_MT_F.bold;
  x.fillText((done ? "✓ " : "") + label, 0, fs * .06); x.restore();
  // bell
  var bp = qtMtE.back(qtMtClamp((t - click - .25) / .4));
  if (bp > 0) {
    var bx = cx + (bw / 2 + 80 * u) * (ar ? -1 : 1), ring = Math.sin((t - click) * 28) * Math.max(0, 1 - (t - click - .3) / 1.2) * .5;
    x.save(); x.globalAlpha = env; x.translate(bx, cy); x.scale(bp, bp); x.rotate(ring);
    x.fillStyle = "#fff"; x.strokeStyle = "rgba(0,0,0,.25)"; x.lineWidth = 3 * u; var r = 38 * u;
    x.beginPath(); x.moveTo(-r, r * .55); x.quadraticCurveTo(-r * .85, -r * .9, 0, -r); x.quadraticCurveTo(r * .85, -r * .9, r, r * .55); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.arc(0, r * .78, r * .22, 0, Math.PI * 2); x.fill(); x.stroke(); x.restore();
  }
  // cursor arrow travelling to the button
  var mv = qtMtE.inOut(qtMtClamp((t - .5) / (click - .55))), out = qtMtClamp((t - click - .5) / .5);
  var px = W * (ar ? .25 : .75) + (cx - W * (ar ? .25 : .75)) * mv + (ar ? -1 : 1) * out * 260 * u, py = H * 1.05 + (cy + 10 * u - H * 1.05) * mv + out * 200 * u;
  if (t > .4 && out < 1) {
    x.save(); x.globalAlpha = env * (1 - out); x.translate(px, py); var k = 1.6 * u;
    x.fillStyle = "#fff"; x.strokeStyle = "#111"; x.lineWidth = 3 * u; x.beginPath();
    x.moveTo(0, 0); x.lineTo(0, 42 * k); x.lineTo(10 * k, 32 * k); x.lineTo(18 * k, 50 * k); x.lineTo(25 * k, 47 * k); x.lineTo(17 * k, 29 * k); x.lineTo(30 * k, 29 * k); x.closePath(); x.fill(); x.stroke();
    if (Math.abs(t - click) < .25) { x.strokeStyle = "rgba(255,255,255," + (1 - Math.abs(t - click) * 4).toFixed(2) + ")"; x.lineWidth = 4 * u; x.beginPath(); x.arc(0, 0, (t - click + .25) * 160 * u, 0, Math.PI * 2); x.stroke(); }
    x.restore();
  }
}
/* 3. big title, word by word */
function qtMtTitle(x, W, H, t, s) {
  var ar = qtMtAr(s.a + s.b), D = s.duration, u = Math.min(W, H) / 1080, words = String(s.a || "").split(/\s+/).filter(Boolean);
  var fs = Math.min(150 * u, W * .85 / Math.max(3, (s.a || "").length * .5)); x.font = "700 " + fs + "px " + QT_MT_F.bold; x.direction = ar ? "rtl" : "ltr";
  var gap = fs * .28, widths = words.map(function (w) { return x.measureText(w).width; }), total = widths.reduce(function (a, b) { return a + b; }, 0) + gap * (words.length - 1);
  var xx = ar ? W / 2 + total / 2 : W / 2 - total / 2, cy = H / 2 - (s.b ? fs * .2 : 0), outk = qtMtE.inBack(qtMtClamp((t - (D - .5)) / .45));
  words.forEach(function (w, i) {
    var p = qtMtE.back(qtMtClamp((t - .1 - i * .12) / .45)), wcx = ar ? xx - widths[i] / 2 : xx + widths[i] / 2; xx += (ar ? -1 : 1) * (widths[i] + gap);
    if (p <= 0) return;
    x.save(); x.translate(wcx, cy - outk * H * .2 * (1 + i * .15)); x.scale(p, p); x.globalAlpha = qtMtClamp(p) * (1 - outk);
    x.fillStyle = "rgba(0,0,0,.35)"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(w, 6 * u, 8 * u);
    x.fillStyle = "#fff"; x.fillText(w, 0, 0); x.restore();
  });
  var ul = qtMtE.out(qtMtClamp((t - .2 - words.length * .12) / .5)) * (1 - outk);
  if (ul > 0) { x.fillStyle = s.accent; var uw = total * ul; x.fillRect(ar ? W / 2 + total / 2 - uw : W / 2 - total / 2, cy + fs * .62, uw, fs * .1); }
  if (s.b) { var sp = qtMtClamp((t - .5 - words.length * .12) / .4) * (1 - outk); if (sp > 0) { x.globalAlpha = sp; x.font = "600 " + fs * .32 + "px " + QT_MT_F.ui; x.fillStyle = "#fff"; x.textAlign = "center"; x.fillText(s.b, W / 2, cy + fs * 1.1 + (1 - sp) * 20 * u); x.globalAlpha = 1; } }
}
/* 4. hand-drawn arrow + label */
function qtMtArrow(x, W, H, t, s) {
  var ar = qtMtAr(s.a + s.b), D = s.duration, u = Math.min(W, H) / 1080, env = qtMtEnv(t, D, .01, .35);
  var lx = W * (ar ? .72 : .28), ly = H * .28, tx = W * (ar ? .42 : .58), ty = H * .6;
  var fs = 70 * u; x.font = "400 " + fs + "px " + QT_MT_F.hand; x.direction = ar ? "rtl" : "ltr";
  var lp = qtMtE.back(qtMtClamp(t / .4)), tw = x.measureText(s.a).width;
  x.save(); x.globalAlpha = env; x.translate(lx, ly); x.rotate(ar ? .05 : -.05); x.scale(lp, lp);
  x.fillStyle = s.accent; qtMtRound(x, -tw / 2 - 30 * u, -fs * .75, tw + 60 * u, fs * 1.5, 18 * u); x.fill();
  x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(s.a, 0, fs * .05); x.restore();
  // curved arrow drawing itself from label to target
  var dp = qtMtE.inOut(qtMtClamp((t - .35) / .7)), c1x = lx + (tx - lx) * .1 + (ar ? -1 : 1) * 160 * u, c1y = ly + 220 * u, steps = 50;
  var pt = function (k) { var a = 1 - k; return [a * a * lx + 2 * a * k * c1x + k * k * tx, a * a * (ly + fs) + 2 * a * k * c1y + k * k * ty]; };
  x.save(); x.globalAlpha = env; x.strokeStyle = "#fff"; x.lineWidth = 11 * u; x.lineCap = "round"; x.lineJoin = "round"; x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 10 * u;
  x.beginPath(); for (var i = 0; i <= steps * dp; i++) { var p = pt(i / steps); i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); } x.stroke();
  if (dp >= 1) { var e = pt(1), b = pt(.94), ang = Math.atan2(e[1] - b[1], e[0] - b[0]), hl = 46 * u;
    x.beginPath(); x.moveTo(e[0] - Math.cos(ang - .5) * hl, e[1] - Math.sin(ang - .5) * hl); x.lineTo(e[0], e[1]); x.lineTo(e[0] - Math.cos(ang + .5) * hl, e[1] - Math.sin(ang + .5) * hl); x.stroke();
    var pulse = (t - .35 - .7) % 1; x.strokeStyle = "rgba(255,255,255," + (1 - pulse).toFixed(2) + ")"; x.lineWidth = 5 * u; x.beginPath(); x.arc(tx, ty, 30 * u + pulse * 70 * u, 0, Math.PI * 2); x.stroke(); }
  x.restore();
  if (s.b) { var sp = qtMtClamp((t - 1.1) / .4) * env; if (sp > 0) { x.globalAlpha = sp; x.font = "600 " + fs * .5 + "px " + QT_MT_F.ui; x.fillStyle = "#fff"; x.textAlign = "center"; x.fillText(s.b, lx, ly + fs * 1.25); x.globalAlpha = 1; } }
}
/* 5. 3-2-1 countdown */
function qtMtCountdown(x, W, H, t, s) {
  var ar = qtMtAr(s.a + s.b), u = Math.min(W, H) / 1080, n = 3, cx = W / 2, cy = H / 2, R = 190 * u;
  if (t < n) {
    var k = Math.floor(t), f = t - k, num = n - k, pop = qtMtE.back(qtMtClamp(f / .3));
    x.save(); x.translate(cx, cy);
    x.strokeStyle = "rgba(255,255,255,.25)"; x.lineWidth = 18 * u; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = s.accent; x.lineCap = "round"; x.beginPath(); x.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - f)); x.stroke();
    x.scale(pop, pop); x.fillStyle = "#fff"; x.font = "700 " + 260 * u + "px " + QT_MT_F.bold; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(String(num), 0, 12 * u); x.restore();
  } else {
    var p = qtMtE.back(qtMtClamp((t - n) / .4)), end = qtMtClamp((s.duration - t) / .35);
    x.save(); x.globalAlpha = end; x.translate(cx, cy); x.scale(p, p); x.fillStyle = "#fff"; x.direction = ar ? "rtl" : "ltr";
    var fs = Math.min(150 * u, W * .8 / Math.max(3, (s.a || "Go").length * .5)); x.font = "700 " + fs + "px " + QT_MT_F.bold; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(s.a || (ar ? "يلا نبدأ!" : "Let's go!"), 0, 0);
    if (s.b) { x.font = "600 " + fs * .32 + "px " + QT_MT_F.ui; x.fillText(s.b, 0, fs * .85); }
    x.restore();
  }
}
/* 6. like + comment reminder */
function qtMtLike(x, W, H, t, s) {
  var ar = qtMtAr(s.a + s.b), D = s.duration, u = Math.min(W, H) / 1080, env = qtMtEnv(t, D, .01, .4), cx = W / 2, cy = H * .72;
  var hp = qtMtE.back(qtMtClamp((t - .2) / .4)), beat = 1 + Math.max(0, Math.sin((t - .9) * 9)) * .12 * (t > .9 && t < 1.6 ? 1 : 0);
  x.save(); x.globalAlpha = env;
  // heart
  x.save(); x.translate(cx - (ar ? -1 : 1) * 170 * u, cy); x.scale(hp * beat, hp * beat); var r = 70 * u;
  x.fillStyle = s.accent; x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 20 * u; x.beginPath(); x.moveTo(0, r * .9);
  x.bezierCurveTo(-r * 1.4, 0, -r * .7, -r * 1.1, 0, -r * .35); x.bezierCurveTo(r * .7, -r * 1.1, r * 1.4, 0, 0, r * .9); x.fill(); x.restore();
  // burst
  var bp = qtMtClamp((t - .55) / .5); if (bp > 0 && bp < 1) for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2, d = 90 * u + bp * 90 * u; x.fillStyle = i % 2 ? "#fff" : s.accent; x.globalAlpha = env * (1 - bp); x.beginPath(); x.arc(cx - (ar ? -1 : 1) * 170 * u + Math.cos(a) * d, cy + Math.sin(a) * d, 9 * u, 0, Math.PI * 2); x.fill(); }
  x.globalAlpha = env;
  // counter + comment bubble
  var cnt = Math.round(qtMtE.out(qtMtClamp((t - .6) / 1.2)) * (+s.count || 1200));
  x.fillStyle = "#fff"; x.font = "700 " + 64 * u + "px " + QT_MT_F.bold; x.textBaseline = "middle"; x.textAlign = ar ? "right" : "left";
  x.fillText(cnt.toLocaleString("en-US"), cx - (ar ? -1 : 1) * 70 * u, cy);
  var bpop = qtMtE.back(qtMtClamp((t - 1.2) / .45));
  if (bpop > 0) {
    var label = s.a || (ar ? "اكتب رأيك في التعليقات 👇" : "Tell me in the comments 👇"); x.font = "600 " + 46 * u + "px " + QT_MT_F.ui; x.direction = ar ? "rtl" : "ltr";
    var bw = x.measureText(label).width + 70 * u, bh = 46 * u * 2.1, by = cy - 210 * u;
    x.save(); x.translate(cx, by); x.scale(bpop, bpop); qtMtRound(x, -bw / 2, -bh / 2, bw, bh, 28 * u); x.fillStyle = "#fff"; x.fill();
    x.beginPath(); x.moveTo(-20 * u, bh / 2 - 2); x.lineTo(0, bh / 2 + 26 * u); x.lineTo(20 * u, bh / 2 - 2); x.fill();
    x.fillStyle = "#14162b"; x.textAlign = "center"; x.fillText(label, 0, 2 * u); x.restore();
  }
  x.restore();
}
var QT_MT_TPL = { lower: qtMtLower, subscribe: qtMtSubscribe, title: qtMtTitle, arrow: qtMtArrow, countdown: qtMtCountdown, like: qtMtLike };
var QT_MT_BG = { green: "#00ff00", blue: "#0047ff", black: "#000000" };
function qtMtRender(x, W, H, t, s, preview) {
  x.setTransform(1, 0, 0, 1, 0, 0);
  if (s.bg === "photo" && preview) { var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#3a4a6b"); g.addColorStop(1, "#1a2033"); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  else { x.fillStyle = QT_MT_BG[s.bg] || "#00ff00"; x.fillRect(0, 0, W, H); }
  x.save(); (QT_MT_TPL[s.tpl] || qtMtLower)(x, W, H, t, s); x.restore();
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("mtCanvas")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var DEF = AR ? { lower: ["محمد أحمد", "صانع محتوى تقني"], subscribe: ["اشترك", "تم الاشتراك"], title: ["الحلقة الأولى", "كيف بدأت القصة"], arrow: ["شوف هنا!", ""], countdown: ["يلا نبدأ!", ""], like: ["اكتب رأيك في التعليقات 👇", ""] }
               : { lower: ["Sarah Ahmed", "Tech creator"], subscribe: ["Subscribe", "Subscribed"], title: ["Episode One", "How it all started"], arrow: ["Look here!", ""], countdown: ["Let's go!", ""], like: ["Tell me in the comments 👇", ""] };
  var DUR = { lower: 5, subscribe: 4, title: 4, arrow: 4, countdown: 4.5, like: 4 };
  var T = AR ? { done: "✓ تم تنزيل الفيديو", wait: "جارٍ تجهيز الفيديو…", webm: "سننزّل WebM لأن متصفحك لا يدعم MP4 هنا.", fail: "تعذّر إنشاء الفيديو: " } : { done: "✓ Video downloaded", wait: "Rendering video…", webm: "Downloading WebM (this browser can't encode MP4 here).", fail: "Couldn't create the video: " };
  var SIZES = { "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080] };
  var st = { tpl: "lower", a: DEF.lower[0], b: DEF.lower[1], accent: "#ff2d55", bg: "green", ratio: "16:9", pos: "start", count: 1200, duration: 5 };
  if (window.qtBrand) { qtBrand.apply(st, { accent: "accent" }); var qtBk = qtBrand.get(); if (qtBk && qtBk.name) { DEF.lower = [qtBk.name, qtBk.tagline || DEF.lower[1]]; if (st.tpl === "lower") { st.a = DEF.lower[0]; st.b = DEF.lower[1]; } } }
  var cv = $("mtCanvas"), ctx = cv.getContext("2d"), t0 = performance.now(), playing = true, exporting = false;
  function size() { var z = SIZES[st.ratio]; cv.width = z[0]; cv.height = z[1]; cv.parentNode.style.aspectRatio = z[0] + " / " + z[1]; }
  function sync() {
    document.querySelectorAll("#mtTpl [data-t]").forEach(function (b) { var on = b.getAttribute("data-t") === st.tpl; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    document.querySelectorAll("#mtRatio .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-r") === st.ratio); });
    document.querySelectorAll("#mtBg .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-b") === st.bg); });
    $("mtA").value = st.a; $("mtB").value = st.b; $("mtAccent").value = st.accent; $("mtPos").value = st.pos; $("mtCount").value = st.count;
    $("mtPosRow").hidden = st.tpl !== "lower"; $("mtCountRow").hidden = st.tpl !== "like"; $("mtBRow").hidden = st.tpl === "like";
  }
  function restart() { t0 = performance.now(); }
  function loop(now) { if (playing && !exporting) { var t = ((now - t0) / 1000) % (st.duration + .7); qtMtRender(ctx, cv.width, cv.height, Math.min(t, st.duration), st, true); $("mtScrub").value = Math.min(t, st.duration) / st.duration * 1000; } requestAnimationFrame(loop); }
  document.querySelectorAll("#mtTpl [data-t]").forEach(function (b) { b.addEventListener("click", function () { st.tpl = b.getAttribute("data-t"); st.a = DEF[st.tpl][0]; st.b = DEF[st.tpl][1]; st.duration = DUR[st.tpl]; sync(); restart(); }); });
  document.querySelectorAll("#mtRatio .chip").forEach(function (b) { b.addEventListener("click", function () { st.ratio = b.getAttribute("data-r"); size(); sync(); restart(); }); });
  document.querySelectorAll("#mtBg .chip").forEach(function (b) { b.addEventListener("click", function () { st.bg = b.getAttribute("data-b"); sync(); }); });
  $("mtA").addEventListener("input", function () { st.a = this.value.slice(0, 40); restart(); });
  $("mtB").addEventListener("input", function () { st.b = this.value.slice(0, 50); restart(); });
  $("mtAccent").addEventListener("input", function () { st.accent = this.value; });
  $("mtPos").addEventListener("change", function () { st.pos = this.value; restart(); });
  $("mtCount").addEventListener("input", function () { st.count = Math.max(1, Math.min(9999999, +this.value || 1)); restart(); });
  $("mtPlay").addEventListener("click", function () { playing = !playing; this.textContent = playing ? "❚❚" : "▶"; if (playing) t0 = performance.now() - $("mtScrub").value / 1000 * st.duration * 1000; });
  $("mtScrub").addEventListener("input", function () { playing = false; $("mtPlay").textContent = "▶"; qtMtRender(ctx, cv.width, cv.height, this.value / 1000 * st.duration, st, true); });
  function download(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }
  async function mp4() {
    var W = cv.width, H = cv.height, fps = 30, frames = Math.round(st.duration * fps) + 6, cfg = null;
    for (var c of ["avc1.640028", "avc1.4d0028", "avc1.42003e"]) { var o = { codec: c, width: W, height: H, bitrate: 8e6, framerate: fps }; try { if ((await VideoEncoder.isConfigSupported(o)).supported) { cfg = o; break; } } catch (e) {} }
    if (!cfg) throw new Error("no-h264");
    var mux = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" }), err = null;
    var enc = new VideoEncoder({ output: function (ch, meta) { mux.addVideoChunk(ch, meta); }, error: function (e) { err = e; } }); enc.configure(cfg);
    for (var f = 0; f < frames; f++) {
      qtMtRender(ctx, W, H, Math.min(st.duration, f / fps), st, false);
      var vf = new VideoFrame(cv, { timestamp: Math.round(f * 1e6 / fps), duration: Math.round(1e6 / fps) }); enc.encode(vf, { keyFrame: f % 60 === 0 }); vf.close();
      if (enc.encodeQueueSize > 8 || f % 10 === 0) { $("mtBarFill").style.width = Math.round(f / frames * 100) + "%"; await new Promise(function (r) { setTimeout(r, 0); }); }
      if (err) throw err;
    }
    await enc.flush(); mux.finalize(); return new Blob([mux.target.buffer], { type: "video/mp4" });
  }
  function webm() {
    return new Promise(function (res, rej) {
      var rec = new MediaRecorder(cv.captureStream(30), { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm", videoBitsPerSecond: 8e6 }), ch = [];
      rec.ondataavailable = function (e) { if (e.data.size) ch.push(e.data); }; rec.onstop = function () { res(new Blob(ch, { type: "video/webm" })); }; rec.onerror = rej;
      var s0 = performance.now(); rec.start();
      (function step() { var t = (performance.now() - s0) / 1000; qtMtRender(ctx, cv.width, cv.height, Math.min(t, st.duration), st, false); if (t < st.duration + .3) requestAnimationFrame(step); else rec.stop(); })();
    });
  }
  $("mtExport").addEventListener("click", async function () {
    if (exporting) return; exporting = true; this.disabled = true; $("mtBar").hidden = false; $("mtStatus").textContent = T.wait;
    try { var blob = null, ext = "mp4";
      if (typeof VideoEncoder !== "undefined" && typeof Mp4Muxer !== "undefined") { try { blob = await mp4(); } catch (e) { if (String(e.message) !== "no-h264") throw e; } }
      if (!blob) { $("mtStatus").textContent = T.webm; blob = await webm(); ext = "webm"; }
      download(blob, "motion-" + st.tpl + "-" + st.bg + "-" + st.ratio.replace(":", "x") + "." + ext); $("mtStatus").textContent = T.done;
      if (typeof qtEvent === "function") qtEvent("titles_export");
    } catch (e) { $("mtStatus").textContent = T.fail + (e && e.message || e); }
    exporting = false; this.disabled = false; $("mtBar").hidden = true; restart();
  });
  size(); sync();
  var ready = document.fonts && document.fonts.load ? Promise.all(['400 40px "QT Lalezar"', '400 40px "QT Rakkas"', '700 40px "QT Arabic"'].map(function (f) { return document.fonts.load(f, "abc ابج").catch(function () {}); })) : Promise.resolve();
  ready.then(function () { restart(); requestAnimationFrame(loop); });
})();
if (typeof module !== "undefined") module.exports = { qtMtEnv: qtMtEnv, qtMtAr: qtMtAr };
