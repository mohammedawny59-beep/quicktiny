# Models

## u2netp.onnx

Used by [Product Photo Studio](../product-photo-studio.html) for in-browser background removal.

- Model: U²-Net-p (small variant of U²-Net), ONNX export as distributed by [rembg](https://github.com/danielgatis/rembg) (`v0.0.0` release, `u2netp.onnx`)
- SHA-256: `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`
- Original work: Xuebin Qin, Zichen Zhang, Chenyang Huang, Masood Dehghan, Osmar R. Zaiane, Martin Jagersand, *U²-Net: Going Deeper with Nested U-Structure for Salient Object Detection*, Pattern Recognition 2020 — https://github.com/xuebinqin/U-2-Net
- License: Apache License 2.0 — https://www.apache.org/licenses/LICENSE-2.0

The model runs entirely in the visitor's browser via ONNX Runtime Web; images are never uploaded.

## blaze_face_short_range.tflite

MediaPipe BlazeFace (short range) face detector, float16, from `storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/`. Apache License 2.0 (Google). Used by the AI Clip Maker to keep the speaker in frame when reframing to 9:16; runs on-device with `@mediapipe/tasks-vision` 1.1.1 from jsDelivr.
- SHA-256: `b4578f35940bf5a1a655214a1cce5cab13eba73c1297cd78e1a04c2380b0152f`
