// QuickTiny Social Image Resizer — one image to every social size: focal-point crop,
// blurred-background fit, story safe zones, ZIP export. Images never leave the device.

(function () {
  var $ = function (id) { return document.getElementById(id); };
  function L(text, vars) { var t = (window.QT_STRINGS && window.QT_STRINGS[text]) || text; return t.replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; }); }

  // [id, platform, name, w, h, safeZone]
  var SIZES = [
    ["ig-square", "Instagram", "Post (square)", 1080, 1080],
    ["ig-portrait", "Instagram", "Post (portrait 4:5)", 1080, 1350],
    ["ig-story", "Instagram", "Story / Reel", 1080, 1920, true],
    ["ig-profile", "Instagram", "Profile photo", 320, 320],
    ["tt-video", "TikTok", "Video / cover", 1080, 1920, true],
    ["fb-post", "Facebook", "Shared image / link", 1200, 630],
    ["fb-cover", "Facebook", "Page cover", 851, 315],
    ["fb-story", "Facebook", "Story", 1080, 1920, true],
    ["x-post", "X / Twitter", "Post image", 1600, 900],
    ["x-header", "X / Twitter", "Header", 1500, 500],
    ["li-post", "LinkedIn", "Post image", 1200, 627],
    ["li-banner", "LinkedIn", "Profile banner", 1584, 396],
    ["yt-thumb", "YouTube", "Thumbnail", 1280, 720],
    ["yt-banner", "YouTube", "Channel banner", 2560, 1440],
    ["pin", "Pinterest", "Pin (2:3)", 1000, 1500],
    ["wa-status", "WhatsApp", "Status", 1080, 1920, true],
    ["og", "Website", "Link preview (Open Graph)", 1200, 630]
  ];
  var DEFAULT_ON = (window.QT_PRESET && window.QT_PRESET.sizes) || ["ig-square", "ig-portrait", "ig-story", "fb-post", "x-post", "li-post", "yt-thumb"];

  var src = null, fileName = "image", focal = { x: 0.5, y: 0.5 };

  function opts() {
    return { mode: $("srMode").value, color: $("srColor").value, fmt: $("srFormat").value, q: Number($("srQuality").value) / 100, safe: $("srSafe").checked };
  }

  // Draw the source into a w×h canvas.
  function draw(w, h, o) {
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var ctx = c.getContext("2d"); ctx.imageSmoothingQuality = "high";
    var sw = src.width, sh = src.height;
    if (o.mode === "cover") {
      var s = Math.max(w / sw, h / sh), cw = w / s, ch = h / s;
      var sx = Math.min(Math.max(focal.x * sw - cw / 2, 0), sw - cw), sy = Math.min(Math.max(focal.y * sh - ch / 2, 0), sh - ch);
      ctx.drawImage(src, sx, sy, cw, ch, 0, 0, w, h);
      return c;
    }
    // contain on blurred copy or solid colour
    if (o.mode === "blur") {
      var bs = Math.max(w / sw, h / sh);
      ctx.filter = "blur(" + Math.round(Math.max(w, h) / 40) + "px) brightness(.8) saturate(1.2)";
      ctx.drawImage(src, (w - sw * bs) / 2 - 20, (h - sh * bs) / 2 - 20, sw * bs + 40, sh * bs + 40);
      ctx.filter = "none";
    } else { ctx.fillStyle = o.color; ctx.fillRect(0, 0, w, h); }
    var k = Math.min(w / sw, h / sh);
    ctx.drawImage(src, (w - sw * k) / 2, (h - sh * k) / 2, sw * k, sh * k);
    return c;
  }

  function mime(fmt) { return fmt === "png" ? "image/png" : fmt === "webp" ? "image/webp" : "image/jpeg"; }
  function toBlob(c, o) { return new Promise(function (r) { c.toBlob(r, mime(o.fmt), o.q); }); }
  function fname(sz, o) { return fileName + "-" + sz[0] + "-" + sz[3] + "x" + sz[4] + "." + (o.fmt === "jpeg" ? "jpg" : o.fmt); }
  function download(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

  function selected() { return SIZES.filter(function (s) { var el = $("sz-" + s[0]); return el && el.checked; }); }

  function renderPreviews() {
    var grid = $("srGrid"); grid.innerHTML = "";
    if (!src) return;
    var o = opts();
    selected().forEach(function (sz) {
      var w = sz[3], h = sz[4], k = Math.min(240 / w, 240 / h), pw = Math.round(w * k), ph = Math.round(h * k);
      var card = document.createElement("div"); card.className = "sr-card";
      var c = draw(pw, ph, o);
      if (o.safe && sz[5]) { // story UI: ~14% top (profile/progress), ~20% bottom (reply/caption)
        var ctx = c.getContext("2d"); ctx.fillStyle = "rgba(255,60,90,.28)";
        ctx.fillRect(0, 0, pw, ph * 0.14); ctx.fillRect(0, ph * 0.8, pw, ph * 0.2);
      }
      var holder = document.createElement("div"); holder.className = "sr-thumb"; holder.appendChild(c);
      var meta = document.createElement("div"); meta.className = "sr-meta";
      meta.innerHTML = "<b>" + L(sz[1]) + "</b><span>" + L(sz[2]) + " · " + w + "×" + h + "</span>";
      var btn = document.createElement("button"); btn.type = "button"; btn.className = "btn btn-secondary sr-dl"; btn.textContent = L("Download");
      btn.addEventListener("click", async function () { download(await toBlob(draw(w, h, opts()), opts()), fname(sz, opts())); qtTrack("resizer_download", { size: sz[0] }); });
      card.appendChild(holder); card.appendChild(meta); card.appendChild(btn); grid.appendChild(card);
    });
    $("srAll").disabled = !selected().length;
  }

  // ---- ZIP (store) ----
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var parts = [], central = [], offset = 0, enc = new TextEncoder();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name); offset += 30 + name.length + data.length;
    });
    var cs = central.reduce(function (a, p) { return a + p.length; }, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: "application/zip" });
  }

  async function downloadAll() {
    var o = opts(), list = selected(), files = [], st = $("srStatus");
    $("srAll").disabled = true;
    for (var i = 0; i < list.length; i++) {
      st.textContent = L("Preparing {i} of {n}…", { i: i + 1, n: list.length }); st.className = "result";
      var blob = await toBlob(draw(list[i][3], list[i][4], o), o);
      files.push({ name: fname(list[i], o), data: new Uint8Array(await blob.arrayBuffer()) });
    }
    download(zip(files), fileName + "-social-sizes.zip");
    st.textContent = L("Done — {n} images in one ZIP ✓", { n: files.length }); st.className = "result success";
    $("srAll").disabled = false;
    qtTrack("resizer_zip", { count: files.length });
  }

  function setFocalUI() { var d = $("srFocal"); d.style.left = (focal.x * 100) + "%"; d.style.top = (focal.y * 100) + "%"; }

  async function load(file) {
    if (!file || !/^image\//.test(file.type)) { $("srStatus").textContent = L("Choose an image file."); $("srStatus").className = "result error"; return; }
    src = await qtLoadImageSource(file);
    fileName = file.name.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 40) || "image";
    focal = { x: 0.5, y: 0.5 };
    var prev = $("srSource"); prev.innerHTML = "";
    var c = document.createElement("canvas"), k = Math.min(1, 520 / src.width); c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
    c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
    prev.appendChild(c); var dot = document.createElement("i"); dot.id = "srFocal"; prev.appendChild(dot); setFocalUI();
    prev.onclick = function (e) { var r = c.getBoundingClientRect(); focal = { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }; setFocalUI(); renderPreviews(); };
    $("srWork").hidden = false; $("srStatus").textContent = L("{w}×{h} px — click the most important spot to set the focal point.", { w: src.width, h: src.height }); $("srStatus").className = "result";
    renderPreviews();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var list = $("srSizes"), groups = {};
    SIZES.forEach(function (s) {
      if (!groups[s[1]]) { var g = document.createElement("div"); g.className = "sr-group"; g.innerHTML = "<b>" + L(s[1]) + "</b>"; list.appendChild(g); groups[s[1]] = g; }
      var lab = document.createElement("label"); lab.className = "checkline";
      lab.innerHTML = '<input type="checkbox" id="sz-' + s[0] + '"' + (DEFAULT_ON.indexOf(s[0]) !== -1 ? " checked" : "") + "> " + L(s[2]) + ' <span class="sr-dim">' + s[3] + "×" + s[4] + "</span>";
      groups[s[1]].appendChild(lab);
      lab.querySelector("input").addEventListener("change", renderPreviews);
    });
    var dz = $("srDz"), input = $("srFile");
    dz.addEventListener("click", function () { input.click(); });
    dz.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") input.click(); });
    ["dragover", "dragenter"].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.add("drag"); }); });
    ["dragleave", "drop"].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.remove("drag"); }); });
    dz.addEventListener("drop", function (e) { if (e.dataTransfer.files[0]) load(e.dataTransfer.files[0]); });
    input.addEventListener("change", function () { if (input.files[0]) load(input.files[0]); });
    ["srMode", "srColor", "srSafe", "srFormat", "srQuality"].forEach(function (id) { $(id).addEventListener("change", function () { $("srColorWrap").hidden = $("srMode").value !== "color"; $("srQVal").textContent = $("srQuality").value; renderPreviews(); }); });
    $("srQuality").addEventListener("input", function () { $("srQVal").textContent = this.value; });
    $("srAll").addEventListener("click", downloadAll);
    $("srAllOn").addEventListener("click", function () { SIZES.forEach(function (s) { $("sz-" + s[0]).checked = true; }); renderPreviews(); });
    $("srAllOff").addEventListener("click", function () { SIZES.forEach(function (s) { $("sz-" + s[0]).checked = false; }); renderPreviews(); });
  });

  window.qtResizer = { draw: draw, SIZES: SIZES, setFocal: function (x, y) { focal = { x: x, y: y }; }, zip: zip };
})();
