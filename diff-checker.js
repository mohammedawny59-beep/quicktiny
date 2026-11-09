// QuickTiny Diff Checker — Myers line diff with word-level highlights, side-by-side or unified view,
// ignore case/whitespace, JSON-aware compare (sorted keys) and a downloadable unified .patch. All local.

// Myers O(ND) diff over two arrays of comparable keys. Returns [["=",ai,bi] | ["-",ai] | ["+",bi]].
function qtMyers(A, B, maxD) {
  var n = A.length, m = B.length, pre = 0, suf = 0;
  while (pre < n && pre < m && A[pre] === B[pre]) pre++;
  while (suf < n - pre && suf < m - pre && A[n - 1 - suf] === B[m - 1 - suf]) suf++;
  var a = A.slice(pre, n - suf), b = B.slice(pre, m - suf), N = a.length, M = b.length, ops = [], k, i;
  for (i = 0; i < pre; i++) ops.push(["=", i, i]);
  var mid = [];
  if (N === 0) for (i = 0; i < M; i++) mid.push(["+", pre + i]);
  else if (M === 0) for (i = 0; i < N; i++) mid.push(["-", pre + i]);
  else {
    var MAX = N + M, off = MAX + 1, v = new Int32Array(2 * MAX + 3), trace = [], found = -1, limit = Math.min(MAX, maxD || 6000);
    for (var d = 0; d <= limit && found < 0; d++) {
      trace.push(v.slice(off - d - 1, off + d + 2));
      for (k = -d; k <= d; k += 2) {
        var x = (k === -d || (k !== d && v[off + k - 1] < v[off + k + 1])) ? v[off + k + 1] : v[off + k - 1] + 1, y = x - k;
        while (x < N && y < M && a[x] === b[y]) { x++; y++; }
        v[off + k] = x;
        if (x >= N && y >= M) { found = d; break; }
      }
    }
    if (found < 0) { // too different: fall back to "replace the whole middle block"
      for (i = 0; i < N; i++) mid.push(["-", pre + i]);
      for (i = 0; i < M; i++) mid.push(["+", pre + i]);
    } else {
      var X = N, Y = M;
      for (d = found; d >= 0; d--) {
        var t = trace[d], at = function (kk) { return t[kk + d + 1]; };
        k = X - Y;
        var pk = (k === -d || (k !== d && at(k - 1) < at(k + 1))) ? k + 1 : k - 1, px = d === 0 ? 0 : at(pk), py = px - pk;
        while (X > px && Y > py) { mid.push(["=", pre + X - 1, pre + Y - 1]); X--; Y--; }
        if (d > 0) { if (X === px) mid.push(["+", pre + Y - 1]); else mid.push(["-", pre + X - 1]); }
        X = px; Y = py;
      }
      mid.reverse();
    }
  }
  ops = ops.concat(mid);
  for (i = 0; i < suf; i++) ops.push(["=", n - suf + i, m - suf + i]);
  return ops;
}

function qtSortKeys(v) {
  if (Array.isArray(v)) return v.map(qtSortKeys);
  if (v && typeof v === "object") { var o = {}; Object.keys(v).sort().forEach(function (k) { o[k] = qtSortKeys(v[k]); }); return o; }
  return v;
}
function qtDiffPrep(text, opts) {
  if (opts.json) { try { return JSON.stringify(qtSortKeys(JSON.parse(text)), null, 2); } catch (e) {} }
  return text;
}
function qtDiffKey(line, opts) {
  var s = line;
  if (opts.ws) s = s.replace(/\s+/g, " ").trim();
  if (opts.icase) s = s.toLowerCase();
  return s;
}
function qtSplitLines(t) { if (t === "") return []; var l = t.replace(/\r\n?/g, "\n").split("\n"); if (l[l.length - 1] === "") l.pop(); return l; }

// Line diff + stats.
function qtDiffText(aText, bText, opts) {
  opts = opts || {};
  var a = qtSplitLines(qtDiffPrep(aText, opts)), b = qtSplitLines(qtDiffPrep(bText, opts));
  var ids = new Map(), toId = function (l) { var k = qtDiffKey(l, opts); if (!ids.has(k)) ids.set(k, ids.size); return ids.get(k); };
  var ops = qtMyers(a.map(toId), b.map(toId));
  if (opts.blank) ops = ops.filter(function (o) { return o[0] === "=" || (o[0] === "-" ? a[o[1]] : b[o[1]]).trim() !== ""; });
  var add = 0, del = 0, same = 0;
  ops.forEach(function (o) { if (o[0] === "+") add++; else if (o[0] === "-") del++; else same++; });
  return { a: a, b: b, ops: ops, added: add, removed: del, same: same, similarity: a.length + b.length ? Math.round(200 * same / (a.length + b.length)) : 100 };
}

// Word-level diff of two lines -> [[op, text]].
function qtWordDiff(x, y, opts) {
  var tok = function (s) { return s.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) || []; };
  var A = tok(x), B = tok(y), norm = function (t) { return opts && opts.icase ? t.toLowerCase() : t; };
  var ops = qtMyers(A.map(norm), B.map(norm), 400), out = [];
  ops.forEach(function (o) {
    var op = o[0], text = op === "+" ? B[o[1]] : A[o[1]];
    if (op === "=") text = B[o[2]];
    if (out.length && out[out.length - 1][0] === op) out[out.length - 1][1] += text; else out.push([op, text]);
  });
  return out;
}

// Groups ops into rows: equal rows and change blocks [{del:[ai...], ins:[bi...]}].
function qtDiffBlocks(ops) {
  var rows = [], cur = null;
  ops.forEach(function (o) {
    if (o[0] === "=") { cur = null; rows.push({ eq: true, a: o[1], b: o[2] }); }
    else { if (!cur) { cur = { del: [], ins: [] }; rows.push(cur); } (o[0] === "-" ? cur.del : cur.ins).push(o[1]); }
  });
  return rows;
}

// Standard unified diff (git-style) with `ctx` lines of context.
function qtUnifiedPatch(r, nameA, nameB, ctx) {
  ctx = ctx === undefined ? 3 : ctx;
  var ops = r.ops, out = ["--- a/" + (nameA || "original.txt"), "+++ b/" + (nameB || "changed.txt")], i = 0;
  var ai = [], bi = []; // line numbers before each op
  var x = 0, y = 0;
  ops.forEach(function (o) { ai.push(x); bi.push(y); if (o[0] !== "+") x++; if (o[0] !== "-") y++; });
  var changes = []; ops.forEach(function (o, k) { if (o[0] !== "=") changes.push(k); });
  if (!changes.length) return "";
  var hunks = [], s = changes[0], e = changes[0];
  for (i = 1; i < changes.length; i++) { if (changes[i] - e > 2 * ctx) { hunks.push([s, e]); s = changes[i]; } e = changes[i]; }
  hunks.push([s, e]);
  hunks.forEach(function (h) {
    var from = Math.max(0, h[0] - ctx), to = Math.min(ops.length - 1, h[1] + ctx), lines = [], ac = 0, bc = 0;
    for (var k = from; k <= to; k++) {
      var o = ops[k];
      if (o[0] === "=") { lines.push(" " + r.a[o[1]]); ac++; bc++; }
      else if (o[0] === "-") { lines.push("-" + r.a[o[1]]); ac++; }
      else { lines.push("+" + r.b[o[1]]); bc++; }
    }
    var as = ac ? ai[from] + 1 : ai[from], bs = bc ? bi[from] + 1 : bi[from];
    out.push("@@ -" + as + (ac === 1 ? "" : "," + ac) + " +" + bs + (bc === 1 ? "" : "," + bc) + " @@");
    out = out.concat(lines);
  });
  return out.join("\n") + "\n";
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var last = null, expanded = {}, debounce = null;

  function opts() { return { icase: $("dfCase").checked, ws: $("dfWs").checked, blank: $("dfBlank").checked, json: $("dfJson").checked }; }
  function inline(x, y, side, o) {
    var parts = qtWordDiff(x, y, o), changed = 0, total = 0;
    parts.forEach(function (p) { total += p[1].length; if (p[0] !== "=") changed += p[1].length; });
    if (total && changed / total > 0.7) return null; // too different — highlight the whole line instead
    return parts.map(function (p) {
      if (p[0] === "=") return esc(p[1]);
      if (side === "a" && p[0] === "-") return "<del>" + esc(p[1]) + "</del>";
      if (side === "b" && p[0] === "+") return "<ins>" + esc(p[1]) + "</ins>";
      return "";
    }).join("");
  }
  function render() {
    var aT = $("dfA").value, bT = $("dfB").value, o = opts();
    if (!aT && !bT) { $("dfOut").innerHTML = '<p class="df-empty">Paste two versions above to compare them.</p>'; $("dfStats").innerHTML = ""; last = null; return; }
    var t0 = performance.now(), r = qtDiffText(aT, bT, o); last = r;
    var ms = Math.round(performance.now() - t0);
    $("dfStats").innerHTML = '<span class="df-add">+' + r.added + " added</span><span class=\"df-del\">−" + r.removed + " removed</span><span>" + r.same + " unchanged</span><span>" + r.similarity + "% similar</span><span class=\"df-dim\">" + ms + " ms</span>" +
      (r.added + r.removed === 0 ? '<span class="df-same">✓ No differences' + (o.icase || o.ws || o.json ? " (with your ignore options)" : "") + "</span>" : "");
    var rows = qtDiffBlocks(r.ops), side = $("dfView").value === "split", only = $("dfOnly").checked, CTX = 3, html = [];
    var near = new Array(rows.length).fill(false);
    rows.forEach(function (row, k) { if (!row.eq) for (var j = Math.max(0, k - CTX); j <= Math.min(rows.length - 1, k + CTX); j++) near[j] = true; });
    var k = 0;
    while (k < rows.length) {
      var row = rows[k];
      if (row.eq && only && !near[k] && !expanded[k]) {
        var s = k; while (k < rows.length && rows[k].eq && !near[k]) k++;
        html.push('<tr class="df-fold"><td colspan="' + (side ? 4 : 3) + '"><button type="button" data-fold="' + s + "-" + k + '">⋯ ' + (k - s) + " unchanged line" + (k - s === 1 ? "" : "s") + " — show</button></td></tr>");
        continue;
      }
      if (row.eq) {
        var la = esc(r.a[row.a]), lb = esc(r.b[row.b]);
        html.push(side ? "<tr><td class=\"df-n\">" + (row.a + 1) + "</td><td class=\"df-c\">" + la + "</td><td class=\"df-n\">" + (row.b + 1) + "</td><td class=\"df-c\">" + lb + "</td></tr>"
          : "<tr><td class=\"df-n\">" + (row.a + 1) + "</td><td class=\"df-n\">" + (row.b + 1) + "</td><td class=\"df-c\"><span class=\"df-sign\"> </span>" + lb + "</td></tr>");
      } else {
        var n = Math.max(row.del.length, row.ins.length);
        if (side) {
          for (var j = 0; j < n; j++) {
            var ai = row.del[j], bi = row.ins[j], ha = "", hb = "";
            if (ai !== undefined && bi !== undefined) { ha = inline(r.a[ai], r.b[bi], "a", o); hb = inline(r.a[ai], r.b[bi], "b", o); }
            html.push("<tr>" + (ai !== undefined ? '<td class="df-n">' + (ai + 1) + '</td><td class="df-c df-rm">' + (ha !== null && ha !== "" ? ha : esc(r.a[ai])) + "</td>" : '<td class="df-n"></td><td class="df-c df-blank"></td>') +
              (bi !== undefined ? '<td class="df-n">' + (bi + 1) + '</td><td class="df-c df-ad">' + (hb !== null && hb !== "" ? hb : esc(r.b[bi])) + "</td>" : '<td class="df-n"></td><td class="df-c df-blank"></td>') + "</tr>");
          }
        } else {
          row.del.forEach(function (ai, j) { var bi = row.ins[j], h = bi !== undefined ? inline(r.a[ai], r.b[bi], "a", o) : null;
            html.push('<tr><td class="df-n">' + (ai + 1) + '</td><td class="df-n"></td><td class="df-c df-rm"><span class="df-sign">−</span>' + (h || esc(r.a[ai])) + "</td></tr>"); });
          row.ins.forEach(function (bi, j) { var ai = row.del[j], h = ai !== undefined ? inline(r.a[ai], r.b[bi], "b", o) : null;
            html.push('<tr><td class="df-n"></td><td class="df-n">' + (bi + 1) + '</td><td class="df-c df-ad"><span class="df-sign">+</span>' + (h || esc(r.b[bi])) + "</td></tr>"); });
        }
      }
      k++;
    }
    $("dfOut").innerHTML = '<table class="df-table' + (side ? " df-split" : "") + '">' + (side ? '<colgroup><col class="df-ncol"><col><col class="df-ncol"><col></colgroup>' : '<colgroup><col class="df-ncol"><col class="df-ncol"><col></colgroup>') + "<tbody>" + html.join("") + "</tbody></table>";
    $("dfOut").querySelectorAll("[data-fold]").forEach(function (b) { b.addEventListener("click", function () {
      var p = b.getAttribute("data-fold").split("-"); for (var i = +p[0]; i < +p[1]; i++) expanded[i] = true; render();
    }); });
  }
  function schedule() { clearTimeout(debounce); debounce = setTimeout(function () { expanded = {}; render(); }, 180); }
  function loadFile(file, target) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { $("dfStatus").textContent = "That file is over 20 MB — too large to diff in the browser."; $("dfStatus").className = "result error"; return; }
    file.text().then(function (t) { $(target).value = t; $(target).setAttribute("data-name", file.name); schedule(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    ["dfA", "dfB"].forEach(function (id) {
      $(id).addEventListener("input", schedule);
      $(id).addEventListener("dragover", function (e) { e.preventDefault(); $(id).classList.add("df-drop"); });
      $(id).addEventListener("dragleave", function () { $(id).classList.remove("df-drop"); });
      $(id).addEventListener("drop", function (e) { e.preventDefault(); $(id).classList.remove("df-drop"); loadFile(e.dataTransfer.files[0], id); });
    });
    $("dfFileA").addEventListener("change", function () { loadFile(this.files[0], "dfA"); });
    $("dfFileB").addEventListener("change", function () { loadFile(this.files[0], "dfB"); });
    ["dfCase", "dfWs", "dfBlank", "dfJson", "dfOnly", "dfView"].forEach(function (id) { $(id).addEventListener("change", function () { expanded = {}; render(); }); });
    $("dfSwap").addEventListener("click", function () { var t = $("dfA").value; $("dfA").value = $("dfB").value; $("dfB").value = t; render(); });
    $("dfClear").addEventListener("click", function () { $("dfA").value = ""; $("dfB").value = ""; render(); });
    $("dfPatch").addEventListener("click", function () {
      if (!last) return;
      var p = qtUnifiedPatch(last, $("dfA").getAttribute("data-name"), $("dfB").getAttribute("data-name"));
      if (!p) { $("dfStatus").textContent = "No differences — nothing to export."; $("dfStatus").className = "result"; return; }
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([p], { type: "text/x-diff" })); a.download = "changes.patch"; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); qtTrack("diff_patch_download");
    });
    $("dfCopy").addEventListener("click", function () { if (last) qtCopy(qtUnifiedPatch(last, $("dfA").getAttribute("data-name"), $("dfB").getAttribute("data-name")) || "No differences", $("dfStatus"), "Unified diff copied"); });
    if (window.innerWidth < 760) $("dfView").value = "unified";
    render();
  });
})();

if (typeof module !== "undefined") module.exports = { qtMyers: qtMyers, qtDiffText: qtDiffText, qtWordDiff: qtWordDiff, qtUnifiedPatch: qtUnifiedPatch };
