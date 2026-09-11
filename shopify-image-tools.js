// QuickTiny Shopify image-limit checking, resizing, and compression.
// Limits verified directly against the live Shopify Admin product-image
// uploader (2026-09-11): >25 megapixels rejected ("Exceeds 25 megapixels
// (width x height). Resize to smaller dimensions and try again."),
// exactly 25.0 MP accepted; >20 MB rejected independently of megapixels
// ("Exceeds maximum image size of 20 MB.").

var SHOPIFY_MAX_MEGAPIXELS = 25000000;
var SHOPIFY_MAX_BYTES = 20 * 1024 * 1024;
var SHOPIFY_TARGET_MEGAPIXELS = 24000000; // safety margin under the verified 25MP limit
var SHOPIFY_TARGET_BYTES = 19 * 1024 * 1024; // safety margin under the verified 20MB limit

function qtShopifyCheck(width, height, sizeBytes) {
  var megapixels = width * height;
  var dimensionFail = megapixels > SHOPIFY_MAX_MEGAPIXELS;
  var sizeFail = sizeBytes > SHOPIFY_MAX_BYTES;
  var reason = null;
  if (dimensionFail && sizeFail) reason = "both";
  else if (dimensionFail) reason = "megapixels";
  else if (sizeFail) reason = "filesize";
  return {
    megapixels: megapixels,
    dimensionFail: dimensionFail,
    sizeFail: sizeFail,
    passes: !dimensionFail && !sizeFail,
    reason: reason
  };
}

function qtShopifyTargetDimensions(width, height, maxPixels) {
  var currentPixels = width * height;
  if (currentPixels <= maxPixels) return { width: width, height: height };
  var scale = Math.sqrt(maxPixels / currentPixels);
  var newWidth = Math.max(1, Math.floor(width * scale));
  var newHeight = Math.max(1, Math.floor(height * scale));
  return { width: newWidth, height: newHeight };
}

function qtLoadImageElement(file) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { reject(new Error("Could not read that image.")); };
    img.src = URL.createObjectURL(file);
  });
}

// Prefers createImageBitmap with imageOrientation:"from-image" so photos
// carrying EXIF rotation (most phone cameras) come out right-side-up.
// Falls back to a plain <img> element on browsers that don't support it.
function qtLoadImageSource(file) {
  if (window.createImageBitmap) {
    return createImageBitmap(file, { imageOrientation: "from-image" }).catch(function () {
      return qtLoadImageElement(file);
    });
  }
  return qtLoadImageElement(file);
}

function qtDrawToCanvas(source, width, height) {
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

// Iteratively lowers JPEG quality until the blob fits under maxBytes,
// stopping at a quality floor so images never degrade past usable.
function qtCompressUnderBytes(canvas, maxBytes, startQuality) {
  return new Promise(function (resolve) {
    var quality = startQuality || 0.85;
    function attempt() {
      canvas.toBlob(function (blob) {
        if (!blob) { resolve(null); return; }
        if (blob.size <= maxBytes || quality <= 0.4) {
          resolve(blob);
        } else {
          quality = Math.round((quality - 0.1) * 100) / 100;
          attempt();
        }
      }, "image/jpeg", quality);
    }
    attempt();
  });
}

// Full check -> fix pipeline for one file. Only resizes when the megapixel
// limit is actually exceeded, and only reports "resized" when it truly
// changed the output dimensions -- never claims a dimension fix that didn't
// happen.
async function qtProcessForShopify(file) {
  var source = await qtLoadImageSource(file);
  var originalWidth = source.width;
  var originalHeight = source.height;
  var originalSizeBytes = file.size;
  var before = qtShopifyCheck(originalWidth, originalHeight, originalSizeBytes);

  var result = {
    fileName: file.name,
    originalWidth: originalWidth,
    originalHeight: originalHeight,
    originalMegapixels: before.megapixels,
    originalSizeBytes: originalSizeBytes,
    passedOriginally: before.passes,
    originalReason: before.reason,
    resized: false,
    compressed: false,
    finalWidth: originalWidth,
    finalHeight: originalHeight,
    finalMegapixels: before.megapixels,
    blob: null,
    finalSizeBytes: originalSizeBytes,
    finalPasses: before.passes,
    finalReason: null
  };

  if (before.passes) {
    if (source.close) source.close();
    return result;
  }

  var targetDims = before.dimensionFail
    ? qtShopifyTargetDimensions(originalWidth, originalHeight, SHOPIFY_TARGET_MEGAPIXELS)
    : { width: originalWidth, height: originalHeight };

  result.resized = targetDims.width !== originalWidth || targetDims.height !== originalHeight;

  var canvas = qtDrawToCanvas(source, targetDims.width, targetDims.height);
  if (source.close) source.close();

  var blob = await qtCompressUnderBytes(canvas, SHOPIFY_TARGET_BYTES, 0.85);
  result.compressed = !!blob && blob.size < originalSizeBytes;

  result.finalWidth = targetDims.width;
  result.finalHeight = targetDims.height;
  result.finalMegapixels = targetDims.width * targetDims.height;
  result.blob = blob;
  result.finalSizeBytes = blob ? blob.size : originalSizeBytes;

  var after = qtShopifyCheck(result.finalWidth, result.finalHeight, result.finalSizeBytes);
  result.finalPasses = after.passes;
  result.finalReason = after.reason;

  return result;
}

function qtFormatBytes(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  return Math.round(bytes / 1024) + " KB";
}

function qtFormatMP(pixels) {
  return (pixels / 1000000).toFixed(2) + " MP";
}
