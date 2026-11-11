// QuickTiny brand kit: your colour, font and channel name saved once in this browser (localStorage, never uploaded)
// and applied automatically by every creator studio. Load before the studio script.
//   qtBrand.get()            -> {accent, font, name, tagline} or null
//   qtBrand.apply(st, map)   -> copies brand fields into a studio's state, e.g. map {accent: "accent", font: "font"}
var qtBrand = (function () {
  var KEY = "qtBrandKit";
  function valid(b) {
    if (!b || typeof b !== "object") return null;
    var o = {};
    if (/^#[0-9a-f]{6}$/i.test(b.accent || "")) o.accent = b.accent.toLowerCase();
    if (b.font === "bold" || b.font === "sans") o.font = b.font;
    if (typeof b.name === "string" && b.name.trim()) o.name = b.name.trim().slice(0, 40);
    if (typeof b.tagline === "string" && b.tagline.trim()) o.tagline = b.tagline.trim().slice(0, 50);
    return Object.keys(o).length ? o : null;
  }
  function get() { try { return valid(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) { return null; } }
  function set(b) { var v = valid(b); try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (e) {} return v; }
  function apply(st, map, brand) {
    var b = brand === undefined ? get() : valid(brand); if (!b || !st) return false;
    var changed = false;
    for (var k in map) if (b[k] != null) { st[map[k]] = b[k]; changed = true; }
    return changed;
  }
  return { get: get, set: set, apply: apply, valid: valid };
})();
if (typeof window !== "undefined") window.qtBrand = qtBrand;

// Brand kit editor (on the Creator Studio pages)
(function () {
  if (typeof document === "undefined") return;
  var f = document.getElementById("bkForm"); if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  function fill() {
    var b = qtBrand.get() || {};
    $("bkName").value = b.name || ""; $("bkTag").value = b.tagline || ""; $("bkAccent").value = b.accent || "#ffd400"; $("bkFont").value = b.font || "bold";
    preview(); $("bkClear").hidden = !qtBrand.get();
  }
  function preview() {
    var p = $("bkPreview"); p.style.setProperty("--bk", $("bkAccent").value);
    p.querySelector("b").textContent = $("bkName").value || (AR ? "اسم قناتك" : "Your channel");
    p.querySelector("span").textContent = $("bkTag").value || (AR ? "وصف قصير" : "Short tagline");
    p.classList.toggle("sans", $("bkFont").value === "sans");
  }
  ["bkName", "bkTag", "bkAccent", "bkFont"].forEach(function (id) { $(id).addEventListener("input", preview); $(id).addEventListener("change", preview); });
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    qtBrand.set({ name: $("bkName").value, tagline: $("bkTag").value, accent: $("bkAccent").value, font: $("bkFont").value });
    $("bkStatus").textContent = AR ? "✓ تم الحفظ — كل الاستوديوهات ستستخدم هويتك تلقائيًا." : "✓ Saved — every studio will use your brand automatically.";
    $("bkClear").hidden = false;
    if (typeof qtEvent === "function") qtEvent("brand_saved");
  });
  $("bkClear").addEventListener("click", function () { qtBrand.set(null); fill(); $("bkStatus").textContent = AR ? "تم حذف الهوية." : "Brand kit cleared."; });
  fill();
})();
if (typeof module !== "undefined") module.exports = { qtBrand: qtBrand };
