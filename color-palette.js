// QuickTiny Brand Color Palette — k-means palette from an image, eyedropper, WCAG contrast
// checker and CSS / Tailwind / SCSS / JSON export. Images never leave the browser.

(function () {
  var $ = function (id) { return document.getElementById(id); };
  var pixels = null, palette = [], pickA = 0, pickB = 1, srcCanvas = null;

  function hex(c) { return "#" + c.map(function (v) { return ("0" + Math.round(v).toString(16)).slice(-2); }).join(""); }
  function hsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) { var d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return "hsl(" + Math.round(h) + ", " + Math.round(s * 100) + "%, " + Math.round(l * 100) + "%)";
  }
  function lum(c) { var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function ink(c) { return ratio(c, [255, 255, 255]) >= ratio(c, [17, 17, 17]) ? "#ffffff" : "#111111"; }

  // Deterministic k-means++ on sampled pixels.
  function kmeans(data, k) {
    if (!data.length) return [];
    var rnd = (function () { var s = 42; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
    var cents = [data[Math.floor(rnd() * data.length)].slice()];
    while (cents.length < k) {
      var d2 = data.map(function (p) { var m = Infinity; cents.forEach(function (c) { var d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < m) m = d; }); return m; });
      var sum = d2.reduce(function (a, b) { return a + b; }, 0); if (!sum) break;
      var t = rnd() * sum, i = 0; while ((t -= d2[i]) > 0 && i < d2.length - 1) i++;
      cents.push(data[i].slice());
    }
    var assign = new Array(data.length);
    for (var it = 0; it < 16; it++) {
      var sums = cents.map(function () { return [0, 0, 0, 0]; }), moved = 0;
      data.forEach(function (p, idx) {
        var best = 0, bd = Infinity;
        cents.forEach(function (c, j) { var d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = j; } });
        if (assign[idx] !== best) moved++;
        assign[idx] = best; var s = sums[best]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
      });
      cents = cents.map(function (c, j) { var s = sums[j]; return s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3], s[3]] : c; });
      if (!moved) break;
    }
    var counts = cents.map(function () { return 0; }); assign.forEach(function (a) { counts[a]++; });
    return cents.map(function (c, j) { return { rgb: [c[0], c[1], c[2]], share: counts[j] / data.length }; })
      .filter(function (c) { return c.share > 0.004; })
      .sort(function (a, b) { return b.share - a.share; });
  }

  function extract() {
    if (!pixels) return;
    palette = kmeans(pixels, Number($("cpCount").value));
    pickA = 0; pickB = Math.min(1, palette.length - 1);
    renderPalette();
  }

  function renderPalette() {
    var box = $("cpSwatches"); box.innerHTML = "";
    $("cpBar").innerHTML = palette.map(function (c) { return '<i style="flex:' + c.share + ';background:' + hex(c.rgb) + '"></i>'; }).join("");
    palette.forEach(function (c, i) {
      var h = hex(c.rgb), s = document.createElement("div"); s.className = "cp-sw";
      s.innerHTML = '<div class="cp-chip" style="background:' + h + ";color:" + ink(c.rgb) + '"><b>' + h.toUpperCase() + "</b><span>" + Math.round(c.share * 100) + "%</span></div>" +
        '<div class="cp-vals"><code>rgb(' + c.rgb.map(Math.round).join(", ") + ")</code><code>" + hsl(c.rgb) + "</code></div>" +
        '<div class="cp-pick"><button type="button" data-a="' + i + '" class="' + (i === pickA ? "on" : "") + '">A</button><button type="button" data-b="' + i + '" class="' + (i === pickB ? "on" : "") + '">B</button></div>';
      s.querySelector(".cp-chip").addEventListener("click", function () { qtCopy(h.toUpperCase(), $("cpStatus"), h.toUpperCase() + " copied"); });
      s.querySelector("[data-a]").addEventListener("click", function () { pickA = i; renderPalette(); });
      s.querySelector("[data-b]").addEventListener("click", function () { pickB = i; renderPalette(); });
      box.appendChild(s);
    });
    renderContrast(); renderExport();
  }

  function renderContrast() {
    if (palette.length < 2) { $("cpContrast").innerHTML = ""; return; }
    var a = palette[pickA].rgb, b = palette[pickB].rgb, r = ratio(a, b);
    function badge(ok, label) { return '<span class="cp-badge ' + (ok ? "ok" : "no") + '">' + (ok ? "✓ " : "✗ ") + label + "</span>"; }
    $("cpContrast").innerHTML =
      '<div class="cp-sample" style="background:' + hex(b) + ";color:" + hex(a) + '"><b>Aa — Headline text</b><span>Body text sample on this background.</span></div>' +
      '<div class="cp-ratio"><b>' + r.toFixed(2) + ":1</b>" + badge(r >= 4.5, "AA text") + badge(r >= 3, "AA large / UI") + badge(r >= 7, "AAA text") + "</div>";
  }

  function names() { return palette.map(function (c, i) { return i === 0 ? "primary" : i === 1 ? "secondary" : i === 2 ? "accent" : "color-" + (i + 1); }); }
  function renderExport() {
    var n = names(), fmt = $("cpFormat").value, out = "";
    if (fmt === "css") out = ":root {\n" + palette.map(function (c, i) { return "  --" + n[i] + ": " + hex(c.rgb) + ";"; }).join("\n") + "\n}";
    else if (fmt === "scss") out = palette.map(function (c, i) { return "$" + n[i] + ": " + hex(c.rgb) + ";"; }).join("\n");
    else if (fmt === "tailwind") out = "// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n" + palette.map(function (c, i) { return "        '" + n[i] + "': '" + hex(c.rgb) + "',"; }).join("\n") + "\n      },\n    },\n  },\n};";
    else out = JSON.stringify(palette.map(function (c, i) { return { name: n[i], hex: hex(c.rgb), rgb: c.rgb.map(Math.round), share: Math.round(c.share * 1000) / 10 }; }), null, 2);
    $("cpCode").textContent = out;
  }

  function downloadPng() {
    var w = 1200, h = 400, c = document.createElement("canvas"); c.width = w; c.height = h;
    var x = c.getContext("2d"), cw = w / palette.length;
    palette.forEach(function (p, i) {
      x.fillStyle = hex(p.rgb); x.fillRect(i * cw, 0, cw + 1, h);
      x.fillStyle = ink(p.rgb); x.font = "bold 28px Sora, Segoe UI, sans-serif"; x.fillText(hex(p.rgb).toUpperCase(), i * cw + 20, h - 34);
    });
    c.toBlob(function (b) { var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "palette.png"; a.click(); }, "image/png");
  }

  async function load(file) {
    if (!file || !/^image\//.test(file.type)) return;
    var src = await qtLoadImageSource(file);
    // display copy
    var k = Math.min(1, 520 / Math.max(src.width, src.height));
    srcCanvas = document.createElement("canvas"); srcCanvas.width = Math.round(src.width * k); srcCanvas.height = Math.round(src.height * k);
    srcCanvas.getContext("2d", { willReadFrequently: true }).drawImage(src, 0, 0, srcCanvas.width, srcCanvas.height);
    var holder = $("cpImage"); holder.innerHTML = ""; holder.appendChild(srcCanvas);
    srcCanvas.addEventListener("click", function (e) {
      var r = srcCanvas.getBoundingClientRect(), px = srcCanvas.getContext("2d").getImageData(Math.floor((e.clientX - r.left) * srcCanvas.width / r.width), Math.floor((e.clientY - r.top) * srcCanvas.height / r.height), 1, 1).data;
      var h = hex([px[0], px[1], px[2]]).toUpperCase(); $("cpPicked").innerHTML = '<i style="background:' + h + '"></i>' + h; qtCopy(h, $("cpStatus"), h + " copied");
    });
    // sample pixels (≤ 160 px side), skip transparent ones
    var s = Math.min(1, 160 / Math.max(src.width, src.height)), c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(src.width * s)); c.height = Math.max(1, Math.round(src.height * s));
    var x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(src, 0, 0, c.width, c.height);
    var d = x.getImageData(0, 0, c.width, c.height).data; pixels = [];
    for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 200) pixels.push([d[i], d[i + 1], d[i + 2]]);
    $("cpWork").hidden = false;
    extract();
    qtTrack("palette_extract");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var dz = $("cpDz"), input = $("cpFile");
    dz.addEventListener("click", function () { input.click(); });
    dz.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") input.click(); });
    ["dragover", "dragenter"].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.add("drag"); }); });
    ["dragleave", "drop"].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.remove("drag"); }); });
    dz.addEventListener("drop", function (e) { if (e.dataTransfer.files[0]) load(e.dataTransfer.files[0]); });
    input.addEventListener("change", function () { if (input.files[0]) load(input.files[0]); });
    $("cpCount").addEventListener("change", extract);
    $("cpFormat").addEventListener("change", renderExport);
    $("cpCopy").addEventListener("click", function () { qtCopy($("cpCode").textContent, $("cpStatus"), "Copied"); });
    $("cpPng").addEventListener("click", downloadPng);
  });

  window.qtPalette = { kmeans: kmeans, ratio: ratio, hex: hex, get: function () { return palette; } };
})();
