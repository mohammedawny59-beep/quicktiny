// QuickTiny speech-to-text worker: Whisper (via transformers.js) running entirely on the device.
// The model is downloaded once from Hugging Face and cached by the browser; audio never leaves the device.
// in:  {type:"run", audio: Float32Array (16 kHz mono), model: "base"|"small", language: "arabic"|"english"|null}
// out: {type:"progress", file, loaded, total} | {type:"status", stage} | {type:"done", words:[{w,start,end}], text} | {type:"error", message}
var TFJS = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/dist/transformers.min.js";
// Models are pinned to an exact Hugging Face commit, so a change or re-upload upstream can never silently swap the
// files under us. tools/check_assets.mjs (daily CI) verifies these exact files are still downloadable.
var MODELS = {
  base: { id: "onnx-community/whisper-base_timestamped", rev: "608c49e61301901684bc36cac8f74b95ff6b5a8e" },
  small: { id: "onnx-community/whisper-small_timestamped", rev: "65caa70f294b46e1c33ff820aae6b16d048ab818" }
};
var lib = null, pipes = {};

// Built from its parts instead of pipeline(): transformers.js 4.3.2's pipeline() looks up config.json and file sizes
// on the "main" branch even when a revision is given, so a change upstream could still break us. Each from_pretrained
// below honours `revision` for every request.
async function loadPipe(m) {
  if (!lib) { try { lib = await import(TFJS); } catch (e) { lib = null; throw e; } }
  // belt and braces: internal look-ups that ignore `revision` (e.g. the tokenizer file check) also go to the pinned commit
  lib.env.remotePathTemplate = "{model}/resolve/" + m.rev + "/";
  var opt = { revision: m.rev, progress_callback: function (p) { if (p && p.status === "progress") postMessage({ type: "progress", file: p.file, loaded: p.loaded, total: p.total }); } };
  var parts = await Promise.all([
    lib.AutoTokenizer.from_pretrained(m.id, opt),
    lib.AutoProcessor.from_pretrained(m.id, opt),
    lib.WhisperForConditionalGeneration.from_pretrained(m.id, Object.assign({}, opt, { dtype: { encoder_model: "q8", decoder_model_merged: "q8" }, device: "wasm" }))
  ]);
  return new lib.AutomaticSpeechRecognitionPipeline({ task: "automatic-speech-recognition", tokenizer: parts[0], processor: parts[1], model: parts[2] });
}
async function getPipe(model) {
  var m = MODELS[model] || MODELS.base;
  if (!pipes[model]) {
    // one automatic retry for a flaky network; a failed load is never cached, so the next click tries again
    pipes[model] = loadPipe(m).catch(function () { return new Promise(function (r) { setTimeout(r, 1500); }).then(function () { return loadPipe(m); }); });
    pipes[model].catch(function () { delete pipes[model]; });
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
  var stage = "load";
  try {
    postMessage({ type: "status", stage: "load" });
    var asr = await getPipe(d.model);
    stage = "run";
    postMessage({ type: "status", stage: "run" });
    var opts = { return_timestamps: "word", chunk_length_s: 30, stride_length_s: 5, task: "transcribe" };
    if (d.language) opts.language = d.language;
    var r = await asr(d.audio, opts);
    postMessage({ type: "done", text: r.text, words: qtAsrWords(r.chunks) });
  } catch (e) {
    // code "model": the speech model couldn't be downloaded (offline, blocked network, CDN outage) — pages show a friendly hint
    postMessage({ type: "error", code: stage === "load" ? "model" : "run", message: String(e && e.message || e) });
  }
};
if (typeof module !== "undefined") module.exports = { qtAsrWords: qtAsrWords };
