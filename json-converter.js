// QuickTiny JSON Converter — JSON → TypeScript / Zod / CSV, and CSV → JSON.
// Pure functions first (testable), UI wiring at the bottom. Runs in the browser.

// ---------- Type inference ----------
// A "shape" is one of:
//   {k:"prim", t:"string"|"number"|"boolean"} | {k:"null"} | {k:"unknown"}
//   {k:"array", of:Shape} | {k:"object", fields:{name:{shape, optional}}, order:[...]} | {k:"union", of:[Shape]}

function qtjInfer(v) {
  if (v === null) return { k: "null" };
  if (Array.isArray(v)) {
    var s = { k: "unknown" };
    v.forEach(function(item, i){ s = i === 0 ? qtjInfer(item) : qtjMerge(s, qtjInfer(item)); });
    return { k: "array", of: s };
  }
  if (typeof v === "object") {
    var fields = {}, order = [];
    Object.keys(v).forEach(function(key){ fields[key] = { shape: qtjInfer(v[key]), optional: false }; order.push(key); });
    return { k: "object", fields: fields, order: order };
  }
  if (typeof v === "number") return { k: "prim", t: "number" };
  if (typeof v === "boolean") return { k: "prim", t: "boolean" };
  return { k: "prim", t: "string" };
}

function qtjKey(s) { return s.k === "prim" ? "prim:" + s.t : s.k; }

function qtjMerge(a, b) {
  if (a.k === "unknown") return b;
  if (b.k === "unknown") return a;
  if (a.k === "union" || b.k === "union") {
    var members = (a.k === "union" ? a.of : [a]).slice();
    (b.k === "union" ? b.of : [b]).forEach(function(m){ members = qtjAddToUnion(members, m); });
    return members.length === 1 ? members[0] : { k: "union", of: members };
  }
  if (qtjKey(a) !== qtjKey(b)) return { k: "union", of: [a, b] };
  if (a.k === "array") return { k: "array", of: qtjMerge(a.of, b.of) };
  if (a.k === "object") {
    var fields = {}, order = a.order.slice();
    b.order.forEach(function(k){ if (order.indexOf(k) === -1) order.push(k); });
    order.forEach(function(k){
      var fa = a.fields[k], fb = b.fields[k];
      if (fa && fb) fields[k] = { shape: qtjMerge(fa.shape, fb.shape), optional: fa.optional || fb.optional };
      else fields[k] = { shape: (fa || fb).shape, optional: true };
    });
    return { k: "object", fields: fields, order: order };
  }
  return a;
}

function qtjAddToUnion(members, m) {
  for (var i = 0; i < members.length; i++) {
    if (qtjKey(members[i]) === qtjKey(m)) { members[i] = qtjMerge(members[i], m); return members; }
  }
  members.push(m);
  return members;
}

function qtjPascal(s) {
  var out = String(s).replace(/[^A-Za-z0-9]+/g, " ").trim().split(/\s+/).map(function(w){ return w.charAt(0).toUpperCase() + w.slice(1); }).join("");
  if (!out) out = "Item";
  if (/^[0-9]/.test(out)) out = "T" + out;
  return out;
}

function qtjSingular(name) {
  if (/ies$/i.test(name)) return name.slice(0, -3) + "y";
  if (/(ss|us)$/i.test(name)) return name;
  if (/s$/i.test(name) && name.length > 3) return name.slice(0, -1);
  return name + "Item";
}

function qtjSafeKey(k) { return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k); }

// ---------- TypeScript ----------

function qtjToTypeScript(value, rootName) {
  var shape = qtjInfer(value);
  var decls = [], used = {};
  function uniqueName(base) { var n = base, i = 2; while (used[n]) n = base + i++; used[n] = true; return n; }

  function typeOf(s, hint) {
    switch (s.k) {
      case "prim": return s.t;
      case "null": return "null";
      case "unknown": return "unknown";
      case "array": {
        var inner = typeOf(s.of, qtjSingular(hint));
        return /[|&]/.test(inner) ? "(" + inner + ")[]" : inner + "[]";
      }
      case "union": return s.of.map(function(m){ return typeOf(m, hint); }).join(" | ");
      case "object": {
        var name = uniqueName(qtjPascal(hint));
        var idx = decls.length; decls.push(null);
        var lines = s.order.map(function(k){
          var f = s.fields[k];
          return "  " + qtjSafeKey(k) + (f.optional ? "?" : "") + ": " + typeOf(f.shape, k) + ";";
        });
        decls[idx] = "export interface " + name + " {\n" + lines.join("\n") + (lines.length ? "\n" : "") + "}";
        return name;
      }
    }
    return "unknown";
  }

  var rootType = typeOf(shape, rootName || "Root");
  if (shape.k !== "object") decls.unshift("export type " + qtjPascal(rootName || "Root") + " = " + rootType + ";");
  return decls.join("\n\n") + "\n";
}

// ---------- Zod ----------

function qtjToZod(value, rootName) {
  var shape = qtjInfer(value);
  var decls = [], used = {};
  function uniqueName(base) { var n = base, i = 2; while (used[n]) n = base + i++; used[n] = true; return n; }

  function zod(s, hint) {
    switch (s.k) {
      case "prim": return "z." + s.t + "()";
      case "null": return "z.null()";
      case "unknown": return "z.unknown()";
      case "array": return "z.array(" + zod(s.of, qtjSingular(hint)) + ")";
      case "union": {
        var hasNull = s.of.some(function(m){ return m.k === "null"; });
        var rest = s.of.filter(function(m){ return m.k !== "null"; });
        var base = rest.length === 1 ? zod(rest[0], hint) : "z.union([" + rest.map(function(m){ return zod(m, hint); }).join(", ") + "])";
        return hasNull ? base + ".nullable()" : base;
      }
      case "object": {
        var name = uniqueName(qtjPascal(hint) + "Schema");
        var idx = decls.length; decls.push(null);
        var lines = s.order.map(function(k){
          var f = s.fields[k];
          return "  " + qtjSafeKey(k) + ": " + zod(f.shape, k) + (f.optional ? ".optional()" : "") + ",";
        });
        decls[idx] = "export const " + name + " = z.object({\n" + lines.join("\n") + (lines.length ? "\n" : "") + "});";
        return name;
      }
    }
    return "z.unknown()";
  }

  var root = zod(shape, rootName || "Root");
  var rootConst = qtjPascal(rootName || "Root") + "Schema";
  // Schemas must be declared before they're used: children were pushed after parents.
  var body = decls.slice().reverse();
  if (shape.k !== "object") body.push("export const " + rootConst + " = " + root + ";");
  body.push("export type " + qtjPascal(rootName || "Root") + " = z.infer<typeof " + (shape.k === "object" ? root : rootConst) + ">;");
  return 'import { z } from "zod";\n\n' + body.join("\n\n") + "\n";
}

// ---------- CSV ----------

function qtjFlatten(obj, prefix, out) {
  out = out || {};
  Object.keys(obj).forEach(function(k){
    var key = prefix ? prefix + "." + k : k, v = obj[k];
    if (v && typeof v === "object" && !Array.isArray(v)) qtjFlatten(v, key, out);
    else out[key] = v;
  });
  return out;
}

function qtjCsvCell(v) {
  if (v === null || v === undefined) return "";
  var s = typeof v === "object" ? JSON.stringify(v) : String(v);
  // Neutralise spreadsheet formula injection for cells that start with = + - @.
  if (/^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function qtjToCsv(value) {
  var rows = Array.isArray(value) ? value : [value];
  if (!rows.length) throw new Error("The JSON array is empty.");
  var flat = rows.map(function(r){ return r && typeof r === "object" && !Array.isArray(r) ? qtjFlatten(r) : { value: r }; });
  var cols = [];
  flat.forEach(function(r){ Object.keys(r).forEach(function(k){ if (cols.indexOf(k) === -1) cols.push(k); }); });
  var lines = [cols.map(qtjCsvCell).join(",")];
  flat.forEach(function(r){ lines.push(cols.map(function(c){ return qtjCsvCell(r[c]); }).join(",")); });
  return lines.join("\r\n") + "\r\n";
}

// RFC 4180 parser with delimiter auto-detection (comma, semicolon, tab).
function qtjParseCsv(text) {
  text = text.replace(/^﻿/, "");
  var firstLine = text.split(/\r?\n/)[0] || "";
  var delim = [",", ";", "\t"].map(function(d){ return [d, firstLine.split(d).length]; }).sort(function(a, b){ return b[1] - a[1]; })[0][0];
  var rows = [], row = [], cell = "", q = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"' && cell === "") q = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  rows = rows.filter(function(r){ return !(r.length === 1 && r[0] === ""); });
  if (rows.length < 1) throw new Error("No CSV rows found.");
  var head = rows[0];
  return rows.slice(1).map(function(r){
    var o = {};
    head.forEach(function(h, j){
      var v = r[j] === undefined ? "" : r[j];
      if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(v) && v.length < 16) o[h] = Number(v);
      else if (v === "true" || v === "false") o[h] = v === "true";
      else o[h] = v;
    });
    return o;
  });
}

// ---------- UI ----------

function qtjRun() {
  var input = document.getElementById("jcIn").value;
  var mode = document.getElementById("jcMode").value;
  var name = document.getElementById("jcName").value.trim() || "Root";
  var out = document.getElementById("jcOut"), status = document.getElementById("jcStatus");
  out.value = "";
  if (!input.trim()) { status.textContent = mode === "csv2json" ? "Paste CSV above." : "Paste JSON above."; status.className = "result"; return; }
  try {
    var result;
    if (mode === "csv2json") result = JSON.stringify(qtjParseCsv(input), null, 2) + "\n";
    else {
      var data;
      try { data = JSON.parse(input); }
      catch (e) { throw new Error("That isn't valid JSON (" + e.message + "). Try the JSON Formatter's repair first."); }
      if (mode === "ts") result = qtjToTypeScript(data, name);
      else if (mode === "zod") result = qtjToZod(data, name);
      else result = qtjToCsv(data);
    }
    out.value = result;
    status.textContent = "Converted ✓";
    status.className = "result success";
    qtTrack("json_convert", { mode: mode });
  } catch (e) {
    status.textContent = e.message;
    status.className = "result error";
  }
}

function qtjUpdateMode() {
  var mode = document.getElementById("jcMode").value;
  document.getElementById("jcNameWrap").hidden = mode === "csv" || mode === "csv2json";
  document.getElementById("jcInLabel").textContent = mode === "csv2json" ? "CSV input" : "JSON input";
  document.getElementById("jcIn").placeholder = mode === "csv2json" ? "name,email\nAda,ada@example.com" : '{"id": 1, "name": "Ada", "tags": ["admin"]}';
  qtjRun();
}

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", function() {
  var timer;
  document.getElementById("jcIn").addEventListener("input", function(){ clearTimeout(timer); timer = setTimeout(qtjRun, 250); });
  document.getElementById("jcName").addEventListener("input", function(){ clearTimeout(timer); timer = setTimeout(qtjRun, 250); });
  document.getElementById("jcMode").addEventListener("change", qtjUpdateMode);
  document.getElementById("jcCopy").addEventListener("click", function(){
    var v = document.getElementById("jcOut").value;
    if (v) qtCopy(v, document.getElementById("jcStatus"), "Copied");
  });
  document.getElementById("jcDownload").addEventListener("click", function(){
    var v = document.getElementById("jcOut").value; if (!v) return;
    var mode = document.getElementById("jcMode").value;
    var ext = { ts: "ts", zod: "ts", csv: "csv", csv2json: "json" }[mode];
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([v], { type: mode === "csv" ? "text/csv" : "text/plain" }));
    a.download = (mode === "zod" ? "schema" : mode === "ts" ? "types" : "data") + "." + ext;
    a.click();
  });

  var params = location.hash.replace("#", "");
  if (["ts", "zod", "csv", "csv2json"].indexOf(params) !== -1) document.getElementById("jcMode").value = params;

  if (typeof qtHandoffConsume === "function") {
    var payload = qtHandoffConsume("/json-converter");
    if (payload) {
      document.getElementById("jcIn").value = payload.value;
      if (["ts", "zod", "csv"].indexOf(payload.action) !== -1) document.getElementById("jcMode").value = payload.action;
    }
  }
  qtjUpdateMode();
});

if (typeof module !== "undefined") module.exports = { qtjToTypeScript: qtjToTypeScript, qtjToZod: qtjToZod, qtjToCsv: qtjToCsv, qtjParseCsv: qtjParseCsv };
