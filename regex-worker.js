// QuickTiny Regex Tester worker — runs the user's pattern off the main thread so a
// catastrophic (exponential) pattern can be killed instead of freezing the tab.
var MAX = 5000;
self.onmessage = function (e) {
  var d = e.data, out = { id: d.id, matches: [], truncated: false };
  try {
    var re = new RegExp(d.pattern, d.flags);
    var global = re.global || re.sticky;
    if (!global) {
      var m = re.exec(d.text);
      if (m) out.matches.push(pack(m));
    } else {
      var m2; re.lastIndex = 0;
      while ((m2 = re.exec(d.text)) !== null) {
        out.matches.push(pack(m2));
        if (m2[0] === "") re.lastIndex = adv(d.text, re.lastIndex, re.unicode || re.unicodeSets);
        if (out.matches.length >= MAX) { out.truncated = true; break; }
      }
    }
    if (d.replace !== null && d.replace !== undefined) out.replaced = d.text.replace(new RegExp(d.pattern, d.flags), d.replace);
  } catch (err) { out.error = String(err.message || err); }
  self.postMessage(out);
};
function adv(s, i, u) {
  if (u && i < s.length) { var c = s.charCodeAt(i); if (c >= 0xd800 && c <= 0xdbff) return i + 2; }
  return i + 1;
}
function pack(m) {
  return { i: m.index, s: m[0], g: Array.prototype.slice.call(m, 1).map(function (x) { return x === undefined ? null : x; }),
    n: m.groups ? JSON.parse(JSON.stringify(m.groups, function (k, v) { return v === undefined ? null : v; })) : null,
    ix: m.indices ? Array.prototype.slice.call(m.indices) : null };
}
