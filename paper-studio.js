// QuickTiny Paper Motion Studio — paper-style kinetic text and image animations for Reels/TikTok/Shorts.
// Every frame is drawn by a pure function of time (qtPmRender), so the preview and the exported video match exactly.
// Export: WebCodecs H.264 + mp4-muxer (vendor/mp4-muxer.js, MIT) → MP4; fallback: MediaRecorder WebM. Nothing is uploaded.

/* ---------- helpers ---------- */
function qtPmHash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function qtPmRng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function qtPmIsArabic(s) { return /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(s || ""); }
var qtPmEase = { out: function (k) { return 1 - Math.pow(1 - k, 3); }, inOut: function (k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
  back: function (k) { var c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); } };
function qtPmClamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
// Arabic letters that never join to the next letter: splitting a word after them keeps every piece correctly shaped.
var QT_PM_NONJOIN = "اأإآدذرزوؤةءى";
function qtPmPieces(text) {
  var out = [];
  String(text || "").trim().split(/\s+/).forEach(function (w, wi) {
    if (wi) out.push({ space: true });
    if (qtPmIsArabic(w)) { var cur = ""; for (var i = 0; i < w.length; i++) { cur += w[i]; if (QT_PM_NONJOIN.indexOf(w[i]) !== -1 && i < w.length - 1) { out.push({ t: cur }); cur = ""; } } if (cur) out.push({ t: cur }); }
    else Array.from(w).forEach(function (ch) { out.push({ t: ch }); });
  });
  return out;
}

/* ---------- textures (cached) ---------- */
var qtPmCache = {};
function qtPmPaper(w, h, tint, seed) {
  var key = [w, h, tint, seed].join("|");
  if (qtPmCache[key]) return qtPmCache[key];
  var c = document.createElement("canvas"); c.width = w; c.height = h;
  var x = c.getContext("2d"), r = qtPmRng(seed);
  x.fillStyle = tint; x.fillRect(0, 0, w, h);
  var g = x.createRadialGradient(w * .5, h * .4, 10, w * .5, h * .5, Math.max(w, h) * .75);
  g.addColorStop(0, "rgba(255,255,255,.18)"); g.addColorStop(1, "rgba(120,90,40,.16)"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (var i = 0; i < w * h / 90; i++) { x.fillStyle = "rgba(60,40,10," + (r() * .07).toFixed(3) + ")"; x.fillRect(r() * w, r() * h, 1 + r() * 1.5, 1 + r() * 1.5); }
  for (var j = 0; j < 22; j++) { x.strokeStyle = "rgba(90,70,30,.05)"; x.lineWidth = 1; x.beginPath(); var sx = r() * w, sy = r() * h; x.moveTo(sx, sy); x.quadraticCurveTo(sx + r() * 60 - 30, sy + r() * 60 - 30, sx + r() * 120 - 60, sy + r() * 120 - 60); x.stroke(); }
  qtPmCache[key] = c; return c;
}
function qtPmDesk(W, H, kind, color) {
  var key = "desk|" + W + "|" + H + "|" + kind + "|" + color;
  if (qtPmCache[key]) return qtPmCache[key];
  var c = document.createElement("canvas"); c.width = W; c.height = H; var x = c.getContext("2d");
  if (kind === "green") { x.fillStyle = "#00ff00"; x.fillRect(0, 0, W, H); }
  else if (kind === "color") { x.fillStyle = color; x.fillRect(0, 0, W, H); var g0 = x.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * .7); g0.addColorStop(0, "rgba(255,255,255,.10)"); g0.addColorStop(1, "rgba(0,0,0,.25)"); x.fillStyle = g0; x.fillRect(0, 0, W, H); }
  else if (kind === "dark") { var g1 = x.createLinearGradient(0, 0, W, H); g1.addColorStop(0, "#14162b"); g1.addColorStop(1, "#05060f"); x.fillStyle = g1; x.fillRect(0, 0, W, H); }
  else { // kraft paper desk
    x.drawImage(qtPmPaper(W, H, "#c9a874", 7), 0, 0);
    var g2 = x.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * .75); g2.addColorStop(0, "rgba(255,240,210,.18)"); g2.addColorStop(1, "rgba(60,35,10,.45)"); x.fillStyle = g2; x.fillRect(0, 0, W, H);
  }
  qtPmCache[key] = c; return c;
}
// Slightly irregular "cut paper" outline.
function qtPmCutPath(x, w, h, r, jag) {
  var pts = [], n = 6;
  for (var i = 0; i <= n; i++) pts.push([w * i / n, (r() - .5) * jag]);
  for (i = 1; i <= n; i++) pts.push([w + (r() - .5) * jag, h * i / n]);
  for (i = n - 1; i >= 0; i--) pts.push([w * i / n, h + (r() - .5) * jag]);
  for (i = n - 1; i > 0; i--) pts.push([(r() - .5) * jag, h * i / n]);
  x.beginPath(); pts.forEach(function (p, k) { k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }); x.closePath();
}

/* ---------- fonts ---------- */
var QT_PM_FONTS = {
  serif: '"QT Amiri", Georgia, "Times New Roman", serif',
  bold: '"QT Lalezar", "Arial Black", Impact, sans-serif',
  fancy: '"QT Rakkas", Georgia, serif',
  sans: '"QT Arabic", "Segoe UI", Arial, sans-serif',
  mono: '"Courier New", Courier, monospace'
};
var QT_PM_MASTHEADS = {
  en: ["THE DAILY PAPER", "Morning Herald", "The Evening Post", "CITY TIMES", "The Weekly Review", "GLOBE & LETTER", "The Chronicle", "News of Today"],
  ar: ["الصحيفة اليومية", "أخبار الصباح", "جريدة المساء", "صدى المدينة", "المجلة الأسبوعية", "الحدث", "الرسالة", "أخبار اليوم"]
};

/* ---------- style 1: newspaper clippings with the keyword always in the centre ---------- */
function qtPmNewspaper(x, W, H, t, s, rnd) {
  var ar = qtPmIsArabic(s.text), D = s.duration, N = 9, holdStart = D * .62;
  // Clip schedule: accelerating cuts, the last clip holds.
  var times = [], acc = 0; for (var i = 0; i < N; i++) { times.push(acc); acc += (D * .62) * (0.17 - i * 0.012); }
  var idx = 0; for (i = 0; i < N; i++) if (t >= times[i] * (D * .62 / acc)) idx = i;
  if (t >= holdStart) idx = N - 1;
  var r = qtPmRng(qtPmHash(s.text + "|np|" + idx));
  var tints = ["#f3eee1", "#efe6d2", "#f7f4ec", "#e9e4d8", "#f2e9e4", "#ece5cf"];
  var fonts = [QT_PM_FONTS.serif, QT_PM_FONTS.bold, QT_PM_FONTS.fancy, QT_PM_FONTS.serif, QT_PM_FONTS.sans];
  var font = fonts[Math.floor(r() * fonts.length)], tint = tints[Math.floor(r() * tints.length)];
  var pw = Math.round(W * (0.86 + r() * .1)), ph = Math.round(Math.min(H * .78, pw * (1.15 + r() * .3)));
  var ks = Math.round(Math.min(W * .14, pw * .9 / Math.max(3, s.text.length * .55)));
  x.save();
  x.font = "700 " + ks + "px " + font; x.direction = ar ? "rtl" : "ltr";
  var kw = x.measureText(s.text).width;
  // Paper position so the keyword's centre sits at the frame centre.
  var kx = pw * (0.5 + (r() - .5) * .2), ky = ph * (0.42 + (r() - .5) * .25);
  var since = idx === N - 1 ? Math.max(0, t - holdStart) : t - times[idx] * (D * .62 / acc);
  var zoom = 1 + since * (idx === N - 1 ? .035 : .12);
  var rot = (r() - .5) * .09 * (idx === N - 1 ? 1 - qtPmEase.out(qtPmClamp(since / .6)) * .7 : 1);
  x.translate(W / 2, H / 2); x.rotate(rot); x.scale(zoom, zoom); x.translate(-kx, -ky);
  // paper
  x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 40; x.shadowOffsetY = 18;
  qtPmCutPath(x, pw, ph, r, 10); x.save(); x.fillStyle = "#fff"; x.fill(); x.shadowColor = "transparent"; x.clip();
  x.drawImage(qtPmPaper(pw, ph, tint, 11 + idx), 0, 0);
  // masthead + rules
  var m = QT_PM_MASTHEADS[ar ? "ar" : "en"][Math.floor(r() * 8)], pad = pw * .06;
  x.fillStyle = "#1b1a17"; x.textAlign = "center"; x.direction = ar ? "rtl" : "ltr";
  x.font = "700 " + Math.round(pw * .075) + "px " + (r() < .5 ? QT_PM_FONTS.serif : QT_PM_FONTS.fancy); x.fillText(m, pw / 2, pad + pw * .07);
  x.fillRect(pad, pad + pw * .095, pw - pad * 2, 3); x.fillRect(pad, pad + pw * .105, pw - pad * 2, 1);
  x.font = "400 " + Math.round(pw * .022) + "px " + QT_PM_FONTS.sans; x.fillStyle = "#4a463d";
  x.fillText(ar ? "العدد " + (1000 + Math.floor(r() * 9000)) + " · طبعة خاصة" : "No. " + (1000 + Math.floor(r() * 9000)) + " · SPECIAL EDITION", pw / 2, pad + pw * .135);
  // columns of text lines
  var cols = 3, gap = pw * .03, cw = (pw - pad * 2 - gap * (cols - 1)) / cols, lh = pw * .022;
  x.fillStyle = "rgba(40,36,30,.55)";
  for (var c = 0; c < cols; c++) for (var y = pad + pw * .17; y < ph - pad; y += lh * 1.55) {
    if (Math.abs(y - ky) < ks * .95) continue;
    var lw = cw * (r() < .12 ? .55 + r() * .3 : .92 + r() * .08);
    x.fillRect(pad + c * (cw + gap) + (ar ? cw - lw : 0), y, lw, lh * .55);
  }
  // keyword band (paper-coloured strip so the columns don't run through it)
  x.fillStyle = tint; x.fillRect(pad * .5, ky - ks * .82, pw - pad, ks * 1.5);
  // highlighter on the final clip
  if (idx === N - 1) {
    var hp = qtPmEase.inOut(qtPmClamp((t - holdStart - .25) / .55));
    x.fillStyle = s.accent; x.globalAlpha = .85;
    var hx = ar ? kx + kw / 2 - kw * hp - ks * .12 : kx - kw / 2 - ks * .12;
    x.fillRect(hx, ky - ks * .55, (kw + ks * .24) * hp, ks * 1.05); x.globalAlpha = 1;
  }
  x.fillStyle = "#121110"; x.font = "700 " + ks + "px " + font; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(s.text, kx, ky);
  // small sub-headline
  if (s.sub) { x.font = "400 " + Math.round(ks * .32) + "px " + QT_PM_FONTS.serif; x.fillStyle = "#3a362e"; x.fillText(s.sub, kx, ky + ks * .95); }
  x.restore(); x.restore();
}

/* ---------- style 2: cut-out letters, dropped one by one ---------- */
function qtPmCutout(x, W, H, t, s) {
  var ar = qtPmIsArabic(s.text), pieces = qtPmPieces(s.text), r = qtPmRng(qtPmHash(s.text + "|cut"));
  var fonts = [QT_PM_FONTS.bold, QT_PM_FONTS.serif, QT_PM_FONTS.fancy, QT_PM_FONTS.sans, QT_PM_FONTS.mono];
  var papers = ["#f6f1e4", "#111111", "#ffd84d", "#ff5b5b", "#ffffff", "#7fd6ff", "#e9e1cf", s.accent];
  var maxW = W * .86, base = Math.min(W * .17, H * .1);
  // measure + wrap into lines
  var items = pieces.map(function (p) {
    if (p.space) return p;
    var f = fonts[Math.floor(r() * fonts.length)], size = base * (0.8 + r() * .45), bg = papers[Math.floor(r() * papers.length)];
    var dark = /^#(11|00|ff5b|7f|3)/i.test(bg) || bg === s.accent;
    x.font = "700 " + size + "px " + f; x.direction = ar ? "rtl" : "ltr";
    var w = x.measureText(p.t).width;
    return { t: p.t, f: f, size: size, bg: bg, fg: bg === "#111111" ? "#f6f1e4" : (dark ? "#ffffff" : "#121212"), w: w + size * .36, h: size * 1.25, rot: (r() - .5) * .22, dy: (r() - .5) * size * .18, seed: Math.floor(r() * 1e6) };
  });
  // Group pieces into words; lines only break between words.
  var sp = base * .35, gap = base * .06, words = [[]];
  items.forEach(function (it) { if (it.space) words.push([]); else words[words.length - 1].push(it); });
  words = words.filter(function (w) { return w.length; });
  var wWidth = function (w) { return w.reduce(function (a, it) { return a + it.w + gap; }, 0) - gap; };
  var total0 = words.reduce(function (a, w) { return a + wWidth(w); }, 0) + sp * (words.length - 1);
  var longest = Math.max.apply(null, words.map(wWidth));
  // Fit: one line if it fits, otherwise about two lines, and never a word wider than the frame.
  var fit = Math.min(1, maxW / longest, total0 > maxW ? (maxW * 1.85) / total0 : 1);
  items.forEach(function (it) { if (!it.space) { it.w *= fit; it.h *= fit; it.size *= fit; it.dy *= fit; } });
  sp *= fit; gap *= fit;
  var lines = [[]], lw = 0;
  words.forEach(function (w) {
    var ww = wWidth(w), cur = lines[lines.length - 1];
    if (cur.length && lw + sp + ww > maxW) { lines.push([]); lw = 0; cur = lines[lines.length - 1]; }
    if (cur.length) { cur.push({ space: true }); lw += sp; }
    w.forEach(function (it) { cur.push(it); }); lw += ww;
  });
  var total = items.filter(function (i) { return !i.space; }).length, k = 0, lineH = base * 1.55 * fit, y0 = H / 2 - (lines.length - 1) * lineH / 2;
  var stagger = Math.min(.22, (s.duration * .55) / Math.max(1, total));
  var floatT = Math.sin(t * 2.2) * base * .04;
  lines.forEach(function (line, li) {
    var width = line.reduce(function (a, it) { return a + (it.space ? sp : it.w + gap); }, 0) - gap, xx = ar ? W / 2 + width / 2 : W / 2 - width / 2;
    line.forEach(function (it) {
      if (it.space) { xx += ar ? -sp : sp; return; }
      var start = .25 + k * stagger, p = qtPmClamp((t - start) / .45); k++;
      var cx = ar ? xx - it.w / 2 : xx + it.w / 2; xx += ar ? -(it.w + gap) : it.w + gap;
      if (p <= 0) return;
      var e = qtPmEase.back(p), cy = y0 + li * lineH + it.dy + floatT, fall = (1 - qtPmEase.out(p)) * -H * .35;
      var pr = qtPmRng(it.seed);
      x.save(); x.translate(cx, cy + fall); x.rotate(it.rot * (0.6 + 0.4 * e) + Math.sin(t * 3 + it.seed) * .015); x.scale(.6 + .4 * e, .6 + .4 * e);
      x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 18; x.shadowOffsetY = 8;
      x.translate(-it.w / 2, -it.h / 2); qtPmCutPath(x, it.w, it.h, pr, it.size * .08); x.fillStyle = it.bg; x.fill(); x.shadowColor = "transparent";
      if (it.bg !== "#111111" && it.bg !== s.accent) { x.save(); x.clip(); x.globalAlpha = .5; x.drawImage(qtPmPaper(Math.ceil(it.w), Math.ceil(it.h), it.bg, it.seed % 50), 0, 0); x.restore(); }
      x.fillStyle = it.fg; x.font = "700 " + it.size + "px " + it.f; x.textAlign = "center"; x.textBaseline = "middle"; x.direction = ar ? "rtl" : "ltr";
      x.fillText(it.t, it.w / 2, it.h / 2 + it.size * .04);
      x.restore();
    });
  });
  if (s.sub) { var sp2 = qtPmClamp((t - .25 - total * stagger) / .5); if (sp2 > 0) { x.save(); x.globalAlpha = sp2; x.font = "400 " + Math.round(base * .38) + "px " + QT_PM_FONTS.sans; x.fillStyle = s.bg === "kraft" || s.bg === "green" ? "#1c1a16" : "#f4f2ea"; x.textAlign = "center"; x.direction = ar ? "rtl" : "ltr"; x.fillText(s.sub, W / 2, y0 + lines.length * lineH + base * .1); x.restore(); } }
}

/* ---------- style 3: paper unfold of an image (optional AI cut-out with a white sticker border) ---------- */
function qtPmSticker(img, cut) {
  var key = "st|" + (img.__qtid || (img.__qtid = Math.random())) + "|" + !!cut;
  if (qtPmCache[key]) return qtPmCache[key];
  var src = cut || img, sw = src.width, sh = src.height, m = Math.round(Math.max(sw, sh) * .035), c = document.createElement("canvas");
  c.width = sw + m * 2; c.height = sh + m * 2; var x = c.getContext("2d");
  if (cut) { // white outline: stamp the silhouette around a circle, tint white
    var sil = document.createElement("canvas"); sil.width = c.width; sil.height = c.height; var sx = sil.getContext("2d");
    for (var a = 0; a < 24; a++) sx.drawImage(cut, m + Math.cos(a / 24 * Math.PI * 2) * m, m + Math.sin(a / 24 * Math.PI * 2) * m);
    sx.globalCompositeOperation = "source-in"; sx.fillStyle = "#fffdf7"; sx.fillRect(0, 0, sil.width, sil.height);
    x.drawImage(sil, 0, 0); x.drawImage(cut, m, m);
  } else { x.fillStyle = "#fffdf7"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, m, m); }
  qtPmCache[key] = c; return c;
}
function qtPmUnfold(x, W, H, t, s) {
  var ar = qtPmIsArabic(s.text);
  if (!s.image) {
    x.fillStyle = s.bg === "kraft" || s.bg === "green" ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.7)"; x.font = "700 " + Math.round(W * .05) + "px " + QT_PM_FONTS.sans; x.textAlign = "center"; x.direction = ar ? "rtl" : "ltr";
    x.fillText(ar ? "أضف صورة لهذا النمط ↑" : "Add an image for this style ↑", W / 2, H / 2); return;
  }
  var st = qtPmSticker(s.image, s.cutout), sc = Math.min(W * .8 / st.width, H * .6 / st.height), sw = st.width * sc, sh = st.height * sc;
  var N = 4, panel = sw / N, p0 = .2, dur = Math.min(1.6, s.duration * .45);
  x.save(); x.translate(W / 2, H * .46 + Math.sin(t * 1.6) * H * .006); x.rotate(-.03 + Math.sin(t * .9) * .01);
  var openAll = qtPmClamp((t - p0) / dur);
  // panels unfold from the centre outwards like a folded sheet
  for (var i = 0; i < N; i++) {
    var order = Math.abs(i - (N - 1) / 2), pk = qtPmEase.out(qtPmClamp(openAll * 1.6 - order * .35));
    if (pk <= 0) continue;
    var left = -sw / 2 + i * panel, fromLeft = i < N / 2, pivot = fromLeft ? left + panel : left;
    x.save(); x.translate(pivot, 0); x.scale(pk, 1); x.translate(-pivot, 0);
    x.shadowColor = "rgba(0,0,0," + (.35 * pk).toFixed(2) + ")"; x.shadowBlur = 30; x.shadowOffsetY = 16;
    x.drawImage(st, i * st.width / N, 0, st.width / N + 1, st.height, left, -sh / 2, panel + 1, sh);
    x.shadowColor = "transparent";
    var shade = (1 - pk) * .55 + (i % 2 ? .06 : 0); // crease shading
    if (shade > .01) { var g = x.createLinearGradient(left, 0, left + panel, 0); g.addColorStop(fromLeft ? 0 : 1, "rgba(0,0,0," + shade.toFixed(2) + ")"); g.addColorStop(fromLeft ? 1 : 0, "rgba(0,0,0," + (shade * .3).toFixed(2) + ")"); x.fillStyle = g;
      x.globalCompositeOperation = "source-atop"; x.fillRect(left, -sh / 2, panel + 1, sh); x.globalCompositeOperation = "source-over"; }
    x.restore();
  }
  x.restore();
  // caption on a paper label
  if (s.text) {
    var cp = qtPmEase.back(qtPmClamp((t - p0 - dur * .8) / .5)); if (cp > 0) {
      var fs = Math.round(Math.min(W * .085, W * .9 / Math.max(4, s.text.length * .6)));
      x.save(); x.font = "700 " + fs + "px " + QT_PM_FONTS.bold; x.direction = ar ? "rtl" : "ltr"; var tw = x.measureText(s.text).width + fs;
      x.translate(W / 2, H * .46 + sh / 2 + fs * 1.1); x.rotate(.03); x.scale(cp, cp);
      var r = qtPmRng(qtPmHash(s.text + "lbl")); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 16; x.shadowOffsetY = 6;
      x.translate(-tw / 2, -fs * .75); qtPmCutPath(x, tw, fs * 1.5, r, 6); x.fillStyle = s.accent; x.fill(); x.shadowColor = "transparent";
      x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(s.text, tw / 2, fs * .78); x.restore();
    }
  }
}

/* ---------- style 4: social posts stacking up, keyword highlighted ---------- */
var QT_PM_POSTS = {
  en: ["Everyone is talking about {k} today.", "Can we talk about {k}?", "{k} just changed everything.", "Honestly, {k} is the best thing this week.", "Breaking: {k} is trending everywhere.", "Okay but {k}…"],
  ar: ["الكل يتكلم اليوم عن {k}.", "ممكن نحكي شوي عن {k}؟", "{k} غيّر كل شيء.", "بصراحة {k} أفضل شيء هالأسبوع.", "عاجل: {k} في كل مكان.", "طيب و{k}؟"]
};
function qtPmPosts(x, W, H, t, s) {
  var ar = qtPmIsArabic(s.text), L = ar ? "ar" : "en", n = 5, D = s.duration, step = (D * .62) / n, r = qtPmRng(qtPmHash(s.text + "|posts"));
  var cw = W * .84, chh = W * .42, names = ar ? ["سارة", "محمد", "نور", "خالد", "ريم", "عمر"] : ["Sara", "Omar", "Lina", "Adam", "Maya", "Yusuf"];
  var shown = Math.min(n, Math.floor(t / step) + 1);
  for (var i = Math.max(0, shown - 3); i < shown; i++) {
    var age = t - i * step, pin = qtPmEase.out(qtPmClamp(age / .45)), depth = shown - 1 - i;
    var cy = H / 2 + (1 - pin) * H * .6 - depth * chh * .14, scale = 1 - depth * .06, alpha = depth > 1 ? .35 : 1 - depth * .25;
    var pr = qtPmRng(qtPmHash(s.text + i)), name = s.sub && i === n - 1 ? s.sub : names[i % names.length];
    x.save(); x.globalAlpha = alpha; x.translate(W / 2, cy); x.scale(scale, scale); x.rotate((pr() - .5) * .04 * (1 - pin * .6));
    x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 40; x.shadowOffsetY = 18;
    var rx = -cw / 2, ry = -chh / 2, rad = W * .035;
    x.beginPath(); x.moveTo(rx + rad, ry); x.arcTo(rx + cw, ry, rx + cw, ry + chh, rad); x.arcTo(rx + cw, ry + chh, rx, ry + chh, rad); x.arcTo(rx, ry + chh, rx, ry, rad); x.arcTo(rx, ry, rx + cw, ry, rad); x.closePath();
    x.fillStyle = "#ffffff"; x.fill(); x.shadowColor = "transparent";
    var pad = cw * .06, av = cw * .11, dir = ar ? -1 : 1, ax = ar ? cw / 2 - pad - av / 2 : -cw / 2 + pad + av / 2, ay = ry + pad + av / 2;
    var g = x.createLinearGradient(ax - av / 2, ay - av / 2, ax + av / 2, ay + av / 2); g.addColorStop(0, s.accent); g.addColorStop(1, "#3be2ff");
    x.fillStyle = g; x.beginPath(); x.arc(ax, ay, av / 2, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#fff"; x.font = "700 " + Math.round(av * .45) + "px " + QT_PM_FONTS.sans; x.textAlign = "center"; x.textBaseline = "middle"; x.direction = ar ? "rtl" : "ltr"; x.fillText(name.slice(0, 1), ax, ay + 1);
    x.textAlign = ar ? "right" : "left"; x.fillStyle = "#121420"; x.font = "700 " + Math.round(cw * .045) + "px " + QT_PM_FONTS.sans;
    var tx = ax + dir * (av / 2 + cw * .03); x.fillText(name, tx, ay - av * .18);
    x.fillStyle = "#6b7085"; x.font = "400 " + Math.round(cw * .034) + "px " + QT_PM_FONTS.sans; x.fillText("@" + (ar ? "user" : name.toLowerCase()) + (10 + i) + " · " + (2 + i) + (ar ? " د" : "m"), tx, ay + av * .22);
    // body with highlighted keyword
    var tpl = QT_PM_POSTS[L][Math.floor(pr() * QT_PM_POSTS[L].length)], parts = tpl.split("{k}"), fsz = Math.round(cw * .06);
    x.font = "600 " + fsz + "px " + QT_PM_FONTS.sans; x.textBaseline = "middle";
    var bx = ar ? cw / 2 - pad : -cw / 2 + pad, by = ry + pad + av + fsz * 1.1, cur = bx;
    var seg = [{ t: parts[0] }, { t: s.text, k: true }, { t: parts[1] || "" }];
    seg.forEach(function (sg) {
      if (!sg.t) return; var w = x.measureText(sg.t).width;
      if (sg.k) { var hp = i === n - 1 ? qtPmEase.inOut(qtPmClamp((t - (D * .62) - .2) / .6)) : 1; x.fillStyle = s.accent; x.globalAlpha = alpha * (i === n - 1 ? 1 : .35);
        x.fillRect(ar ? cur - w * hp - 6 : cur - 6, by - fsz * .62, (w + 12) * hp, fsz * 1.24); x.globalAlpha = alpha; x.fillStyle = i === n - 1 && hp > .5 ? "#fff" : "#121420"; }
      else x.fillStyle = "#2a2d3c";
      x.fillText(sg.t, cur, by); cur += dir * w;
    });
    // action row
    x.fillStyle = "#8a8fa5"; x.font = "400 " + Math.round(cw * .034) + "px " + QT_PM_FONTS.sans;
    var row = ["♡ " + (120 + Math.floor(pr() * 900)), "⟳ " + (10 + Math.floor(pr() * 90)), "💬 " + (3 + Math.floor(pr() * 40))];
    row.forEach(function (lab, ri) { x.fillText(lab, bx + dir * ri * cw * .22, ry + chh - pad); });
    x.restore();
  }
}

/* ---------- shared: wrap text into lines that fit a width ---------- */
function qtPmWrap(x, text, maxW) {
  var words = String(text || "").split(/\s+/).filter(Boolean), lines = [], cur = "";
  words.forEach(function (w) { var tr = cur ? cur + " " + w : w; if (cur && x.measureText(tr).width > maxW) { lines.push(cur); cur = w; } else cur = tr; });
  if (cur) lines.push(cur); return lines.length ? lines : [""];
}
// Visible prefix of a string by user-perceived characters (keeps Arabic marks with their letter).
function qtPmPrefix(text, n) { var a = Array.from(String(text || "")), out = "", k = 0; for (var i = 0; i < a.length && k < n; i++) { out += a[i]; if (!/[ً-ٰٟ]/.test(a[i])) k++; } return out; }
function qtPmLen(text) { return Array.from(String(text || "")).filter(function (c) { return !/[ً-ٰٟ]/.test(c); }).length; }

/* ---------- style 5: typewriter on a sheet of paper ---------- */
function qtPmTypewriter(x, W, H, t, s) {
  var ar = qtPmIsArabic(s.text), D = s.duration, r = qtPmRng(qtPmHash(s.text + "|tw"));
  var pw = W * .82, fs = Math.min(W * .1, pw * 1.6 / Math.max(6, qtPmLen(s.text) * .62)), font = ar ? QT_PM_FONTS.serif : '"Courier New", Courier, monospace';
  x.font = "700 " + fs + "px " + font; x.direction = ar ? "rtl" : "ltr";
  var lines = qtPmWrap(x, s.text, pw * .84), sub = s.sub ? s.sub : "", subFs = fs * .42;
  var total = lines.reduce(function (a, l) { return a + qtPmLen(l); }, 0) + (sub ? qtPmLen(sub) + 6 : 0);
  var typeEnd = D * .72, cps = total / Math.max(.8, typeEnd - .4), typed = Math.max(0, Math.floor((t - .4) * cps));
  var ph = Math.min(H * .7, (lines.length * fs * 1.5 + (sub ? subFs * 3 : 0)) + pw * .5);
  // carriage nudge: the sheet steps up a hair on every keystroke
  var key = (t - .4) * cps, nudge = (key - Math.floor(key)) < .25 && typed < total ? 1.5 : 0;
  x.save(); x.translate(W / 2, H / 2 - nudge); x.rotate(-.012);
  x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 40; x.shadowOffsetY = 18;
  x.translate(-pw / 2, -ph / 2); x.fillStyle = "#fbfaf5"; x.fillRect(0, 0, pw, ph); x.shadowColor = "transparent";
  x.drawImage(qtPmPaper(Math.round(pw), Math.round(ph), "#fbfaf5", 21), 0, 0);
  x.fillStyle = "rgba(220,60,60,.35)"; x.fillRect(ar ? pw - pw * .08 : pw * .08, 0, 2, ph); // margin line
  x.fillStyle = "#1d1c1a"; x.textBaseline = "alphabetic"; x.textAlign = ar ? "right" : "left";
  var xx = ar ? pw * .9 : pw * .1, y = pw * .22 + fs, left = typed, lastX = xx, lastY = y;
  lines.forEach(function (l) {
    var n = Math.min(qtPmLen(l), left); left -= n;
    var shown = qtPmPrefix(l, n); x.font = "700 " + fs + "px " + font; x.globalAlpha = .92;
    x.fillText(shown, xx, y); lastX = xx + (ar ? -1 : 1) * x.measureText(shown).width; lastY = y; y += fs * 1.5;
  });
  x.globalAlpha = 1;
  if (sub && left > 6) { left -= 6; x.font = "400 " + subFs + "px " + font; x.fillStyle = "#4a473f"; var ss = qtPmPrefix(sub, left); x.fillText(ss, xx, y + subFs * .6); lastX = xx + (ar ? -1 : 1) * x.measureText(ss).width; lastY = y + subFs * .6; }
  // blinking cursor
  if (Math.floor(t * 2.4) % 2 === 0 || typed < total) { x.fillStyle = s.accent; x.fillRect(ar ? lastX - fs * .5 : lastX + 4, lastY - fs * .78, fs * .42, fs * .9); }
  // final stamp underline
  var up = qtPmEase.out(qtPmClamp((t - typeEnd - .1) / .5));
  if (up > 0) { x.strokeStyle = s.accent; x.lineWidth = fs * .12; x.lineCap = "round"; x.font = "700 " + fs + "px " + font; var y0 = pw * .22 + fs * 1.25, w0 = Math.min(pw * .8, Math.max.apply(null, lines.map(function (l) { return x.measureText(l).width; })));
    x.beginPath(); if (ar) { x.moveTo(pw * .9, y0); x.lineTo(pw * .9 - w0 * up, y0 + fs * .05); } else { x.moveTo(pw * .1, y0); x.lineTo(pw * .1 + w0 * up, y0 + fs * .05); } x.stroke(); }
  x.restore();
}

/* ---------- style 6: a receipt printing out of a slot ---------- */
function qtPmReceipt(x, W, H, t, s) {
  var ar = qtPmIsArabic(s.text), D = s.duration, r = qtPmRng(qtPmHash(s.text + "|rc"));
  var rw = W * .7, slotY = H * .14, mono = ar ? QT_PM_FONTS.sans : '"Courier New", Courier, monospace', base = rw * .055;
  var L = ar ? { head: "إيصال", store: "متجر الورق", item: ["خدمة إبداعية", "فكرة جديدة", "لمسة سحرية"], total: "الإجمالي", thanks: "شكرًا لزيارتكم" } : { head: "RECEIPT", store: "PAPER STORE", item: ["Creative service", "Fresh idea", "Magic touch"], total: "TOTAL", thanks: "THANK YOU" };
  x.font = "700 " + base * 2.4 + "px " + QT_PM_FONTS.bold; x.direction = ar ? "rtl" : "ltr";
  var kLines = qtPmWrap(x, s.text, rw * .86), rh = base * (16.5 + kLines.length * 3.6 + (s.sub ? 2 : 0));
  var p = qtPmEase.inOut(qtPmClamp((t - .2) / (D * .7))), shown = rh * p;
  // printer
  x.save(); var px = W / 2 - rw * .62, pwid = rw * 1.24;
  x.fillStyle = "#1c1e2b"; x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 30; x.shadowOffsetY = 10;
  x.beginPath(); x.roundRect ? x.roundRect(px, slotY - base * 5, pwid, base * 5.4, base) : x.rect(px, slotY - base * 5, pwid, base * 5.4); x.fill(); x.shadowColor = "transparent";
  x.fillStyle = "#0b0c14"; x.fillRect(W / 2 - rw * .54, slotY - base * .3, rw * 1.08, base * .6);
  x.fillStyle = (Math.floor(t * 4) % 2 && p < 1) ? "#3bff8a" : "#2b6b45"; x.beginPath(); x.arc(px + pwid - base * 1.4, slotY - base * 3.2, base * .35, 0, 7); x.fill();
  x.restore();
  // receipt paper (clipped below the slot so it appears to come out of it)
  x.save(); x.beginPath(); x.rect(0, slotY, W, H); x.clip();
  x.translate(W / 2 - rw / 2, slotY + shown - rh);
  x.shadowColor = "rgba(0,0,0,.3)"; x.shadowBlur = 24; x.shadowOffsetY = 10;
  x.beginPath(); x.moveTo(0, 0); x.lineTo(rw, 0); x.lineTo(rw, rh);
  for (var z = 0; z <= 16; z++) x.lineTo(rw - z * rw / 16, rh + (z % 2 ? -base * .5 : 0));
  x.closePath(); x.fillStyle = "#fdfdf8"; x.fill(); x.shadowColor = "transparent";
  var cx = rw / 2, y = base * 2.4, side = ar ? rw - base * 1.2 : base * 1.2, other = ar ? base * 1.2 : rw - base * 1.2;
  x.fillStyle = "#1b1b1b"; x.textAlign = "center"; x.textBaseline = "alphabetic";
  x.font = "700 " + base * 1.15 + "px " + mono; x.fillText(L.store, cx, y); y += base * 1.5;
  x.font = "400 " + base * .8 + "px " + mono; x.fillText(L.head + " #" + (1000 + Math.floor(r() * 8999)), cx, y); y += base * 1.4;
  var dash = function () { x.fillText("- - - - - - - - - - - - - - - -", cx, y); y += base * 1.3; };
  dash();
  L.item.forEach(function (it) { x.textAlign = ar ? "right" : "left"; x.fillText(it, side, y); x.textAlign = ar ? "left" : "right"; x.fillText((5 + Math.floor(r() * 90)) + ".00", other, y); y += base * 1.25; });
  x.textAlign = "center"; dash();
  x.font = "700 " + base * .9 + "px " + mono; x.fillText(L.total, cx, y); y += base * .8;
  // the keyword as the big total, highlighted once printed
  x.font = "700 " + base * 2.4 + "px " + QT_PM_FONTS.bold; var ky = y + base * 2.3;
  var hp = qtPmEase.inOut(qtPmClamp((t - D * .75) / .5));
  kLines.forEach(function (l, i) {
    var ly = ky + i * base * 2.9, lw = x.measureText(l).width;
    if (hp > 0) { x.fillStyle = s.accent; x.globalAlpha = .9; x.fillRect(ar ? cx + lw / 2 - lw * hp - 8 : cx - lw / 2 - 8, ly - base * 2.05, (lw + 16) * hp, base * 2.6); x.globalAlpha = 1; }
    x.fillStyle = "#111"; x.fillText(l, cx, ly);
  });
  y = ky + kLines.length * base * 2.9;
  if (s.sub) { x.font = "400 " + base * .85 + "px " + mono; x.fillText(s.sub, cx, y); y += base * 1.5; }
  x.font = "400 " + base * .8 + "px " + mono; dash(); x.fillText(L.thanks, cx, y); y += base * 1.2;
  for (var b = 0; b < 46; b++) { var bw = (b % 3 === 0 ? 3 : 1.5) * (1 + (r() < .3)); x.fillRect(rw * .18 + b * rw * .64 / 46, y, bw, base * 2); }
  x.restore();
}

/* ---------- style 7: sticky notes slapped onto a board ---------- */
function qtPmSticky(x, W, H, t, s) {
  var ar = qtPmIsArabic(s.text), words = String(s.text || "").split(/\s+/).filter(Boolean).slice(0, 6), r = qtPmRng(qtPmHash(s.text + "|st"));
  if (s.sub) words.push(s.sub);
  var colors = ["#ffe66d", "#ff9fb2", "#9be7ff", "#b9f6a5", "#ffc58a", s.accent], n = words.length;
  var cols = n <= 2 ? n : n <= 4 ? 2 : 3, rows = Math.ceil(n / cols), size = Math.min(W * .8 / cols, H * .62 / rows) * .92;
  var stagger = Math.min(.5, (s.duration * .6) / Math.max(1, n));
  words.forEach(function (w, i) {
    var p = qtPmClamp((t - .2 - i * stagger) / .35); if (p <= 0) return;
    var col = i % cols, row = Math.floor(i / cols), gx = (ar ? cols - 1 - col : col) - (cols - 1) / 2, gy = row - (rows - 1) / 2;
    var cx = W / 2 + gx * size * 1.08 + (r() - .5) * size * .08, cy = H / 2 + gy * size * 1.1 + (r() - .5) * size * .08;
    var sc = 1 + (1 - qtPmEase.out(p)) * .45, rot = (r() - .5) * .16, isSub = s.sub && i === n - 1;
    x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(sc, sc); x.globalAlpha = Math.min(1, p * 2.5);
    x.shadowColor = "rgba(0,0,0," + (.25 + (sc - 1) * .5).toFixed(2) + ")"; x.shadowBlur = 20 + (sc - 1) * 60; x.shadowOffsetY = 10 + (sc - 1) * 40;
    var c = colors[(i + Math.floor(r() * 3)) % colors.length];
    x.fillStyle = c; x.beginPath(); x.moveTo(-size / 2, -size / 2); x.lineTo(size / 2, -size / 2); x.lineTo(size / 2, size / 2 - size * .08);
    x.quadraticCurveTo(size / 2 - size * .02, size / 2, size / 2 - size * .1, size / 2); x.lineTo(-size / 2, size / 2); x.closePath(); x.fill(); x.shadowColor = "transparent";
    var g = x.createLinearGradient(0, -size / 2, 0, size / 2); g.addColorStop(0, "rgba(0,0,0,.06)"); g.addColorStop(.2, "rgba(0,0,0,0)"); x.fillStyle = g; x.fill();
    x.fillStyle = "rgba(255,255,255,.55)"; x.save(); x.rotate(-.05 + (r() - .5) * .1); x.fillRect(-size * .18, -size / 2 - size * .06, size * .36, size * .13); x.restore(); // tape
    var fs = size * (isSub ? .16 : .3), font = isSub ? QT_PM_FONTS.sans : QT_PM_FONTS.fancy;
    x.font = "700 " + fs + "px " + font; x.direction = ar ? "rtl" : "ltr";
    while (x.measureText(w).width > size * .84 && fs > 10) { fs *= .9; x.font = "700 " + fs + "px " + font; }
    x.fillStyle = "#1d1b16"; x.textAlign = "center"; x.textBaseline = "middle";
    var ls = isSub ? qtPmWrap(x, w, size * .84) : [w]; ls.forEach(function (l, k) { x.fillText(l, 0, (k - (ls.length - 1) / 2) * fs * 1.25); });
    x.restore();
  });
}

/* ---------- style 8: marker handwriting with a scribbled underline ---------- */
function qtPmMarker(x, W, H, t, s) {
  var ar = qtPmIsArabic(s.text), D = s.duration, r = qtPmRng(qtPmHash(s.text + "|mk"));
  var pw = W * .86, ph = H * .5, fs = Math.min(W * .16, pw * 1.5 / Math.max(4, qtPmLen(s.text) * .58));
  // notebook sheet
  x.save(); x.translate(W / 2, H / 2); x.rotate(.015);
  x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 40; x.shadowOffsetY = 18; x.fillStyle = "#fffef7"; x.fillRect(-pw / 2, -ph / 2, pw, ph); x.shadowColor = "transparent";
  x.strokeStyle = "rgba(80,130,220,.25)"; x.lineWidth = 2; for (var y = -ph / 2 + ph * .12; y < ph / 2; y += ph * .085) { x.beginPath(); x.moveTo(-pw / 2, y); x.lineTo(pw / 2, y); x.stroke(); }
  x.strokeStyle = "rgba(230,80,80,.45)"; x.beginPath(); x.moveTo(ar ? pw / 2 - pw * .1 : -pw / 2 + pw * .1, -ph / 2); x.lineTo(ar ? pw / 2 - pw * .1 : -pw / 2 + pw * .1, ph / 2); x.stroke();
  x.font = "400 " + fs + "px " + QT_PM_FONTS.bold; x.direction = ar ? "rtl" : "ltr";
  var lines = qtPmWrap(x, s.text, pw * .78); while (lines.length > 3 && fs > 20) { fs *= .88; x.font = "400 " + fs + "px " + QT_PM_FONTS.bold; lines = qtPmWrap(x, s.text, pw * .78); }
  var writeEnd = D * .6, wp = qtPmClamp((t - .3) / (writeEnd - .3)), lh = fs * 1.2, top = -((lines.length - 1) * lh) / 2 - fs * .1;
  x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#16233f";
  lines.forEach(function (l, i) {
    var seg = 1 / lines.length, lp = qtPmClamp((wp - i * seg) / seg); if (lp <= 0) return;
    var lw = x.measureText(l).width, ly = top + i * lh;
    // reveal like a pen moving in the writing direction
    x.save(); x.beginPath(); if (ar) x.rect(lw / 2 - lw * lp - fs * .1, ly - fs, lw * lp + fs * .2, fs * 2); else x.rect(-lw / 2 - fs * .1, ly - fs, lw * lp + fs * .2, fs * 2); x.clip();
    x.fillText(l, 0, ly); x.restore();
    if (lp < 1) { var penX = ar ? lw / 2 - lw * lp : -lw / 2 + lw * lp; x.fillStyle = s.accent; x.beginPath(); x.arc(penX, ly + Math.sin(t * 40) * fs * .12, fs * .07, 0, 7); x.fill(); x.fillStyle = "#16233f"; }
  });
  // scribbled underline + circle doodle after writing
  var bottom = top + (lines.length - 1) * lh + fs * .75, maxLw = Math.max.apply(null, lines.map(function (l) { return x.measureText(l).width; }));
  var up = qtPmClamp((t - writeEnd - .05) / .45);
  if (up > 0) {
    x.strokeStyle = s.accent; x.lineWidth = fs * .11; x.lineCap = "round"; x.lineJoin = "round";
    x.beginPath(); var steps = 40;
    for (var k = 0; k <= steps * up; k++) { var f = k / steps, ux = (ar ? maxLw / 2 - f * maxLw : -maxLw / 2 + f * maxLw), uy = bottom + Math.sin(f * 9 + 1) * fs * .06 + f * fs * .05; k ? x.lineTo(ux, uy) : x.moveTo(ux, uy); }
    x.stroke();
  }
  var cp = qtPmClamp((t - writeEnd - .45) / .55);
  if (cp > 0 && lines.length === 1) {
    x.strokeStyle = s.accent; x.globalAlpha = .9; x.lineWidth = fs * .06; x.beginPath();
    var rx = maxLw * .62, ry = fs * .9;
    for (var a = 0; a <= cp * 1.08; a += .01) { var an = -Math.PI * .6 + a * Math.PI * 2 * (ar ? -1 : 1), jx = Math.cos(an) * rx * (1 + a * .04), jy = Math.sin(an) * ry * (1 + a * .06) + top; a ? x.lineTo(jx, jy) : x.moveTo(jx, jy); }
    x.stroke(); x.globalAlpha = 1;
  }
  if (s.sub) { var sp = qtPmClamp((t - writeEnd - .8) / .5); if (sp > 0) { x.globalAlpha = sp; x.font = "400 " + fs * .32 + "px " + QT_PM_FONTS.sans; x.fillStyle = "#3b4a6b"; x.fillText(s.sub, 0, bottom + fs * .7); x.globalAlpha = 1; } }
  x.restore();
}

var QT_PM_STYLES = { newspaper: qtPmNewspaper, cutout: qtPmCutout, unfold: qtPmUnfold, posts: qtPmPosts, typewriter: qtPmTypewriter, receipt: qtPmReceipt, sticky: qtPmSticky, marker: qtPmMarker };
function qtPmRender(x, W, H, t, s) {
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
  if (s.bg === "transparent") x.clearRect(0, 0, W, H); else x.drawImage(qtPmDesk(W, H, s.bg, s.bgColor), 0, 0);
  (QT_PM_STYLES[s.style] || qtPmNewspaper)(x, W, H, t, s);
  x.restore();
}

/* ---------- UI ---------- */
(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("pmCanvas")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? { mp4: "جارٍ تجهيز الفيديو…", done: "✓ تم تنزيل الفيديو", webm: "متصفحك لا يدعم MP4 هنا — سننزّل WebM (يعمل في كاب كت وإنستغرام).", fail: "تعذّر إنشاء الفيديو: ", bgload: "تحميل نموذج إزالة الخلفية (مرة واحدة)…", bgdone: "✓ أُزيلت الخلفية", bgfail: "تعذّرت إزالة الخلفية؛ سنستخدم الصورة كما هي." }
             : { mp4: "Rendering video…", done: "✓ Video downloaded", webm: "MP4 isn't available in this browser — downloading WebM instead (works in CapCut and Instagram).", fail: "Couldn't create the video: ", bgload: "Loading the background remover (once)…", bgdone: "✓ Background removed", bgfail: "Couldn't remove the background; using the image as is." };
  var SIZES = { "9:16": [1080, 1920], "1:1": [1080, 1080], "16:9": [1920, 1080] };
  var cv = $("pmCanvas"), ctx = cv.getContext("2d");
  var state = { style: "newspaper", text: AR ? "كويك تايني" : "QuickTiny", sub: "", accent: "#ffd400", bg: "kraft", bgColor: "#6b6bff", ratio: "9:16", duration: 5, image: null, cutout: null };
  try { var sv = JSON.parse(localStorage.getItem("qtPaperMotion") || "null"); if (sv) ["style", "text", "sub", "accent", "bg", "bgColor", "ratio", "duration"].forEach(function (k) { if (sv[k] != null) state[k] = sv[k]; }); } catch (e) {}
  if (window.qtBrand) qtBrand.apply(state, { accent: "accent" });
  function persist() { try { var o = {}; ["style", "text", "sub", "accent", "bg", "bgColor", "ratio", "duration"].forEach(function (k) { o[k] = state[k]; }); localStorage.setItem("qtPaperMotion", JSON.stringify(o)); } catch (e) {} }
  function size() { var s = SIZES[state.ratio] || SIZES["9:16"]; cv.width = s[0]; cv.height = s[1]; cv.parentNode.style.aspectRatio = s[0] + " / " + s[1]; }
  function syncUI() {
    document.querySelectorAll("#pmStyles [data-s]").forEach(function (b) { var on = b.getAttribute("data-s") === state.style; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    document.querySelectorAll("#pmRatio .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-r") === state.ratio); });
    $("pmText").value = state.text; $("pmSub").value = state.sub; $("pmAccent").value = state.accent; $("pmBg").value = state.bg; $("pmBgColor").value = state.bgColor; $("pmDur").value = state.duration; $("pmDurV").textContent = state.duration + "s";
    $("pmBgColorWrap").hidden = state.bg !== "color"; $("pmImgWrap").classList.toggle("pm-need", state.style === "unfold" && !state.image);
  }
  var t0 = performance.now(), playing = true;
  function loop(now) {
    if (playing && !exporting) { var t = ((now - t0) / 1000) % (state.duration + .8); qtPmRender(ctx, cv.width, cv.height, Math.min(t, state.duration), state); $("pmScrub").value = Math.min(t, state.duration) / state.duration * 1000; }
    requestAnimationFrame(loop);
  }
  function restart() { t0 = performance.now(); persist(); }
  document.querySelectorAll("#pmStyles [data-s]").forEach(function (b) { b.addEventListener("click", function () { state.style = b.getAttribute("data-s"); syncUI(); restart(); }); });
  document.querySelectorAll("#pmRatio .chip").forEach(function (b) { b.addEventListener("click", function () { state.ratio = b.getAttribute("data-r"); size(); syncUI(); restart(); }); });
  $("pmText").addEventListener("input", function () { state.text = $("pmText").value.slice(0, 40); restart(); });
  $("pmSub").addEventListener("input", function () { state.sub = $("pmSub").value.slice(0, 60); restart(); });
  $("pmAccent").addEventListener("input", function () { state.accent = $("pmAccent").value; persist(); });
  $("pmBg").addEventListener("change", function () { state.bg = $("pmBg").value; syncUI(); persist(); });
  $("pmBgColor").addEventListener("input", function () { state.bgColor = $("pmBgColor").value; persist(); });
  $("pmDur").addEventListener("input", function () { state.duration = +$("pmDur").value; $("pmDurV").textContent = state.duration + "s"; restart(); });
  $("pmPlay").addEventListener("click", function () { playing = !playing; $("pmPlay").textContent = playing ? "❚❚" : "▶"; if (playing) t0 = performance.now() - $("pmScrub").value / 1000 * state.duration * 1000; });
  $("pmScrub").addEventListener("input", function () { playing = false; $("pmPlay").textContent = "▶"; qtPmRender(ctx, cv.width, cv.height, $("pmScrub").value / 1000 * state.duration, state); });

  // image + optional background removal (same U²-Net-p model as the product photo studio)
  var ort = null, session = null;
  async function removeBg(img) {
    $("pmStatus").textContent = T.bgload;
    if (!session) {
      ort = await import("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.wasm.min.mjs");
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/"; ort.env.wasm.numThreads = 1;
      var buf = new Uint8Array(await (await fetch("/models/u2netp.onnx")).arrayBuffer());
      session = await ort.InferenceSession.create(buf, { executionProviders: ["wasm"] });
    }
    var S = 320, sm = document.createElement("canvas"); sm.width = sm.height = S; var sx = sm.getContext("2d", { willReadFrequently: true }); sx.drawImage(img, 0, 0, S, S);
    var px = sx.getImageData(0, 0, S, S).data, max = 1; for (var i = 0; i < px.length; i += 4) max = Math.max(max, px[i], px[i + 1], px[i + 2]);
    var mean = [.485, .456, .406], std = [.229, .224, .225], inp = new Float32Array(3 * S * S);
    for (var p = 0, k = 0; p < S * S; p++, k += 4) for (var c = 0; c < 3; c++) inp[c * S * S + p] = (px[k + c] / max - mean[c]) / std[c];
    var feeds = {}; feeds[session.inputNames[0]] = new ort.Tensor("float32", inp, [1, 3, S, S]);
    var pred = (await session.run(feeds))[session.outputNames[0]].data, lo = Infinity, hi = -Infinity;
    for (var q = 0; q < pred.length; q++) { lo = Math.min(lo, pred[q]); hi = Math.max(hi, pred[q]); }
    var md = sx.createImageData(S, S); for (var r = 0, m = 0; r < pred.length; r++, m += 4) { var a = qtPmClamp(((pred[r] - lo) / (hi - lo || 1) - .12) / .76); md.data[m + 3] = Math.round(a * a * (3 - 2 * a) * 255); }
    sx.putImageData(md, 0, 0);
    var out = document.createElement("canvas"); out.width = img.width; out.height = img.height; var ox = out.getContext("2d", { willReadFrequently: true });
    ox.drawImage(sm, 0, 0, img.width, img.height); var mask = ox.getImageData(0, 0, img.width, img.height).data; ox.clearRect(0, 0, img.width, img.height); ox.drawImage(img, 0, 0);
    var id = ox.getImageData(0, 0, img.width, img.height); for (var z = 3; z < id.data.length; z += 4) id.data[z] = mask[z]; ox.putImageData(id, 0, 0);
    return out;
  }
  function loadImage(f) {
    if (!f || !/^image\//.test(f.type)) return;
    createImageBitmap(f).then(function (bmp) {
      var lim = 1400, k = Math.min(1, lim / Math.max(bmp.width, bmp.height)), c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); state.image = c; state.cutout = null; qtPmCache = {};
      $("pmThumb").src = c.toDataURL("image/jpeg", .7); $("pmThumb").hidden = false;
      if (state.style !== "unfold") state.style = "unfold";
      syncUI(); restart();
      if ($("pmCut").checked) cutNow();
    });
  }
  function cutNow() {
    if (!state.image) return;
    removeBg(state.image).then(function (c) { state.cutout = c; qtPmCache = {}; $("pmStatus").textContent = T.bgdone; restart(); })
      .catch(function () { $("pmStatus").textContent = T.bgfail; });
  }
  $("pmImg").addEventListener("change", function () { loadImage(this.files[0]); this.value = ""; });
  $("pmCut").addEventListener("change", function () { if (this.checked) cutNow(); else { state.cutout = null; qtPmCache = {}; restart(); } });
  ["dragover", "dragenter"].forEach(function (ev) { $("pmImgWrap").addEventListener(ev, function (e) { e.preventDefault(); }); });
  $("pmImgWrap").addEventListener("drop", function (e) { e.preventDefault(); loadImage(e.dataTransfer.files[0]); });

  // export
  var exporting = false;
  function fileName(ext) { return "paper-" + state.style + "-" + state.ratio.replace(":", "x") + "." + ext; }
  function download(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }
  async function exportMp4() {
    var W = cv.width, H = cv.height, fps = 30, frames = Math.round(state.duration * fps) + 15;
    var codecs = ["avc1.640028", "avc1.4d0028", "avc1.42003e"], cfg = null;
    for (var i = 0; i < codecs.length && !cfg; i++) { var c = { codec: codecs[i], width: W, height: H, bitrate: 8e6, framerate: fps }; try { if ((await VideoEncoder.isConfigSupported(c)).supported) cfg = c; } catch (e) {} }
    if (!cfg) throw new Error("no-h264");
    var muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" });
    var err = null, enc = new VideoEncoder({ output: function (chunk, meta) { muxer.addVideoChunk(chunk, meta); }, error: function (e) { err = e; } });
    enc.configure(cfg);
    for (var f = 0; f < frames; f++) {
      qtPmRender(ctx, W, H, Math.min(state.duration, f / fps), state);
      var vf = new VideoFrame(cv, { timestamp: Math.round(f * 1e6 / fps), duration: Math.round(1e6 / fps) });
      enc.encode(vf, { keyFrame: f % 60 === 0 }); vf.close();
      if (enc.encodeQueueSize > 8) await new Promise(function (r) { setTimeout(r, 0); });
      if (f % 10 === 0) { $("pmBarFill").style.width = Math.round(f / frames * 100) + "%"; await new Promise(function (r) { setTimeout(r, 0); }); }
      if (err) throw err;
    }
    await enc.flush(); muxer.finalize();
    return new Blob([muxer.target.buffer], { type: "video/mp4" });
  }
  function exportWebm() {
    return new Promise(function (resolve, reject) {
      var stream = cv.captureStream(30), rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm", videoBitsPerSecond: 8e6 }), chunks = [];
      rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); }; rec.onstop = function () { resolve(new Blob(chunks, { type: "video/webm" })); }; rec.onerror = reject;
      var start = performance.now(); rec.start();
      (function step() { var t = (performance.now() - start) / 1000; qtPmRender(ctx, cv.width, cv.height, Math.min(t, state.duration), state); $("pmBarFill").style.width = Math.round(Math.min(1, t / (state.duration + .5)) * 100) + "%"; if (t < state.duration + .5) requestAnimationFrame(step); else rec.stop(); })();
    });
  }
  $("pmExport").addEventListener("click", async function () {
    if (exporting) return; exporting = true; var btn = this; btn.disabled = true; $("pmBar").hidden = false; $("pmStatus").textContent = T.mp4;
    try {
      var blob, ext = "mp4";
      if (typeof VideoEncoder !== "undefined" && typeof Mp4Muxer !== "undefined") { try { blob = await exportMp4(); } catch (e) { if (String(e.message) !== "no-h264") throw e; } }
      if (!blob) { $("pmStatus").textContent = T.webm; blob = await exportWebm(); ext = "webm"; }
      download(blob, fileName(ext)); $("pmStatus").textContent = T.done;
      if (typeof qtEvent === "function") qtEvent("paper_export");
    } catch (e) { $("pmStatus").textContent = T.fail + (e && e.message || e); }
    exporting = false; btn.disabled = false; $("pmBar").hidden = true; restart();
  });
  $("pmPng").addEventListener("click", function () { cv.toBlob(function (b) { download(b, fileName("png")); }, "image/png"); });

  size(); syncUI();
  var fontsReady = document.fonts && document.fonts.load ? Promise.all(['700 40px "QT Amiri"', '400 40px "QT Lalezar"', '400 40px "QT Rakkas"', '700 40px "QT Arabic"'].map(function (f) { return document.fonts.load(f, "abc ابج").catch(function () {}); })) : Promise.resolve();
  fontsReady.then(function () { qtPmCache = {}; restart(); requestAnimationFrame(loop); });
})();

if (typeof module !== "undefined") module.exports = { qtPmPrefix: qtPmPrefix, qtPmLen: qtPmLen, qtPmPieces: qtPmPieces, qtPmIsArabic: qtPmIsArabic, qtPmHash: qtPmHash, qtPmRng: qtPmRng };
