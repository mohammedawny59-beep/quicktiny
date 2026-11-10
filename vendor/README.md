# Vendored libraries

Self-hosted so tool pages don't depend on a third-party CDN.

| File | Package | Version | License |
| --- | --- | --- | --- |
| `qrcode-generator.js` | [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase | 1.4.4 | MIT |
| `jsQR.js` | [jsQR](https://github.com/cozmo/jsQR) | 1.4.0 | Apache-2.0 |

## libheif (HEIC/HEIF decoder) — `vendor/libheif/`
- `libheif.js` + `libheif.wasm` from [libheif-js](https://github.com/catdad-experiments/libheif-js) 1.19.8 (Emscripten build of [libheif](https://github.com/strukturag/libheif)).
- License: **LGPL-3.0** (see `vendor/libheif/LICENSE`). Shipped unmodified as separate files and loaded on demand by `/image-converter.js`, so it can be replaced with any compatible build.
