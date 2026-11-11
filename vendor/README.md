# Vendored libraries

Self-hosted so tool pages don't depend on a third-party CDN.

| File | Package | Version | License |
| --- | --- | --- | --- |
| `qrcode-generator.js` | [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase | 1.4.4 | MIT |
| `jsQR.js` | [jsQR](https://github.com/cozmo/jsQR) | 1.4.0 | Apache-2.0 |

## libheif (HEIC/HEIF decoder) — `vendor/libheif/`
- `libheif.js` + `libheif.wasm` from [libheif-js](https://github.com/catdad-experiments/libheif-js) 1.19.8 (Emscripten build of [libheif](https://github.com/strukturag/libheif)).
- License: **LGPL-3.0** (see `vendor/libheif/LICENSE`). Shipped unmodified as separate files and loaded on demand by `/image-converter.js`, so it can be replaced with any compatible build.

## pdf.js — `vendor/pdfjs/`
- **Legacy** build of [pdfjs-dist](https://github.com/mozilla/pdf.js) 5.7.284 (`pdf.min.mjs`, `pdf.worker.min.mjs`) — the legacy build includes polyfills, so it also works in browsers that are a few versions old (the modern build needs `Uint8Array.prototype.toHex`).
- Plus `wasm/` (OpenJPEG, JBIG2, QCMS decoders and their no-wasm fallbacks), `standard_fonts/` and `iccs/`. CMaps for CJK fonts are not included.
- License: Apache-2.0 (`vendor/pdfjs/LICENSE`); bundled decoders keep their own licenses in `vendor/pdfjs/wasm/LICENSE_*`.
- Used by `/pdf-render.js` for PDF → images and Compress PDF; loaded only when those tabs are used.

## Tesseract OCR — `vendor/tesseract/`
- `tesseract.min.js` + `worker.min.js` from [tesseract.js](https://github.com/naptha/tesseract.js) 6.0.1, and `tesseract-core-lstm.wasm.js` / `tesseract-core-simd-lstm.wasm.js` from tesseract.js-core 6.0.0 (Emscripten build of [Tesseract](https://github.com/tesseract-ocr/tesseract)). License: Apache-2.0 (`LICENSE-tesseract.js.txt`).
- `lang/ara.traineddata.gz`, `lang/eng.traineddata.gz`: `4.0.0_best_int` models from [@tesseract.js-data](https://github.com/naptha/tessdata) (tessdata, Apache-2.0).
- Used by `/ocr.js` on the Image to Text pages; loaded only there. The worker needs `'wasm-unsafe-eval'`, set for `/vendor/tesseract/(.*)` in `vercel.json`.

## mp4-muxer — `vendor/mp4-muxer.js`
- [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) 5.1.3 (MIT), UMD build. Used by `/paper-studio.js` to wrap WebCodecs H.264 frames into an MP4 file in the browser.
