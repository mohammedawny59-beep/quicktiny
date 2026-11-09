// QuickTiny Regex Tester — live matches, groups, replace preview, plain-English explanation,
// code export (JS / Python / PHP / Java) and a worker with a timeout so bad patterns can't freeze the tab.

function qtRxEsc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

var QT_RX_ESCAPES = {
  d: "a digit (0–9)", D: "any character that is not a digit", w: "a word character (letter, digit or _)",
  W: "any character that is not a word character", s: "a whitespace character (space, tab, line break)",
  S: "any non-whitespace character", b: "a word boundary", B: "a position that is not a word boundary",
  n: "a line feed (new line)", r: "a carriage return", t: "a tab", f: "a form feed", v: "a vertical tab", "0": "a NUL character"
};

function qtRxClassDesc(body) {
  // 1) split into atoms (single chars or escapes), 2) join "x - y" into ranges
  var atoms = [], i = 0, m;
  while (i < body.length) {
    var c = body[i];
    if (c === "\\") {
      var n = body[i + 1], rest = body.slice(i);
      if (QT_RX_ESCAPES[n]) { atoms.push({ label: QT_RX_ESCAPES[n], set: true }); i += 2; }
      else if ((m = /^\\[pP]\{[^}]*\}/.exec(rest))) { atoms.push({ label: (n === "P" ? "not " : "") + "Unicode " + m[0].slice(3, -1), set: true }); i += m[0].length; }
      else if ((m = /^\\u\{([0-9a-fA-F]+)\}/.exec(rest)) || (m = /^\\u([0-9a-fA-F]{4})/.exec(rest)) || (m = /^\\x([0-9a-fA-F]{2})/.exec(rest))) {
        var cp = parseInt(m[1], 16); atoms.push({ label: "U+" + m[1].toUpperCase().padStart(4, "0") + (cp > 32 && cp < 0x10ffff ? ' "' + String.fromCodePoint(cp) + '"' : "") }); i += m[0].length;
      } else { atoms.push({ label: '"' + (n === undefined ? "\\" : n) + '"' }); i += 2; }
    } else { var ch = Array.from(body.slice(i))[0]; atoms.push({ label: '"' + ch + '"', dash: ch === "-" }); i += ch.length; }
  }
  var parts = [];
  for (var k = 0; k < atoms.length; k++) {
    var a = atoms[k], d = atoms[k + 1], b = atoms[k + 2];
    if (!a.set && d && d.dash && b && !b.set) { parts.push(a.label + " to " + b.label); k += 2; }
    else parts.push(a.label);
  }
  return parts.join(", ");
}

function qtRxQuant(q) {
  var lazy = /\?$/.test(q) && q.length > 1, b = lazy ? q.slice(0, -1) : q, t;
  if (b === "*") t = "zero or more times"; else if (b === "+") t = "one or more times"; else if (b === "?") t = "optionally (zero or one time)";
  else {
    var m = /^\{(\d+)(,(\d*))?\}$/.exec(b);
    if (!m) t = b;
    else if (!m[2]) t = "exactly " + m[1] + " time" + (m[1] === "1" ? "" : "s");
    else if (m[3] === "") t = m[1] + " or more times";
    else t = "between " + m[1] + " and " + m[3] + " times";
  }
  return t + (lazy ? " — as few as possible (lazy)" : b === "?" ? "" : " — as many as possible");
}

// Returns [{depth, token, desc}] describing a JavaScript regex source in plain English.
function qtRegexExplain(src, flags) {
  flags = flags || "";
  var out = [], opens = [], i = 0, depth = 0, group = 0, lit = null;
  function push(token, desc) { lit = null; out.push({ depth: depth, token: token, desc: desc }); return out[out.length - 1]; }
  function addLit(ch, shown) {
    if (lit && lit.depth === depth) { lit.parts.push([ch, shown]); lit.raw += ch; lit.token += shown; lit.desc = 'the text "' + lit.raw + '"'; return; }
    lit = { depth: depth, token: shown, raw: ch, parts: [[ch, shown]], desc: 'the text "' + ch + '"' }; out.push(lit);
  }
  while (i < src.length) {
    var c = src[i];
    var q = /^(\*\??|\+\??|\?\??|\{\d+(,\d*)?\}\??)/.exec(src.slice(i));
    if (q && out.length) {
      var prev = out[out.length - 1];
      if (prev === lit && lit.parts.length > 1) { // quantifier applies only to the last literal character
        var last = lit.parts.pop(); lit.raw = lit.raw.slice(0, -last[0].length); lit.token = lit.token.slice(0, -last[1].length); lit.desc = 'the text "' + lit.raw + '"';
        prev = { depth: depth, token: last[1], desc: 'the character "' + last[0] + '"' }; out.push(prev);
      } else if (prev === lit) prev.desc = prev.desc.replace(/^the text/, "the character");
      prev.token += q[0];
      prev.desc += prev.isClose ? " — repeat the whole group " + qtRxQuant(q[0]) : ", " + qtRxQuant(q[0]);
      lit = null; i += q[0].length; continue;
    }
    if (c === "\\") {
      var n = src[i + 1] || "";
      if (QT_RX_ESCAPES[n]) push("\\" + n, "Match " + QT_RX_ESCAPES[n]);
      else if (/[1-9]/.test(n)) { var num = /^\d+/.exec(src.slice(i + 1))[0]; push("\\" + num, "Match the same text as group #" + num + " again"); i += 1 + num.length; continue; }
      else if (n === "k" && src[i + 2] === "<") { var e = src.indexOf(">", i); push(src.slice(i, e + 1), 'Match the same text as group "' + src.slice(i + 3, e) + '" again'); i = e + 1; continue; }
      else if ((n === "p" || n === "P") && src[i + 2] === "{") { var e3 = src.indexOf("}", i); push(src.slice(i, e3 + 1), "Match " + (n === "P" ? "a character that is NOT " : "a character with ") + "Unicode property " + src.slice(i + 3, e3)); i = e3 + 1; continue; }
      else if (n === "u" && src[i + 2] === "{") { var e4 = src.indexOf("}", i); addLit(String.fromCodePoint(parseInt(src.slice(i + 3, e4), 16)), src.slice(i, e4 + 1)); i = e4 + 1; continue; }
      else if (n === "u" && /^[0-9a-fA-F]{4}$/.test(src.substr(i + 2, 4))) { addLit(String.fromCharCode(parseInt(src.substr(i + 2, 4), 16)), src.substr(i, 6)); i += 6; continue; }
      else if (n === "x" && /^[0-9a-fA-F]{2}$/.test(src.substr(i + 2, 2))) { addLit(String.fromCharCode(parseInt(src.substr(i + 2, 2), 16)), src.substr(i, 4)); i += 4; continue; }
      else if (n === "c") { push(src.substr(i, 3), "Match control character Ctrl+" + (src[i + 2] || "").toUpperCase()); i += 3; continue; }
      else addLit(n, "\\" + n);
      i += 2; continue;
    }
    if (c === "[") {
      var j = i + 1, neg = false;
      if (src[j] === "^") { neg = true; j++; }
      var start = j;
      while (j < src.length && src[j] !== "]") { if (src[j] === "\\") j++; j++; }
      var body = src.slice(start, j);
      push(src.slice(i, j + 1), body === "" ? (neg ? "Match any character at all" : "Match nothing (empty class)") : (neg ? "Match one character that is NOT: " : "Match one of: ") + qtRxClassDesc(body));
      i = j + 1; continue;
    }
    if (c === "(") {
      var r = src.slice(i), m, label, startI = i;
      if (/^\(\?:/.test(r)) { label = "Group (not captured)"; i += 3; }
      else if (/^\(\?=/.test(r)) { label = "Lookahead — only if followed by:"; i += 3; }
      else if (/^\(\?!/.test(r)) { label = "Negative lookahead — only if NOT followed by:"; i += 3; }
      else if (/^\(\?<=/.test(r)) { label = "Lookbehind — only if preceded by:"; i += 4; }
      else if (/^\(\?<!/.test(r)) { label = "Negative lookbehind — only if NOT preceded by:"; i += 4; }
      else if ((m = /^\(\?<([A-Za-z_$][\w$]*)>/.exec(r))) { group++; label = 'Capture group #' + group + ' named "' + m[1] + '"'; i += m[0].length; }
      else { group++; label = "Capture group #" + group; i += 1; }
      opens.push(push(src.slice(startI, i), label)); depth++;
      continue;
    }
    if (c === ")") {
      depth = Math.max(0, depth - 1);
      var o = opens.pop();
      var oname = o ? o.desc.split(" —")[0].replace(/:$/, "") : "group";
      var close = push(")", "End of " + oname.charAt(0).toLowerCase() + oname.slice(1));
      close.isClose = true; // a quantifier after ")" repeats the whole group
      i++; continue;
    }
    if (c === "|") { push("|", "OR — try the alternative instead"); i++; continue; }
    if (c === "^") { push("^", flags.indexOf("m") !== -1 ? "Start of a line" : "Start of the text"); i++; continue; }
    if (c === "$") { push("$", flags.indexOf("m") !== -1 ? "End of a line" : "End of the text"); i++; continue; }
    if (c === ".") { push(".", flags.indexOf("s") !== -1 ? "Any character, including line breaks" : "Any character except a line break"); i++; continue; }
    var ch = Array.from(src.slice(i))[0];
    addLit(ch, ch); i += ch.length;
  }
  return out.filter(function (x) { return x.token !== ""; }).map(function (x) { return { depth: x.depth, token: x.token, desc: (/^the /.test(x.desc) ? "Match " : "") + x.desc }; });
}

function qtRxJsLiteral(p, f) { return "/" + p.replace(/(^|[^\\])\//g, "$1\\/").replace(/(^|[^\\])\//g, "$1\\/") + "/" + f; }
function qtRegexCode(lang, p, f) {
  var g = f.indexOf("g") !== -1;
  if (lang === "js") {
    return "const re = " + qtRxJsLiteral(p, f) + ";\n" + (g ? "const matches = [...text.matchAll(re)];\nmatches.forEach(m => console.log(m[0], m.index));" : "const m = text.match(re);\nif (m) console.log(m[0], m.index);");
  }
  if (lang === "py") {
    var pp = p.replace(/\(\?<([A-Za-z_]\w*)>/g, "(?P<$1>").replace(/\\k<([A-Za-z_]\w*)>/g, "(?P=$1)");
    var fl = [];
    if (f.indexOf("i") !== -1) fl.push("re.IGNORECASE"); if (f.indexOf("m") !== -1) fl.push("re.MULTILINE"); if (f.indexOf("s") !== -1) fl.push("re.DOTALL");
    var qt = pp.indexOf("'") === -1 ? "'" : pp.indexOf('"') === -1 ? '"' : "'''";
    var lit = "r" + qt + pp + qt;
    if (/\\$/.test(pp)) lit = JSON.stringify(pp);
    return "import re\n\npattern = re.compile(" + lit + (fl.length ? ", " + fl.join(" | ") : "") + ")\n" + (g ? "for m in pattern.finditer(text):\n    print(m.group(0), m.start())" : "m = pattern.search(text)\nif m:\n    print(m.group(0), m.start())") + (/\\p\{/.test(pp) ? "\n# note: \\p{...} needs the third-party 'regex' module in Python" : "");
  }
  if (lang === "php") {
    var pf = f.replace(/[gy]/g, "").replace("d", "");
    var body = ("/" + p.replace(/(^|[^\\])\//g, "$1\\/") + "/" + pf).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return g ? "preg_match_all('" + body + "', $text, $matches, PREG_OFFSET_CAPTURE);\nprint_r($matches);" : "if (preg_match('" + body + "', $text, $m, PREG_OFFSET_CAPTURE)) {\n    print_r($m);\n}";
  }
  if (lang === "java") {
    var jf = [];
    if (f.indexOf("i") !== -1) jf.push("Pattern.CASE_INSENSITIVE"); if (f.indexOf("m") !== -1) jf.push("Pattern.MULTILINE"); if (f.indexOf("s") !== -1) jf.push("Pattern.DOTALL"); if (f.indexOf("u") !== -1) jf.push("Pattern.UNICODE_CHARACTER_CLASS");
    var js = p.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return "import java.util.regex.*;\n\nPattern p = Pattern.compile(\"" + js + "\"" + (jf.length ? ", " + jf.join(" | ") : "") + ");\nMatcher m = p.matcher(text);\n" + (g ? "while (m.find()) {\n    System.out.println(m.group() + \" @ \" + m.start());\n}" : "if (m.find()) System.out.println(m.group());");
  }
  return "";
}

var QT_RX_LIB = [
  ["Email", "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", "gm", "ada@example.com\nnot-an-email\nsara.k@mail.co.uk"],
  ["URL", "https?:\\/\\/[^\\s/$.?#][^\\s]*", "gi", "Visit https://quicktinyv2.vercel.app/tools or http://example.com?q=1 today."],
  ["IPv4", "\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b", "g", "Server 192.168.1.20 and 10.0.0.255 — but not 999.1.1.1"],
  ["Phone (intl.)", "\\+[1-9]\\d{6,14}\\b", "g", "Call +962791234567 or +14155550123"],
  ["Date YYYY-MM-DD", "(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])", "g", "Released 2026-11-09, updated 2026-12-01."],
  ["Hex color", "#(?:[0-9a-fA-F]{3}){1,2}\\b", "g", "Brand: #6b6bff, accent #3be2ff, text #fff"],
  ["Arabic words", "\\p{Script=Arabic}+", "gu", "QuickTiny أدوات مجانية in your browser"],
  ["UUID", "\\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\b", "gi", "id: 3f2b8c1e-9d4a-4f6b-a2c3-1e5d7f9b0a12"],
  ["Strong password", "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{12,}$", "gm", "password123\nCorrect-Horse-42!\nShort1!"],
  ["URL slug", "^[a-z0-9]+(?:-[a-z0-9]+)*$", "gm", "my-blog-post\nMy Blog Post\nhello--world"],
  ["Repeated word", "\\b(\\w+)\\s+\\1\\b", "gi", "This is is a test of the the tool."],
  ["HTML tag", "<\\/?([a-z][a-z0-9]*)\\b[^>]*>", "gi", "<p class=\"x\">Hello <b>world</b></p>"]
];

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var FLAGS = [["g", "global — find all matches"], ["i", "ignore case"], ["m", "multiline — ^ and $ match at line breaks"], ["s", "dotAll — . matches line breaks"], ["u", "unicode — enables \\p{…} and full Unicode"], ["y", "sticky — match only at lastIndex"]];
  var worker = null, seq = 0, timer = null, debounce = null;

  function flags() { return Array.from(document.querySelectorAll("#rxFlags .chip.active")).map(function (b) { return b.getAttribute("data-f"); }).join(""); }
  function setFlags(f) { document.querySelectorAll("#rxFlags .chip").forEach(function (b) { var on = f.indexOf(b.getAttribute("data-f")) !== -1; b.classList.toggle("active", on); b.setAttribute("aria-pressed", on); }); }
  function newWorker() { if (worker) worker.terminate(); worker = new Worker("/regex-worker.js"); worker.onmessage = onResult; }

  function run() {
    var p = $("rxPattern").value, f = flags(), t = $("rxText").value;
    $("rxSlashF").textContent = "/" + f;
    renderExplain(p, f); renderCode();
    if (!p) { $("rxHighlight").innerHTML = qtRxEsc(t) + "\n"; $("rxCount").textContent = "Type a pattern"; $("rxCount").className = "rx-count"; $("rxTable").innerHTML = ""; $("rxReplaced").textContent = ""; return; }
    try { new RegExp(p, f); } catch (e) { showError(e.message); return; }
    $("rxPattern").classList.remove("rx-bad");
    if (!worker) newWorker();
    var id = ++seq, rep = $("rxReplaceOn").checked ? $("rxReplace").value : null;
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (id !== seq) return;
      newWorker();
      showError("Stopped after 1.5 s — this pattern backtracks catastrophically on this text (nested quantifiers like (a+)+ are the usual cause). Your tab is fine.");
    }, 1500);
    worker.postMessage({ id: id, pattern: p, flags: f, text: t, replace: rep });
  }
  function showError(msg) {
    $("rxPattern").classList.add("rx-bad");
    $("rxCount").textContent = msg; $("rxCount").className = "rx-count rx-err";
    $("rxHighlight").innerHTML = qtRxEsc($("rxText").value) + "\n"; $("rxTable").innerHTML = ""; $("rxReplaced").textContent = "";
  }
  function onResult(e) {
    var d = e.data; if (d.id !== seq) return;
    clearTimeout(timer);
    if (d.error) { showError(d.error); return; }
    var t = $("rxText").value, ms = d.matches, html = "", pos = 0;
    ms.forEach(function (m, k) {
      if (m.i < pos) return;
      html += qtRxEsc(t.slice(pos, m.i));
      html += m.s === "" ? '<span class="rx-zero" title="empty match at ' + m.i + '"></span>' : '<mark class="rx-m' + (k % 2) + '" title="Match ' + (k + 1) + '">' + qtRxEsc(m.s) + "</mark>";
      pos = m.i + m.s.length;
    });
    html += qtRxEsc(t.slice(pos));
    $("rxHighlight").innerHTML = html + "\n";
    $("rxCount").className = "rx-count" + (ms.length ? " rx-ok" : "");
    $("rxCount").textContent = ms.length ? ms.length + (d.truncated ? "+" : "") + " match" + (ms.length === 1 ? "" : "es") + (flags().indexOf("g") === -1 && ms.length ? " (first only — add the g flag for all)" : "") : "No match";
    var names = [];
    try { qtRegexExplain($("rxPattern").value, flags()).forEach(function (x) { var nm = /^Capture group #(\d+) named "(.+)"$/.exec(x.desc); if (nm) names[+nm[1] - 1] = nm[2]; }); } catch (er) {}
    var rows = ms.slice(0, 300).map(function (m, k) {
      var gs = m.g.map(function (g, gi) {
        var name = names[gi] || null;
        return '<span class="rx-g"><b>' + (name ? qtRxEsc(name) : gi + 1) + "</b>" + (g === null ? '<i>—</i>' : qtRxEsc(g)) + "</span>";
      }).join("");
      return "<tr><td>" + (k + 1) + '</td><td><code>' + (m.s === "" ? "<i>empty</i>" : qtRxEsc(m.s.length > 120 ? m.s.slice(0, 120) + "…" : m.s)) + "</code></td><td>" + m.i + "–" + (m.i + m.s.length) + "</td><td>" + (gs || '<span class="rx-dim">no groups</span>') + "</td></tr>";
    }).join("");
    $("rxTable").innerHTML = ms.length ? '<table class="rx-table"><thead><tr><th>#</th><th>Match</th><th>Position</th><th>Groups</th></tr></thead><tbody>' + rows + "</tbody></table>" + (ms.length > 300 ? '<p class="rx-dim">Showing first 300.</p>' : "") : "";
    $("rxReplaced").textContent = d.replaced !== undefined ? d.replaced : "";
  }
  function renderExplain(p, f) {
    if (!p) { $("rxExplain").innerHTML = '<li class="rx-dim">The explanation appears here as you type.</li>'; return; }
    var items; try { items = qtRegexExplain(p, f); } catch (e) { items = []; }
    $("rxExplain").innerHTML = items.map(function (x) {
      return '<li style="margin-inline-start:' + (x.depth * 18) + 'px"><code>' + qtRxEsc(x.token) + "</code><span>" + qtRxEsc(x.desc) + "</span></li>";
    }).join("");
  }
  function renderCode() { $("rxCodeOut").textContent = $("rxPattern").value ? qtRegexCode($("rxLang").value, $("rxPattern").value, flags()) : ""; }
  function schedule() { clearTimeout(debounce); debounce = setTimeout(run, 120); }

  function readHash() {
    if (!location.hash || location.hash.length < 3) return false;
    try {
      var h = new URLSearchParams(location.hash.slice(1));
      if (!h.has("p")) return false;
      $("rxPattern").value = h.get("p"); setFlags(h.get("f") || "g");
      if (h.has("t")) $("rxText").value = h.get("t");
      if (h.has("r")) { $("rxReplace").value = h.get("r"); $("rxReplaceOn").checked = true; $("rxReplaceWrap").hidden = false; }
      return true;
    } catch (e) { return false; }
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("rxFlags").innerHTML = FLAGS.map(function (f) { return '<button type="button" class="chip" data-f="' + f[0] + '" title="' + qtRxEsc(f[1]) + '" aria-pressed="false">' + f[0] + "</button>"; }).join("");
    document.querySelectorAll("#rxFlags .chip").forEach(function (b) { b.addEventListener("click", function () { b.classList.toggle("active"); b.setAttribute("aria-pressed", b.classList.contains("active")); schedule(); }); });
    $("rxLib").innerHTML = QT_RX_LIB.map(function (x, k) { return '<button type="button" class="chip" data-k="' + k + '">' + qtRxEsc(x[0]) + "</button>"; }).join("");
    document.querySelectorAll("#rxLib .chip").forEach(function (b) { b.addEventListener("click", function () {
      var x = QT_RX_LIB[+b.getAttribute("data-k")]; $("rxPattern").value = x[1]; setFlags(x[2]); $("rxText").value = x[3]; run(); qtTrack("regex_library", { name: x[0] });
    }); });
    if (!readHash()) setFlags("g");
    ["rxPattern", "rxText", "rxReplace"].forEach(function (id) { $(id).addEventListener("input", schedule); });
    $("rxText").addEventListener("scroll", function () { $("rxHighlight").scrollTop = $("rxText").scrollTop; $("rxHighlight").scrollLeft = $("rxText").scrollLeft; });
    $("rxReplaceOn").addEventListener("change", function () { $("rxReplaceWrap").hidden = !$("rxReplaceOn").checked; run(); });
    $("rxLang").addEventListener("change", renderCode);
    $("rxCopyCode").addEventListener("click", function () { qtCopy($("rxCodeOut").textContent, $("rxStatus"), "Code copied"); qtTrack("regex_copy_code", { lang: $("rxLang").value }); });
    $("rxCopyRe").addEventListener("click", function () { qtCopy(qtRxJsLiteral($("rxPattern").value, flags()), $("rxStatus"), "Regex copied"); });
    $("rxCopyOut").addEventListener("click", function () { qtCopy($("rxReplaced").textContent, $("rxStatus"), "Result copied"); });
    $("rxShare").addEventListener("click", function () {
      var h = new URLSearchParams(); h.set("p", $("rxPattern").value); h.set("f", flags());
      var t = $("rxText").value; if (t.length <= 1500) h.set("t", t);
      if ($("rxReplaceOn").checked) h.set("r", $("rxReplace").value);
      history.replaceState(null, "", "#" + h.toString());
      qtCopy(location.href, $("rxStatus"), "Share link copied" + (t.length > 1500 ? " (test text too long to include)" : ""));
      qtTrack("regex_share");
    });
    run();
  });
})();

if (typeof module !== "undefined") module.exports = { qtRegexExplain: qtRegexExplain, qtRegexCode: qtRegexCode, qtRxJsLiteral: qtRxJsLiteral };
