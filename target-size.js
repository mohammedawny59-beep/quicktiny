// QuickTiny — compress images to an exact size (e.g. under 100 KB) for upload forms.
// Finds the highest JPEG quality that fits; if even low quality is too big, scales the image down step by step.
// "100 KB" is treated as 100,000 bytes, which is under the limit whether a site means 1000 or 1024 bytes per KB.

// encode(w, h, q) -> Promise<size in bytes>. Returns {w, h, q, size} that fits under maxBytes, or null.
async function qtFitToSize(encode, w0, h0, maxBytes, opt) {
  opt = opt || {};
  var qMin = opt.qMin || 0.55, qMax = opt.qMax || 0.92, minSide = opt.minSide || 48, steps = opt.steps || 7;
  var w = w0, h = h0, guard = 0;
  while (guard++ < 30) {
    var lo = await encode(w, h, qMin);
    if (lo <= maxBytes) {
      // Binary search the best quality at this size.
      var best = { q: qMin, size: lo }, a = qMin, b = qMax;
      var hi = await encode(w, h, qMax);
      if (hi <= maxBytes) return { w: w, h: h, q: qMax, size: hi };
      for (var i = 0; i < steps; i++) {
        var m = (a + b) / 2, s = await encode(w, h, m);
        if (s <= maxBytes) { best = { q: m, size: s }; a = m; } else b = m;
      }
      return { w: w, h: h, q: Math.round(best.q * 100) / 100, size: best.size };
    }
    // Too big even at low quality: shrink. Size scales roughly with pixel count.
    var r = Math.sqrt(maxBytes / lo) * 0.92;
    r = Math.min(0.9, Math.max(0.3, r));
    var nw = Math.max(1, Math.round(w * r)), nh = Math.max(1, Math.round(h * r));
    if (Math.min(nw, nh) < minSide) {
      if (Math.min(w, h) <= minSide) return null;
      var k = minSide / Math.min(w, h); nw = Math.round(w * k); nh = Math.round(h * k);
    }
    w = nw; h = nh;
  }
  return null;
}
function qtKbLabel(bytes) { return bytes >= 1e6 ? (bytes / 1e6).toFixed(2) + " MB" : (bytes / 1e3).toFixed(1) + " KB"; }

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var S = window.QT_STRINGS || {}, L = function (k, d) { return S[k] || d; };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var results = [], queue = [], busy = false, all = [];

  function decode(file) {
    if (window.createImageBitmap) return createImageBitmap(file).catch(function () { return viaImg(file); });
    return viaImg(file);
  }
  function viaImg(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { res(im); }; im.onerror = function () { URL.revokeObjectURL(u); rej(new Error(L("cantRead", "Your browser can't read this file as an image (HEIC? Convert it to JPG first)."))); };
      im.src = u;
    });
  }
  function target() {
    var v = parseFloat(String($("tsKb").value).replace(",", ".")), unit = $("tsUnit").value;
    return Math.round((isFinite(v) && v > 0 ? v : 100) * (unit === "mb" ? 1e6 : 1e3));
  }
  function addRow(f) {
    var li = document.createElement("li"); li.className = "ic-row";
    li.innerHTML = '<div class="ic-thumb"></div><div class="ic-meta"><b>' + esc(f.name) + '</b><span class="ic-st">' + L("waiting", "Waiting…") + '</span></div><div class="ic-act"></div>';
    $("tsList").appendChild(li); return li;
  }
  function next() {
    if (busy || !queue.length) { bar(); return; }
    busy = true; bar();
    var job = queue.shift(), f = job.file, li = job.li, max = target(), fmt = $("tsFormat").value, mime = fmt === "webp" ? "image/webp" : "image/jpeg";
    var maxW = parseInt($("tsMaxW").value, 10) || 0, maxH = parseInt($("tsMaxH").value, 10) || 0;
    li.querySelector(".ic-st").textContent = L("working", "Finding the best quality that fits…");
    var t0 = performance.now(), src, lastBlob = null;
    decode(f).then(function (s) {
      src = s;
      var w = s.width || s.naturalWidth, h = s.height || s.naturalHeight, r = 1;
      if (maxW) r = Math.min(r, maxW / w); if (maxH) r = Math.min(r, maxH / h);
      w = Math.max(1, Math.round(w * r)); h = Math.max(1, Math.round(h * r));
      var cache = {};
      var encode = function (ew, eh, q) {
        var key = ew + "x" + eh;
        var c = cache.key === key ? cache.c : null;
        if (!c) { c = document.createElement("canvas"); c.width = ew; c.height = eh; var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, ew, eh); x.imageSmoothingQuality = "high"; x.drawImage(src, 0, 0, ew, eh); cache = { key: key, c: c }; }
        return new Promise(function (res) { c.toBlob(function (b) { lastBlob = b; cache[key + "@" + q] = b; res(b ? b.size : Infinity); }, mime, q); });
      };
      if (f.size <= max && !maxW && !maxH && /jpe?g/i.test(f.type) && fmt === "jpg") return { keep: true };
      return qtFitToSize(encode, w, h, max).then(function (fit) {
        if (!fit) return null;
        return new Promise(function (res) { var b = cache[fit.w + "x" + fit.h + "@" + fit.q]; if (b) return res({ fit: fit, blob: b }); encode(fit.w, fit.h, fit.q).then(function () { res({ fit: fit, blob: lastBlob }); }); });
      });
    }).then(function (r) {
      var ext = fmt === "webp" ? "webp" : "jpg", name = f.name.replace(/\.[^.]*$/, "") + "-" + Math.round(max / 1000) + "kb." + ext;
      if (r && r.keep) { r = { blob: f, fit: { w: src.width || src.naturalWidth, h: src.height || src.naturalHeight, q: null } }; name = f.name; }
      if (!r) throw new Error(L("cannot", "Couldn't get this image under that size — try a bigger limit."));
      results.push({ name: name, blob: r.blob });
      var url = URL.createObjectURL(r.blob);
      li.classList.add("ic-done");
      li.querySelector(".ic-thumb").innerHTML = '<img alt="" src="' + url + '">';
      li.querySelector(".ic-st").innerHTML = qtKbLabel(f.size) + " → <b>" + qtKbLabel(r.blob.size) + "</b> " + '<span class="ic-down">✓ ' + L("under", "under") + " " + qtKbLabel(max) + "</span> · " + r.fit.w + "×" + r.fit.h +
        (r.fit.q ? " · " + L("quality", "quality") + " " + Math.round(r.fit.q * 100) + "%" : " · " + L("already", "already small enough — unchanged")) + ' <span class="ic-dim">' + Math.round(performance.now() - t0) + " ms</span>";
      var a = document.createElement("a"); a.className = "btn btn-secondary ic-dl"; a.href = url; a.download = name; a.textContent = L("download", "Download");
      li.querySelector(".ic-act").appendChild(a);
      qtTrack("target_size", { kb: Math.round(max / 1000) });
    }).catch(function (e) { li.classList.add("ic-fail"); li.querySelector(".ic-st").textContent = e.message || String(e); })
      .then(function () { if (src && src.close) try { src.close(); } catch (x) {} busy = false; next(); });
  }
  function bar() {
    $("tsBar").hidden = !$("tsList").children.length;
    $("tsZip").disabled = results.length < 2 || busy || queue.length > 0;
  }
  function add(list, redo) { Array.prototype.forEach.call(list, function (f) { if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name)) return; if (!redo) all.push(f); queue.push({ file: f, li: addRow(f) }); }); next(); }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("tsKb")) return;
    var P = window.QT_PRESET || {};
    if (P.kb) {
      $("tsKb").value = P.kb >= 1000 ? P.kb / 1000 : P.kb; $("tsUnit").value = P.kb >= 1000 ? "mb" : "kb";
      document.querySelectorAll("#tsPresets .chip").forEach(function (x) { x.classList.toggle("active", +x.getAttribute("data-kb") === P.kb); });
    }
    ["tsKb", "tsUnit"].forEach(function (id) { $(id).addEventListener("input", function () { var v = target(); document.querySelectorAll("#tsPresets .chip").forEach(function (x) { x.classList.toggle("active", +x.getAttribute("data-kb") * 1000 === v); }); }); });
    document.querySelectorAll("#tsPresets .chip").forEach(function (b) { b.addEventListener("click", function () {
      var v = +b.getAttribute("data-kb"); $("tsKb").value = v >= 1000 ? v / 1000 : v; $("tsUnit").value = v >= 1000 ? "mb" : "kb";
      document.querySelectorAll("#tsPresets .chip").forEach(function (x) { x.classList.toggle("active", x === b); });
    }); });
    var dz = $("tsDrop"), inp = $("tsFile");
    dz.addEventListener("click", function () { inp.click(); });
    dz.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } });
    dz.addEventListener("dragover", function (e) { e.preventDefault(); dz.classList.add("drag"); });
    dz.addEventListener("dragleave", function () { dz.classList.remove("drag"); });
    dz.addEventListener("drop", function (e) { e.preventDefault(); dz.classList.remove("drag"); add(e.dataTransfer.files); });
    inp.addEventListener("change", function () { add(inp.files); inp.value = ""; });
    document.addEventListener("paste", function (e) { var fs = Array.prototype.filter.call((e.clipboardData && e.clipboardData.files) || [], function (f) { return /^image\//.test(f.type); }); if (fs.length) add(fs); });
    $("tsRedo").addEventListener("click", function () { if (busy) return; results = []; queue = []; $("tsList").innerHTML = ""; add(all, true); });
    $("tsClear").addEventListener("click", function () { results = []; queue = []; all = []; $("tsList").innerHTML = ""; bar(); });
    $("tsZip").addEventListener("click", function () {
      Promise.all(results.map(function (r) { return r.blob.arrayBuffer().then(function (b) { return { name: r.name, data: new Uint8Array(b) }; }); })).then(function (files) {
        var a = document.createElement("a"); a.href = URL.createObjectURL(qtZip(files)); a.download = "compressed-images.zip"; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      });
    });
    try { var t = document.createElement("canvas"); t.width = t.height = 1; if (t.toDataURL("image/webp").indexOf("data:image/webp") !== 0) { var o = $("tsFormat").querySelector('option[value="webp"]'); if (o) o.remove(); } } catch (e) {}
  });
})();

if (typeof module !== "undefined") module.exports = { qtFitToSize: qtFitToSize, qtKbLabel: qtKbLabel };
