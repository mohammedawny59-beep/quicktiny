// QuickTiny GTA 6 Zone — an unofficial fan section. Original neon-sunset world (no game assets), launch countdown,
// mission-style overlay videos, crew name generator, photo-mode wallpaper maker and a launch-day checklist.
// Grand Theft Auto and the GTA VI logo are trademarks of Rockstar Games / Take-Two; this page is not affiliated.

var QT_GTA_LAUNCH = "2026-11-19T00:00:00"; // local midnight on launch day (exact unlock time not announced yet)

/* ---------- pure helpers (tests/gta.test.js) ---------- */
function qtGtaLeft(nowMs, targetMs) {
  var d = Math.max(0, targetMs - nowMs), s = Math.floor(d / 1000);
  return { done: d <= 0, days: Math.floor(s / 86400), hours: Math.floor(s / 3600) % 24, mins: Math.floor(s / 60) % 60, secs: s % 60 };
}
function qtGtaRng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
var QT_GTA_WORDS = {
  en: { a: ["Neon", "Vice", "Palm", "Midnight", "Sunset", "Velvet", "Chrome", "Ocean", "Golden", "Silent", "Electric", "Royal", "Shadow", "Crimson", "Tropic", "Lucky"],
        b: ["Kings", "Syndicate", "Riders", "Outlaws", "Wolves", "Cartel", "Saints", "Crew", "Phantoms", "Hustlers", "Sharks", "Ghosts", "Legends", "Vipers", "Dons", "Bandits"] },
  ar: { a: ["نيون", "ليل", "نخيل", "غروب", "ذهب", "صقور", "أسود", "ملوك", "ظلال", "برق", "موج", "ذئاب", "فرسان", "نجوم", "عاصفة", "ليالي"],
        b: ["المدينة", "الشاطئ", "الليل", "الصحراء", "الطريق", "الميناء", "الغروب", "البحر", "الجزيرة", "الحي", "السرعة", "الذهب", "النيون", "الساحل", "القمة", "الأسطورة"] }
};
// Crew names: two-word combos (Arabic uses "noun + الـnoun" idafa), plus a short uppercase tag.
function qtGtaCrews(lang, seed, n) {
  var W = QT_GTA_WORDS[lang] || QT_GTA_WORDS.en, R = qtGtaRng(seed), out = [], seen = {};
  for (var guard = 0; out.length < n && guard < 200; guard++) {
    var a = W.a[Math.floor(R() * W.a.length)], b = W.b[Math.floor(R() * W.b.length)], name = lang === "ar" ? a + " " + b : a + " " + b;
    if (seen[name]) continue; seen[name] = 1;
    var tag = lang === "ar" ? qtGtaTag(QT_GTA_WORDS.en.a[W.a.indexOf(a)] + " " + QT_GTA_WORDS.en.b[W.b.indexOf(b)], R) : qtGtaTag(name, R);
    out.push({ name: name, tag: tag });
  }
  return out;
}
function qtGtaTag(name, R) {
  // first two letters of each word: "Neon Kings" → NEKI
  var p = name.toUpperCase().replace(/[^A-Z ]/g, "").split(/\s+/).filter(Boolean);
  return p.map(function (w) { return w.slice(0, 2); }).join("").slice(0, 4);
}
// Wallpaper crop: cover-fit source into W×H with a horizontal/vertical focus (0..1).
function qtGtaCover(sw, sh, W, H, fx, fy) {
  var k = Math.max(W / sw, H / sh), w = sw * k, h = sh * k;
  return { x: (W - w) * (fx == null ? .5 : fx), y: (H - h) * (fy == null ? .5 : fy), w: w, h: h };
}

/* ---------- the world: synthwave sun, palms, moving grid, stars, searchlights ---------- */
function qtGtaWorld(x, W, H, t) {
  var sky = x.createLinearGradient(0, 0, 0, H * .62); sky.addColorStop(0, "#0b0420"); sky.addColorStop(.45, "#3a0b5c"); sky.addColorStop(.8, "#c2185b"); sky.addColorStop(1, "#ff7a3d");
  x.fillStyle = sky; x.fillRect(0, 0, W, H);
  var R = qtGtaRng(3); for (var i = 0; i < 120; i++) { var sx = R() * W, sy = R() * H * .45, tw = .3 + .7 * Math.abs(Math.sin(t * (.6 + R() * 1.6) + i)); x.globalAlpha = tw * .8; x.fillStyle = "#fff"; x.fillRect(sx, sy, 1.4, 1.4); } x.globalAlpha = 1;
  // searchlights
  [[.18, .9], [.82, -1.1]].forEach(function (s, i) { var a = -Math.PI / 2 + Math.sin(t * .35 * s[1] + i) * .55, ox = W * s[0], oy = H * .62; x.save(); x.translate(ox, oy); x.rotate(a); var g = x.createLinearGradient(0, 0, H * .7, 0); g.addColorStop(0, "rgba(255,240,255,.16)"); g.addColorStop(1, "rgba(255,240,255,0)"); x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.lineTo(H * .7, -H * .05); x.lineTo(H * .7, H * .05); x.closePath(); x.fill(); x.restore(); });
  // sun with retro stripes
  var cx = W / 2, cy = H * .5, r = Math.min(W, H) * .2, sg = x.createLinearGradient(0, cy - r, 0, cy + r); sg.addColorStop(0, "#ffe66d"); sg.addColorStop(.55, "#ff8a3d"); sg.addColorStop(1, "#ff2d75");
  x.save(); x.shadowColor = "rgba(255,120,80,.8)"; x.shadowBlur = r * .5; x.fillStyle = sg; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.restore();
  x.save(); x.globalCompositeOperation = "destination-out"; for (var k = 0; k < 7; k++) { var yy = cy + r * (.08 + k * .14) + ((t * 6) % (r * .14)), hh = r * (.02 + k * .012); x.fillRect(cx - r, yy, r * 2, hh); } x.restore();
  // horizon + grid floor
  var hy = H * .62, fl = x.createLinearGradient(0, hy, 0, H); fl.addColorStop(0, "#2b0640"); fl.addColorStop(1, "#08020f"); x.fillStyle = fl; x.fillRect(0, hy, W, H - hy);
  x.save(); x.strokeStyle = "rgba(255,64,170,.55)"; x.lineWidth = 1.2; x.shadowColor = "#ff40aa"; x.shadowBlur = 6;
  for (var v = -14; v <= 14; v++) { x.beginPath(); x.moveTo(cx + v * W * .012, hy); x.lineTo(cx + v * W * .16, H); x.stroke(); }
  var off = (t * .35) % 1; for (var hz = 0; hz < 14; hz++) { var p = (hz + off) / 14, y = hy + (H - hy) * p * p; x.globalAlpha = Math.min(1, p * 2.5); x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
  x.restore(); x.globalAlpha = 1;
  x.fillStyle = "rgba(255,120,200,.9)"; x.fillRect(0, hy - 1, W, 2);
  // palms swaying in the breeze (left and right)
  qtGtaPalm(x, W * .08, H * .66, H * .46, -.08 + Math.sin(t * .9) * .03, t, 0);
  qtGtaPalm(x, W * .17, H * .68, H * .32, .05 + Math.sin(t * 1.1 + 1) * .03, t, 1);
  qtGtaPalm(x, W * .92, H * .66, H * .5, .1 + Math.sin(t * .8 + 2) * .03, t, 2);
  qtGtaPalm(x, W * .83, H * .69, H * .3, -.04 + Math.sin(t * 1.2 + 3) * .03, t, 3);
  // VHS scanlines
  x.fillStyle = "rgba(0,0,0,.12)"; for (var sl = 0; sl < H; sl += 3) x.fillRect(0, sl, W, 1);
}
function qtGtaPalm(x, bx, by, h, lean, t, seed) {
  x.save(); x.fillStyle = "#0a0212"; x.strokeStyle = "#0a0212";
  var tx = bx + Math.sin(lean) * h, ty = by - h; x.lineWidth = h * .035; x.lineCap = "round";
  x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + (tx - bx) * .2 + h * .06, by - h * .55, tx, ty); x.stroke();
  for (var i = 0; i < 9; i++) {
    var a = -Math.PI / 2 + (i - 4) * .42 + Math.sin(t * 1.4 + i + seed) * .06, L = h * (.32 + .06 * Math.cos(i * 1.7)), droop = .55;
    var ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L + L * droop * Math.abs(Math.cos(a)), mx = tx + Math.cos(a) * L * .5, my = ty + Math.sin(a) * L * .5 - L * .12;
    x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(mx, my, ex, ey); x.quadraticCurveTo(mx + Math.sin(a) * L * .1, my + L * .14, tx, ty + h * .01); x.fill();
  }
  x.restore();
}

/* ---------- mission overlay (green-screen video) ---------- */
var QT_GTA_OVL = {
  passed: { en: ["MISSION PASSED", "+$5,000"], ar: ["المهمة نجحت", "+5,000$"], color: "#ffd23f", glow: "#ff8a00" },
  failed: { en: ["MISSION FAILED", "Try again"], ar: ["المهمة فشلت", "حاول مرة ثانية"], color: "#ff3b4e", glow: "#8a0015" },
  busted: { en: ["BUSTED", "Caught by the cops"], ar: ["انمسكت", "الشرطة مسكتك"], color: "#46b4ff", glow: "#002b8a" },
  respect: { en: ["RESPECT +", "Crew level up"], ar: ["احترام +", "مستوى العصابة ارتفع"], color: "#47ff9c", glow: "#007a3d" }
};
function qtGtaOverlay(x, W, H, t, o) {
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = { green: "#00ff00", blue: "#0047ff", black: "#000000" }[o.bg] || "#00ff00"; x.fillRect(0, 0, W, H);
  var u = Math.min(W, H) / 1080, D = 3.6, inK = Math.min(1, t / .35), out = Math.max(0, Math.min(1, (t - (D - .4)) / .4)), vis = (1 - out);
  // cinematic letterbox bars
  var bar = H * .11 * (1 - Math.pow(1 - inK, 3)) * vis; x.fillStyle = "#000"; x.fillRect(0, 0, W, bar); x.fillRect(0, H - bar, W, bar);
  // band behind the text
  var bk = Math.min(1, Math.max(0, (t - .1) / .4)), bw = W * (1 - Math.pow(1 - bk, 3)), cy = H / 2;
  x.globalAlpha = .55 * vis; x.fillStyle = "#000"; x.fillRect((W - bw) / 2, cy - 130 * u, bw, 260 * u); x.globalAlpha = 1;
  var ar = /[؀-ۿ]/.test(o.title), fam = ar ? '"QT Lalezar", "QT Arabic", sans-serif' : 'Sora, "Arial Black", sans-serif', wt = ar ? "400 " : "800 ";
  var p = Math.min(1, Math.max(0, (t - .2) / .5)), e = 1 - Math.pow(1 - p, 3), sc = 1 + (1 - e) * .35, fs = 150 * u;
  x.font = wt + fs + "px " + fam; var mw = x.measureText(o.title).width; if (mw > W * .86) { fs *= W * .86 / mw; x.font = wt + fs + "px " + fam; }
  x.save(); x.globalAlpha = e * vis; x.translate(W / 2, cy - 20 * u); x.scale(sc, sc); x.textAlign = "center"; x.textBaseline = "middle"; x.direction = ar ? "rtl" : "ltr";
  if (!ar && "letterSpacing" in x) x.letterSpacing = (6 * u * (1 + (1 - e) * 3)) + "px";
  x.shadowColor = o.glow; x.shadowBlur = 40 * u; x.lineJoin = "round"; x.lineWidth = fs * .1; x.strokeStyle = "#000"; x.strokeText(o.title, 0, 0);
  x.fillStyle = o.color; x.fillText(o.title, 0, 0); x.restore();
  var sp = Math.min(1, Math.max(0, (t - .65) / .45)); if (o.sub) { x.save(); x.globalAlpha = sp * vis; x.font = (ar ? "400 " : "700 ") + 62 * u + "px " + fam; x.textAlign = "center"; x.textBaseline = "middle"; x.direction = ar ? "rtl" : "ltr"; x.lineWidth = 8 * u; x.strokeStyle = "#000"; x.strokeText(o.sub, W / 2, cy + 85 * u + (1 - sp) * 30 * u); x.fillStyle = "#fff"; x.fillText(o.sub, W / 2, cy + 85 * u + (1 - sp) * 30 * u); x.restore(); }
  return D;
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("gtaZone")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0, L = AR ? "ar" : "en";
  var reduce = (function () { try { return localStorage.getItem("qtGsMotion") === "off"; } catch (e) { return false; } })(); window.qtGsStill = reduce; if (reduce) document.documentElement.classList.add("gs-still");
  var T = AR ? { d: "يوم", h: "ساعة", m: "دقيقة", s: "ثانية", out: "🎮 نزلت! استمتع", copied: "✓ تم النسخ", exp: "جارٍ تجهيز الفيديو…", done: "✓ تم التنزيل", fail: "تعذّر إنشاء الفيديو: ", saved: "✓ تم تنزيل الخلفية", photo: "اختر لقطة شاشة أولًا" }
             : { d: "days", h: "hours", m: "min", s: "sec", out: "🎮 It's out! Have fun", copied: "✓ Copied", exp: "Rendering video…", done: "✓ Downloaded", fail: "Couldn't create the video: ", saved: "✓ Wallpaper downloaded", photo: "Choose a screenshot first" };

  // ---- world background (paused when hidden / reduced motion draws one frame) ----
  var wc = $("gtaWorld"), wx = wc.getContext("2d"), dpr = Math.min(1.5, window.devicePixelRatio || 1);
  function size() { wc.width = Math.round(innerWidth * dpr * .75); wc.height = Math.round(innerHeight * dpr * .75); }
  size(); addEventListener("resize", size);
  var t0 = performance.now(), last = 0;
  (function tick(now) { if (!document.hidden && now - last > 33) { last = now; qtGtaWorld(wx, wc.width, wc.height, reduce ? 4 : (now - t0) / 1000); } if (!reduce) requestAnimationFrame(tick); })(performance.now());
  if (reduce) qtGtaWorld(wx, wc.width, wc.height, 4);
  // arrival effect when coming through the portal
  try { if (sessionStorage.getItem("qtGtaWarp")) { sessionStorage.removeItem("qtGtaWarp"); if (!reduce) document.documentElement.classList.add("gta-arrive"); setTimeout(function () { document.documentElement.classList.remove("gta-arrive"); }, 1400); } } catch (e) {}

  // ---- countdown ----
  var target = new Date(QT_GTA_LAUNCH).getTime();
  function cd() {
    var l = qtGtaLeft(Date.now(), target);
    if (l.done) { $("gtaCount").innerHTML = '<div class="gta-out">' + T.out + "</div>"; return; }
    [["gtaD", l.days, T.d], ["gtaH", l.hours, T.h], ["gtaM", l.mins, T.m], ["gtaS", l.secs, T.s]].forEach(function (c) { var el = $(c[0]); var v = String(c[1]).padStart(2, "0"); if (el.firstChild.textContent !== v) { el.firstChild.textContent = v; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); } el.lastChild.textContent = c[2]; });
  }
  cd(); setInterval(cd, 1000);

  // ---- crew names ----
  var seed = Date.now() % 100000;
  function crews() {
    var box = $("gtaCrews"); box.innerHTML = "";
    qtGtaCrews(L, seed, 8).forEach(function (c) {
      var b = document.createElement("button"); b.type = "button"; b.className = "gta-crew";
      b.innerHTML = "<b></b><span></span>"; b.firstChild.textContent = c.name; b.lastChild.textContent = "[" + c.tag + "]";
      b.addEventListener("click", function () { var txt = c.name + " [" + c.tag + "]"; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { b.classList.add("ok"); $("gtaCrewMsg").textContent = T.copied + ": " + txt; setTimeout(function () { b.classList.remove("ok"); }, 1200); }, function () {}); });
      box.appendChild(b);
    });
  }
  $("gtaCrewGo").addEventListener("click", function () { seed = (seed * 7 + 13) % 1000003; crews(); if (typeof qtEvent === "function") qtEvent("gta_crews"); });
  crews();

  // ---- mission overlays ----
  var ov = { kind: "passed", bg: "green", ratio: "16:9", title: "", sub: "" }, oc = $("gtaOvl"), ox = oc.getContext("2d"), ot0 = performance.now();
  function ovFill() { var k = QT_GTA_OVL[ov.kind]; ov.title = k[L][0]; ov.sub = k[L][1]; $("gtaOvlTitle").value = ov.title; $("gtaOvlSub").value = ov.sub; }
  function ovOpts() { var k = QT_GTA_OVL[ov.kind]; return { title: ov.title, sub: ov.sub, color: k.color, glow: k.glow, bg: ov.bg }; }
  function ovSize() { var z = ov.ratio === "9:16" ? [540, 960] : [960, 540]; oc.width = z[0]; oc.height = z[1]; oc.parentNode.style.aspectRatio = z[0] + " / " + z[1]; }
  (function oloop(now) { if (!document.hidden) { var tt = ((now - ot0) / 1000) % 4.4; qtGtaOverlay(ox, oc.width, oc.height, Math.min(tt, 3.6), ovOpts()); } requestAnimationFrame(oloop); })(performance.now());
  document.querySelectorAll("#gtaOvlKind .chip").forEach(function (b) { b.addEventListener("click", function () { ov.kind = b.getAttribute("data-k"); ovFill(); syncOv(); ot0 = performance.now(); }); });
  document.querySelectorAll("#gtaOvlBg .chip").forEach(function (b) { b.addEventListener("click", function () { ov.bg = b.getAttribute("data-b"); syncOv(); }); });
  document.querySelectorAll("#gtaOvlRatio .chip").forEach(function (b) { b.addEventListener("click", function () { ov.ratio = b.getAttribute("data-r"); ovSize(); syncOv(); }); });
  $("gtaOvlTitle").addEventListener("input", function () { ov.title = this.value.slice(0, 40); });
  $("gtaOvlSub").addEventListener("input", function () { ov.sub = this.value.slice(0, 50); });
  function syncOv() { [["#gtaOvlKind", "data-k", "kind"], ["#gtaOvlBg", "data-b", "bg"], ["#gtaOvlRatio", "data-r", "ratio"]].forEach(function (g) { document.querySelectorAll(g[0] + " .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute(g[1]) === ov[g[2]]); }); }); }
  function dl(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }
  async function ovMp4() {
    var W = ov.ratio === "9:16" ? 1080 : 1920, H = ov.ratio === "9:16" ? 1920 : 1080, fps = 30, D = 3.6, frames = Math.round(D * fps), cfg = null;
    for (var c of ["avc1.640028", "avc1.4d0028", "avc1.42003e"]) { var o = { codec: c, width: W, height: H, bitrate: 6e6, framerate: fps }; try { if ((await VideoEncoder.isConfigSupported(o)).supported) { cfg = o; break; } } catch (e) {} }
    if (!cfg) throw new Error("no-h264");
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H; var x = cv.getContext("2d"), oo = ovOpts();
    var mux = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" }), err = null;
    var enc = new VideoEncoder({ output: function (ch, meta) { mux.addVideoChunk(ch, meta); }, error: function (e) { err = e; } }); enc.configure(cfg);
    for (var f = 0; f < frames; f++) { qtGtaOverlay(x, W, H, f / fps, oo); var vf = new VideoFrame(cv, { timestamp: Math.round(f * 1e6 / fps), duration: Math.round(1e6 / fps) }); enc.encode(vf, { keyFrame: f % 60 === 0 }); vf.close(); if (f % 10 === 0) await new Promise(function (r) { setTimeout(r, 0); }); if (err) throw err; }
    await enc.flush(); mux.finalize(); return new Blob([mux.target.buffer], { type: "video/mp4" });
  }
  function ovRec() {
    return new Promise(function (res, rej) {
      var W = ov.ratio === "9:16" ? 1080 : 1920, H = ov.ratio === "9:16" ? 1920 : 1080, cv = document.createElement("canvas"); cv.width = W; cv.height = H; var x = cv.getContext("2d"), oo = ovOpts();
      var mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find(function (m) { return MediaRecorder.isTypeSupported(m); });
      var rec = new MediaRecorder(cv.captureStream(30), { mimeType: mime, videoBitsPerSecond: 6e6 }), ch = [];
      rec.ondataavailable = function (e) { if (e.data.size) ch.push(e.data); }; rec.onstop = function () { res(new Blob(ch, { type: mime.split(";")[0] })); }; rec.onerror = rej;
      var s0 = performance.now(); rec.start();
      (function step() { var tt = (performance.now() - s0) / 1000; qtGtaOverlay(x, W, H, Math.min(tt, 3.6), oo); if (tt < 3.6) requestAnimationFrame(step); else rec.stop(); })();
    });
  }
  $("gtaOvlGo").addEventListener("click", async function () {
    this.disabled = true; $("gtaOvlMsg").textContent = T.exp;
    try { var blob = null; if (typeof VideoEncoder !== "undefined" && typeof Mp4Muxer !== "undefined") { try { blob = await ovMp4(); } catch (e) { if (String(e.message) !== "no-h264") throw e; } }
      if (!blob) blob = await ovRec();
      dl(blob, "overlay-" + ov.kind + "-" + ov.bg + "-" + ov.ratio.replace(":", "x") + (blob.type.indexOf("webm") >= 0 ? ".webm" : ".mp4")); $("gtaOvlMsg").textContent = T.done;
      if (typeof qtEvent === "function") qtEvent("gta_overlay");
    } catch (e) { $("gtaOvlMsg").textContent = T.fail + (e && e.message || e); }
    this.disabled = false;
  });
  ovFill(); ovSize(); syncOv();

  // ---- wallpaper maker ----
  var wp = { img: null, preset: "phone", fx: .5, fy: .5, fxk: "neon" }, PRE = { phone: [1080, 2340], iphone: [1290, 2796], desktop: [2560, 1440], uhd: [3840, 2160] };
  var pc = $("gtaWp"), px = pc.getContext("2d");
  function wpDraw(x, W, H) {
    var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#2b0640"); g.addColorStop(1, "#c2185b"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    if (wp.img) { var r = qtGtaCover(wp.img.width, wp.img.height, W, H, wp.fx, wp.fy); x.drawImage(wp.img, r.x, r.y, r.w, r.h); }
    if (wp.fxk === "neon" || wp.fxk === "vhs") { var gg = x.createLinearGradient(0, 0, 0, H); gg.addColorStop(0, "rgba(120,0,180,.22)"); gg.addColorStop(.6, "rgba(255,40,140,0)"); gg.addColorStop(1, "rgba(255,120,60,.28)"); x.fillStyle = gg; x.fillRect(0, 0, W, H); var vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(10,0,25,.55)"); x.fillStyle = vg; x.fillRect(0, 0, W, H); }
    if (wp.fxk === "vhs") { x.fillStyle = "rgba(0,0,0,.18)"; for (var y = 0; y < H; y += Math.max(3, Math.round(H / 400))) x.fillRect(0, y, W, Math.max(1, Math.round(H / 900))); }
  }
  function wpPreview() { var z = PRE[wp.preset], k = Math.min(360 / z[0], 420 / z[1]); pc.width = Math.round(z[0] * k); pc.height = Math.round(z[1] * k); wpDraw(px, pc.width, pc.height); }
  $("gtaWpFile").addEventListener("change", function () { var f = this.files[0]; if (!f) return; createImageBitmap(f).then(function (b) { wp.img = b; wpPreview(); }); });
  document.querySelectorAll("#gtaWpPre .chip").forEach(function (b) { b.addEventListener("click", function () { wp.preset = b.getAttribute("data-p"); document.querySelectorAll("#gtaWpPre .chip").forEach(function (o) { o.classList.toggle("active", o === b); }); wpPreview(); }); });
  document.querySelectorAll("#gtaWpFx .chip").forEach(function (b) { b.addEventListener("click", function () { wp.fxk = b.getAttribute("data-f"); document.querySelectorAll("#gtaWpFx .chip").forEach(function (o) { o.classList.toggle("active", o === b); }); wpPreview(); }); });
  $("gtaWpX").addEventListener("input", function () { wp.fx = this.value / 100; wpPreview(); });
  $("gtaWpY").addEventListener("input", function () { wp.fy = this.value / 100; wpPreview(); });
  $("gtaWpGo").addEventListener("click", function () {
    if (!wp.img) { $("gtaWpMsg").textContent = T.photo; return; }
    var z = PRE[wp.preset], c = document.createElement("canvas"); c.width = z[0]; c.height = z[1]; wpDraw(c.getContext("2d"), z[0], z[1]);
    c.toBlob(function (b) { dl(b, "wallpaper-" + z[0] + "x" + z[1] + ".jpg"); $("gtaWpMsg").textContent = T.saved; if (typeof qtEvent === "function") qtEvent("gta_wallpaper"); }, "image/jpeg", .92);
  });
  wpPreview();

  // ---- launch checklist (saved in this browser) ----
  var KEY = "qtGtaCheck", done = {}; try { done = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  var boxes = document.querySelectorAll("#gtaCheck input[type=checkbox]");
  function prog() { var n = 0; boxes.forEach(function (b) { if (b.checked) n++; }); $("gtaCheckBar").style.width = Math.round(n / boxes.length * 100) + "%"; $("gtaCheckN").textContent = n + " / " + boxes.length; }
  boxes.forEach(function (b) { b.checked = !!done[b.id]; b.addEventListener("change", function () { done[b.id] = b.checked; try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} prog(); }); });
  prog();
})();
if (typeof module !== "undefined") module.exports = { qtGtaLeft: qtGtaLeft, qtGtaCrews: qtGtaCrews, qtGtaTag: qtGtaTag, qtGtaCover: qtGtaCover, QT_GTA_LAUNCH: QT_GTA_LAUNCH, QT_GTA_OVL: QT_GTA_OVL };
