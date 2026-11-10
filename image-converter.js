// QuickTiny Image Converter — HEIC/HEIF, WebP, AVIF, PNG, JPG, GIF, BMP, SVG -> JPG / PNG / WebP (/ AVIF where
// the browser can encode it). Optional resize, background for transparency, batch + ZIP.
// Everything runs on the device; re-encoding also strips EXIF metadata such as GPS location.

// Pure helpers (also used by tests) -----------------------------------------------------------
function qtIcIsHeic(name, type, head) {
  if (/image\/hei[cf]/i.test(type || "") || /\.(heic|heif)$/i.test(name || "")) return true;
  if (head && head.length >= 12) {
    var s = String.fromCharCode.apply(null, Array.prototype.slice.call(head, 4, 12));
    return /^ftyp(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(s) && !/^ftypavif/.test(s);
  }
  return false;
}
// Target size for resize options: {mode:"none"|"max"|"pct"|"w"|"h", w, h, pct}
function qtIcTarget(w, h, o) {
  o = o || {}; var m = o.mode || "none", r = 1;
  if (m === "pct") r = Math.max(1, Math.min(400, +o.pct || 100)) / 100;
  else if (m === "max") { var mw = +o.w || Infinity, mh = +o.h || Infinity; r = Math.min(1, mw / w, mh / h); }
  else if (m === "w" && +o.w) r = +o.w / w;
  else if (m === "h" && +o.h) r = +o.h / h;
  return { w: Math.max(1, Math.round(w * r)), h: Math.max(1, Math.round(h * r)) };
}
function qtIcOutName(name, ext) {
  var base = String(name || "image").replace(/\.[^.\/\\]*$/, "") || "image";
  return base + "." + ext;
}
var QT_IC_FORMATS = { jpg: { mime: "image/jpeg", ext: "jpg", label: "JPG", lossy: true }, png: { mime: "image/png", ext: "png", label: "PNG" },
  webp: { mime: "image/webp", ext: "webp", label: "WebP", lossy: true }, avif: { mime: "image/avif", ext: "avif", label: "AVIF", lossy: true } };

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var S = window.QT_STRINGS || {};
  var L = function (k, d) { return S[k] || d; };
  var fmtB = function (b) { return typeof qtFormatBytes === "function" ? qtFormatBytes(b) : (b > 1048576 ? (b / 1048576).toFixed(2) + " MB" : Math.round(b / 1024) + " KB"); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var results = [], busy = false, queue = [], heifMod = null, heifLoading = null, rowSeq = 0;

  function canEncode(mime) { try { var c = document.createElement("canvas"); c.width = c.height = 2; return c.toDataURL(mime).indexOf("data:" + mime) === 0; } catch (e) { return false; } }

  function loadHeif() {
    if (heifMod) return Promise.resolve(heifMod);
    if (heifLoading) return heifLoading;
    heifLoading = new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = "/vendor/libheif/libheif.js"; s.onload = res; s.onerror = function () { rej(new Error(L("heifLoad", "Could not load the HEIC decoder."))); };
      document.head.appendChild(s);
    }).then(function () { return fetch("/vendor/libheif/libheif.wasm"); })
      .then(function (r) { if (!r.ok) throw new Error(L("heifLoad", "Could not load the HEIC decoder.")); return r.arrayBuffer(); })
      .then(function (buf) {
        var m = window.libheif({ wasmBinary: buf });
        return (m && typeof m.then === "function" && typeof m.HeifDecoder !== "function") ? m : Promise.resolve(m);
      }).then(function (m) { heifMod = m; return m; })
      .catch(function (e) { heifLoading = null; throw e; });
    return heifLoading;
  }
  function decodeHeic(buf) {
    return loadHeif().then(function (lh) {
      var dec = new lh.HeifDecoder(), imgs = dec.decode(new Uint8Array(buf));
      if (!imgs || !imgs.length) throw new Error(L("heifBad", "This HEIC file has no readable image."));
      var im = imgs[0], w = im.get_width(), h = im.get_height();
      return new Promise(function (res, rej) {
        im.display({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }, function (d) {
          if (!d) return rej(new Error(L("heifBad", "This HEIC file has no readable image.")));
          var c = document.createElement("canvas"); c.width = w; c.height = h;
          c.getContext("2d").putImageData(new ImageData(d.data, w, h), 0, 0);
          try { imgs.forEach(function (x) { x.free && x.free(); }); } catch (e) {}
          res({ source: c, w: w, h: h, via: "libheif" });
        });
      });
    });
  }
  function decodeNative(file) {
    if (window.createImageBitmap && !/svg/i.test(file.type)) {
      return createImageBitmap(file).then(function (b) { return { source: b, w: b.width, h: b.height, via: "native" }; })
        .catch(function () { return decodeImg(file); });
    }
    return decodeImg(file);
  }
  function decodeImg(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { var w = img.naturalWidth || 1024, h = img.naturalHeight || 1024; res({ source: img, w: w, h: h, via: "img", url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error(L("cantRead", "Your browser can't read this file as an image."))); };
      img.src = url;
    });
  }
  function decode(file) {
    return file.slice(0, 16).arrayBuffer().then(function (hb) {
      var heic = qtIcIsHeic(file.name, file.type, new Uint8Array(hb));
      if (!heic) return decodeNative(file);
      // Safari can decode HEIC natively; everyone else gets libheif (WebAssembly, loaded on demand).
      return decodeNative(file).catch(function () { return file.arrayBuffer().then(decodeHeic); });
    });
  }
  function draw(src, tw, th, bg) {
    var cur = src.source, cw = src.w, ch = src.h;
    // Step down in halves for big reductions — much sharper than one huge drawImage.
    while (cw / 2 >= tw && ch / 2 >= th && cw > 2048) {
      var half = document.createElement("canvas"); half.width = Math.round(cw / 2); half.height = Math.round(ch / 2);
      var hx = half.getContext("2d"); hx.imageSmoothingQuality = "high"; hx.drawImage(cur, 0, 0, half.width, half.height);
      cur = half; cw = half.width; ch = half.height;
    }
    var c = document.createElement("canvas"); c.width = tw; c.height = th;
    var x = c.getContext("2d");
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, tw, th); }
    x.imageSmoothingQuality = "high"; x.drawImage(cur, 0, 0, tw, th);
    return c;
  }
  function opts() {
    var f = $("icFormat").value;
    return { fmt: f, q: +$("icQuality").value / 100, resize: { mode: $("icResize").value, w: $("icW").value, h: $("icH").value, pct: $("icPct").value },
      bg: f === "jpg" ? $("icBg").value : ($("icFlatten").checked ? $("icBg").value : null) };
  }
  function addRow(file) {
    var id = "icr" + (++rowSeq), li = document.createElement("li"); li.className = "ic-row"; li.id = id;
    li.innerHTML = '<div class="ic-thumb"></div><div class="ic-meta"><b>' + esc(file.name) + '</b><span class="ic-st">' + L("waiting", "Waiting…") + "</span></div><div class=\"ic-act\"></div>";
    $("icList").appendChild(li); return li;
  }
  function processNext() {
    if (busy || !queue.length) { updateBar(); return; }
    busy = true;
    var job = queue.shift(), file = job.file, li = job.li, o = opts(), F = QT_IC_FORMATS[o.fmt];
    li.querySelector(".ic-st").textContent = qtIcIsHeic(file.name, file.type) && !heifMod ? L("loadingHeic", "Loading HEIC decoder (1 MB, once)…") : L("converting", "Converting…");
    var t0 = performance.now();
    decode(file).then(function (src) {
      var t = qtIcTarget(src.w, src.h, o.resize);
      if (t.w * t.h > 120e6) throw new Error(L("tooBig", "Output would be too large for the browser — use a smaller size."));
      var c = draw(src, t.w, t.h, o.bg);
      if (src.url) URL.revokeObjectURL(src.url);
      if (src.source && src.source.close) try { src.source.close(); } catch (e) {}
      return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res({ blob: b, w: t.w, h: t.h, ow: src.w, oh: src.h, via: src.via }) : rej(new Error(L("encodeFail", "Your browser couldn't encode this format."))); }, F.mime, F.lossy ? o.q : undefined); });
    }).then(function (r) {
      var name = qtIcOutName(file.name, F.ext), url = URL.createObjectURL(r.blob), diff = Math.round((r.blob.size / file.size - 1) * 100);
      results.push({ name: name, blob: r.blob });
      li.classList.add("ic-done");
      li.querySelector(".ic-thumb").innerHTML = '<img src="' + url + '" alt="">';
      li.querySelector(".ic-st").innerHTML = r.ow + "×" + r.oh + (r.w !== r.ow ? " → " + r.w + "×" + r.h : "") + " · " + fmtB(file.size) + " → <b>" + fmtB(r.blob.size) + '</b> <span class="' + (diff <= 0 ? "ic-down" : "ic-up") + '">' + (diff > 0 ? "+" : "") + diff + "%</span>" + (r.via === "libheif" ? ' <span class="ic-dim">HEIC</span>' : "") + ' <span class="ic-dim">' + Math.round(performance.now() - t0) + " ms</span>";
      var a = document.createElement("a"); a.className = "btn btn-secondary ic-dl"; a.href = url; a.download = name; a.textContent = L("download", "Download");
      if (r.via !== "libheif" && /^image\/(jpeg|png|webp|gif|bmp|avif)$/.test(file.type)) { var AR = (document.documentElement.lang || "").indexOf("ar") === 0; var cb = typeof qtCompareButton === "function" && qtCompareButton(li, file, r.blob, { after: (AR ? "بعد التحويل" : "Converted") + " · " + F.label }); if (cb) li.querySelector(".ic-act").appendChild(cb); }
      li.querySelector(".ic-act").appendChild(a);
      qtTrack("image_convert", { to: o.fmt, heic: r.via === "libheif" ? 1 : 0 });
    }).catch(function (e) {
      li.classList.add("ic-fail"); li.querySelector(".ic-st").textContent = e.message || String(e);
    }).then(function () { busy = false; processNext(); });
    updateBar();
  }
  function updateBar() {
    var n = results.length;
    $("icBar").hidden = !$("icList").children.length;
    $("icZip").disabled = n < 2 || busy || queue.length > 0;
    $("icCount").textContent = n ? n + " " + L("converted", "converted") + (queue.length || busy ? " · " + (queue.length + (busy ? 1 : 0)) + " " + L("left", "left") : "") : "";
  }
  var allFiles = [];
  function addFiles(list, redo) {
    Array.prototype.forEach.call(list, function (f) { if (!redo) allFiles.push(f); queue.push({ file: f, li: addRow(f) }); });
    processNext();
  }
  function syncUi() {
    var f = $("icFormat").value, F = QT_IC_FORMATS[f];
    $("icQWrap").hidden = !F.lossy;
    $("icBgWrap").hidden = f !== "jpg" && !$("icFlatten").checked;
    $("icFlattenWrap").hidden = f === "jpg";
    var m = $("icResize").value;
    $("icWWrap").hidden = !(m === "max" || m === "w"); $("icHWrap").hidden = !(m === "max" || m === "h"); $("icPctWrap").hidden = m !== "pct";
    $("icQVal").textContent = $("icQuality").value + "%";
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Only offer formats this browser can actually encode.
    Array.prototype.slice.call($("icFormat").options).forEach(function (op) { if (op.value !== "jpg" && op.value !== "png" && !canEncode(QT_IC_FORMATS[op.value].mime)) op.remove(); });
    var P = window.QT_PRESET || {};
    if (P.to && $("icFormat").querySelector('option[value="' + P.to + '"]')) $("icFormat").value = P.to;
    if (P.resize) { $("icResize").value = P.resize; }
    ["icFormat", "icResize", "icQuality", "icFlatten"].forEach(function (id) { $(id).addEventListener(id === "icQuality" ? "input" : "change", syncUi); });
    syncUi();
    var dz = $("icDrop"), inp = $("icFile");
    dz.addEventListener("click", function () { inp.click(); });
    dz.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } });
    dz.addEventListener("dragover", function (e) { e.preventDefault(); dz.classList.add("drag"); });
    dz.addEventListener("dragleave", function () { dz.classList.remove("drag"); });
    dz.addEventListener("drop", function (e) { e.preventDefault(); dz.classList.remove("drag"); addFiles(e.dataTransfer.files); });
    inp.addEventListener("change", function () { addFiles(inp.files); inp.value = ""; });
    document.addEventListener("paste", function (e) {
      var fs = Array.prototype.filter.call((e.clipboardData && e.clipboardData.files) || [], function (f) { return /^image\//.test(f.type); });
      if (fs.length) addFiles(fs);
    });
    $("icZip").addEventListener("click", function () {
      Promise.all(results.map(function (r) { return r.blob.arrayBuffer().then(function (b) { return { name: r.name, data: new Uint8Array(b) }; }); })).then(function (files) {
        var a = document.createElement("a"); a.href = URL.createObjectURL(qtZip(files)); a.download = "converted-images.zip"; a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); qtTrack("image_convert_zip", { n: files.length });
      });
    });
    $("icClear").addEventListener("click", function () { queue = []; results = []; allFiles = []; $("icList").innerHTML = ""; updateBar(); });
    $("icRedo").addEventListener("click", function () { if (busy) return; queue = []; results = []; $("icList").innerHTML = ""; addFiles(allFiles, true); });
  });
})();

if (typeof module !== "undefined") module.exports = { qtIcIsHeic: qtIcIsHeic, qtIcTarget: qtIcTarget, qtIcOutName: qtIcOutName };
