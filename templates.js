// QuickTiny Video Templates: ready-made animated templates for the most common short-video formats (announcement,
// top list, sale, quote, invite, before/after, product, Ramadan/Eid greeting, real estate, menu item, review, stats,
// Reels hook). Every frame is a pure function of time → smooth scrubbing and 30/60 fps MP4 export (WebCodecs +
// mp4-muxer). Arabic and English, photos stay on the device.

/* ================= animation toolkit ================= */
var TP = (function () {
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a)); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var expo = function (k) { k = clamp(k); return k === 1 ? 1 : 1 - Math.pow(2, -10 * k); };
  var cubic = function (k) { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  var back = function (k, s) { k = clamp(k); s = s == null ? 1.70158 : s; var c3 = s + 1; return 1 + c3 * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
  var spring = function (k) { k = clamp(k); return 1 - Math.exp(-7 * k) * Math.cos(9.5 * k); };
  var pend = function (t, amp, damp, freq) { return t < 0 ? amp : amp * Math.exp(-damp * t) * Math.cos(freq * t); };
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function isAr(s) { return /[؀-ۿ]/.test(s || ""); }
  function rr(x, X, Y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function font(ar, kind) {
    if (kind === "serif") return ['700 ', '"QT Amiri", Georgia, serif'];
    if (kind === "body") return ar ? ['700 ', '"QT Arabic", Sora, sans-serif'] : ['600 ', 'Sora, "Segoe UI", sans-serif'];
    return ar ? ['400 ', '"QT Lalezar", "QT Arabic", sans-serif'] : ['800 ', 'Sora, "Arial Black", sans-serif'];
  }
  function tokens(text) {
    var out = [], hi = false;
    String(text || "").replace(/\s+/g, " ").trim().split(" ").forEach(function (raw) {
      if (!raw) return; var w = raw, s = w.charAt(0) === "*"; if (s) { hi = true; w = w.slice(1); }
      var m = /\*([.,!?؟،:;]*)$/.exec(w), e = !!m; if (e) w = w.slice(0, m.index) + m[1];
      if (w) out.push({ w: w, hi: hi }); if (e) hi = false;
    });
    return out;
  }
  // Fit text into a box: largest size (≤ max) where all lines fit; words never split.
  function layout(x, text, boxW, boxH, kind, max, min, maxLines, lhK) {
    var ar = isAr(text), f = font(ar, kind), toks = tokens(text), lh = lhK || (ar ? 1.22 : 1.08), best = null;
    for (var size = max; size >= min; size -= Math.max(1, max / 60)) {
      x.font = f[0] + size + "px " + f[1]; var sp = x.measureText(" ").width, lines = [], cur = [], cw = 0, ok = true;
      toks.forEach(function (t) { var w = x.measureText(t.w).width; if (w > boxW) ok = false; if (cur.length && cw + sp + w > boxW) { lines.push({ words: cur, width: cw }); cur = []; cw = 0; } cw += (cur.length ? sp : 0) + w; cur.push({ w: t.w, hi: t.hi, width: w }); });
      if (cur.length) lines.push({ words: cur, width: cw });
      best = { lines: lines, size: size, lh: size * lh, sp: sp, ar: ar, f: f };
      if (ok && lines.length <= (maxLines || 4) && lines.length * size * lh <= boxH) return best;
    }
    return best;
  }
  // Draw laid-out words with a per-word entrance. Returns the time the last word finishes.
  // anim: rise | pop | slam | fade | drop ; align: start | center | end (reading direction aware)
  function words(x, L, box, o, t) {
    var n = 0, total = 0; L.lines.forEach(function (l) { total += l.words.length; });
    var h = L.lines.length * L.lh, y0 = box.y + (o.valign === "top" ? 0 : (box.h - h) / 2) + L.lh / 2, stg = o.stagger == null ? .08 : o.stagger, dur = o.dur || .55;
    L.lines.forEach(function (line, li) {
      var y = y0 + li * L.lh, align = o.align || "center", startX;
      if (align === "center") startX = box.x + (box.w - line.width) / 2;
      else if ((align === "start") !== L.ar) startX = box.x; else startX = box.x + box.w - line.width;
      var cx = L.ar ? startX + line.width : startX;
      line.words.forEach(function (wd) {
        var w = wd.width, mx = L.ar ? cx - w : cx; cx += (L.ar ? -1 : 1) * (w + L.sp);
        var p = clamp((t - o.t0 - n * stg) / dur); n++;
        if (p <= 0) return;
        var a = 1, sc = 1, dy = 0, rot = 0;
        if (o.anim === "pop") { sc = back(p, 2.2); a = Math.min(1, p * 3); }
        else if (o.anim === "slam") { var e = expo(p); sc = 1 + (1 - e) * 1.4; a = Math.min(1, p * 4); rot = (1 - e) * -.08; }
        else if (o.anim === "drop") { dy = -(1 - back(p, 1.6)) * L.size * 1.2; a = Math.min(1, p * 2.5); }
        else if (o.anim === "fade") { a = cubic(p); dy = (1 - cubic(p)) * L.size * .18; }
        else { var s = spring(p); dy = (1 - s) * L.size * .7; a = Math.min(1, p * 2.2); }
        x.save(); x.globalAlpha *= a; x.translate(mx + w / 2, y + dy); x.rotate(rot); x.scale(sc, sc);
        if (wd.hi && o.hiBox) { x.fillStyle = o.hiBox; rr(x, -w / 2 - L.size * .14, -L.size * .56, w + L.size * .28, L.size * 1.08, L.size * .16); x.fill(); }
        x.font = L.f[0] + L.size + "px " + L.f[1]; x.textBaseline = "middle"; x.textAlign = "center"; x.direction = L.ar ? "rtl" : "ltr";
        if (o.shadow) { x.shadowColor = o.shadow; x.shadowBlur = L.size * .25; x.shadowOffsetY = L.size * .06; }
        if (o.stroke) { x.lineJoin = "round"; x.lineWidth = L.size * .12; x.strokeStyle = o.stroke; x.strokeText(wd.w, 0, L.size * .04); }
        x.fillStyle = wd.hi ? (o.hiBox ? (o.hiInk || "#111") : (o.hi || o.color)) : o.color; x.fillText(wd.w, 0, L.size * .04);
        x.restore();
      });
    });
    return o.t0 + Math.max(0, total - 1) * stg + dur;
  }
  function text(x, str, cx, cy, size, color, kind, o) {
    o = o || {}; var ar = isAr(str), f = font(ar, kind); x.save(); x.font = f[0] + size + "px " + f[1]; x.textAlign = o.align || "center"; x.textBaseline = "middle"; x.direction = ar ? "rtl" : "ltr";
    if (o.ls != null && "letterSpacing" in x) x.letterSpacing = o.ls + "px";
    if (o.shadow) { x.shadowColor = o.shadow; x.shadowBlur = size * .3; }
    if (o.stroke) { x.lineJoin = "round"; x.lineWidth = size * .12; x.strokeStyle = o.stroke; x.strokeText(str, cx, cy); }
    x.fillStyle = color; x.fillText(str, cx, cy); var w = x.measureText(str).width; x.restore(); return w;
  }
  function fitSize(x, str, maxW, max, kind) { var f = font(isAr(str), kind); x.font = f[0] + max + "px " + f[1]; var w = x.measureText(str).width; return w > maxW ? max * maxW / w : max; }
  // Animated number: the first number inside the string counts up with p (keeps prefix/suffix and separators).
  function count(str, p) {
    str = String(str == null ? "" : str); var m = /(\d[\d,]*(?:\.\d+)?)/.exec(str); if (!m) return str;
    var raw = m[1], target = parseFloat(raw.replace(/,/g, "")), dec = (raw.split(".")[1] || "").length, v = target * clamp(p);
    var s = v.toFixed(dec); if (raw.indexOf(",") >= 0 || target >= 10000) { var parts = s.split("."); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); s = parts.join("."); }
    return str.slice(0, m.index) + s + str.slice(m.index + raw.length);
  }
  // Moving gradient background with soft colour blobs (+ optional rays / grid / stars / dots).
  function bg(x, W, H, t, P, kind) {
    var g = x.createLinearGradient(0, 0, W * .4, H); g.addColorStop(0, P.bg[0]); g.addColorStop(1, P.bg[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var u = Math.min(W, H);
    x.save(); x.globalCompositeOperation = P.light ? "multiply" : "screen";
    [[P.a, .25, .2, 1.1], [P.b, .8, .75, 1.4], [P.a, .7, .15, .9]].forEach(function (b, i) {
      var cx = W * (b[1] + .08 * Math.sin(t * .5 + i * 2)), cy = H * (b[2] + .06 * Math.cos(t * .4 + i)), r = u * .6 * b[3];
      var rg = x.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, hexA(b[0], P.light ? .16 : .28)); rg.addColorStop(1, hexA(b[0], 0)); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    });
    x.restore();
    if (kind === "rays") { x.save(); x.translate(W / 2, H * .45); x.rotate(t * .12); x.globalAlpha = P.light ? .06 : .07; x.fillStyle = P.light ? P.a : "#fff"; for (var r = 0; r < 16; r++) { x.rotate(Math.PI / 8); x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.max(W, H), -u * .09); x.lineTo(Math.max(W, H), u * .09); x.closePath(); x.fill(); } x.restore(); }
    if (kind === "grid") { x.save(); x.strokeStyle = P.light ? "rgba(0,0,0,.06)" : "rgba(255,255,255,.07)"; x.lineWidth = Math.max(1, u * .002); var s = u * .09, off = (t * u * .03) % s; for (var gx = -s + off; gx < W + s; gx += s) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); } for (var gy = -s + off; gy < H + s; gy += s) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); } x.restore(); }
    if (kind === "stars") { var R = rng(7); x.save(); for (var k = 0; k < 90; k++) { var sx = R() * W, sy = R() * H * .8, tw = .35 + .65 * Math.abs(Math.sin(t * (1 + R() * 2) + k)); x.globalAlpha = tw * .9; x.fillStyle = "#fff"; x.beginPath(); x.arc(sx, sy, u * (.0015 + R() * .003), 0, 7); x.fill(); } x.restore(); }
    if (kind === "dots") { var Q = rng(11); x.save(); for (var d = 0; d < 26; d++) { var dx = Q() * W, dy = (Q() * H - t * u * (.02 + Q() * .05)) % H; if (dy < 0) dy += H; x.globalAlpha = .12 + Q() * .2; x.fillStyle = Q() > .5 ? P.a : P.b; x.beginPath(); x.arc(dx, dy, u * (.006 + Q() * .014), 0, 7); x.fill(); } x.restore(); }
    var vg = x.createRadialGradient(W / 2, H / 2, u * .3, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, P.light ? "rgba(80,40,0,.12)" : "rgba(0,0,0,.4)"); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  }
  function hexA(hex, a) { var m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return "rgba(255,255,255," + a + ")"; var n = parseInt(m[1], 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
  function ink(hex) { var m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return "#fff"; var n = parseInt(m[1], 16); return .2126 * (n >> 16 & 255) + .7152 * (n >> 8 & 255) + .0722 * (n & 255) > 150 ? "#111111" : "#ffffff"; }
  // Image (cover) inside a rounded rect, with optional Ken Burns zoom.
  function photo(x, img, X, Y, w, h, r, zoom, fx, fy) {
    x.save(); rr(x, X, Y, w, h, r); x.clip();
    if (img) { var z = zoom || 1, k = Math.max(w / img.width, h / img.height) * z, iw = img.width * k, ih = img.height * k; x.drawImage(img, X + (w - iw) * (fx == null ? .5 : fx), Y + (h - ih) * (fy == null ? .5 : fy), iw, ih); }
    else { var g = x.createLinearGradient(X, Y, X + w, Y + h); g.addColorStop(0, "#5b6b8c"); g.addColorStop(1, "#2a3350"); x.fillStyle = g; x.fillRect(X, Y, w, h); x.fillStyle = "rgba(255,255,255,.55)"; var s = Math.min(w, h) * .18; x.beginPath(); x.arc(X + w / 2, Y + h * .42, s * .5, 0, 7); x.fill(); x.beginPath(); x.ellipse(X + w / 2, Y + h * .42 + s * 1.15, s * .9, s * .55, 0, Math.PI, 0); x.fill(); }
    x.restore();
  }
  function shine(x, X, Y, w, h, p, r) { if (p <= 0 || p >= 1) return; x.save(); rr(x, X, Y, w, h, r || 0); x.clip(); var sx = X - w * .3 + p * w * 1.6, g = x.createLinearGradient(sx - w * .15, 0, sx + w * .15, 0); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.5, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.transform(1, 0, -.3, 1, 0, 0); x.fillRect(X - h, Y, w + h * 2, h); x.restore(); }
  function star(x, cx, cy, r, pts, inner) { x.beginPath(); for (var i = 0; i < pts * 2; i++) { var rad = i % 2 ? r * inner : r, a = -Math.PI / 2 + i * Math.PI / pts; x.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } x.closePath(); }
  return { clamp: clamp, seg: seg, lerp: lerp, expo: expo, cubic: cubic, back: back, spring: spring, pend: pend, rng: rng, isAr: isAr, rr: rr, font: font, tokens: tokens, layout: layout, words: words, text: text, fitSize: fitSize, count: count, bg: bg, hexA: hexA, ink: ink, photo: photo, shine: shine, star: star };
})();

var QT_TP_PALETTES = {
  electric: { bg: ["#170a3a", "#3a0ca3"], a: "#ffd60a", b: "#4cc9f0", txt: "#ffffff" },
  sunset: { bg: ["#ff5f6d", "#ffc371"], a: "#2b1055", b: "#ffffff", txt: "#ffffff" },
  mint: { bg: ["#06302d", "#0f766e"], a: "#a7f3d0", b: "#fde68a", txt: "#ffffff" },
  noir: { bg: ["#0b0b0f", "#22222b"], a: "#ff2d55", b: "#8b5cf6", txt: "#ffffff" },
  cream: { bg: ["#fff8ea", "#ffe3c2"], a: "#e4572e", b: "#2a9d8f", txt: "#1b1b1b", light: true },
  royal: { bg: ["#081a36", "#13406f"], a: "#e9c46a", b: "#8ecae6", txt: "#ffffff" }
};
function qtTpLines(s) { return String(s || "").split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean); }

/* ================= templates ================= */
// Each: id, cat, dur(f), pal (default palette), bgk (background kind), fields [{k, type, en, ar, l:{en,ar}}], draw(x, W, H, t, f, P, A)
var QT_TEMPLATES = [
 { id: "announce", cat: "promo", pal: "electric", dur: function () { return 5; },
   name: { en: "Big Announcement", ar: "إعلان كبير" },
   fields: [{ k: "kicker", en: "BIG NEWS", ar: "خبر مهم", l: { en: "Small label", ar: "عنوان صغير" } },
            { k: "title", en: "We're launching *something new*", ar: "نطلق *شيئًا جديدًا*", l: { en: "Headline", ar: "العنوان" } },
            { k: "sub", en: "Coming 1 December", ar: "قريبًا في 1 ديسمبر", l: { en: "Line below", ar: "سطر تحت" } }],
   draw: function (x, W, H, t, f, P) {
     var u = Math.min(W, H) / 1080, port = H > W;
     TP.bg(x, W, H, t, P, "rays");
     // flash on start
     var fl = 1 - TP.seg(t, 0, .35); if (fl > 0) { x.fillStyle = TP.hexA(P.a, .55 * fl); x.fillRect(0, 0, W, H); }
     var box = { x: W * .08, y: H * (port ? .3 : .22), w: W * .84, h: H * (port ? .34 : .46) };
     // kicker pill
     var kp = TP.spring(TP.seg(t, .2, .9)); if (kp > 0) {
       x.save(); x.globalAlpha = Math.min(1, kp * 1.5); var ks = 46 * u, kw = TP.fitSize(x, f.kicker, W * .7, ks, "body"), y = box.y - 70 * u - (1 - kp) * 120 * u;
       x.font = TP.font(TP.isAr(f.kicker), "body")[0] + kw + "px " + TP.font(TP.isAr(f.kicker), "body")[1]; var tw = x.measureText(f.kicker).width + kw * 1.6;
       x.fillStyle = P.a; TP.rr(x, W / 2 - tw / 2, y - kw * .85, tw, kw * 1.7, kw * .85); x.fill(); TP.text(x, f.kicker, W / 2, y, kw, TP.ink(P.a), "body", { ls: TP.isAr(f.kicker) ? 0 : kw * .08 }); x.restore(); }
     var L = TP.layout(x, f.title, box.w, box.h, "display", (port ? 150 : 130) * u, 50 * u, 4);
     var end = TP.words(x, L, box, { t0: .55, stagger: .11, dur: .5, anim: "slam", color: P.txt, hi: P.a, shadow: "rgba(0,0,0,.35)" }, t);
     // underline wipe + shine
     var ul = TP.expo(TP.seg(t, end, end + .5)), lineY = box.y + (box.h + L.lines.length * L.lh) / 2 + 26 * u, lw = Math.min(box.w, Math.max.apply(null, L.lines.map(function (l) { return l.width; }))) * .6;
     if (ul > 0) { x.fillStyle = P.a; TP.rr(x, W / 2 - lw * ul / 2, lineY, lw * ul, 12 * u, 6 * u); x.fill(); }
     TP.shine(x, box.x, box.y, box.w, box.h, TP.seg(t, end + .4, end + 1.3));
     var sp = TP.seg(t, end + .3, end + .9); if (sp > 0) { x.save(); x.globalAlpha = TP.cubic(sp); TP.text(x, f.sub, W / 2, lineY + 90 * u + (1 - TP.cubic(sp)) * 30 * u, TP.fitSize(x, f.sub, W * .8, 54 * u, "body"), TP.hexA(P.txt, .9), "body"); x.restore(); }
   } },
 { id: "toplist", cat: "list", pal: "noir", dur: function (f) { return 1.4 + Math.max(1, qtTpLines(f.items).length) * .85 + 1.6; },
   name: { en: "Top 5 List", ar: "قائمة أفضل 5" },
   fields: [{ k: "title", en: "Top 5 *free tools* for creators", ar: "أفضل 5 *أدوات مجانية* لصناع المحتوى", l: { en: "Title", ar: "العنوان" } },
            { k: "items", type: "lines", en: "Auto subtitles\nThumbnail maker\nSilence remover\nGlass slides\nMotion titles", ar: "ترجمة تلقائية\nصانع الصورة المصغّرة\nحذف السكتات\nسلايدات زجاجية\nعناوين متحركة", l: { en: "Items (one per line, up to 6)", ar: "العناصر (سطر لكل عنصر، حتى 6)" } }],
   draw: function (x, W, H, t, f, P) {
     var u = Math.min(W, H) / 1080, port = H > W, items = qtTpLines(f.items).slice(0, 6), n = Math.max(1, items.length), ar = TP.isAr(f.title + f.items);
     TP.bg(x, W, H, t, P, "grid");
     var tb = { x: W * .08, y: H * (port ? .07 : .06), w: W * .84, h: H * (port ? .17 : .2) };
     TP.words(x, TP.layout(x, f.title, tb.w, tb.h, "display", 100 * u, 40 * u, 3), tb, { t0: .15, stagger: .07, dur: .5, anim: "drop", color: P.txt, hi: P.a }, t);
     var top = tb.y + tb.h + 30 * u, avail = H - top - H * .1, rowH = Math.min(avail / n, (port ? 200 : 140) * u), gap = rowH * .14;
     items.forEach(function (it, i) {
       var st = 1.1 + i * .85, p = TP.spring(TP.seg(t, st, st + .7)); if (p <= 0) return;
       var y = top + i * rowH, h = rowH - gap, cw = W * .84, cx = W * .08 + (ar ? -1 : 1) * (1 - p) * -W * .5, a = Math.min(1, TP.seg(t, st, st + .3) * 1.5);
       var latest = i === Math.min(n - 1, Math.floor((t - 1.1) / .85)); x.save(); x.globalAlpha = a * (latest ? 1 : .82);
       x.fillStyle = latest ? TP.hexA(P.a, .16) : "rgba(255,255,255,.07)"; TP.rr(x, cx, y, cw, h, h * .28); x.fill();
       if (latest) { x.strokeStyle = TP.hexA(P.a, .7); x.lineWidth = 3 * u; TP.rr(x, cx, y, cw, h, h * .28); x.stroke(); }
       var nr = h * .38, ncx = ar ? cx + cw - h * .5 : cx + h * .5, np = TP.back(TP.seg(t, st + .1, st + .55), 2.5);
       x.save(); x.translate(ncx, y + h / 2); x.scale(np, np); x.fillStyle = P.a; x.beginPath(); x.arc(0, 0, nr, 0, 7); x.fill(); TP.text(x, String(i + 1), 0, h * .02, nr * 1.15, TP.ink(P.a), "display"); x.restore();
       var tx = ar ? cx + cw - h * 1.05 : cx + h * 1.05, size = TP.fitSize(x, it, cw - h * 1.35, h * .42, "display");
       TP.text(x, it, tx, y + h / 2 + h * .03, size, P.txt, "display", { align: ar ? "right" : "left" });
       x.restore();
     });
     var prog = TP.clamp((t - 1.1) / (n * .85)); x.fillStyle = "rgba(255,255,255,.12)"; TP.rr(x, W * .08, H - H * .05, W * .84, 10 * u, 5 * u); x.fill(); x.fillStyle = P.a; TP.rr(x, W * .08, H - H * .05, W * .84 * prog, 10 * u, 5 * u); x.fill();
   } },
 { id: "sale", cat: "promo", pal: "sunset", dur: function () { return 5.5; },
   name: { en: "Flash Sale", ar: "عرض وخصم" },
   fields: [{ k: "label", en: "MEGA SALE", ar: "تخفيضات كبرى", l: { en: "Label", ar: "العنوان" } },
            { k: "percent", en: "50%", ar: "50%", l: { en: "Discount", ar: "الخصم" } },
            { k: "old", en: "$199", ar: "199 ر.س", l: { en: "Old price", ar: "السعر قبل" } },
            { k: "price", en: "$99", ar: "99 ر.س", l: { en: "New price", ar: "السعر بعد" } },
            { k: "cta", en: "Shop now", ar: "اطلب الآن", l: { en: "Button", ar: "الزر" } }],
   draw: function (x, W, H, t, f, P) {
     var u = Math.min(W, H) / 1080, port = H > W, cy = H * (port ? .42 : .45);
     TP.bg(x, W, H, t, P, "dots");
     // label letters flip in
     var lp = TP.seg(t, .1, .9), ls = TP.fitSize(x, f.label, W * .86, (port ? 120 : 100) * u, "display");
     x.save(); x.globalAlpha = Math.min(1, lp * 2); x.translate(W / 2, H * (port ? .14 : .13)); x.scale(1, TP.back(lp, 2)); TP.text(x, f.label, 0, 0, ls, "#fff", "display", { shadow: "rgba(0,0,0,.25)" }); x.restore();
     // starburst badge with counting percent
     var bp = TP.back(TP.seg(t, .6, 1.3), 1.8), R = Math.min(W, H) * .3 * bp;
     if (bp > 0) {
       x.save(); x.translate(W / 2, cy); x.rotate(t * .25); x.fillStyle = P.a; TP.star(x, 0, 0, R, 18, .86); x.fill(); x.rotate(-t * .5); x.globalAlpha = .25; x.fillStyle = "#fff"; TP.star(x, 0, 0, R * .9, 18, .86); x.fill(); x.restore();
       var cp = TP.expo(TP.seg(t, .9, 2.2)), pulse = 1 + .06 * Math.max(0, Math.sin((t - 2.2) * 6)) * (t > 2.2 && t < 2.8 ? 1 : 0);
       x.save(); x.translate(W / 2, cy); x.scale(pulse, pulse); TP.text(x, TP.count(f.percent, cp), 0, -R * .06, TP.fitSize(x, f.percent, R * 1.4, R * .78, "display"), "#fff", "display"); TP.text(x, TP.isAr(f.label) ? "خصم" : "OFF", 0, R * .45, R * .2, TP.hexA("#ffffff", .9), "display"); x.restore();
     }
     // old price with strike, new price pop
     var py = cy + Math.min(W, H) * .44, op = TP.seg(t, 2.0, 2.4);
     if (op > 0) { x.save(); x.globalAlpha = op; var os = 64 * u, ow = TP.text(x, f.old, W / 2 - W * .16, py, os, TP.hexA("#ffffff", .85), "body"); var sk = TP.expo(TP.seg(t, 2.4, 2.8)); x.strokeStyle = "#fff"; x.lineWidth = 6 * u; x.beginPath(); x.moveTo(W / 2 - W * .16 - ow / 2 - 8 * u, py + 4 * u); x.lineTo(W / 2 - W * .16 - ow / 2 - 8 * u + (ow + 16 * u) * sk, py - 4 * u); x.stroke(); x.restore(); }
     var np = TP.back(TP.seg(t, 2.6, 3.1), 2.4); if (np > 0) { x.save(); x.translate(W / 2 + W * .16, py); x.scale(np, np); TP.text(x, f.price, 0, 0, TP.fitSize(x, f.price, W * .4, 110 * u, "display"), "#fff", "display", { shadow: "rgba(0,0,0,.3)" }); x.restore(); }
     // CTA pulse + shine
     var cp2 = TP.spring(TP.seg(t, 3.2, 3.9)); if (cp2 > 0) {
       var bw = Math.min(W * .62, 620 * u), bh = 120 * u, by = H * (port ? .86 : .87) - bh / 2 + (1 - cp2) * 80 * u, pul = 1 + .035 * Math.sin(t * 6);
       x.save(); x.globalAlpha = Math.min(1, cp2 * 1.5); x.translate(W / 2, by + bh / 2); x.scale(pul, pul); x.shadowColor = "rgba(0,0,0,.3)"; x.shadowBlur = 30 * u; x.fillStyle = "#fff"; TP.rr(x, -bw / 2, -bh / 2, bw, bh, bh / 2); x.fill(); x.shadowColor = "transparent";
       TP.text(x, f.cta + (TP.isAr(f.cta) ? "  ←" : "  →"), 0, 2 * u, TP.fitSize(x, f.cta + "  →", bw * .8, 54 * u, "display"), P.bg[0], "display"); TP.shine(x, -bw / 2, -bh / 2, bw, bh, (t * .6) % 1.6, bh / 2); x.restore(); }
   } },
 { id: "quote", cat: "social", pal: "cream", dur: function () { return 6; },
   name: { en: "Quote Card", ar: "اقتباس" },
   fields: [{ k: "quote", en: "Small steps every day add up to *big results*.", ar: "الخطوات الصغيرة كل يوم تصنع *نتائج كبيرة*.", l: { en: "Quote", ar: "الاقتباس" }, type: "lines" },
            { k: "author", en: "— Your name", ar: "— اسمك", l: { en: "Author", ar: "القائل" } }],
   draw: function (x, W, H, t, f, P) {
     var u = Math.min(W, H) / 1080, port = H > W, ar = TP.isAr(f.quote);
     TP.bg(x, W, H, t, P, "none");
     var qm = TP.back(TP.seg(t, .1, .8), 1.6), qx = ar ? W * .82 : W * .18, qy = H * (port ? .24 : .2);
     if (qm > 0) { x.save(); x.translate(qx, qy); x.rotate((1 - qm) * -.6); x.scale(qm, qm); x.globalAlpha = .9; TP.text(x, ar ? "”" : "“", 0, 0, 340 * u, P.a, "serif"); x.restore(); }
     var box = { x: W * .12, y: H * (port ? .3 : .28), w: W * .76, h: H * (port ? .38 : .44) };
     var L = TP.layout(x, f.quote.replace(/\n/g, " "), box.w, box.h, "serif", (port ? 96 : 86) * u, 36 * u, 6, 1.3);
     var end = TP.words(x, L, box, { t0: .7, stagger: .09, dur: .7, anim: "fade", color: P.txt, hi: P.a }, t);
     var lp = TP.expo(TP.seg(t, end, end + .6)), ly = box.y + (box.h + L.lines.length * L.lh) / 2 + 50 * u;
     x.fillStyle = P.a; x.fillRect(W / 2 - 90 * u * lp, ly, 180 * u * lp, 5 * u);
     var ap = TP.cubic(TP.seg(t, end + .3, end + .9)); if (ap > 0) { x.save(); x.globalAlpha = ap; TP.text(x, f.author, W / 2 + (1 - ap) * (ar ? -40 : 40) * u, ly + 70 * u, TP.fitSize(x, f.author, W * .7, 50 * u, "body"), P.txt, "body"); x.restore(); }
   } },
 { id: "invite", cat: "event", pal: "mint", dur: function () { return 5.5; },
   name: { en: "Event Invite", ar: "دعوة لحدث" },
   fields: [{ k: "kicker", en: "You're invited", ar: "أنت مدعو", l: { en: "Top line", ar: "السطر الأول" } },
            { k: "title", en: "Creators *Meetup*", ar: "لقاء *صناع المحتوى*", l: { en: "Event", ar: "الحدث" } },
            { k: "date", en: "12 DEC 2026", ar: "12 ديسمبر 2026", l: { en: "Date", ar: "التاريخ" } },
            { k: "place", en: "Riyadh · 7 PM", ar: "الرياض · 7 مساءً", l: { en: "Place & time", ar: "المكان والوقت" } }],
   draw: function (x, W, H, t, f, P) {
     var u = Math.min(W, H) / 1080, port = H > W;
     TP.bg(x, W, H, t, P, "dots");
     // confetti burst
     var R = TP.rng(5); for (var i = 0; i < 70; i++) { var a0 = R() * Math.PI * 2, sp = (.25 + R() * .55) * Math.max(W, H), tt = TP.clamp(t - .3), cx = W / 2 + Math.cos(a0) * sp * TP.expo(tt * .8), cy = H * .45 + Math.sin(a0) * sp * TP.expo(tt * .8) + tt * tt * H * .08; if (t < .3) break; x.save(); x.globalAlpha = Math.max(0, 1 - (t - .3) / 3.5); x.translate(cx, cy); x.rotate(t * (2 + R() * 4)); x.fillStyle = [P.a, P.b, "#fff"][i % 3]; x.fillRect(-7 * u, -3 * u, 14 * u, 6 * u); x.restore(); }
     // card flips in
     var cp = TP.spring(TP.seg(t, .2, 1.1)), cw = W * (port ? .84 : .62), ch = H * (port ? .62 : .78), cx0 = W / 2, cy0 = H / 2;
     x.save(); x.translate(cx0, cy0); x.scale(Math.max(.02, cp), 1); x.globalAlpha = Math.min(1, cp * 2);
     x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 60 * u; x.shadowOffsetY = 30 * u; x.fillStyle = "rgba(255,255,255,.96)"; TP.rr(x, -cw / 2, -ch / 2, cw, ch, 44 * u); x.fill(); x.shadowColor = "transparent";
     x.fillStyle = P.bg[1]; TP.rr(x, -cw / 2, -ch / 2, cw, ch * .12, 44 * u); x.fill(); x.fillRect(-cw / 2, -ch / 2 + ch * .06, cw, ch * .06);
     var ks = TP.fitSize(x, f.kicker, cw * .8, 46 * u, "body"); TP.text(x, f.kicker, 0, -ch / 2 + ch * .06, ks, "#fff", "body");
     x.restore();
     if (cp > .6) {
       var tb = { x: cx0 - cw * .42, y: cy0 - ch * .32, w: cw * .84, h: ch * .32 };
       TP.words(x, TP.layout(x, f.title, tb.w, tb.h, "display", 120 * u, 44 * u, 3), tb, { t0: 1.0, stagger: .1, dur: .55, anim: "pop", color: "#151a2c", hi: P.bg[1] }, t);
       // date tiles drop in
       var parts = String(f.date).split(/\s+/).slice(0, 3), tw = cw * .84 / Math.max(1, parts.length), ty = cy0 + ch * .1;
       parts.forEach(function (pt, i) { var p = TP.back(TP.seg(t, 1.8 + i * .18, 2.4 + i * .18), 1.8); if (p <= 0) return; var tx = cx0 - cw * .42 + tw * (TP.isAr(f.date) ? parts.length - 1 - i : i) + tw / 2; x.save(); x.translate(tx, ty - (1 - p) * 140 * u); x.globalAlpha = Math.min(1, p * 2); x.fillStyle = P.bg[0]; TP.rr(x, -tw * .45, -70 * u, tw * .9, 140 * u, 22 * u); x.fill(); TP.text(x, pt, 0, 4 * u, TP.fitSize(x, pt, tw * .78, 70 * u, "display"), P.a, "display"); x.restore(); });
       var pp = TP.cubic(TP.seg(t, 2.6, 3.2)); if (pp > 0) { x.save(); x.globalAlpha = pp; TP.text(x, "📍 " + f.place, cx0, cy0 + ch * .33 + (1 - pp) * 20 * u, TP.fitSize(x, "📍 " + f.place, cw * .8, 48 * u, "body"), "#26304a", "body"); x.restore(); }
     }
   } },
 { id: "beforeafter", cat: "social", pal: "noir", dur: function () { return 5.5; }, imgs: 2,
   name: { en: "Before / After", ar: "قبل / بعد" },
   fields: [{ k: "title", en: "The *transformation*", ar: "*التحوّل*", l: { en: "Title", ar: "العنوان" } },
            { k: "l1", en: "BEFORE", ar: "قبل", l: { en: "Left label", ar: "التسمية الأولى" } },
            { k: "l2", en: "AFTER", ar: "بعد", l: { en: "Right label", ar: "التسمية الثانية" } },
            { k: "img", type: "image", l: { en: "Before photo", ar: "صورة قبل" } }, { k: "img2", type: "image", l: { en: "After photo", ar: "صورة بعد" } }],
   draw: function (x, W, H, t, f, P, A) {
     var u = Math.min(W, H) / 1080, port = H > W;
     TP.bg(x, W, H, t, P, "none");
     var tb = { x: W * .08, y: H * .04, w: W * .84, h: H * (port ? .13 : .15) };
     TP.words(x, TP.layout(x, f.title, tb.w, tb.h, "display", 110 * u, 40 * u, 2), tb, { t0: .1, stagger: .08, anim: "rise", color: "#fff", hi: P.a }, t);
     var ip = TP.spring(TP.seg(t, .3, 1.1)), X = W * .06, Y = tb.y + tb.h + 20 * u, w = W * .88, h = H - Y - H * .06, r = 36 * u;
     x.save(); x.globalAlpha = Math.min(1, ip * 1.5); x.translate(0, (1 - ip) * 80 * u);
     TP.photo(x, A.img, X, Y, w, h, r, 1.06 - .04 * TP.seg(t, 0, 5.5));
     // wipe: 0 → full → back to the middle
     var k = t < 1.4 ? 0 : t < 2.9 ? TP.cubic(TP.seg(t, 1.4, 2.9)) : 1 - .5 * TP.cubic(TP.seg(t, 3.1, 4.1)), sx = X + w * k;
     x.save(); TP.rr(x, X, Y, w, h, r); x.clip(); x.beginPath(); x.rect(X, Y, w * k, h); x.clip();
     if (A.img2) TP.photo(x, A.img2, X, Y, w, h, 0, 1.06 - .04 * TP.seg(t, 0, 5.5)); else { var g = x.createLinearGradient(X, Y, X + w, Y + h); g.addColorStop(0, P.a); g.addColorStop(1, P.b); x.fillStyle = g; x.fillRect(X, Y, w, h); }
     x.restore();
     if (k > .002 && k < .998) { x.fillStyle = "#fff"; x.fillRect(sx - 3 * u, Y, 6 * u, h); x.beginPath(); x.arc(sx, Y + h / 2, 38 * u, 0, 7); x.fill(); TP.text(x, "‹ ›", sx, Y + h / 2 + 2 * u, 40 * u, "#111", "display"); }
     var pill = function (txt, px, al) { var s = 40 * u; x.save(); x.font = TP.font(TP.isAr(txt), "body")[0] + s + "px " + TP.font(TP.isAr(txt), "body")[1]; var pw = x.measureText(txt).width + s * 1.2; var xx = al === "l" ? px : px - pw; x.fillStyle = "rgba(0,0,0,.55)"; TP.rr(x, xx, Y + 26 * u, pw, s * 1.6, s * .8); x.fill(); TP.text(x, txt, xx + pw / 2, Y + 26 * u + s * .8, s, "#fff", "body"); x.restore(); };
     if (k < .9) pill(f.l1, X + w - 26 * u, "r"); if (k > .1) pill(f.l2, X + 26 * u, "l");
     x.restore();
   } },
 { id: "product", cat: "promo", pal: "electric", dur: function () { return 6; }, imgs: 1,
   name: { en: "Product Showcase", ar: "عرض منتج" },
   fields: [{ k: "name", en: "Wireless *Earbuds*", ar: "سماعات *لاسلكية*", l: { en: "Product name", ar: "اسم المنتج" } },
            { k: "features", type: "lines", en: "30h battery\nNoise cancelling\nWater resistant", ar: "بطارية 30 ساعة\nعزل للضوضاء\nمقاومة للماء", l: { en: "Features (one per line)", ar: "المميزات (سطر لكل ميزة)" } },
            { k: "price", en: "$49", ar: "149 ر.س", l: { en: "Price", ar: "السعر" } },
            { k: "img", type: "image", l: { en: "Product photo (PNG with transparency looks best)", ar: "صورة المنتج (PNG بخلفية شفافة أجمل)" } }],
   draw: function (x, W, H, t, f, P, A) {
     var u = Math.min(W, H) / 1080, port = H > W, ar = TP.isAr(f.name + f.features);
     TP.bg(x, W, H, t, P, "rays");
     var icx = port ? W / 2 : W * (ar ? .7 : .3), icy = port ? H * .36 : H * .5, isz = Math.min(W, H) * (port ? .52 : .6);
     // rotating glow ring
     x.save(); x.translate(icx, icy); x.rotate(t * .6); var gr = x.createConicGradient ? x.createConicGradient(0, 0, 0) : null;
     if (gr) { gr.addColorStop(0, TP.hexA(P.a, .0)); gr.addColorStop(.5, TP.hexA(P.a, .55)); gr.addColorStop(1, TP.hexA(P.b, 0)); x.strokeStyle = gr; } else x.strokeStyle = TP.hexA(P.a, .4);
     var rp = TP.expo(TP.seg(t, .2, 1)); x.lineWidth = 14 * u; x.beginPath(); x.arc(0, 0, isz * .56 * rp, 0, 7); x.stroke(); x.restore();
     // product floats in and bobs
     var pp = TP.spring(TP.seg(t, .3, 1.3)), bob = Math.sin(t * 2) * 12 * u * TP.seg(t, 1.3, 2);
     x.save(); x.globalAlpha = TP.clamp(pp * 1.5); x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.ellipse(icx, icy + isz * .5, isz * .32 * (1 - bob / (80 * u)), isz * .05, 0, 0, 7); x.fill(); x.restore();
     x.save(); x.translate(icx, icy + (1 - pp) * H * .4 + bob); x.rotate((1 - pp) * .3 + Math.sin(t * 1.3) * .02); x.globalAlpha = TP.clamp(pp * 1.5);
     if (A.img) { var k = Math.min(isz / A.img.width, isz / A.img.height), iw = A.img.width * k, ih = A.img.height * k; x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 40 * u; x.shadowOffsetY = 20 * u; x.drawImage(A.img, -iw / 2, -ih / 2, iw, ih); }
     else TP.photo(x, null, -isz * .4, -isz * .4, isz * .8, isz * .8, 40 * u);
     x.restore();
     // name + features + price
     var tx = port ? W * .08 : W * (ar ? .06 : .52), tw = port ? W * .84 : W * .42, ty = port ? H * .64 : H * .16;
     var nb = { x: tx, y: ty, w: tw, h: H * (port ? .1 : .2) }, NL = TP.layout(x, f.name, nb.w, nb.h, "display", 100 * u, 40 * u, 2);
     var e = TP.words(x, NL, nb, { t0: 1.1, stagger: .08, anim: "rise", color: "#fff", hi: P.a, align: port ? "center" : "start" }, t);
     qtTpLines(f.features).slice(0, 4).forEach(function (ft, i) {
       var st = e + .1 + i * .3, p = TP.spring(TP.seg(t, st, st + .6)); if (p <= 0) return;
       var fy = nb.y + nb.h + 30 * u + i * 78 * u, fs = TP.fitSize(x, ft, tw * .8, 44 * u, "body"), cx = port ? W / 2 - (x.font = TP.font(TP.isAr(ft), "body")[0] + fs + "px " + TP.font(TP.isAr(ft), "body")[1], x.measureText(ft).width + 60 * u) / 2 : (ar ? tx + tw : tx);
       x.save(); x.globalAlpha = TP.clamp(p * 1.5); x.translate((1 - p) * (ar ? 60 : -60) * u, 0);
       var cxx = port ? (ar ? cx + x.measureText(ft).width + 60 * u - 22 * u : cx + 22 * u) : (ar ? cx - 22 * u : cx + 22 * u);
       x.fillStyle = P.a; x.beginPath(); x.arc(cxx, fy, 20 * u, 0, 7); x.fill(); x.strokeStyle = TP.ink(P.a); x.lineWidth = 5 * u; x.beginPath(); x.moveTo(cxx - 9 * u, fy); x.lineTo(cxx - 2 * u, fy + 7 * u); x.lineTo(cxx + 10 * u, fy - 7 * u); x.stroke();
       TP.text(x, ft, ar ? cxx - 40 * u : cxx + 40 * u, fy + 2 * u, fs, "#fff", "body", { align: ar ? "right" : "left" }); x.restore();
     });
     // price tag swings in (damped pendulum)
     var sp = TP.seg(t, e + 1.1, e + 1.4); if (sp > 0) {
       var ang = TP.pend(t - (e + 1.1), .5, 2.2, 7), px = port ? W * .78 : (ar ? tx + tw * .2 : tx + tw * .8), py = port ? H * .52 : H * .78;
       x.save(); x.translate(px, py - 120 * u); x.rotate(ang); x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = 3 * u; x.beginPath(); x.moveTo(0, -60 * u); x.lineTo(0, 0); x.stroke();
       var ps = TP.fitSize(x, f.price, 260 * u, 76 * u, "display"); x.font = TP.font(TP.isAr(f.price), "display")[0] + ps + "px " + TP.font(TP.isAr(f.price), "display")[1]; var pw = x.measureText(f.price).width + 70 * u;
       x.fillStyle = P.a; TP.rr(x, -pw / 2, 0, pw, 120 * u, 26 * u); x.fill(); TP.text(x, f.price, 0, 62 * u, ps, TP.ink(P.a), "display"); x.restore();
     }
   } },
 { id: "greeting", cat: "event", pal: "royal", dur: function () { return 6; },
   name: { en: "Ramadan / Eid Greeting", ar: "تهنئة رمضان والعيد" },
   fields: [{ k: "title", en: "Ramadan *Kareem*", ar: "رمضان *كريم*", l: { en: "Greeting", ar: "التهنئة" } },
            { k: "sub", en: "Warm wishes from our family to yours", ar: "كل عام وأنتم بخير من عائلتنا لعائلتكم", l: { en: "Message", ar: "الرسالة" } },
            { k: "from", en: "@yourbrand", ar: "@اسمك", l: { en: "Signature", ar: "التوقيع" } }],
   draw: function (x, W, H, t, f, P) {
     var u = Math.min(W, H) / 1080, port = H > W;
     TP.bg(x, W, H, t, P, "stars");
     // slow rotating 8-point geometric star pattern
     x.save(); x.translate(W / 2, H * .5); x.rotate(t * .05); x.globalAlpha = .06; x.strokeStyle = P.a; x.lineWidth = 2 * u;
     for (var ring = 1; ring <= 4; ring++) for (var k = 0; k < 8; k++) { x.save(); x.rotate(k * Math.PI / 4); TP.star(x, 0, -ring * 190 * u, 70 * u, 8, .62); x.stroke(); x.restore(); }
     x.restore();
     // crescent draws
     var mp = TP.cubic(TP.seg(t, .2, 1.4)), mx = W * .5, my = H * (port ? .27 : .25), mr = Math.min(W, H) * .15;
     x.save(); x.shadowColor = P.a; x.shadowBlur = 50 * u * mp; x.strokeStyle = P.a; x.lineWidth = 6 * u; x.beginPath(); x.arc(mx, my, mr, Math.PI * .35, Math.PI * .35 + Math.PI * 1.3 * mp); x.stroke();
     if (mp > .95) { x.fillStyle = P.a; x.globalAlpha = TP.seg(t, 1.3, 1.8); x.beginPath(); x.arc(mx, my, mr, 0, 7); x.arc(mx + mr * .38, my - mr * .2, mr * .82, 0, 7, true); x.fill("evenodd"); }
     x.restore();
     // lanterns drop on strings and swing
     [[.16, .0, 1], [.84, .15, 1.15], [.3, .3, .8], [.7, .45, .85]].forEach(function (L, i) {
       var dp = TP.back(TP.seg(t, .5 + L[1], 1.4 + L[1]), 1.3), len = H * (port ? .13 : .16) * L[2] * dp, ang = TP.pend(t - 1.2 - L[1], .22, 1.1, 3.2) * (i % 2 ? 1 : -1), lx = W * L[0];
       if (dp <= 0) return; x.save(); x.translate(lx, 0); x.rotate(ang); x.strokeStyle = TP.hexA(P.a, .7); x.lineWidth = 2 * u; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, len); x.stroke();
       var s = 60 * u * L[2]; x.translate(0, len); x.fillStyle = P.a; x.beginPath(); x.moveTo(-s * .35, 0); x.lineTo(s * .35, 0); x.lineTo(s * .55, s * .5); x.lineTo(s * .45, s * 1.5); x.lineTo(-s * .45, s * 1.5); x.lineTo(-s * .55, s * .5); x.closePath(); x.fill();
       var gl = .6 + .4 * Math.sin(t * 3 + i); var rg = x.createRadialGradient(0, s * .9, 0, 0, s * .9, s * 1.4); rg.addColorStop(0, "rgba(255,230,150," + (.75 * gl) + ")"); rg.addColorStop(1, "rgba(255,230,150,0)"); x.fillStyle = rg; x.beginPath(); x.arc(0, s * .9, s * 1.4, 0, 7); x.fill();
       x.fillStyle = "rgba(255,245,210,.85)"; x.fillRect(-s * .22, s * .55, s * .44, s * .7); x.fillStyle = P.a; x.fillRect(-s * .5, s * 1.5, s, s * .14); x.restore();
     });
     // title with a gold shimmer sweep
     var tb = { x: W * .08, y: H * (port ? .45 : .46), w: W * .84, h: H * (port ? .2 : .26) }, TL = TP.layout(x, f.title, tb.w, tb.h, "display", 170 * u, 60 * u, 2);
     var end = TP.words(x, TL, tb, { t0: 1.3, stagger: .14, dur: .7, anim: "fade", color: "#ffffff", hi: P.a, shadow: TP.hexA(P.a, .55) }, t);
     TP.shine(x, tb.x, tb.y, tb.w, tb.h, TP.seg(t, end, end + 1.2));
     var sp = TP.cubic(TP.seg(t, end + .2, end + .9)); if (sp > 0) { x.save(); x.globalAlpha = sp; var sb = { x: W * .12, y: tb.y + tb.h + 10 * u, w: W * .76, h: H * .12 }; TP.words(x, TP.layout(x, f.sub, sb.w, sb.h, "body", 52 * u, 26 * u, 3, 1.4), sb, { t0: -10, anim: "fade", color: TP.hexA("#ffffff", .9), stagger: 0 }, t); x.restore(); }
     var fp = TP.cubic(TP.seg(t, end + .8, end + 1.4)); if (fp > 0) { x.save(); x.globalAlpha = fp; TP.text(x, f.from, W / 2, H * (port ? .9 : .9), TP.fitSize(x, f.from, W * .7, 44 * u, "body"), P.a, "body"); x.restore(); }
   } },
 { id: "realestate", cat: "promo", pal: "noir", dur: function () { return 6; }, imgs: 1,
   name: { en: "Real Estate Listing", ar: "إعلان عقار" },
   fields: [{ k: "tag", en: "FOR SALE", ar: "للبيع", l: { en: "Tag", ar: "الوسم" } },
            { k: "title", en: "Modern villa · *Al Malqa*", ar: "فيلا حديثة · *الملقا*", l: { en: "Title", ar: "العنوان" } },
            { k: "price", en: "SAR 1,250,000", ar: "1,250,000 ر.س", l: { en: "Price", ar: "السعر" } },
            { k: "specs", type: "lines", en: "🛏 4 beds\n🛁 5 baths\n📐 450 m²", ar: "🛏 4 غرف\n🛁 5 حمامات\n📐 450 م²", l: { en: "Specs (one per line)", ar: "المواصفات (سطر لكل بند)" } },
            { k: "img", type: "image", l: { en: "Property photo", ar: "صورة العقار" } }],
   draw: function (x, W, H, t, f, P, A) {
     var u = Math.min(W, H) / 1080, ar = TP.isAr(f.title + f.tag);
     x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
     TP.photo(x, A.img, 0, 0, W, H, 0, 1.18 - .12 * TP.cubic(TP.seg(t, 0, 6)), .5 + .1 * Math.sin(t * .3), .5);
     var g = x.createLinearGradient(0, H * .35, 0, H); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.88)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
     var tp = TP.spring(TP.seg(t, .3, 1)); if (tp > 0) { var ts = 44 * u; x.save(); x.font = TP.font(ar, "body")[0] + ts + "px " + TP.font(ar, "body")[1]; var tw = x.measureText(f.tag).width + ts * 1.4, tx = ar ? W - 50 * u - tw + (1 - tp) * tw * 2 : 50 * u - (1 - tp) * tw * 2; x.fillStyle = P.a; TP.rr(x, tx, 60 * u, tw, ts * 1.8, 14 * u); x.fill(); TP.text(x, f.tag, tx + tw / 2, 60 * u + ts * .9, ts, TP.ink(P.a), "body"); x.restore(); }
     var bx = W * .07, bw = W * .86, tb = { x: bx, y: H * .52, w: bw, h: H * .16 };
     var end = TP.words(x, TP.layout(x, f.title, tb.w, tb.h, "display", 110 * u, 40 * u, 2), tb, { t0: .8, stagger: .09, anim: "rise", color: "#fff", hi: P.a, align: "start", valign: "top" }, t);
     var pp = TP.expo(TP.seg(t, end, end + .7)), py = tb.y + tb.h + 20 * u, ps = TP.fitSize(x, f.price, bw * .8, 96 * u, "display");
     x.save(); x.beginPath(); x.rect(ar ? bx + bw * (1 - pp) : bx, py - 70 * u, bw * pp, 140 * u); x.clip(); TP.text(x, TP.count(f.price, TP.expo(TP.seg(t, end, end + 1.4))), ar ? bx + bw : bx, py, ps, "#fff", "display", { align: ar ? "right" : "left" }); x.restore();
     var specs = qtTpLines(f.specs).slice(0, 4), cx = ar ? bx + bw : bx;
     specs.forEach(function (s, i) { var p = TP.back(TP.seg(t, end + .6 + i * .18, end + 1.1 + i * .18), 2); if (p <= 0) return; var fs = 40 * u; x.save(); x.font = TP.font(TP.isAr(s), "body")[0] + fs + "px " + TP.font(TP.isAr(s), "body")[1]; var w = x.measureText(s).width + fs * 1.2, X = ar ? cx - w : cx, Y = py + 100 * u; x.translate(X + w / 2, Y + fs * .8); x.scale(p, p); x.fillStyle = "rgba(255,255,255,.14)"; TP.rr(x, -w / 2, -fs * .8, w, fs * 1.6, fs * .8); x.fill(); x.strokeStyle = "rgba(255,255,255,.3)"; x.lineWidth = 2 * u; x.stroke(); TP.text(x, s, 0, 2 * u, fs, "#fff", "body"); x.restore(); cx += (ar ? -1 : 1) * (w + 14 * u); });
   } },
 { id: "menu", cat: "promo", pal: "sunset", dur: function () { return 5.5; }, imgs: 1,
   name: { en: "Menu Item", ar: "طبق من المنيو" },
   fields: [{ k: "name", en: "Smash *Burger*", ar: "برجر *سماش*", l: { en: "Dish", ar: "الطبق" } },
            { k: "desc", en: "Double beef · cheddar · house sauce", ar: "لحم مزدوج · شيدر · صوص خاص", l: { en: "Description", ar: "الوصف" } },
            { k: "price", en: "$12", ar: "35 ر.س", l: { en: "Price", ar: "السعر" } },
            { k: "img", type: "image", l: { en: "Food photo", ar: "صورة الطبق" } }],
   draw: function (x, W, H, t, f, P, A) {
     var u = Math.min(W, H) / 1080, port = H > W;
     TP.bg(x, W, H, t, P, "dots");
     var cx = W / 2, cy = H * (port ? .38 : .45), R = Math.min(W, H) * (port ? .33 : .3);
     // morphing splash blob
     var bp = TP.expo(TP.seg(t, .1, .8)); x.save(); x.translate(cx, cy); x.fillStyle = TP.hexA(P.a, .9); x.beginPath();
     for (var i = 0; i <= 64; i++) { var a = i / 64 * Math.PI * 2, rr = R * 1.18 * bp * (1 + .07 * Math.sin(a * 5 + t * 2) + .05 * Math.sin(a * 3 - t * 1.4)); x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill(); x.restore();
     // plate spins in
     var pp = TP.back(TP.seg(t, .4, 1.3), 1.4); x.save(); x.translate(cx, cy); x.rotate((1 - pp) * -2.5 + t * .08); x.scale(pp, pp);
     x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 40 * u; x.shadowOffsetY = 20 * u; x.fillStyle = "#fff"; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill(); x.shadowColor = "transparent";
     x.save(); x.beginPath(); x.arc(0, 0, R * .9, 0, 7); x.clip(); TP.photo(x, A.img, -R * .9, -R * .9, R * 1.8, R * 1.8, 0, 1.05); x.restore(); x.restore();
     var nb = { x: W * .08, y: cy + R * 1.2, w: W * .84, h: H * (port ? .12 : .14) };
     var e = TP.words(x, TP.layout(x, f.name, nb.w, nb.h, "display", 120 * u, 44 * u, 2), nb, { t0: 1.1, stagger: .1, anim: "pop", color: "#fff", hi: P.a, shadow: "rgba(0,0,0,.3)" }, t);
     var dp = TP.cubic(TP.seg(t, e, e + .6)); if (dp > 0) { x.save(); x.globalAlpha = dp; TP.text(x, f.desc, W / 2, nb.y + nb.h + 34 * u, TP.fitSize(x, f.desc, W * .84, 44 * u, "body"), "#fff", "body"); x.restore(); }
     // price stamp: squash and stretch
     var sp = TP.seg(t, e + .3, e + .8); if (sp > 0) { var sq = 1 + .25 * Math.sin(sp * Math.PI) * (1 - sp), sc = TP.back(sp, 2.5), sx = Math.min(cx + R * .78, W - 135 * u), sy = Math.max(cy - R * .78, 135 * u); x.save(); x.translate(sx, sy); x.rotate(-.18); x.scale(sc * sq, sc / sq); x.fillStyle = P.bg[0]; TP.star(x, 0, 0, 120 * u, 14, .82); x.fill(); x.fillStyle = "#fff"; TP.star(x, 0, 0, 104 * u, 14, .82); x.fill(); TP.text(x, f.price, 0, 4 * u, TP.fitSize(x, f.price, 170 * u, 70 * u, "display"), P.bg[0], "display"); x.restore(); }
   } },
 { id: "review", cat: "social", pal: "cream", dur: function () { return 6; },
   name: { en: "Customer Review", ar: "رأي عميل" },
   fields: [{ k: "review", type: "lines", en: "Fast delivery and *amazing quality*. I'll definitely order again!", ar: "توصيل سريع *وجودة رائعة*. أكيد بطلب مرة ثانية!", l: { en: "Review", ar: "الرأي" } },
            { k: "name", en: "Sara A.", ar: "سارة أ.", l: { en: "Name", ar: "الاسم" } },
            { k: "role", en: "Verified customer", ar: "عميلة موثّقة", l: { en: "Detail", ar: "تفاصيل" } },
            { k: "stars", en: "5", ar: "5", l: { en: "Stars (1–5)", ar: "النجوم (1–5)" } }],
   draw: function (x, W, H, t, f, P) {
     var u = Math.min(W, H) / 1080, port = H > W, ar = TP.isAr(f.review);
     TP.bg(x, W, H, t, P, "none");
     var cw = W * (port ? .86 : .7), ch = H * (port ? .56 : .76), cx = W / 2 - cw / 2, cy = H / 2 - ch / 2, cp = TP.spring(TP.seg(t, .1, .9));
     x.save(); x.globalAlpha = TP.clamp(cp * 1.5); x.translate(0, (1 - cp) * 140 * u); x.shadowColor = "rgba(80,40,0,.18)"; x.shadowBlur = 60 * u; x.shadowOffsetY = 30 * u; x.fillStyle = "#fff"; TP.rr(x, cx, cy, cw, ch, 46 * u); x.fill(); x.restore();
     var n = Math.max(1, Math.min(5, parseInt(f.stars, 10) || 5)), ss = Math.min(cw / 7, 90 * u);
     for (var i = 0; i < 5; i++) { var p = TP.back(TP.seg(t, .7 + i * .15, 1.1 + i * .15), 3), sx = W / 2 + (i - 2) * ss * 1.15 * (ar ? -1 : 1), sy = cy + ch * .16; if (p <= 0) continue; x.save(); x.translate(sx, sy); x.scale(p, p); x.rotate((1 - p) * 1.2); x.fillStyle = i < n ? "#f5b301" : "#e6e1d8"; TP.star(x, 0, 0, ss * .5, 5, .45); x.fill(); x.restore();
       var sk = TP.seg(t, 1.0 + i * .15, 1.4 + i * .15); if (sk > 0 && sk < 1 && i < n) { x.save(); x.globalAlpha = 1 - sk; x.strokeStyle = "#f5b301"; x.lineWidth = 3 * u; for (var r = 0; r < 6; r++) { var a = r / 6 * Math.PI * 2; x.beginPath(); x.moveTo(sx + Math.cos(a) * ss * .5, sy + Math.sin(a) * ss * .5); x.lineTo(sx + Math.cos(a) * ss * (.55 + sk * .4), sy + Math.sin(a) * ss * (.55 + sk * .4)); x.stroke(); } x.restore(); } }
     var rb = { x: cx + cw * .08, y: cy + ch * .27, w: cw * .84, h: ch * .45 };
     var end = TP.words(x, TP.layout(x, f.review.replace(/\n/g, " "), rb.w, rb.h, "body", 70 * u, 30 * u, 6, 1.4), rb, { t0: 1.5, stagger: .05, dur: .5, anim: "fade", color: "#1b1b1b", hi: P.a }, t);
     var ap = TP.spring(TP.seg(t, end, end + .7)); if (ap > 0) {
       var ay = cy + ch * .84, av = 56 * u, ax = W / 2 - 150 * u * (ar ? -1 : 1); x.save(); x.globalAlpha = TP.clamp(ap * 1.4);
       x.fillStyle = P.a; x.beginPath(); x.arc(ax, ay, av, 0, 7); x.fill(); TP.text(x, (f.name || "?").trim().charAt(0), ax, ay + 3 * u, av, "#fff", "display");
       TP.text(x, f.name, ax + (ar ? -1 : 1) * (av + 24 * u), ay - 18 * u, 44 * u, "#1b1b1b", "display", { align: ar ? "right" : "left" });
       TP.text(x, "✓ " + f.role, ax + (ar ? -1 : 1) * (av + 24 * u), ay + 28 * u, 30 * u, "#6b7280", "body", { align: ar ? "right" : "left" }); x.restore(); }
   } },
 { id: "stats", cat: "list", pal: "royal", dur: function () { return 5.5; },
   name: { en: "Stats in Numbers", ar: "أرقام وإنجازات" },
   fields: [{ k: "title", en: "Our year *in numbers*", ar: "سنتنا *بالأرقام*", l: { en: "Title", ar: "العنوان" } },
            { k: "items", type: "lines", en: "120K | Followers\n3.5M | Views\n98% | Happy clients", ar: "120K | متابع\n3.5M | مشاهدة\n98% | عملاء سعداء", l: { en: "Stats: value | label (one per line, up to 4)", ar: "الأرقام: القيمة | الوصف (سطر لكل رقم، حتى 4)" } }],
   draw: function (x, W, H, t, f, P) {
     var u = Math.min(W, H) / 1080, port = H > W, rows = qtTpLines(f.items).slice(0, 4).map(function (l) { var p = l.split("|"); return { v: (p[0] || "").trim(), l: (p[1] || "").trim() }; });
     TP.bg(x, W, H, t, P, "grid");
     var tb = { x: W * .08, y: H * (port ? .08 : .06), w: W * .84, h: H * (port ? .15 : .2) };
     TP.words(x, TP.layout(x, f.title, tb.w, tb.h, "display", 110 * u, 40 * u, 2), tb, { t0: .1, stagger: .08, anim: "rise", color: "#fff", hi: P.a }, t);
     var n = Math.max(1, rows.length), cols = port ? 1 : Math.min(n, 4), rowsN = Math.ceil(n / cols), top = tb.y + tb.h + 40 * u, cellW = W * .84 / cols, cellH = (H - top - H * .08) / rowsN;
     rows.forEach(function (r, i) {
       var col = i % cols, row = Math.floor(i / cols), X = W * .08 + col * cellW, Y = top + row * cellH, st = .7 + i * .35, p = TP.seg(t, st, st + 1.6), e = TP.expo(p);
       if (p <= 0) return; var R = Math.min(cellW, cellH) * (port ? .3 : .34), rtl = TP.isAr(r.l), cxr = port ? (rtl ? X + cellW - R - 20 * u : X + R + 20 * u) : X + cellW / 2, cyr = port ? Y + cellH / 2 : Y + R + 10 * u;
       x.save(); x.globalAlpha = TP.clamp(p * 4);
       x.lineWidth = R * .14; x.strokeStyle = "rgba(255,255,255,.1)"; x.beginPath(); x.arc(cxr, cyr, R, 0, 7); x.stroke();
       var pct = /%/.test(r.v) ? TP.clamp(parseFloat(r.v) / 100) : .78; x.strokeStyle = [P.a, P.b, "#fff", P.a][i % 4]; x.lineCap = "round"; x.beginPath(); x.arc(cxr, cyr, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct * e); x.stroke();
       TP.text(x, TP.count(r.v, e), cxr, cyr + 4 * u, TP.fitSize(x, r.v + "0", R * 1.5, R * .62, "display"), "#fff", "display");
       var lx = port ? (rtl ? cxr - R - 40 * u : cxr + R + 40 * u) : cxr, ly = port ? cyr : cyr + R + 60 * u;
       TP.text(x, r.l, lx, ly, TP.fitSize(x, r.l, port ? (rtl ? lx - W * .08 : W * .92 - lx) : cellW * .9, 50 * u, "body"), TP.hexA("#ffffff", .92), "body", { align: port ? (rtl ? "right" : "left") : "center" });
       x.restore();
     });
   } },
 { id: "hook", cat: "social", pal: "noir", dur: function () { return 4.5; },
   name: { en: "Reels Hook", ar: "افتتاحية ريلز" },
   fields: [{ k: "line1", en: "Did you know?", ar: "هل تعرف؟", l: { en: "Small line", ar: "السطر الصغير" } },
            { k: "line2", en: "*90%* of videos are watched on mute", ar: "*90%* من الفيديوهات تُشاهد بدون صوت", l: { en: "Big line", ar: "السطر الكبير" } }],
   draw: function (x, W, H, t, f, P) {
     var u = Math.min(W, H) / 1080;
     TP.bg(x, W, H, t, P, "none");
     // punch zoom + shake at the start
     var shake = t < .6 ? (1 - t / .6) * 14 * u : 0, R = TP.rng(Math.floor(t * 30) + 1);
     x.save(); x.translate((R() - .5) * shake, (R() - .5) * shake);
     var l1p = TP.back(TP.seg(t, .05, .45), 2.5); if (l1p > 0) {
       x.save(); x.translate(W / 2, H * .3); x.scale(l1p, l1p); var s1 = TP.fitSize(x, f.line1, W * .8, 90 * u, "display");
       // RGB split (glitch) for the first moment
       var gl = Math.max(0, 1 - TP.seg(t, .3, .9)) * 10 * u; if (gl > .5) { x.globalCompositeOperation = "screen"; TP.text(x, f.line1, -gl, 0, s1, "#ff2d55", "display"); TP.text(x, f.line1, gl, 0, s1, "#00e5ff", "display"); x.globalCompositeOperation = "source-over"; }
       TP.text(x, f.line1, 0, 0, s1, "#fff", "display"); x.restore(); }
     var zoom = 1 + .05 * TP.cubic(TP.seg(t, .9, 4.5)); x.translate(W / 2, H * .58); x.scale(zoom, zoom); x.translate(-W / 2, -H * .58);
     var b = { x: W * .07, y: H * .4, w: W * .86, h: H * .36 };
     TP.words(x, TP.layout(x, f.line2, b.w, b.h, "display", 150 * u, 50 * u, 4), b, { t0: .8, stagger: .13, dur: .45, anim: "slam", color: "#fff", hiBox: P.a, hiInk: TP.ink(P.a), shadow: "rgba(0,0,0,.4)" }, t);
     x.restore();
     var arp = TP.seg(t, 2.6, 3.1); if (arp > 0) { var by = H * .86 + Math.sin(t * 6) * 10 * u; x.save(); x.globalAlpha = arp; x.strokeStyle = P.a; x.lineWidth = 10 * u; x.lineCap = "round"; x.beginPath(); x.moveTo(W / 2 - 40 * u, by - 20 * u); x.lineTo(W / 2, by + 20 * u); x.lineTo(W / 2 + 40 * u, by - 20 * u); x.stroke(); x.restore(); }
   } }
];

// Render one frame of a template: background + template + gentle camera drift; safe for any size.
function qtTpRender(x, W, H, t, tpl, f, palKey, A, accent) {
  var P = Object.assign({}, QT_TP_PALETTES[palKey] || QT_TP_PALETTES[tpl.pal]);
  if (accent) P.a = accent;
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; x.shadowColor = "transparent";
  var D = tpl.dur(f), z = 1 + .025 * TP.cubic(TP.clamp(t / D));
  x.translate(W / 2, H / 2); x.scale(z, z); x.translate(-W / 2, -H / 2);
  tpl.draw(x, W, H, t, f, P, A || {});
  x.restore();
}
function qtTpDefaults(tpl, lang) { var o = {}; tpl.fields.forEach(function (fd) { if (fd.type !== "image") o[fd.k] = fd[lang] != null ? fd[lang] : fd.en; }); return o; }

/* ================= page ================= */
(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("tpGallery")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0, LANG = AR ? "ar" : "en";
  var T = AR ? { all: "الكل", promo: "ترويج", list: "قوائم", social: "سوشال", event: "مناسبات", use: "استخدم القالب", exp: "جارٍ تجهيز الفيديو…", done: "✓ تم تنزيل الفيديو", fail: "تعذّر إنشاء الفيديو: ", webm: "سننزّل WebM لأن متصفحك لا يدعم MP4 هنا.", photo: "اختر صورة", s: "ث" }
             : { all: "All", promo: "Promo", list: "Lists", social: "Social", event: "Events", use: "Use template", exp: "Rendering video…", done: "✓ Video downloaded", fail: "Couldn't create the video: ", webm: "Downloading WebM (this browser can't encode MP4 here).", photo: "Choose a photo", s: "s" };
  var SIZES = { "9:16": [1080, 1920], "1:1": [1080, 1080], "16:9": [1920, 1080], "4:5": [1080, 1350] };
  var cur = null, vals = {}, assets = {}, st = { pal: null, ratio: "9:16", fps: 30, accent: "" }, playing = true, t0 = performance.now(), exporting = false;
  if (window.qtBrand) { var bk = qtBrand.get(); if (bk && bk.accent) st.accent = bk.accent; }
  var cv = $("tpCanvas"), cx = cv.getContext("2d");

  // ---- gallery with live previews (animated only while visible) ----
  var cards = [];
  QT_TEMPLATES.forEach(function (tpl) {
    var a = document.createElement("button"); a.type = "button"; a.className = "tp-card"; a.setAttribute("data-cat", tpl.cat); a.setAttribute("data-id", tpl.id);
    var c = document.createElement("canvas"); c.width = 216; c.height = 384; c.setAttribute("aria-hidden", "true");
    var b = document.createElement("b"); b.textContent = tpl.name[LANG];
    var s = document.createElement("span"); s.textContent = T[tpl.cat] + " · " + tpl.dur(qtTpDefaults(tpl, LANG)).toFixed(1) + T.s;
    a.appendChild(c); a.appendChild(b); a.appendChild(s); $("tpGallery").appendChild(a);
    var item = { tpl: tpl, c: c, x: c.getContext("2d"), vis: false, f: qtTpDefaults(tpl, LANG), off: Math.random() * 3 };
    cards.push(item);
    a.addEventListener("click", function () { open(tpl.id, true); });
  });
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typeof IntersectionObserver !== "undefined") { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var it = cards.find(function (k) { return k.c === e.target; }); if (it) it.vis = e.isIntersecting; }); }, { rootMargin: "100px" }); cards.forEach(function (k) { io.observe(k.c); }); }
  else cards.forEach(function (k) { k.vis = true; });
  var lastG = 0;
  function galleryTick(now) {
    if (now - lastG > 33) { lastG = now; cards.forEach(function (k) { if (!k.vis && k.drawn) return; var D = k.tpl.dur(k.f), tt = reduce ? D * .8 : ((now / 1000 + k.off) % (D + .8)); qtTpRender(k.x, 216, 384, Math.min(tt, D), k.tpl, k.f, null, {}, st.accent || null); k.drawn = true; }); }
    requestAnimationFrame(galleryTick);
  }
  document.querySelectorAll("#tpCats .chip").forEach(function (b) { b.addEventListener("click", function () { var c = b.getAttribute("data-c"); document.querySelectorAll("#tpCats .chip").forEach(function (o) { o.classList.toggle("active", o === b); }); document.querySelectorAll(".tp-card").forEach(function (k) { k.hidden = c !== "all" && k.getAttribute("data-cat") !== c; }); }); });

  // ---- editor ----
  function dur() { return cur ? cur.dur(vals) : 5; }
  function size() { var z = SIZES[st.ratio]; cv.width = z[0] / 2; cv.height = z[1] / 2; $("tpScreen").style.aspectRatio = z[0] + " / " + z[1]; }
  function open(id, scroll) {
    cur = QT_TEMPLATES.find(function (k) { return k.id === id; }) || QT_TEMPLATES[0]; vals = qtTpDefaults(cur, LANG); assets = {}; st.pal = cur.pal;
    document.querySelectorAll(".tp-card").forEach(function (k) { k.classList.toggle("on", k.getAttribute("data-id") === cur.id); });
    $("tpName").textContent = cur.name[LANG];
    var box = $("tpFields"); box.innerHTML = "";
    cur.fields.forEach(function (fd) {
      var row = document.createElement("div"); row.className = "tp-row"; var id = "tpF_" + fd.k;
      var lab = document.createElement("label"); lab.setAttribute("for", id); lab.textContent = fd.l[LANG]; row.appendChild(lab);
      var inp;
      if (fd.type === "image") { inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.addEventListener("change", function () { var file = inp.files[0]; if (!file) return; createImageBitmap(file).then(function (bmp) { var k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); assets[fd.k] = c; restart(); }); }); }
      else if (fd.type === "lines") { inp = document.createElement("textarea"); inp.rows = 4; inp.value = vals[fd.k]; inp.dir = "auto"; inp.addEventListener("input", function () { vals[fd.k] = inp.value.slice(0, 400); }); }
      else { inp = document.createElement("input"); inp.type = "text"; inp.value = vals[fd.k]; inp.dir = "auto"; inp.maxLength = 120; inp.addEventListener("input", function () { vals[fd.k] = inp.value; }); }
      inp.id = id; row.appendChild(inp); box.appendChild(row);
    });
    syncPal(); $("tpEditor").hidden = false; restart();
    if (scroll) $("tpEditor").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (typeof qtEvent === "function" && scroll) qtEvent("template_open");
  }
  function syncPal() {
    document.querySelectorAll("#tpPals [data-p]").forEach(function (b) { var on = b.getAttribute("data-p") === st.pal; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    $("tpAccent").value = st.accent || QT_TP_PALETTES[st.pal].a;
    document.querySelectorAll("#tpRatio .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-r") === st.ratio); });
    document.querySelectorAll("#tpFps .chip").forEach(function (b) { b.classList.toggle("active", +b.getAttribute("data-f") === st.fps); });
  }
  document.querySelectorAll("#tpPals [data-p]").forEach(function (b) { b.addEventListener("click", function () { st.pal = b.getAttribute("data-p"); st.accent = ""; syncPal(); }); });
  $("tpAccent").addEventListener("input", function () { st.accent = this.value; });
  document.querySelectorAll("#tpRatio .chip").forEach(function (b) { b.addEventListener("click", function () { st.ratio = b.getAttribute("data-r"); size(); syncPal(); }); });
  document.querySelectorAll("#tpFps .chip").forEach(function (b) { b.addEventListener("click", function () { st.fps = +b.getAttribute("data-f"); syncPal(); }); });
  function restart() { t0 = performance.now(); }
  function frame(t) { qtTpRender(cx, cv.width, cv.height, t, cur, vals, st.pal, assets, st.accent || null); }
  function loop(now) { if (cur && playing && !exporting) { var D = dur(), t = ((now - t0) / 1000) % (D + 1); frame(Math.min(t, D)); $("tpScrub").value = Math.min(t, D) / D * 1000; } requestAnimationFrame(loop); }
  $("tpPlay").addEventListener("click", function () { playing = !playing; this.textContent = playing ? "❚❚" : "▶"; if (playing) t0 = performance.now() - $("tpScrub").value / 1000 * dur() * 1000; });
  $("tpScrub").addEventListener("input", function () { playing = false; $("tpPlay").textContent = "▶"; frame(this.value / 1000 * dur()); });
  $("tpRestart").addEventListener("click", function () { playing = true; $("tpPlay").textContent = "❚❚"; restart(); });

  function download(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }
  async function mp4() {
    var z = SIZES[st.ratio], W = z[0], H = z[1], fps = st.fps, D = dur(), frames = Math.round(D * fps), cfg = null;
    for (var c of (fps > 30 ? ["avc1.64002a", "avc1.640033", "avc1.4d002a"] : ["avc1.640028", "avc1.4d0028", "avc1.42003e"])) { var o = { codec: c, width: W, height: H, bitrate: fps > 30 ? 12e6 : 8e6, framerate: fps }; try { if ((await VideoEncoder.isConfigSupported(o)).supported) { cfg = o; break; } } catch (e) {} }
    if (!cfg) throw new Error("no-h264");
    var big = document.createElement("canvas"); big.width = W; big.height = H; var bx = big.getContext("2d");
    var mux = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" }), err = null;
    var enc = new VideoEncoder({ output: function (ch, meta) { mux.addVideoChunk(ch, meta); }, error: function (e) { err = e; } }); enc.configure(cfg);
    for (var f = 0; f < frames; f++) {
      qtTpRender(bx, W, H, f / fps, cur, vals, st.pal, assets, st.accent || null);
      var vf = new VideoFrame(big, { timestamp: Math.round(f * 1e6 / fps), duration: Math.round(1e6 / fps) }); enc.encode(vf, { keyFrame: f % (fps * 2) === 0 }); vf.close();
      if (enc.encodeQueueSize > 8 || f % 10 === 0) { $("tpBarFill").style.width = Math.round(f / frames * 100) + "%"; await new Promise(function (r) { setTimeout(r, 0); }); }
      if (err) throw err;
    }
    await enc.flush(); mux.finalize(); return new Blob([mux.target.buffer], { type: "video/mp4" });
  }
  function webm() {
    return new Promise(function (res, rej) {
      var z = SIZES[st.ratio], big = document.createElement("canvas"); big.width = z[0]; big.height = z[1]; var bx = big.getContext("2d"), D = dur();
      var rec = new MediaRecorder(big.captureStream(30), { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm", videoBitsPerSecond: 8e6 }), ch = [];
      rec.ondataavailable = function (e) { if (e.data.size) ch.push(e.data); }; rec.onstop = function () { res(new Blob(ch, { type: "video/webm" })); }; rec.onerror = rej;
      var s0 = performance.now(); rec.start();
      (function step() { var t = (performance.now() - s0) / 1000; qtTpRender(bx, big.width, big.height, Math.min(t, D), cur, vals, st.pal, assets, st.accent || null); if (t < D) requestAnimationFrame(step); else rec.stop(); })();
    });
  }
  $("tpExport").addEventListener("click", async function () {
    if (exporting || !cur) return; exporting = true; this.disabled = true; $("tpBar").hidden = false; $("tpStatus").textContent = T.exp;
    try { var blob = null, ext = "mp4";
      if (typeof VideoEncoder !== "undefined" && typeof Mp4Muxer !== "undefined") { try { blob = await mp4(); } catch (e) { if (String(e.message) !== "no-h264") throw e; } }
      if (!blob) { $("tpStatus").textContent = T.webm; blob = await webm(); ext = "webm"; }
      download(blob, "quicktiny-" + cur.id + "-" + st.ratio.replace(":", "x") + "-" + st.fps + "fps." + ext); $("tpStatus").textContent = T.done;
      if (typeof qtEvent === "function") qtEvent("template_export");
    } catch (e) { $("tpStatus").textContent = T.fail + (e && e.message || e); }
    exporting = false; this.disabled = false; $("tpBar").hidden = true; restart();
  });

  size();
  var want = (location.hash || "").replace("#", ""); open(QT_TEMPLATES.some(function (k) { return k.id === want; }) ? want : QT_TEMPLATES[0].id, false);
  var ready = document.fonts && document.fonts.load ? Promise.all(['400 60px "QT Lalezar"', '700 60px "QT Amiri"', '800 60px Sora', '600 60px Sora', '700 60px "QT Arabic"'].map(function (f) { return document.fonts.load(f, "Ab ابج").catch(function () {}); })) : Promise.resolve();
  ready.then(function () { restart(); requestAnimationFrame(loop); requestAnimationFrame(galleryTick); });
})();
if (typeof module !== "undefined") module.exports = { TP: TP, QT_TEMPLATES: QT_TEMPLATES, QT_TP_PALETTES: QT_TP_PALETTES, qtTpDefaults: qtTpDefaults, qtTpLines: qtTpLines };
