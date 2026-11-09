// QuickTiny Product Photo Studio — everything runs in the browser.
// Optional AI background removal uses U²-Net-p (Apache-2.0, ~4.6 MB, served from
// /models) on ONNX Runtime Web's CPU/WASM backend, so it works on any device.
// It is loaded only when the user turns it on. Images are never uploaded.

var QT_ORT_VERSION = "1.30.0";
var QT_ORT_BASE = "https://cdn.jsdelivr.net/npm/onnxruntime-web@" + QT_ORT_VERSION + "/dist/";
var QT_BG_MODEL_URL = "/models/u2netp.onnx";
var QT_BG_SIZE = 320; // U²-Net-p input resolution

// Output is always kept under Shopify's verified 20 MB / 25 MP product-image limits.
var QT_MAX_BYTES = 19 * 1024 * 1024;
var QT_PRESETS = {
  shopify:   { w: 2048, h: 2048 },
  amazon:    { w: 2000, h: 2000, forceWhite: true },
  landscape: { w: 2400, h: 1800 },
  instagram: { w: 1080, h: 1080 },
  original:  { w: 0, h: 0 }
};

var qtStudio = {
  file: null,
  source: null,        // ImageBitmap or <img> of the original
  cutout: null,        // canvas with transparent background (after AI)
  ort: null,
  session: null,
  busy: false
};

function qtStudioEl(id) { return document.getElementById(id); }

function qtStudioStatus(text, kind) {
  var el = qtStudioEl("studioStatus");
  el.textContent = text || "";
  el.className = "result" + (kind ? " " + kind : "");
}

function qtStudioProgress(pct, label) {
  var wrap = qtStudioEl("studioProgress");
  if (pct == null) { wrap.hidden = true; return; }
  wrap.hidden = false;
  qtStudioEl("studioProgressBar").style.width = Math.max(2, Math.min(100, pct)) + "%";
  qtStudioEl("studioProgressLabel").textContent = label || "";
}

// ---------- AI background removal (lazy) ----------

// Fetch with a progress callback (the browser HTTP cache keeps it for next time).
async function qtFetchWithProgress(url, onProgress) {
  var res = await fetch(url);
  if (!res.ok) throw new Error("Could not download the model (" + res.status + ")");
  var total = Number(res.headers.get("Content-Length")) || 0;
  if (!res.body || !total) return new Uint8Array(await res.arrayBuffer());
  var reader = res.body.getReader(), chunks = [], loaded = 0;
  for (;;) {
    var step = await reader.read();
    if (step.done) break;
    chunks.push(step.value); loaded += step.value.length;
    onProgress(loaded, total);
  }
  var out = new Uint8Array(loaded), off = 0;
  chunks.forEach(function(c){ out.set(c, off); off += c.length; });
  return out;
}

async function qtLoadBgModel() {
  if (qtStudio.session) return;
  qtStudio.ort = await import(QT_ORT_BASE + "ort.wasm.min.mjs");
  qtStudio.ort.env.wasm.wasmPaths = QT_ORT_BASE;
  // Threads need cross-origin isolation, which this site doesn't enable.
  qtStudio.ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;

  var bytes = await qtFetchWithProgress(QT_BG_MODEL_URL, function(loaded, total){
    qtStudioProgress(loaded / total * 100, "Downloading the AI model once (" + (loaded / 1e6).toFixed(1) + " / " + (total / 1e6).toFixed(1) + " MB)");
  });
  qtStudioProgress(100, "Starting the AI engine...");
  qtStudio.session = await qtStudio.ort.InferenceSession.create(bytes, { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
  qtStudioProgress(null);
}

// Returns a canvas the size of the source, with the background made transparent.
async function qtRemoveBackground(source) {
  var w = source.width, h = source.height, S = QT_BG_SIZE;

  // 1. Pre-process like U²-Net's reference code: resize to 320×320, scale by the
  //    image max, then ImageNet mean/std normalisation, CHW float32.
  var small = document.createElement("canvas");
  small.width = S; small.height = S;
  var sctx = small.getContext("2d", { willReadFrequently: true });
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(source, 0, 0, S, S);
  var px = sctx.getImageData(0, 0, S, S).data;
  var max = 1;
  for (var i = 0; i < px.length; i += 4) { if (px[i] > max) max = px[i]; if (px[i+1] > max) max = px[i+1]; if (px[i+2] > max) max = px[i+2]; }
  var mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225];
  var input = new Float32Array(3 * S * S);
  for (var p = 0, k = 0; p < S * S; p++, k += 4) {
    input[p]             = (px[k]     / max - mean[0]) / std[0];
    input[S * S + p]     = (px[k + 1] / max - mean[1]) / std[1];
    input[2 * S * S + p] = (px[k + 2] / max - mean[2]) / std[2];
  }

  // 2. Run the model; the first output is the fused saliency map.
  var feeds = {};
  feeds[qtStudio.session.inputNames[0]] = new qtStudio.ort.Tensor("float32", input, [1, 3, S, S]);
  var results = await qtStudio.session.run(feeds);
  var pred = results[qtStudio.session.outputNames[0]].data;

  // 3. Min-max normalise, firm up soft edges a little, and write as an alpha mask.
  var lo = Infinity, hi = -Infinity;
  for (var q = 0; q < pred.length; q++) { if (pred[q] < lo) lo = pred[q]; if (pred[q] > hi) hi = pred[q]; }
  var range = hi - lo || 1;
  var maskData = sctx.createImageData(S, S);
  for (var r = 0, m = 0; r < pred.length; r++, m += 4) {
    var a = (pred[r] - lo) / range;
    a = Math.min(1, Math.max(0, (a - 0.12) / 0.76)); // remove faint halo, keep edges smooth
    a = a * a * (3 - 2 * a);                          // smoothstep
    maskData.data[m + 3] = Math.round(a * 255);
  }
  sctx.putImageData(maskData, 0, 0);

  // 4. Upscale the mask to full size and apply it to the original pixels.
  var out = document.createElement("canvas");
  out.width = w; out.height = h;
  var octx = out.getContext("2d", { willReadFrequently: true });
  octx.imageSmoothingQuality = "high";
  octx.drawImage(small, 0, 0, w, h);
  var maskFull = octx.getImageData(0, 0, w, h).data;
  octx.clearRect(0, 0, w, h);
  octx.drawImage(source, 0, 0);
  var img = octx.getImageData(0, 0, w, h);
  for (var t = 3; t < img.data.length; t += 4) img.data[t] = maskFull[t];
  octx.putImageData(img, 0, 0);
  return out;
}

// ---------- Composition ----------

// Bounding box of pixels with alpha above a threshold (the product).
function qtAlphaBounds(canvas) {
  var w = canvas.width, h = canvas.height;
  var data = canvas.getContext("2d").getImageData(0, 0, w, h).data;
  var minX = w, minY = h, maxX = -1, maxY = -1;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 24) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: w, h: h };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function qtStudioOptions() {
  var preset = QT_PRESETS[qtStudioEl("studioPreset").value];
  var bgMode = qtStudioEl("studioBg").value; // white | transparent | color
  if (preset.forceWhite) bgMode = "white";
  return {
    preset: preset,
    bgMode: bgMode,
    color: qtStudioEl("studioColor").value,
    padding: Number(qtStudioEl("studioPadding").value) / 100,
    format: qtStudioEl("studioFormat").value,
    shadow: qtStudioEl("studioShadow").checked
  };
}

function qtCompose(opts) {
  var src = qtStudio.cutout || qtStudio.source;
  var box = qtStudio.cutout ? qtAlphaBounds(qtStudio.cutout) : { x: 0, y: 0, w: src.width, h: src.height };

  var outW = opts.preset.w, outH = opts.preset.h;
  if (!outW) {
    // Original proportions: keep the subject's aspect ratio, cap at 24 MP.
    var pad = 1 + opts.padding * 2;
    outW = Math.round(box.w * pad); outH = Math.round(box.h * pad);
    var maxPx = 24000000;
    if (outW * outH > maxPx) { var s = Math.sqrt(maxPx / (outW * outH)); outW = Math.floor(outW * s); outH = Math.floor(outH * s); }
  }

  var canvas = document.createElement("canvas");
  canvas.width = outW; canvas.height = outH;
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  var transparent = opts.bgMode === "transparent" && opts.format !== "jpeg";
  if (!transparent) {
    ctx.fillStyle = opts.bgMode === "color" ? opts.color : "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
  }

  var availW = outW * (1 - opts.padding * 2), availH = outH * (1 - opts.padding * 2);
  var scale = Math.min(availW / box.w, availH / box.h);
  var dw = box.w * scale, dh = box.h * scale;
  var dx = (outW - dw) / 2, dy = (outH - dh) / 2;

  if (opts.shadow && qtStudio.cutout) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.filter = "blur(" + Math.round(outW / 90) + "px)";
    ctx.beginPath();
    ctx.ellipse(outW / 2, dy + dh, dw * 0.42, Math.max(6, dh * 0.035), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.drawImage(src, box.x, box.y, box.w, box.h, dx, dy, dw, dh);
  canvas.qtUpscale = scale; // > 1 means the product was enlarged
  return canvas;
}

function qtCanvasToBlob(canvas, type, quality) {
  return new Promise(function(resolve){ canvas.toBlob(resolve, type, quality); });
}

// Encode, lowering quality until it fits the preset's size limit.
async function qtEncode(canvas, format, maxBytes) {
  var type = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
  if (type === "image/png") return await qtCanvasToBlob(canvas, type);
  var q = 0.9, blob;
  do {
    blob = await qtCanvasToBlob(canvas, type, q);
    q = Math.round((q - 0.08) * 100) / 100;
  } while (blob && blob.size > maxBytes && q >= 0.45);
  return blob;
}

// ---------- UI ----------

var qtLastUrl = null;
var qtRenderSeq = 0;

async function qtStudioRender() {
  if (!qtStudio.source || qtStudio.busy) return;
  var seq = ++qtRenderSeq;
  var opts = qtStudioOptions();
  qtStudioEl("studioColorWrap").hidden = opts.bgMode !== "color";
  qtStudioEl("studioBg").disabled = !!opts.preset.forceWhite;

  var canvas = qtCompose(opts);
  var blob = await qtEncode(canvas, opts.format, QT_MAX_BYTES);
  if (seq !== qtRenderSeq) return; // a newer render started while this one was encoding
  if (!blob) { qtStudioStatus("Your browser couldn't encode that format. Try JPG.", "error"); return; }

  if (qtLastUrl) URL.revokeObjectURL(qtLastUrl);
  qtLastUrl = URL.createObjectURL(blob);
  var preview = qtStudioEl("studioPreview");
  preview.src = qtLastUrl;
  preview.hidden = false;
  preview.classList.toggle("checker", opts.bgMode === "transparent" && opts.format !== "jpeg");

  var ext = opts.format === "jpeg" ? "jpg" : opts.format;
  var a = qtStudioEl("studioDownload");
  a.href = qtLastUrl;
  a.download = "quicktiny-" + qtStudio.file.name.replace(/\.[^.]+$/, "") + "-" + qtStudioEl("studioPreset").value + "." + ext;
  a.hidden = false;

  var mp = canvas.width * canvas.height;
  var fitsShopify = mp <= 25000000 && blob.size <= 20 * 1024 * 1024;
  qtStudioEl("studioInfo").innerHTML =
    "<strong>" + canvas.width + " × " + canvas.height + "</strong> · " + qtFormatBytes(blob.size) + " · " + ext.toUpperCase() +
    "<br>" + (fitsShopify ? "✓ Within Shopify's product-image limits (25 MP, 20 MB)" : "⚠ Over Shopify's product-image limits — try JPG or WebP.") +
    (canvas.qtUpscale > 1.6 ? "<br>⚠ Your original photo is small, so the product was enlarged " + canvas.qtUpscale.toFixed(1) + "× and may look soft. A higher-resolution photo will be sharper." : "");
}

async function qtStudioLoadFile(file) {
  if (!file || !file.type || file.type.indexOf("image/") !== 0) {
    qtStudioStatus("Please choose an image file (JPG, PNG, WebP).", "error");
    return;
  }
  qtStudio.file = file;
  qtStudio.cutout = null;
  qtStudioStatus("Reading image...");
  try {
    qtStudio.source = await qtLoadImageSource(file);
  } catch (e) {
    qtStudioStatus("Could not read that image. Try a different file.", "error");
    return;
  }
  qtStudioEl("studioControls").hidden = false;
  qtStudioStatus("");
  if (qtStudioEl("studioRemoveBg").checked) await qtStudioRunRemoval();
  else await qtStudioRender();
}

async function qtStudioRunRemoval() {
  if (!qtStudio.source) return;
  qtStudio.busy = true;
  qtStudioEl("studioRemoveBg").disabled = true;
  try {
    if (!qtStudio.session) {
      qtStudioStatus("Loading the background-removal model (first time only)...");
      await qtLoadBgModel();
    }
    qtStudioStatus("Removing the background on your device...");
    var t0 = performance.now();
    qtStudio.cutout = await qtRemoveBackground(qtStudio.source);
    qtStudioStatus("Background removed in " + ((performance.now() - t0) / 1000).toFixed(1) + "s — on your device, nothing uploaded.", "success");
    qtTrack("studio_bg_removed");
  } catch (e) {
    console.error(e);
    qtStudio.cutout = null;
    qtStudioEl("studioRemoveBg").checked = false;
    qtStudioProgress(null);
    qtStudioStatus("Background removal isn't available in this browser" + (e && e.message ? " (" + e.message + ")" : "") + ". You can still frame and resize the photo.", "error");
  } finally {
    qtStudio.busy = false;
    qtStudioEl("studioRemoveBg").disabled = false;
    await qtStudioRender();
  }
}

document.addEventListener("DOMContentLoaded", function() {
  var dz = qtStudioEl("studioDz"), input = qtStudioEl("studioFile");
  dz.addEventListener("click", function(){ input.click(); });
  dz.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " ") input.click(); });
  ["dragover", "dragenter"].forEach(function(t){ dz.addEventListener(t, function(e){ e.preventDefault(); dz.classList.add("drag"); }); });
  ["dragleave", "drop"].forEach(function(t){ dz.addEventListener(t, function(e){ e.preventDefault(); dz.classList.remove("drag"); }); });
  dz.addEventListener("drop", function(e){ if (e.dataTransfer.files[0]) qtStudioLoadFile(e.dataTransfer.files[0]); });
  input.addEventListener("change", function(){ if (input.files[0]) qtStudioLoadFile(input.files[0]); });

  qtStudioEl("studioRemoveBg").addEventListener("change", function(e){
    if (e.target.checked) qtStudioRunRemoval();
    else { qtStudio.cutout = null; qtStudioStatus(""); qtStudioRender(); }
  });
  ["studioPreset", "studioBg", "studioColor", "studioFormat", "studioShadow"].forEach(function(id){
    qtStudioEl(id).addEventListener("change", qtStudioRender);
  });
  var pad = qtStudioEl("studioPadding");
  pad.addEventListener("input", function(){ qtStudioEl("studioPaddingVal").textContent = pad.value + "%"; });
  pad.addEventListener("change", qtStudioRender);
});
