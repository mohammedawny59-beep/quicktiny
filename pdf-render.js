// QuickTiny PDF Tools — rendering features built on pdf.js (Apache-2.0, self-hosted in /vendor/pdfjs):
//   • PDF → JPG / PNG / WebP (each page as an image, ZIP for many)
//   • Compress PDF (re-render each page as a JPEG at a chosen resolution and rebuild the PDF with pdf-lib)
// Loaded after pdf-tools.js and reuses its helpers (qtL, qtWireDrop, qtPdfStatus, qtLoadPdfLib, qtParseRanges…).

var QT_PDFJS = null;
function qtLoadPdfJs() {
  if (QT_PDFJS) return QT_PDFJS;
  QT_PDFJS = import("/vendor/pdfjs/pdf.min.mjs").then(function (lib) {
    lib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
    return lib;
  }).catch(function () { QT_PDFJS = null; throw new Error(qtL("Could not load the PDF engine. Check your connection and try again.")); });
  return QT_PDFJS;
}
async function qtPdfJsOpen(file) {
  var lib = await qtLoadPdfJs();
  var data = new Uint8Array(await file.arrayBuffer());
  try {
    return await lib.getDocument({ data: data, isEvalSupported: false, wasmUrl: "/vendor/pdfjs/wasm/", standardFontDataUrl: "/vendor/pdfjs/standard_fonts/", iccUrl: "/vendor/pdfjs/iccs/", enableXfa: false }).promise;
  } catch (e) {
    if (window.console) console.warn("pdf.js open failed:", e);
    if (e && /password/i.test(e.name + e.message)) throw new Error(qtL("“{name}” is password-protected. Remove the password first, then try again.", { name: file.name }));
    throw new Error(qtL("“{name}” doesn't look like a valid PDF.", { name: file.name }));
  }
}
// Render one page to a canvas at `dpi`, never above ~40 megapixels (browser canvas limits).
async function qtRenderPage(pdf, n, dpi, gray) {
  var page = await pdf.getPage(n);
  var base = page.getViewport({ scale: 1 });
  var scale = dpi / 72, maxPx = 40e6;
  if (base.width * base.height * scale * scale > maxPx) scale = Math.sqrt(maxPx / (base.width * base.height));
  var vp = page.getViewport({ scale: scale });
  var c = document.createElement("canvas");
  c.width = Math.max(1, Math.floor(vp.width)); c.height = Math.max(1, Math.floor(vp.height));
  var ctx = c.getContext("2d", { alpha: false });
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, canvas: c, viewport: vp, background: "#ffffff" }).promise;
  if (gray) {
    var im = ctx.getImageData(0, 0, c.width, c.height), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; d[i] = d[i + 1] = d[i + 2] = y; }
    ctx.putImageData(im, 0, 0);
  }
  page.cleanup();
  return { canvas: c, wPt: base.width, hPt: base.height };
}
function qtCanvasBlob(c, mime, q) { return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error(qtL("Your browser couldn't encode this format."))); }, mime, q); }); }

// ---------------- PDF → images ----------------
var qtToImgFile = null, qtToImgPdf = null;
async function qtLoadToImg(file) {
  $pdf("toimgOut").innerHTML = ""; $pdf("toimgControls").hidden = true;
  if (!file || !/pdf/i.test(file.type + file.name)) { qtPdfStatus("toimgStatus", qtL("Choose a PDF file."), "error"); return; }
  qtPdfStatus("toimgStatus", qtL("Reading {name}…", { name: file.name }));
  try {
    qtToImgPdf = await qtPdfJsOpen(file); qtToImgFile = file;
    qtPdfStatus("toimgStatus", file.name + " — " + qtPagesLabel(qtToImgPdf.numPages), "success");
    $pdf("toimgControls").hidden = false;
  } catch (e) { qtPdfStatus("toimgStatus", e.message, "error"); }
}
async function qtRunToImg() {
  if (!qtToImgPdf) return;
  var pdf = qtToImgPdf, fmt = $pdf("toimgFormat").value, dpi = +$pdf("toimgDpi").value, out = $pdf("toimgOut");
  var mime = fmt === "png" ? "image/png" : fmt === "webp" ? "image/webp" : "image/jpeg", ext = fmt === "jpg" ? "jpg" : fmt;
  var pages;
  try { pages = $pdf("toimgRange").value.trim() ? qtParseRanges($pdf("toimgRange").value, pdf.numPages) : pdf.numPages ? Array.from({ length: pdf.numPages }, function (_, i) { return i; }) : []; }
  catch (e) { qtPdfStatus("toimgStatus", e.message, "error"); return; }
  out.innerHTML = ""; $pdf("toimgBtn").disabled = true;
  var files = [], grid = document.createElement("div"); grid.className = "pdf-thumbs"; out.appendChild(grid);
  var base = qtBaseName(qtToImgFile.name), pad = String(pdf.numPages).length;
  try {
    for (var k = 0; k < pages.length; k++) {
      qtPdfStatus("toimgStatus", qtL("Rendering page {i} of {n}…", { i: k + 1, n: pages.length }));
      var r = await qtRenderPage(pdf, pages[k] + 1, dpi, false);
      var blob = await qtCanvasBlob(r.canvas, mime, fmt === "png" ? undefined : 0.9);
      var name = base + "-page-" + String(pages[k] + 1).padStart(pad, "0") + "." + ext;
      files.push({ name: name, blob: blob });
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = name; a.className = "pdf-thumb";
      a.innerHTML = '<img alt="" loading="lazy"><span></span>';
      a.querySelector("img").src = url; a.querySelector("span").textContent = qtL("Page {i}", { i: pages[k] + 1 }) + " · " + qtFormatBytes(blob.size);
      grid.appendChild(a);
    }
    if (files.length > 1) {
      var parts = await Promise.all(files.map(function (f) { return f.blob.arrayBuffer().then(function (b) { return { name: f.name, data: new Uint8Array(b) }; }); }));
      var row = document.createElement("div"); row.className = "btn-row"; out.insertBefore(row, grid);
      var zl = document.createElement("a"); zl.className = "btn"; zl.href = URL.createObjectURL(qtZip(parts)); zl.download = base + "-images.zip";
      zl.textContent = qtL("Download all as ZIP") + " (" + files.length + ")"; row.appendChild(zl);
    } else if (files.length === 1) {
      var r1 = document.createElement("div"); r1.className = "btn-row"; out.insertBefore(r1, grid);
      var one = document.createElement("a"); one.className = "btn"; one.href = grid.firstChild.href; one.download = files[0].name; one.textContent = qtL("Download") + " (" + qtFormatBytes(files[0].blob.size) + ")"; r1.appendChild(one);
    }
    qtPdfStatus("toimgStatus", qtL("Done — {n} images. Click a page to download it.", { n: files.length }), "success");
    qtTrack("pdf_to_images", { pages: files.length, fmt: fmt });
  } catch (e) { qtPdfStatus("toimgStatus", e.message || String(e), "error"); }
  $pdf("toimgBtn").disabled = false;
}

// ---------------- Compress ----------------
var qtCmpFile = null, qtCmpPdf = null;
var QT_CMP_LEVELS = { strong: { dpi: 96, q: 0.55 }, balanced: { dpi: 140, q: 0.7 }, light: { dpi: 200, q: 0.82 } };
async function qtLoadCmp(file) {
  $pdf("cmpOut").innerHTML = ""; $pdf("cmpControls").hidden = true;
  if (!file || !/pdf/i.test(file.type + file.name)) { qtPdfStatus("cmpStatus", qtL("Choose a PDF file."), "error"); return; }
  qtPdfStatus("cmpStatus", qtL("Reading {name}…", { name: file.name }));
  try {
    qtCmpPdf = await qtPdfJsOpen(file); qtCmpFile = file;
    qtPdfStatus("cmpStatus", file.name + " — " + qtPagesLabel(qtCmpPdf.numPages) + " · " + qtFormatBytes(file.size), "success");
    $pdf("cmpControls").hidden = false;
  } catch (e) { qtPdfStatus("cmpStatus", e.message, "error"); }
}
async function qtRunCmp() {
  if (!qtCmpPdf) return;
  var lvl = QT_CMP_LEVELS[$pdf("cmpLevel").value] || QT_CMP_LEVELS.balanced, gray = $pdf("cmpGray").checked, out = $pdf("cmpOut");
  out.innerHTML = ""; $pdf("cmpBtn").disabled = true;
  try {
    var PDFLib = await qtLoadPdfLib(), doc = await PDFLib.PDFDocument.create(), pdf = qtCmpPdf;
    for (var n = 1; n <= pdf.numPages; n++) {
      qtPdfStatus("cmpStatus", qtL("Compressing page {i} of {n}…", { i: n, n: pdf.numPages }));
      var r = await qtRenderPage(pdf, n, lvl.dpi, gray);
      var jpg = new Uint8Array(await (await qtCanvasBlob(r.canvas, "image/jpeg", lvl.q)).arrayBuffer());
      var img = await doc.embedJpg(jpg), page = doc.addPage([r.wPt, r.hPt]);
      page.drawImage(img, { x: 0, y: 0, width: r.wPt, height: r.hPt });
      r.canvas.width = r.canvas.height = 0;
    }
    var bytes = await doc.save({ useObjectStreams: true });
    var before = qtCmpFile.size, after = bytes.length, pct = Math.round((1 - after / before) * 100);
    var name = qtBaseName(qtCmpFile.name) + "-compressed.pdf";
    var box = document.createElement("div"); box.className = "pdf-cmp-res";
    box.innerHTML = '<div class="pdf-cmp-nums"><span>' + qtFormatBytes(before) + '</span><span class="arr">→</span><b></b><span class="pct"></span></div>';
    box.querySelector("b").textContent = qtFormatBytes(after);
    box.querySelector(".pct").textContent = pct > 0 ? "−" + pct + "%" : "+" + Math.abs(pct) + "%";
    box.querySelector(".pct").className = "pct " + (pct > 0 ? "good" : "bad");
    out.appendChild(box);
    var row = document.createElement("div"); row.className = "btn-row"; out.appendChild(row);
    qtDownloadLink(row, bytes, name, qtL("Download compressed PDF"));
    if (pct <= 5) qtPdfStatus("cmpStatus", qtL("This PDF is already well compressed — the new file isn't meaningfully smaller. Keep your original, or try “Strong”."), "error");
    else qtPdfStatus("cmpStatus", qtL("Done — {pct}% smaller.", { pct: pct }), "success");
    qtTrack("pdf_compress", { pages: pdf.numPages, pct: pct, level: $pdf("cmpLevel").value });
  } catch (e) { qtPdfStatus("cmpStatus", e.message || String(e), "error"); }
  $pdf("cmpBtn").disabled = false;
}

document.addEventListener("DOMContentLoaded", function () {
  if (!$pdf("toimgDz")) return;
  qtWireDrop("toimgDz", "toimgFile", function (files) { qtLoadToImg(files[0]); });
  $pdf("toimgBtn").addEventListener("click", qtRunToImg);
  qtWireDrop("cmpDz", "cmpFile", function (files) { qtLoadCmp(files[0]); });
  $pdf("cmpBtn").addEventListener("click", qtRunCmp);
  // Hide WebP output where the browser can't encode it.
  try { var t = document.createElement("canvas"); t.width = t.height = 1; if (t.toDataURL("image/webp").indexOf("data:image/webp") !== 0) { var o = $pdf("toimgFormat").querySelector('option[value="webp"]'); if (o) o.remove(); } } catch (e) {}
});
