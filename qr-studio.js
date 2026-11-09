// QuickTiny QR Studio — static QR codes that never expire, designed and verified in the browser.
// Encoding: qrcode-generator (MIT, /vendor). Scan verification: jsQR (Apache-2.0, /vendor).
// Nothing is uploaded; no redirect links, no tracking.

(function () {
  "use strict";
  if (typeof qrcode !== "undefined") qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

  // ---------- i18n (translated pages set window.QT_STRINGS) ----------
  function L(text, vars) {
    var t = (window.QT_STRINGS && window.QT_STRINGS[text]) || text;
    return t.replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
  }
  var $ = function (id) { return document.getElementById(id); };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // ---------- Content types ----------
  var TYPES = {
    url:      { label: "Website", fields: [["url", "Link", "https://example.com"]], utm: true },
    wifi:     { label: "Wi-Fi", fields: [["ssid", "Network name (SSID)", "Cafe Guest"], ["pass", "Password", ""], ["enc", "Security", "WPA", ["WPA", "WEP", "nopass"]], ["hidden", "Hidden network", "", "check"]] },
    whatsapp: { label: "WhatsApp", fields: [["phone", "Phone with country code", "+962 7 9123 4567"], ["msg", "Pre-filled message", "Hi! I'd like to order…", "area"]] },
    vcard:    { label: "Contact card", fields: [["first", "First name", "Sara"], ["last", "Last name", "Ali"], ["org", "Company", "QuickTiny"], ["title", "Job title", "Marketing lead"], ["tel", "Phone", "+962791234567"], ["email", "Email", "sara@example.com"], ["web", "Website", "https://example.com"], ["adr", "Address", "Amman, Jordan"]] },
    email:    { label: "Email", fields: [["to", "To", "hello@example.com"], ["subject", "Subject", "Question about…"], ["body", "Message", "", "area"]] },
    sms:      { label: "SMS", fields: [["phone", "Phone", "+962791234567"], ["msg", "Message", "", "area"]] },
    phone:    { label: "Call", fields: [["phone", "Phone", "+962791234567"]] },
    geo:      { label: "Location", fields: [["lat", "Latitude", "31.9539"], ["lng", "Longitude", "35.9106"], ["q", "or a place / address", ""]] },
    event:    { label: "Event", fields: [["title", "Event name", "Grand opening"], ["start", "Starts", "", "datetime"], ["end", "Ends", "", "datetime"], ["where", "Location", "Our store, Amman"]] },
    text:     { label: "Text", fields: [["text", "Text", "Any text up to ~1,000 characters", "area"]] }
  };
  var UTM_FIELDS = [["utm_source", "Source", "instagram"], ["utm_medium", "Medium", "qr"], ["utm_campaign", "Campaign", "summer_sale"], ["utm_content", "Content", "flyer_a"], ["utm_term", "Term", ""]];

  var state = { type: "url", values: {}, utm: false };

  function v(k) { return (state.values[state.type + "." + k] || "").trim(); }
  function esc(s) { return String(s).replace(/([\\;,:"])/g, "\\$1"); }
  function icsDate(s) { return s ? s.replace(/[-:]/g, "").replace(/\.\d+$/, "") + (s.length === 16 ? "00" : "") : ""; }

  function buildPayload() {
    var t = state.type;
    if (t === "url") {
      var u = v("url"); if (!u) return "";
      if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "https://" + u;
      if (state.utm) {
        try {
          var url = new URL(u);
          UTM_FIELDS.forEach(function (f) { var val = (state.values["utm." + f[0]] || "").trim(); if (val) url.searchParams.set(f[0], val); });
          u = url.toString();
        } catch (e) {}
      }
      return u;
    }
    if (t === "wifi") { if (!v("ssid")) return ""; var enc = v("enc") || "WPA"; return "WIFI:T:" + enc + ";S:" + esc(v("ssid")) + ";" + (enc !== "nopass" ? "P:" + esc(v("pass")) + ";" : "") + (state.values["wifi.hidden"] === "1" ? "H:true;" : "") + ";"; }
    if (t === "whatsapp") { var d = v("phone").replace(/\D/g, ""); if (!d) return ""; return "https://wa.me/" + d + (v("msg") ? "?text=" + encodeURIComponent(v("msg")) : ""); }
    if (t === "vcard") {
      if (!v("first") && !v("last") && !v("org")) return "";
      var lines = ["BEGIN:VCARD", "VERSION:3.0", "N:" + esc(v("last")) + ";" + esc(v("first")) + ";;;", "FN:" + esc((v("first") + " " + v("last")).trim() || v("org"))];
      if (v("org")) lines.push("ORG:" + esc(v("org")));
      if (v("title")) lines.push("TITLE:" + esc(v("title")));
      if (v("tel")) lines.push("TEL;TYPE=CELL:" + v("tel"));
      if (v("email")) lines.push("EMAIL:" + v("email"));
      if (v("web")) lines.push("URL:" + v("web"));
      if (v("adr")) lines.push("ADR:;;" + esc(v("adr")) + ";;;;");
      lines.push("END:VCARD"); return lines.join("\n");
    }
    if (t === "email") { if (!v("to")) return ""; var q = []; if (v("subject")) q.push("subject=" + encodeURIComponent(v("subject"))); if (v("body")) q.push("body=" + encodeURIComponent(v("body"))); return "mailto:" + v("to") + (q.length ? "?" + q.join("&") : ""); }
    if (t === "sms") { if (!v("phone")) return ""; return "SMSTO:" + v("phone") + ":" + v("msg"); }
    if (t === "phone") { if (!v("phone")) return ""; return "tel:" + v("phone").replace(/[^\d+]/g, ""); }
    if (t === "geo") {
      if (v("q")) return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(v("q"));
      var lat = parseFloat(v("lat")), lng = parseFloat(v("lng"));
      if (isNaN(lat) || isNaN(lng)) return "";
      return "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng;
    }
    if (t === "event") {
      if (!v("title")) return "";
      var ev = ["BEGIN:VEVENT", "SUMMARY:" + esc(v("title"))];
      if (v("start")) ev.push("DTSTART:" + icsDate(v("start")));
      if (v("end")) ev.push("DTEND:" + icsDate(v("end")));
      if (v("where")) ev.push("LOCATION:" + esc(v("where")));
      ev.push("END:VEVENT"); return ev.join("\n");
    }
    return v("text");
  }

  // ---------- Design ----------
  var DEFAULT_DESIGN = { fg: "#14143a", fg2: "#3b6bff", grad: "none", bg: "#ffffff", transparent: false, shape: "square", eye: "square", eyeColor: "#14143a", eyeSame: true, margin: 3, ecc: "auto", logo: null, logoSize: 22, logoPlate: true, frame: "none", frameText: "SCAN ME", frameColor: "#14143a", frameTextColor: "#ffffff" };
  var design = JSON.parse(JSON.stringify(DEFAULT_DESIGN));

  var TEMPLATES = [
    { name: "Classic",   d: { fg: "#000000", grad: "none", bg: "#ffffff", shape: "square", eye: "square", eyeSame: true, frame: "none" } },
    { name: "Midnight",  d: { fg: "#3b2bff", fg2: "#00c2ff", grad: "linear", bg: "#ffffff", shape: "fluid", eye: "rounded", eyeSame: false, eyeColor: "#14143a", frame: "badge", frameText: "SCAN ME", frameColor: "#14143a", frameTextColor: "#ffffff" } },
    { name: "Insta",     d: { fg: "#7b2ff7", fg2: "#f107a3", grad: "linear", bg: "#ffffff", shape: "dots", eye: "circle", eyeSame: true, frame: "label", frameText: "FOLLOW US", frameColor: "#c2189b", frameTextColor: "#ffffff" } },
    { name: "Mint",      d: { fg: "#065f46", grad: "none", bg: "#ecfdf5", shape: "rounded", eye: "leaf", eyeSame: false, eyeColor: "#047857", frame: "none" } },
    { name: "Gold",      d: { fg: "#5c3a00", fg2: "#a8780a", grad: "radial", bg: "#fffaf0", shape: "fluid", eye: "leaf", eyeSame: false, eyeColor: "#5c3a00", frame: "badge", frameText: "MENU", frameColor: "#5c3a00", frameTextColor: "#fffaf0" } },
    { name: "Mono dots", d: { fg: "#111111", grad: "none", bg: "#ffffff", shape: "dots", eye: "rounded", eyeSame: true, frame: "label", frameText: "SCAN FOR WI-FI", frameColor: "#111111", frameTextColor: "#ffffff" } }
  ];

  function chooseEcc(payload) {
    if (design.ecc !== "auto") return design.ecc;
    if (design.logo) return "H";
    return payload.length > 600 ? "L" : "M";
  }

  function makeMatrix(payload) {
    var ecc = chooseEcc(payload);
    var qr = qrcode(0, ecc);
    qr.addData(payload, "Byte");
    qr.make();
    var n = qr.getModuleCount(), m = [];
    for (var r = 0; r < n; r++) { m.push([]); for (var c = 0; c < n; c++) m[r].push(qr.isDark(r, c)); }
    return { m: m, n: n, ecc: ecc };
  }

  function inFinder(r, c, n) { return (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7); }

  // Alignment-pattern centres per version (ISO/IEC 18004 table, same as qrcode-generator's).
  var ALIGN = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]];
  // Structural modules (alignment patterns + timing lines) are always drawn as solid squares,
  // whatever the dot style: scanners rely on them to locate the grid, and dots/diamonds there
  // make many decoders fail.
  function structuralMask(n) {
    var v = (n - 17) / 4, pos = ALIGN[v - 1] || [], mask = [];
    for (var r = 0; r < n; r++) { mask.push([]); for (var c = 0; c < n; c++) mask[r].push((r === 6 || c === 6) && !inFinder(r, c, n)); }
    pos.forEach(function (cr) { pos.forEach(function (cc) {
      if (inFinder(cr, cc, n) || (cr <= 8 && cc <= 8) || (cr <= 8 && cc >= n - 9) || (cr >= n - 9 && cc <= 8)) return;
      for (var r = cr - 2; r <= cr + 2; r++) for (var c = cc - 2; c <= cc + 2; c++) mask[r][c] = true;
    }); });
    return mask;
  }

  // Module path for one dark cell at (x, y), size 1.
  function modulePath(shape, x, y, nb) {
    // Full circle as two half-arcs, centred on the module (a single near-closed arc is ambiguous
    // and can place the centre above the module).
    if (shape === "dots") return "M" + (x + 0.08) + " " + (y + 0.5) + "a.42 .42 0 1 0 .84 0a.42 .42 0 1 0 -.84 0Z";
    // Diamonds are drawn 30% oversized so neighbours overlap into solid runs (plain diamonds
    // only touch at their tips, which scanners read poorly).
    if (shape === "diamond") return "M" + (x + 0.5) + " " + (y - 0.15) + "L" + (x + 1.15) + " " + (y + 0.5) + "L" + (x + 0.5) + " " + (y + 1.15) + "L" + (x - 0.15) + " " + (y + 0.5) + "Z";
    if (shape === "rounded") { var k = 0.3; return "M" + (x + k) + " " + y + "h" + (1 - 2 * k) + "a" + k + " " + k + " 0 0 1 " + k + " " + k + "v" + (1 - 2 * k) + "a" + k + " " + k + " 0 0 1 -" + k + " " + k + "h-" + (1 - 2 * k) + "a" + k + " " + k + " 0 0 1 -" + k + " -" + k + "v-" + (1 - 2 * k) + "a" + k + " " + k + " 0 0 1 " + k + " -" + k + "Z"; }
    if (shape === "fluid") {
      // Round only the outer corners: a corner is round when both neighbours on that corner are empty.
      var R = 0.5, tl = !nb.t && !nb.l, tr = !nb.t && !nb.r, br = !nb.b && !nb.r, bl = !nb.b && !nb.l;
      var p = "M" + (x + (tl ? R : 0)) + " " + y;
      p += "H" + (x + 1 - (tr ? R : 0)); if (tr) p += "a" + R + " " + R + " 0 0 1 " + R + " " + R;
      p += "V" + (y + 1 - (br ? R : 0)); if (br) p += "a" + R + " " + R + " 0 0 1 -" + R + " " + R;
      p += "H" + (x + (bl ? R : 0)); if (bl) p += "a" + R + " " + R + " 0 0 1 -" + R + " -" + R;
      p += "V" + (y + (tl ? R : 0)); if (tl) p += "a" + R + " " + R + " 0 0 1 " + R + " -" + R;
      return p + "Z";
    }
    return "M" + x + " " + y + "h1v1h-1Z";
  }

  function roundRect(x, y, w, h, r) {
    return "M" + (x + r) + " " + y + "h" + (w - 2 * r) + "a" + r + " " + r + " 0 0 1 " + r + " " + r + "v" + (h - 2 * r) + "a" + r + " " + r + " 0 0 1 -" + r + " " + r + "h-" + (w - 2 * r) + "a" + r + " " + r + " 0 0 1 -" + r + " -" + r + "v-" + (h - 2 * r) + "a" + r + " " + r + " 0 0 1 " + r + " -" + r + "Z";
  }
  function leafRect(x, y, w, h, r) { // round top-left and bottom-right only
    return "M" + (x + r) + " " + y + "H" + (x + w) + "V" + (y + h - r) + "a" + r + " " + r + " 0 0 1 -" + r + " " + r + "H" + x + "V" + (y + r) + "a" + r + " " + r + " 0 0 1 " + r + " -" + r + "Z";
  }
  function eyePaths(style, x, y) {
    // outer 7x7 ring (even-odd), inner 3x3
    var outer, inner;
    if (style === "circle") {
      outer = "M" + (x + 3.5) + " " + y + "a3.5 3.5 0 1 0 .001 0Z M" + (x + 3.5) + " " + (y + 1) + "a2.5 2.5 0 1 1 -.001 0Z";
      inner = "M" + (x + 3.5) + " " + (y + 2) + "a1.5 1.5 0 1 0 .001 0Z";
    } else if (style === "rounded") {
      outer = roundRect(x, y, 7, 7, 2) + roundRect(x + 1, y + 1, 5, 5, 1.3);
      inner = roundRect(x + 2, y + 2, 3, 3, 0.9);
    } else if (style === "leaf") {
      outer = leafRect(x, y, 7, 7, 2.6) + leafRect(x + 1, y + 1, 5, 5, 1.7);
      inner = leafRect(x + 2, y + 2, 3, 3, 1.1);
    } else {
      outer = "M" + x + " " + y + "h7v7h-7Z M" + (x + 1) + " " + (y + 1) + "v5h5v-5Z";
      inner = "M" + (x + 2) + " " + (y + 2) + "h3v3h-3Z";
    }
    return { outer: outer, inner: inner };
  }

  function xmlEsc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // Build the full SVG for a payload with the current design. Returns {svg, ecc, n} or null.
  function buildSVG(payload, opt) {
    opt = opt || {};
    var M = makeMatrix(payload), n = M.n, m = M.m;
    var q = Math.max(0, Math.min(8, Number(design.margin)));
    var size = n + q * 2;
    var hasFrame = design.frame !== "none";
    var frameH = hasFrame ? Math.max(5, size * 0.17) : 0;
    var pad = design.frame === "badge" ? Math.max(1.2, size * 0.035) : 0;
    var W = size + pad * 2, H = size + pad * 2 + frameH;
    var fill = design.grad === "none" ? design.fg : "url(#qtg)";
    var eyeFill = design.eyeSame ? fill : design.eyeColor;

    // logo excavation box (in module units, relative to code origin)
    var logoBox = null;
    if (design.logo) {
      var ls = n * (design.logoSize / 100);
      logoBox = { x: (n - ls) / 2, y: (n - ls) / 2, s: ls };
    }

    var dPath = "", structural = structuralMask(n), artistic = design.shape === "dots" || design.shape === "diamond";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (!m[r][c] || inFinder(r, c, n)) continue;
      if (logoBox && !structural[r][c] && c + 1 > logoBox.x - 0.5 && c < logoBox.x + logoBox.s + 0.5 && r + 1 > logoBox.y - 0.5 && r < logoBox.y + logoBox.s + 0.5) continue;
      var nb = { t: r > 0 && m[r - 1][c], b: r < n - 1 && m[r + 1][c], l: c > 0 && m[r][c - 1], r: c < n - 1 && m[r][c + 1] };
      dPath += modulePath(artistic && structural[r][c] ? "square" : design.shape, c + q + pad, r + q + pad, nb);
    }
    var eyes = [[0, 0], [n - 7, 0], [0, n - 7]].map(function (p) { return eyePaths(design.eye, p[0] + q + pad, p[1] + q + pad); });

    var defs = "";
    if (design.grad === "linear") defs = '<linearGradient id="qtg" gradientUnits="userSpaceOnUse" x1="' + (q + pad) + '" y1="' + (q + pad) + '" x2="' + (q + pad + n) + '" y2="' + (q + pad + n) + '"><stop offset="0" stop-color="' + design.fg + '"/><stop offset="1" stop-color="' + design.fg2 + '"/></linearGradient>';
    if (design.grad === "radial") defs = '<radialGradient id="qtg" gradientUnits="userSpaceOnUse" cx="' + (q + pad + n / 2) + '" cy="' + (q + pad + n / 2) + '" r="' + (n * 0.72) + '"><stop offset="0" stop-color="' + design.fg2 + '"/><stop offset="1" stop-color="' + design.fg + '"/></radialGradient>';

    var px = opt.px || 1024;
    var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" width="' + px + '" height="' + Math.round(px * H / W) + '" shape-rendering="' + (design.shape === "square" ? "crispEdges" : "geometricPrecision") + '">';
    if (defs) out += "<defs>" + defs + "</defs>";
    if (design.frame === "badge") out += '<path d="' + roundRect(0, 0, W, H, Math.min(3, W * 0.06)) + '" fill="' + design.frameColor + '"/>';
    if (!design.transparent || design.frame === "badge") out += '<path d="' + roundRect(pad, pad, size, size, design.frame === "badge" ? Math.min(2, size * 0.04) : 0) + '" fill="' + (design.transparent ? "#ffffff" : design.bg) + '"/>';
    out += '<path d="' + dPath + '" fill="' + fill + '"/>';
    eyes.forEach(function (e) { out += '<path d="' + e.outer + '" fill="' + eyeFill + '" fill-rule="evenodd"/><path d="' + e.inner + '" fill="' + eyeFill + '"/>'; });
    if (logoBox) {
      var lx = logoBox.x + q + pad, ly = logoBox.y + q + pad, s = logoBox.s;
      if (design.logoPlate) out += '<path d="' + roundRect(lx - 0.4, ly - 0.4, s + 0.8, s + 0.8, Math.min(1.4, s * 0.2)) + '" fill="#ffffff"/>';
      out += '<image href="' + design.logo + '" x="' + (lx + 0.3) + '" y="' + (ly + 0.3) + '" width="' + (s - 0.6) + '" height="' + (s - 0.6) + '" preserveAspectRatio="xMidYMid meet"/>';
    }
    if (hasFrame) {
      if (design.frame === "label") out += '<path d="' + roundRect(pad + size * 0.12, size + pad + frameH * 0.12, size * 0.76, frameH * 0.78, frameH * 0.39) + '" fill="' + design.frameColor + '"/>';
      var fs = frameH * 0.42;
      out += '<text x="' + (W / 2) + '" y="' + (size + pad + frameH * 0.52) + '" text-anchor="middle" dominant-baseline="central" font-family="Sora, Segoe UI, Tahoma, Arial, sans-serif" font-weight="800" font-size="' + fs + '" letter-spacing="' + (fs * 0.06) + '" fill="' + (design.frame === "label" || design.frame === "badge" ? design.frameTextColor : design.frameColor) + '">' + xmlEsc(design.frameText || "") + "</text>";
    }
    out += "</svg>";
    return { svg: out, ecc: M.ecc, n: n, W: W, H: H };
  }

  // ---------- Rasterise + verify ----------
  function svgToCanvas(svg, px) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      img.onload = function () {
        var c = document.createElement("canvas");
        c.width = px; c.height = Math.round(px * img.naturalHeight / img.naturalWidth);
        var ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); resolve(c);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("render failed")); };
      img.src = url;
    });
  }
  async function verify(svg, payload) {
    if (typeof jsQR === "undefined") return { ok: null };
    var c = await svgToCanvas(svg, 640);
    var ctx = c.getContext("2d");
    // Scanners see transparent pixels as black/white depending on app; test on white like print.
    var bg = document.createElement("canvas"); bg.width = c.width; bg.height = c.height;
    var b = bg.getContext("2d", { willReadFrequently: true }); b.fillStyle = "#fff"; b.fillRect(0, 0, bg.width, bg.height); b.drawImage(c, 0, 0);
    var data = b.getImageData(0, 0, bg.width, bg.height);
    var res = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
    if (!res) return { ok: false };
    return { ok: res.data === payload, decoded: res.data };
  }

  function lum(hex) {
    var c = hex.replace("#", ""); if (c.length === 3) c = c.replace(/./g, "$&$&");
    var rgb = [0, 2, 4].map(function (i) { var x = parseInt(c.substr(i, 2), 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  // ---------- UI ----------
  var renderSeq = 0, lastSVG = null, lastPayload = "";
  function renderFields() {
    var box = $("qrFields"), t = TYPES[state.type];
    box.innerHTML = "";
    t.fields.forEach(function (f) {
      var key = state.type + "." + f[0], kind = f[3], wrap = document.createElement("div");
      if (kind === "check") {
        wrap.className = "checkline";
        wrap.innerHTML = '<input type="checkbox" id="qf_' + f[0] + '"><label for="qf_' + f[0] + '">' + L(f[1]) + "</label>";
        box.appendChild(wrap);
        var cb = wrap.querySelector("input"); cb.checked = state.values[key] === "1";
        cb.addEventListener("change", function () { state.values[key] = cb.checked ? "1" : ""; schedule(); });
        return;
      }
      wrap.innerHTML = '<label class="field-label" for="qf_' + f[0] + '">' + L(f[1]) + "</label>";
      var el;
      if (Array.isArray(kind)) { el = document.createElement("select"); kind.forEach(function (o) { var op = document.createElement("option"); op.value = o; op.textContent = o === "nopass" ? L("No password") : o; el.appendChild(op); }); }
      else if (kind === "area") { el = document.createElement("textarea"); el.rows = 3; el.style.minHeight = "80px"; el.style.fontFamily = "inherit"; }
      else { el = document.createElement("input"); el.type = kind === "datetime" ? "datetime-local" : "text"; el.autocomplete = "off"; }
      el.id = "qf_" + f[0]; el.setAttribute("dir", "auto");
      if (f[2] && el.tagName !== "SELECT") el.placeholder = f[2];
      if (state.values[key] === undefined && (state.type === "url" || el.tagName === "SELECT")) state.values[key] = el.tagName === "SELECT" ? (f[2] || "") : "";
      el.value = state.values[key] || (el.tagName === "SELECT" ? f[2] : "");
      el.addEventListener("input", function () { state.values[key] = el.value; schedule(); });
      el.addEventListener("change", function () { state.values[key] = el.value; schedule(); });
      wrap.appendChild(el); box.appendChild(wrap);
    });
    $("qrUtmWrap").hidden = !t.utm;
    document.querySelectorAll("#qrTypes .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-type") === state.type); });
  }

  function readDesign() {
    design.fg = $("qrFg").value; design.fg2 = $("qrFg2").value; design.grad = $("qrGrad").value;
    design.bg = $("qrBg").value; design.transparent = $("qrTransparent").checked;
    design.eyeSame = $("qrEyeSame").checked; design.eyeColor = $("qrEyeColor").value;
    design.margin = Number($("qrMargin").value); design.ecc = $("qrEcc").value;
    design.logoSize = Number($("qrLogoSize").value); design.logoPlate = $("qrLogoPlate").checked;
    design.frame = $("qrFrame").value; design.frameText = $("qrFrameText").value;
    design.frameColor = $("qrFrameColor").value; design.frameTextColor = $("qrFrameTextColor").value;
    $("qrFg2Wrap").hidden = design.grad === "none";
    $("qrEyeColorWrap").hidden = design.eyeSame;
    $("qrFrameOpts").hidden = design.frame === "none";
    $("qrLogoOpts").hidden = !design.logo;
    $("qrMarginVal").textContent = design.margin;
    $("qrLogoSizeVal").textContent = design.logoSize + "%";
  }
  function writeDesign() {
    $("qrFg").value = design.fg; $("qrFg2").value = design.fg2; $("qrGrad").value = design.grad; $("qrBg").value = design.bg;
    $("qrTransparent").checked = design.transparent; $("qrEyeSame").checked = design.eyeSame; $("qrEyeColor").value = design.eyeColor;
    $("qrMargin").value = design.margin; $("qrEcc").value = design.ecc; $("qrLogoSize").value = design.logoSize; $("qrLogoPlate").checked = design.logoPlate;
    $("qrFrame").value = design.frame; $("qrFrameText").value = design.frameText; $("qrFrameColor").value = design.frameColor; $("qrFrameTextColor").value = design.frameTextColor;
    document.querySelectorAll("#qrShapes .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-shape") === design.shape); });
    document.querySelectorAll("#qrEyes .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-eye") === design.eye); });
    readDesign();
  }

  var timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(render, 120); }

  async function render() {
    var seq = ++renderSeq;
    var payload = buildPayload();
    var prev = $("qrPreview"), status = $("qrScan");
    lastPayload = payload;
    $("qrPayload").textContent = payload;
    if (!payload) {
      prev.innerHTML = '<div class="qr-empty">' + L("Fill in the details to create your QR code") + "</div>";
      status.className = "qr-scan"; status.textContent = ""; lastSVG = null; setButtons(false); return;
    }
    var built;
    try { built = buildSVG(payload); }
    catch (e) { prev.innerHTML = '<div class="qr-empty">' + L("Too much content for one QR code — shorten it.") + "</div>"; lastSVG = null; setButtons(false); return; }
    lastSVG = built.svg; prev.innerHTML = built.svg; setButtons(true);
    $("qrMeta").textContent = L("Version {v} · {n}×{n} modules · error correction {e}", { v: (built.n - 17) / 4, n: built.n, e: built.ecc });

    var warn = [], cr = contrast(design.fg, design.transparent ? "#ffffff" : design.bg);
    if (design.grad !== "none") cr = Math.min(cr, contrast(design.fg2, design.transparent ? "#ffffff" : design.bg));
    if (cr < 3) warn.push(L("Low contrast between code and background ({r}:1). Aim for 4:1 or more.", { r: cr.toFixed(1) }));
    if (!design.transparent && lum(design.fg) > lum(design.bg)) warn.push(L("Light code on a dark background — some older scanner apps can't read inverted codes."));
    if (design.transparent) warn.push(L("Transparent background: place it on a light surface when printing."));
    $("qrWarn").innerHTML = warn.map(function (w) { return "<li>" + w + "</li>"; }).join("");

    status.className = "qr-scan busy"; status.textContent = L("Testing scan…");
    var res = await verify(built.svg, payload);
    if (seq !== renderSeq) return;
    if (res.ok === true) { status.className = "qr-scan ok"; status.textContent = L("✓ Scan test passed — reads exactly your content"); }
    else if (res.ok === false) { status.className = "qr-scan bad"; status.textContent = res.decoded ? L("✗ Scans, but reads different content") : L("✗ Doesn't scan reliably — increase contrast, use square shapes or a smaller logo"); }
    else { status.className = "qr-scan"; status.textContent = ""; }
  }
  function setButtons(on) { ["qrDlPng", "qrDlSvg", "qrCopy"].forEach(function (id) { $(id).disabled = !on; }); }

  function download(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); }
  function fileBase() { return "qr-" + (state.type === "url" ? (v("url").replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").slice(0, 40) || "code") : state.type); }
  async function pngBlob(svg, px) { var c = await svgToCanvas(svg, px); return await new Promise(function (r) { c.toBlob(r, "image/png"); }); }

  // ---------- Minimal ZIP (store) ----------
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var parts = [], central = [], offset = 0, enc = new TextEncoder();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var cSize = central.reduce(function (a, p) { return a + p.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cSize, true); e.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: "application/zip" });
  }

  // CSV: first column = content (link/text); optional second column = file name.
  function parseList(text) {
    return text.split(/\r?\n/).map(function (line) {
      var m = line.match(/^\s*"((?:[^"]|"")*)"\s*(?:[,;\t]\s*(.*))?$/) || line.match(/^\s*([^,;\t]*)\s*(?:[,;\t]\s*(.*))?$/);
      return m ? { value: (m[1] || "").replace(/""/g, '"').trim(), name: (m[2] || "").replace(/^"|"$/g, "").trim() } : null;
    }).filter(function (r) { return r && r.value && !/^(url|link|content|value)$/i.test(r.value); });
  }
  async function runBulk() {
    var rows = parseList($("qrBulkInput").value), out = $("qrBulkStatus");
    if (!rows.length) { out.textContent = L("Add at least one line."); out.className = "result error"; return; }
    if (rows.length > 500) { out.textContent = L("Up to 500 codes at a time."); out.className = "result error"; return; }
    var fmt = $("qrBulkFormat").value, px = Number($("qrSize").value), files = [], failed = [], used = {};
    $("qrBulkRun").disabled = true;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i], payload = row.value;
      if ($("qrBulkUtm").checked && state.utm && /^https?:\/\//i.test(payload)) {
        try { var u = new URL(payload); UTM_FIELDS.forEach(function (f) { var val = (state.values["utm." + f[0]] || "").trim(); if (val) u.searchParams.set(f[0], val); }); payload = u.toString(); } catch (e) {}
      }
      out.textContent = L("Creating {i} of {n}…", { i: i + 1, n: rows.length }); out.className = "result";
      var b = buildSVG(payload), ok = await verify(b.svg, payload);
      if (ok.ok === false) failed.push(i + 1);
      var base = (row.name || payload.replace(/^https?:\/\//, "")).replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "qr-" + (i + 1);
      var nm = base, k = 2; while (used[nm]) nm = base + "-" + k++; used[nm] = 1;
      var data = fmt === "svg" ? new TextEncoder().encode(b.svg) : new Uint8Array(await (await pngBlob(b.svg, px)).arrayBuffer());
      files.push({ name: nm + "." + fmt, data: data });
    }
    download(zip(files), "qr-codes.zip");
    out.textContent = L("Done — {n} codes in qr-codes.zip.", { n: files.length }) + (failed.length ? " " + L("Check rows {rows}: they didn't pass the scan test with this design.", { rows: failed.join(", ") }) : " " + L("All passed the scan test ✓"));
    out.className = failed.length ? "result error" : "result success";
    $("qrBulkRun").disabled = false;
    qtTrack("qr_bulk", { count: files.length });
  }

  function showPane(name) {
    document.querySelectorAll("#qrPanes .chip").forEach(function (b) { var on = b.getAttribute("data-pane") === name; b.classList.toggle("active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    document.querySelectorAll(".qr-pane").forEach(function (p) { p.hidden = p.id !== "qrPane-" + name; });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof qrcode === "undefined") { $("qrPreview").innerHTML = '<div class="qr-empty">QR engine failed to load.</div>'; return; }
    // Type chips
    var tbox = $("qrTypes");
    Object.keys(TYPES).forEach(function (k) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.setAttribute("data-type", k); b.textContent = L(TYPES[k].label);
      b.addEventListener("click", function () { state.type = k; renderFields(); schedule(); });
      tbox.appendChild(b);
    });
    // UTM
    var ubox = $("qrUtmFields");
    UTM_FIELDS.forEach(function (f) {
      var d = document.createElement("div");
      d.innerHTML = '<label class="field-label" for="qu_' + f[0] + '">' + L(f[1]) + ' <code>' + f[0] + "</code></label>";
      var i = document.createElement("input"); i.type = "text"; i.id = "qu_" + f[0]; i.placeholder = f[2]; i.autocomplete = "off";
      i.addEventListener("input", function () { state.values["utm." + f[0]] = i.value; schedule(); });
      d.appendChild(i); ubox.appendChild(d);
    });
    $("qrUtmOn").addEventListener("change", function () { state.utm = this.checked; $("qrUtmFields").hidden = !this.checked; schedule(); });

    // Prefill from the URL hash or Smart-Actions/UTM-builder handoff
    var handoff = typeof qtHandoffConsume === "function" ? qtHandoffConsume("/qr-code-generator") : null;
    state.values["url.url"] = handoff ? handoff.value : "https://quicktinyv2.vercel.app";

    // Shapes / eyes
    document.querySelectorAll("#qrShapes .chip").forEach(function (b) { b.addEventListener("click", function () { design.shape = b.getAttribute("data-shape"); writeDesign(); schedule(); }); });
    document.querySelectorAll("#qrEyes .chip").forEach(function (b) { b.addEventListener("click", function () { design.eye = b.getAttribute("data-eye"); writeDesign(); schedule(); }); });
    ["qrFg", "qrFg2", "qrGrad", "qrBg", "qrTransparent", "qrEyeSame", "qrEyeColor", "qrMargin", "qrEcc", "qrLogoSize", "qrLogoPlate", "qrFrame", "qrFrameText", "qrFrameColor", "qrFrameTextColor"].forEach(function (id) {
      $(id).addEventListener("input", function () { readDesign(); schedule(); });
      $(id).addEventListener("change", function () { readDesign(); schedule(); });
    });
    // Templates
    var tpl = $("qrTemplates");
    TEMPLATES.forEach(function (t) {
      var b = document.createElement("button"); b.type = "button"; b.className = "qr-tpl"; b.title = t.name;
      var saved = design; design = Object.assign(JSON.parse(JSON.stringify(DEFAULT_DESIGN)), t.d, { margin: 2, logo: null });
      try { b.innerHTML = buildSVG("QuickTiny", { px: 96 }).svg + "<span>" + L(t.name) + "</span>"; } catch (e) { b.textContent = t.name; }
      design = saved;
      b.addEventListener("click", function () { var logo = design.logo; design = Object.assign(JSON.parse(JSON.stringify(DEFAULT_DESIGN)), t.d, { logo: logo }); writeDesign(); schedule(); qtTrack("qr_template", { name: t.name }); });
      tpl.appendChild(b);
    });
    // Logo
    $("qrLogo").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        // Downscale big logos so the SVG stays light.
        var img = new Image();
        img.onload = function () {
          var s = Math.min(512, Math.max(img.width, img.height)), c = document.createElement("canvas");
          var k = s / Math.max(img.width, img.height); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          design.logo = c.toDataURL("image/png"); readDesign(); schedule();
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(f);
    });
    $("qrLogoRemove").addEventListener("click", function () { design.logo = null; $("qrLogo").value = ""; readDesign(); schedule(); });
    // Save/restore my style
    $("qrSaveStyle").addEventListener("click", function () { var d = JSON.parse(JSON.stringify(design)); d.logo = null; store("qt_qr_style", JSON.stringify(d)); this.textContent = L("Style saved ✓"); var b = this; setTimeout(function () { b.textContent = L("Save my style"); }, 1500); });
    var mine = store("qt_qr_style"); if (mine) { try { design = Object.assign(design, JSON.parse(mine)); } catch (e) {} }

    // Export
    $("qrDlSvg").addEventListener("click", function () { if (lastSVG) { download(new Blob([buildSVG(lastPayload, { px: Number($("qrSize").value) }).svg], { type: "image/svg+xml" }), fileBase() + ".svg"); qtTrack("qr_download", { format: "svg" }); } });
    $("qrDlPng").addEventListener("click", async function () { if (lastSVG) { download(await pngBlob(lastSVG, Number($("qrSize").value)), fileBase() + ".png"); qtTrack("qr_download", { format: "png" }); } });
    $("qrCopy").addEventListener("click", async function () {
      var btn = this;
      try { var blob = await pngBlob(lastSVG, 1024); await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); btn.textContent = L("Copied ✓"); }
      catch (e) { btn.textContent = L("Copy not supported"); }
      setTimeout(function () { btn.textContent = L("Copy image"); }, 1500);
    });
    // Panes + bulk
    document.querySelectorAll("#qrPanes .chip").forEach(function (b) { b.addEventListener("click", function () { showPane(b.getAttribute("data-pane")); }); });
    $("qrBulkRun").addEventListener("click", runBulk);
    $("qrBulkFile").addEventListener("change", function () { var f = this.files[0]; if (!f) return; f.text().then(function (t) { $("qrBulkInput").value = t; }); });

    writeDesign(); renderFields(); render();
  });

  window.qtQR = { buildPayload: function () { return buildPayload(); }, buildSVG: buildSVG, state: state, design: function () { return design; }, verify: verify, zip: zip, parseList: parseList };
})();
