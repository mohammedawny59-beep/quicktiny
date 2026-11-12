// Daily health check for every third-party file the site loads at runtime (AI models + CDN libraries).
// If one disappears or moves, the scheduled GitHub Action fails and GitHub emails the repo owner —
// before visitors hit a broken tool.  usage: node tools/check_assets.mjs
const HF = (id, rev, files) => files.map((f) => `https://huggingface.co/${id}/resolve/${rev}/${f}`);
const WHISPER_FILES = ["config.json", "generation_config.json", "preprocessor_config.json", "tokenizer.json", "tokenizer_config.json",
  "onnx/encoder_model_quantized.onnx", "onnx/decoder_model_merged_quantized.onnx"];
const J = "https://cdn.jsdelivr.net/npm/";
const ASSETS = [
  // Auto Subtitles + AI Clip Maker (asr-worker.js) — must match MODELS there
  ...HF("onnx-community/whisper-base_timestamped", "608c49e61301901684bc36cac8f74b95ff6b5a8e", WHISPER_FILES),
  ...HF("onnx-community/whisper-small_timestamped", "65caa70f294b46e1c33ff820aae6b16d048ab818", WHISPER_FILES),
  J + "@huggingface/transformers@4.3.2/dist/transformers.min.js",
  J + "onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/ort-wasm-simd-threaded.asyncify.mjs",
  J + "onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/ort-wasm-simd-threaded.asyncify.wasm",
  // AI Clip Maker face tracking
  J + "@mediapipe/tasks-vision@1.1.1/vision_bundle.mjs",
  J + "@mediapipe/tasks-vision@1.1.1/wasm/vision_wasm_internal.js",
  J + "@mediapipe/tasks-vision@1.1.1/wasm/vision_wasm_internal.wasm",
  // background removal (product photo studio, paper studio, thumbnail maker)
  J + "onnxruntime-web@1.30.0/dist/ort.wasm.min.mjs",
  J + "onnxruntime-web@1.30.0/dist/ort-wasm-simd-threaded.wasm",
  // PDF tools
  J + "pdf-lib@1.17.1/dist/pdf-lib.min.js"
];
async function check(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { Range: "bytes=0-0" }, redirect: "follow" });
      if (r.status === 200 || r.status === 206) { await r.body?.cancel?.(); return { url, ok: true }; }
      if (attempt === 3) return { url, ok: false, why: "HTTP " + r.status };
    } catch (e) { if (attempt === 3) return { url, ok: false, why: e.message }; }
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}
const results = [];
for (const u of ASSETS) results.push(await check(u));
const bad = results.filter((r) => !r.ok);
for (const r of results) console.log((r.ok ? "ok   " : "FAIL ") + r.url + (r.ok ? "" : "  ← " + r.why));
console.log(`\n${results.length - bad.length}/${results.length} external assets reachable`);
if (bad.length) process.exit(1);
