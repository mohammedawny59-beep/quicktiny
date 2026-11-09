// QuickTiny PDF Tools — merge, extract/remove pages, rotate, images → PDF.
// Uses pdf-lib (MIT) in the browser; files are never uploaded.
// Messages go through qtL() so translated pages can set window.QT_STRINGS.

var QT_PDFLIB_URL = "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";
var qtPdfLibPromise = null;

// qtL("Merged {n} files", {n: 3}) → translated (if window.QT_STRINGS has it) and filled in.
function qtL(text, vars) {
  var t = (window.QT_STRINGS && window.QT_STRINGS[text]) || text;
  return t.replace(/\{(\w+)\}/g, function(m, k){ return vars && vars[k] !== undefined ? vars[k] : m; });
}

function qtLoadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (!qtPdfLibPromise) {
    qtPdfLibPromise = new Promise(function(resolve, reject) {
      var s = document.createElement("script");
      s.src = QT_PDFLIB_URL;
      s.onload = function(){ resolve(window.PDFLib); };
      s.onerror = function(){ qtPdfLibPromise = null; reject(new Error(qtL("Could not load the PDF engine. Check your connection and try again."))); };
      document.head.appendChild(s);
    });
  }
  return qtPdfLibPromise;
}

function $pdf(id) { return document.getElementById(id); }

function qtPdfStatus(id, text, kind) {
  var el = $pdf(id);
  el.textContent = text || "";
  el.className = "result" + (kind ? " " + kind : "");
}

function qtReadBytes(file) {
  return file.arrayBuffer().then(function(b){ return new Uint8Array(b); });
}

// Translated pages can set window.QT_PAGES_LABEL(n) for languages with richer plural rules.
function qtPagesLabel(n) {
  if (typeof window.QT_PAGES_LABEL === "function") return window.QT_PAGES_LABEL(n);
  return n === 1 ? qtL("1 page") : qtL("{n} pages", { n: n });
}

async function qtOpenPdf(file) {
  var PDFLib = await qtLoadPdfLib();
  var bytes = await qtReadBytes(file);
  try {
    return await PDFLib.PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    if (/encrypt/i.test(e && e.message)) throw new Error(qtL("“{name}” is password-protected. Remove the password first, then try again.", { name: file.name }));
    throw new Error(qtL("“{name}” doesn't look like a valid PDF.", { name: file.name }));
  }
}

function qtBaseName(name) { return name.replace(/\.[^.]+$/, ""); }

function qtDownloadLink(container, bytes, filename, label) {
  var blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: "application/pdf" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.className = "btn";
  a.textContent = (label || qtL("Download")) + " (" + qtFormatBytes(blob.size) + ")";
  container.appendChild(a);
  return a;
}

// "1-3, 5, 8-" → zero-based page indexes (sorted, unique), validated against pageCount.
function qtParseRanges(text, pageCount) {
  var out = [], seen = {};
  var parts = String(text || "").replace(/،/g, ",").split(",").map(function(p){ return p.trim(); }).filter(Boolean);
  if (!parts.length) throw new Error(qtL("Enter the pages you want, e.g. 1-3, 5"));
  parts.forEach(function(part) {
    var m = /^(\d+)?\s*(-)?\s*(\d+)?$/.exec(part);
    if (!m || (!m[1] && !m[3])) throw new Error(qtL("“{part}” isn't a page or range. Use e.g. 1-3, 5, 8-", { part: part }));
    var start = m[1] ? Number(m[1]) : 1;
    var end = m[2] ? (m[3] ? Number(m[3]) : pageCount) : start;
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) throw new Error(qtL("This PDF has {n} pages — “{part}” is out of range.", { n: pageCount, part: part }));
    if (end < start) { var t = start; start = end; end = t; }
    for (var p = start; p <= end; p++) if (!seen[p]) { seen[p] = true; out.push(p - 1); }
  });
  return out.sort(function(a, b){ return a - b; });
}

// Shared list renderer for the merge and images lists (reorder + remove).
function qtRenderFileList(listId, items, labelOf, onChange) {
  var list = $pdf(listId);
  list.innerHTML = "";
  items.forEach(function(item, i) {
    var li = document.createElement("li");
    li.className = "pdf-item";
    var name = document.createElement("span");
    name.className = "pdf-name";
    name.textContent = (i + 1) + ". " + labelOf(item);
    li.appendChild(name);
    var fileName = (item.file || item).name;
    [["↑", -1, "Move up {name}"], ["↓", 1, "Move down {name}"]].forEach(function(cfg) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "btn btn-secondary pdf-mini"; b.textContent = cfg[0];
      b.setAttribute("aria-label", qtL(cfg[2], { name: fileName }));
      b.disabled = (cfg[1] < 0 && i === 0) || (cfg[1] > 0 && i === items.length - 1);
      b.addEventListener("click", function(){ var j = i + cfg[1]; var t = items[i]; items[i] = items[j]; items[j] = t; onChange(); });
      li.appendChild(b);
    });
    var rm = document.createElement("button");
    rm.type = "button"; rm.className = "btn btn-secondary pdf-mini"; rm.textContent = "✕";
    rm.setAttribute("aria-label", qtL("Remove {name}", { name: fileName }));
    rm.addEventListener("click", function(){ items.splice(i, 1); onChange(); });
    li.appendChild(rm);
    list.appendChild(li);
  });
}

// ---------- Merge ----------

var qtMergeFiles = [];

function qtRenderMergeList() {
  qtRenderFileList("mergeList", qtMergeFiles, function(item){
    return item.file.name + (item.pages ? " — " + qtPagesLabel(item.pages) : "");
  }, qtRenderMergeList);
  $pdf("mergeBtn").disabled = qtMergeFiles.length < 2;
}

async function qtAddMergeFiles(files) {
  $pdf("mergeOut").innerHTML = "";
  qtPdfStatus("mergeStatus", qtL("Reading files..."));
  var errors = [];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { errors.push(qtL("“{name}” isn't a PDF.", { name: f.name })); continue; }
    try { var doc = await qtOpenPdf(f); qtMergeFiles.push({ file: f, pages: doc.getPageCount() }); }
    catch (e) { errors.push(e.message); }
  }
  qtRenderMergeList();
  if (errors.length) qtPdfStatus("mergeStatus", errors.join(" "), "error");
  else qtPdfStatus("mergeStatus", qtMergeFiles.length < 2 ? qtL("Add at least one more PDF to merge.") : qtL("Ready — reorder if needed, then merge."));
}

async function qtMerge() {
  var out = $pdf("mergeOut"); out.innerHTML = "";
  qtPdfStatus("mergeStatus", qtL("Merging..."));
  try {
    var PDFLib = await qtLoadPdfLib();
    var merged = await PDFLib.PDFDocument.create();
    for (var i = 0; i < qtMergeFiles.length; i++) {
      var src = await qtOpenPdf(qtMergeFiles[i].file);
      var pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach(function(p){ merged.addPage(p); });
    }
    var bytes = await merged.save();
    qtDownloadLink(out, bytes, "merged.pdf", qtL("Download merged PDF"));
    qtPdfStatus("mergeStatus", qtL("Merged {files} files into {pages} ✓", { files: qtMergeFiles.length, pages: qtPagesLabel(merged.getPageCount()) }), "success");
    qtTrack("pdf_merge");
  } catch (e) { qtPdfStatus("mergeStatus", e.message, "error"); }
}

// ---------- Extract / remove pages ----------

var qtPagesFile = null, qtPagesCount = 0;

async function qtLoadPagesFile(file) {
  $pdf("pagesOut").innerHTML = "";
  try {
    var doc = await qtOpenPdf(file);
    qtPagesFile = file; qtPagesCount = doc.getPageCount();
    $pdf("pagesControls").hidden = false;
    qtPdfStatus("pagesStatus", qtL("“{name}” has {pages}.", { name: file.name, pages: qtPagesLabel(qtPagesCount) }));
  } catch (e) { qtPagesFile = null; $pdf("pagesControls").hidden = true; qtPdfStatus("pagesStatus", e.message, "error"); }
}

async function qtRunPages() {
  var out = $pdf("pagesOut"); out.innerHTML = "";
  var mode = $pdf("pagesMode").value;
  try {
    var PDFLib = await qtLoadPdfLib();
    var src = await qtOpenPdf(qtPagesFile);
    var base = qtBaseName(qtPagesFile.name);
    if (mode === "split") {
      for (var i = 0; i < qtPagesCount; i++) {
        var one = await PDFLib.PDFDocument.create();
        var pg = await one.copyPages(src, [i]);
        one.addPage(pg[0]);
        qtDownloadLink(out, await one.save(), base + "-page-" + (i + 1) + ".pdf", qtL("Page {n}", { n: i + 1 }));
      }
      qtPdfStatus("pagesStatus", qtL("Split into {n} files ✓", { n: qtPagesCount }), "success");
      qtTrack("pdf_split");
      return;
    }
    var picked = qtParseRanges($pdf("pagesRange").value, qtPagesCount);
    var keep = mode === "remove"
      ? src.getPageIndices().filter(function(i){ return picked.indexOf(i) === -1; })
      : picked;
    if (!keep.length) throw new Error(qtL("That would leave no pages."));
    var doc = await PDFLib.PDFDocument.create();
    var pages = await doc.copyPages(src, keep);
    pages.forEach(function(p){ doc.addPage(p); });
    qtDownloadLink(out, await doc.save(), base + (mode === "remove" ? "-trimmed" : "-extract") + ".pdf", qtL("Download PDF"));
    qtPdfStatus("pagesStatus", mode === "remove"
      ? qtL("Removed {removed}, kept {kept} ✓", { removed: qtPagesLabel(picked.length), kept: qtPagesLabel(keep.length) })
      : qtL("Extracted {kept} ✓", { kept: qtPagesLabel(keep.length) }), "success");
    qtTrack(mode === "remove" ? "pdf_remove_pages" : "pdf_extract");
  } catch (e) { qtPdfStatus("pagesStatus", e.message, "error"); }
}

// ---------- Rotate ----------

var qtRotateFile = null, qtRotateCount = 0;

async function qtLoadRotateFile(file) {
  $pdf("rotateOut").innerHTML = "";
  try {
    var doc = await qtOpenPdf(file);
    qtRotateFile = file; qtRotateCount = doc.getPageCount();
    $pdf("rotateControls").hidden = false;
    qtPdfStatus("rotateStatus", qtL("“{name}” has {pages}.", { name: file.name, pages: qtPagesLabel(qtRotateCount) }));
  } catch (e) { qtRotateFile = null; $pdf("rotateControls").hidden = true; qtPdfStatus("rotateStatus", e.message, "error"); }
}

async function qtRunRotate() {
  var out = $pdf("rotateOut"); out.innerHTML = "";
  try {
    var PDFLib = await qtLoadPdfLib();
    var doc = await qtOpenPdf(qtRotateFile);
    var angle = Number($pdf("rotateAngle").value);
    var rangeText = $pdf("rotateRange").value.trim();
    var targets = rangeText ? qtParseRanges(rangeText, qtRotateCount) : doc.getPageIndices();
    targets.forEach(function(i) {
      var page = doc.getPage(i);
      page.setRotation(PDFLib.degrees((page.getRotation().angle + angle) % 360));
    });
    qtDownloadLink(out, await doc.save(), qtBaseName(qtRotateFile.name) + "-rotated.pdf", qtL("Download rotated PDF"));
    qtPdfStatus("rotateStatus", qtL("Rotated {pages} by {angle}° ✓", { pages: qtPagesLabel(targets.length), angle: angle }), "success");
    qtTrack("pdf_rotate");
  } catch (e) { qtPdfStatus("rotateStatus", e.message, "error"); }
}

// ---------- Images → PDF ----------

var qtImgFiles = [];
var QT_PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] };

function qtRenderImgList() {
  qtRenderFileList("imgList", qtImgFiles, function(f){ return f.name; }, qtRenderImgList);
  $pdf("imgBtn").disabled = !qtImgFiles.length;
}

// JPG and PNG embed directly; anything else the browser can decode becomes a JPEG first.
async function qtEmbedImage(doc, file) {
  var bytes = await qtReadBytes(file);
  if (/jpe?g$/i.test(file.type)) return doc.embedJpg(bytes);
  if (/png$/i.test(file.type)) return doc.embedPng(bytes);
  var src = await qtLoadImageSource(file);
  var c = document.createElement("canvas");
  c.width = src.width; c.height = src.height;
  var ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, 0, 0);
  var blob = await new Promise(function(r){ c.toBlob(r, "image/jpeg", 0.9); });
  return doc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
}

async function qtRunImages() {
  var out = $pdf("imgOut"); out.innerHTML = "";
  qtPdfStatus("imgStatus", qtL("Building PDF..."));
  try {
    var PDFLib = await qtLoadPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var sizeKey = $pdf("imgPageSize").value;
    var margin = Number($pdf("imgMargin").value) * 2.835; // mm → pt
    for (var i = 0; i < qtImgFiles.length; i++) {
      var img;
      try { img = await qtEmbedImage(doc, qtImgFiles[i]); }
      catch (e) { throw new Error(qtL("Couldn't read “{name}” as an image.", { name: qtImgFiles[i].name })); }
      var pw, ph;
      if (sizeKey === "fit") { pw = img.width + margin * 2; ph = img.height + margin * 2; }
      else {
        pw = QT_PAGE_SIZES[sizeKey][0]; ph = QT_PAGE_SIZES[sizeKey][1];
        if (img.width > img.height) { var t = pw; pw = ph; ph = t; } // landscape image → landscape page
      }
      var page = doc.addPage([pw, ph]);
      var scale = Math.min((pw - margin * 2) / img.width, (ph - margin * 2) / img.height, sizeKey === "fit" ? 1 : Infinity);
      var w = img.width * scale, h = img.height * scale;
      page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    }
    qtDownloadLink(out, await doc.save(), "images.pdf", qtL("Download PDF"));
    qtPdfStatus("imgStatus", qtL("Created a PDF with {pages} ✓", { pages: qtPagesLabel(qtImgFiles.length) }), "success");
    qtTrack("pdf_from_images");
  } catch (e) { qtPdfStatus("imgStatus", e.message, "error"); }
}

// ---------- Wiring ----------

function qtWireDrop(zoneId, inputId, onFiles) {
  var dz = $pdf(zoneId), input = $pdf(inputId);
  dz.addEventListener("click", function(){ input.click(); });
  dz.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
  ["dragover", "dragenter"].forEach(function(t){ dz.addEventListener(t, function(e){ e.preventDefault(); dz.classList.add("drag"); }); });
  ["dragleave", "drop"].forEach(function(t){ dz.addEventListener(t, function(e){ e.preventDefault(); dz.classList.remove("drag"); }); });
  dz.addEventListener("drop", function(e){ if (e.dataTransfer.files.length) onFiles([].slice.call(e.dataTransfer.files)); });
  input.addEventListener("change", function(){ if (input.files.length) onFiles([].slice.call(input.files)); input.value = ""; });
}

function qtShowPdfTab(name) {
  document.querySelectorAll("#pdfTabs .chip").forEach(function(b){
    var on = b.getAttribute("data-tab") === name;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll(".pdf-panel").forEach(function(p){ p.hidden = p.id !== "panel-" + name; });
}

document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll("#pdfTabs .chip").forEach(function(b){
    b.addEventListener("click", function(){ qtShowPdfTab(b.getAttribute("data-tab")); history.replaceState(null, "", "#" + b.getAttribute("data-tab")); });
  });
  var hash = location.hash.replace("#", "");
  if (["merge", "pages", "rotate", "images"].indexOf(hash) !== -1) qtShowPdfTab(hash);

  qtWireDrop("mergeDz", "mergeFiles", qtAddMergeFiles);
  $pdf("mergeBtn").addEventListener("click", qtMerge);

  qtWireDrop("pagesDz", "pagesFile", function(files){ qtLoadPagesFile(files[0]); });
  $pdf("pagesMode").addEventListener("change", function(){ $pdf("pagesRangeWrap").hidden = $pdf("pagesMode").value === "split"; });
  $pdf("pagesBtn").addEventListener("click", qtRunPages);

  qtWireDrop("rotateDz", "rotateFile", function(files){ qtLoadRotateFile(files[0]); });
  $pdf("rotateBtn").addEventListener("click", qtRunRotate);

  qtWireDrop("imgDz", "imgFiles", function(files){
    files.forEach(function(f){ if (/^image\//.test(f.type)) qtImgFiles.push(f); });
    $pdf("imgOut").innerHTML = "";
    qtRenderImgList();
    qtPdfStatus("imgStatus", qtImgFiles.length ? qtL("Ready — reorder if needed, then create the PDF.") : qtL("Choose JPG, PNG or WebP images."), qtImgFiles.length ? "" : "error");
  });
  $pdf("imgBtn").addEventListener("click", qtRunImages);
});
