// QuickTiny speech-to-text worker: Whisper (via transformers.js) running entirely on the device.
// The model is downloaded once from Hugging Face and cached by the browser; audio never leaves the device.
// in:  {type:"run", audio: Float32Array (16 kHz mono), model: "base"|"small", language: "arabic"|"english"|null}
// out: {type:"progress", file, loaded, total} | {type:"status", stage} | {type:"done", words:[{w,start,end}], text} | {type:"error", message}
var TFJS = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/dist/transformers.min.js";
var MODELS = { base: "onnx-community/whisper-base_timestamped", small: "onnx-community/whisper-small_timestamped" };
var lib = null, pipes = {};

async function getPipe(model) {
  if (!lib) lib = await import(TFJS);
  if (!pipes[model]) {
    pipes[model] = lib.pipeline("automatic-speech-recognition", MODELS[model] || MODELS.base, {
      dtype: { encoder_model: "q8", decoder_model_merged: "q8" },
      device: "wasm",
      progress_callback: function (p) { if (p && p.status === "progress") postMessage({ type: "progress", file: p.file, loaded: p.loaded, total: p.total }); }
    });
  }
  return pipes[model];
}

// Whisper word chunks -> [{w, start, end}], merging sub-word pieces that come without a leading space.
function qtAsrWords(chunks) {
  var out = [];
  (chunks || []).forEach(function (c) {
    var raw = String(c.text || ""), txt = raw.trim(), ts = c.timestamp || [];
    if (!txt) return;
    var s = +ts[0], e = ts[1] == null ? s + .3 : +ts[1];
    if (out.length && !/^\s/.test(raw)) { out[out.length - 1].w += txt; out[out.length - 1].end = e; return; }
    out.push({ w: txt, start: s, end: Math.max(e, s + .05) });
  });
  return out;
}

if (typeof self !== "undefined") self.onmessage = async function (ev) {
  var d = ev.data || {};
  if (d.type !== "run") return;
  try {
    postMessage({ type: "status", stage: "load" });
    var asr = await getPipe(d.model);
    postMessage({ type: "status", stage: "run" });
    var opts = { return_timestamps: "word", chunk_length_s: 30, stride_length_s: 5, task: "transcribe" };
    if (d.language) opts.language = d.language;
    var r = await asr(d.audio, opts);
    postMessage({ type: "done", text: r.text, words: qtAsrWords(r.chunks) });
  } catch (e) {
    postMessage({ type: "error", message: String(e && e.message || e) });
  }
};
if (typeof module !== "undefined") module.exports = { qtAsrWords: qtAsrWords };
