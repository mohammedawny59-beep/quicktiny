// QuickTiny Fancy Name Generator / زخرفة أسماء — Unicode text styles for gamer names
// (PUBG, Free Fire, Fortnite, Discord…). Works for Latin and Arabic. All local.

// ---------- Latin font styles (Unicode Mathematical Alphanumeric + friends) ----------
function qtMapRange(text, upper, lower, digits, exceptions) {
  var out = "";
  for (var ch of text) {
    var c = ch.codePointAt(0);
    if (exceptions && exceptions[ch]) { out += exceptions[ch]; continue; }
    if (c >= 65 && c <= 90 && upper) out += String.fromCodePoint(upper + c - 65);
    else if (c >= 97 && c <= 122 && lower) out += String.fromCodePoint(lower + c - 97);
    else if (c >= 48 && c <= 57 && digits) out += String.fromCodePoint(digits + c - 48);
    else out += ch;
  }
  return out;
}
function qtMapChars(text, from, to) {
  var map = {}, f = Array.from(from), t = Array.from(to);
  f.forEach(function (ch, i) { map[ch] = t[i]; });
  return Array.from(text).map(function (ch) { return map[ch] || map[ch.toLowerCase()] || ch; }).join("");
}
var QT_ABC = "abcdefghijklmnopqrstuvwxyz";
var QT_LATIN_STYLES = [
  { id: "bold",      label: "Bold",            fn: function (t) { return qtMapRange(t, 0x1D400, 0x1D41A, 0x1D7CE); } },
  { id: "script",    label: "Script",          fn: function (t) { return qtMapRange(t, 0x1D4D0, 0x1D4EA, 0x1D7CE); } },
  { id: "fraktur",   label: "Gothic",          fn: function (t) { return qtMapRange(t, 0x1D56C, 0x1D586, 0x1D7CE); } },
  { id: "double",    label: "Double-struck",   fn: function (t) { return qtMapRange(t, 0x1D538, 0x1D552, 0x1D7D8, { C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ" }); } },
  { id: "sansbold",  label: "Sans bold",       fn: function (t) { return qtMapRange(t, 0x1D5D4, 0x1D5EE, 0x1D7EC); } },
  { id: "italic",    label: "Bold italic",     fn: function (t) { return qtMapRange(t, 0x1D468, 0x1D482, 0x1D7CE); } },
  { id: "mono",      label: "Monospace",       fn: function (t) { return qtMapRange(t, 0x1D670, 0x1D68A, 0x1D7F6); } },
  { id: "smallcaps", label: "Small caps",      fn: function (t) { return qtMapChars(t, QT_ABC, "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ"); } },
  { id: "circled",   label: "Bubbles",         fn: function (t) { return qtMapRange(t, 0x24B6, 0x24D0, null, { "0": "⓪", "1": "①", "2": "②", "3": "③", "4": "④", "5": "⑤", "6": "⑥", "7": "⑦", "8": "⑧", "9": "⑨" }); } },
  { id: "squared",   label: "Squares",         fn: function (t) { return qtMapRange(t.toUpperCase(), 0x1F130, null, null); } },
  { id: "wide",      label: "Wide",            fn: function (t) { return qtMapRange(t, 0xFF21, 0xFF41, 0xFF10); } },
  { id: "asian",     label: "Asian style",     fn: function (t) { return qtMapChars(t, QT_ABC, "卂乃匚ᗪ乇千Ꮆ卄丨ﾌҜㄥ爪几ㄖ卩Ɋ尺丂ㄒㄩᐯ山乂ㄚ乙"); } }
];

// ---------- Arabic styles ----------
// Letters that never connect to the following letter: no tatweel after them.
var QT_AR_NONJOIN = "اأإآٱدذرزوؤةءى";
function qtIsArabic(ch) { return /[؀-ۿ]/.test(ch); }
function qtTatweel(t, k, mark) {
  var chars = Array.from(t), out = "";
  chars.forEach(function (ch, i) {
    out += ch;
    var next = chars[i + 1];
    if (next && qtIsArabic(ch) && qtIsArabic(next) && QT_AR_NONJOIN.indexOf(ch) === -1 && !/[ً-ٰٟ]/.test(next)) {
      out += (mark || "") + "ـ".repeat(k);
    }
  });
  return out;
}
var QT_ARABIC_STYLES = [
  { id: "t1", label: "تطويل",            fn: function (t) { return qtTatweel(t, 1); } },
  { id: "t2", label: "تطويل مزدوج",       fn: function (t) { return qtTatweel(t, 2); } },
  { id: "t3", label: "تطويل طويل",        fn: function (t) { return qtTatweel(t, 3); } },
  { id: "sh", label: "شدّة",              fn: function (t) { return qtTatweel(t, 1, "ّ"); } },
  { id: "al", label: "ألف خنجرية",        fn: function (t) { return qtTatweel(t, 1, "ٰ"); } },
  { id: "dm", label: "ضمّة",              fn: function (t) { return qtTatweel(t, 1, "ُ"); } }
];

// ---------- Frames (decorations around the whole name) ----------
var QT_FRAMES = [
  ["亗 ", " 亗"], ["꧁", "꧂"], ["𓆩", "𓆪"], ["『", "』"], ["〖", "〗"], ["★彡", "彡★"], ["⚡", "⚡"],
  ["乂", "乂"], ["么", "么"], ["ᴳᵒᵈ ", ""], ["ツ", "ツ"], ["☬", "☬"], ["✿", "✿"], ["⫷", "⫸"], ["•", "•"], ["", " ♛"]
];

function qtDecorate(name) {
  name = String(name || "").trim();
  if (!name) return [];
  var hasArabic = Array.from(name).some(qtIsArabic);
  var hasLatin = /[A-Za-z0-9]/.test(name);
  var styled = [];
  if (hasArabic) QT_ARABIC_STYLES.forEach(function (s) { styled.push({ style: s.label, text: s.fn(name) }); });
  if (hasLatin) QT_LATIN_STYLES.forEach(function (s) { styled.push({ style: s.label, text: s.fn(name) }); });
  if (!styled.length) styled.push({ style: "", text: name });
  // Pair styles with frames so every row is a different look.
  var out = [], seen = {};
  styled.forEach(function (s, i) {
    var f = QT_FRAMES[i % QT_FRAMES.length];
    [s.text, f[0] + s.text + f[1]].forEach(function (txt) { if (!seen[txt]) { seen[txt] = 1; out.push({ style: s.style, text: txt }); } });
  });
  QT_FRAMES.forEach(function (f) { var txt = f[0] + (hasArabic ? qtTatweel(name, 1) : name) + f[1]; if (!seen[txt]) { seen[txt] = 1; out.push({ style: "", text: txt }); } });
  return out;
}
function qtLen(s) { return Array.from(s).length; }

(function () {
  if (typeof document === "undefined") return;
  var ar = document.documentElement.lang === "ar";
  var L = ar ? { copy: "نسخ", copied: "تم النسخ ✓", chars: "حرف", empty: "اكتب اسمك بالأعلى لتظهر الزخارف." }
             : { copy: "Copy", copied: "Copied ✓", chars: "chars", empty: "Type your name above to see the styles." };
  function render() {
    var name = document.getElementById("ndInput").value, list = document.getElementById("ndList");
    var items = qtDecorate(name);
    list.innerHTML = "";
    if (!items.length) { list.innerHTML = '<p class="result">' + L.empty + "</p>"; return; }
    items.forEach(function (it) {
      var row = document.createElement("div"); row.className = "nd-row";
      var t = document.createElement("span"); t.className = "nd-text"; t.textContent = it.text; t.dir = "auto";
      var meta = document.createElement("span"); meta.className = "nd-meta"; meta.textContent = (it.style ? it.style + " · " : "") + qtLen(it.text) + " " + L.chars;
      var b = document.createElement("button"); b.type = "button"; b.className = "btn btn-secondary nd-copy"; b.textContent = L.copy;
      b.addEventListener("click", async function () {
        try { await navigator.clipboard.writeText(it.text); b.textContent = L.copied; row.classList.add("copied"); qtTrack("name_decorator_copy"); }
        catch (e) { var r = document.createRange(); r.selectNodeContents(t); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
        setTimeout(function () { b.textContent = L.copy; row.classList.remove("copied"); }, 1400);
      });
      var left = document.createElement("div"); left.className = "nd-left"; left.appendChild(t); left.appendChild(meta);
      row.appendChild(left); row.appendChild(b); list.appendChild(row);
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    var i = document.getElementById("ndInput");
    i.addEventListener("input", render);
    document.querySelectorAll("[data-example]").forEach(function (b) { b.addEventListener("click", function () { i.value = b.getAttribute("data-example"); render(); i.focus(); }); });
    render();
  });
})();

if (typeof module !== "undefined") module.exports = { qtDecorate: qtDecorate, qtTatweel: qtTatweel, QT_LATIN_STYLES: QT_LATIN_STYLES, qtLen: qtLen };
