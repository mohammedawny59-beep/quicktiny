// Tests for templates.js: helpers + every template renders at every size/time without throwing.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const M = require(ROOT + "/templates.js");
let n = 0;
assert.strictEqual(M.TP.count("SAR 1,250,000", 1), "SAR 1,250,000"); n++;
assert.strictEqual(M.TP.count("SAR 1,250,000", .5), "SAR 625,000"); n++;
assert.strictEqual(M.TP.count("3.5M", .5), "1.8M"); n++;
assert.strictEqual(M.TP.count("98%", 0), "0%"); n++;
assert.strictEqual(M.TP.count("no number", .3), "no number"); n++;
assert.deepStrictEqual(M.TP.tokens("We are *very big* now").map((t) => t.hi), [false, false, true, true, false]); n++;
assert.ok(Math.abs(M.TP.spring(1) - 1) < .01 && M.TP.spring(0) === 0); n++;
assert.ok(Math.abs(M.TP.pend(0, .5, 2, 7) - .5) < 1e-9 && Math.abs(M.TP.pend(5, .5, 2, 7)) < .001, "pendulum settles"); n++;
assert.deepStrictEqual(M.qtTpLines("a\n\n b \nc"), ["a", "b", "c"]); n++;
assert.strictEqual(M.QT_TEMPLATES.length, 13); n++;
assert.strictEqual(new Set(M.QT_TEMPLATES.map((t) => t.id)).size, 13, "unique ids"); n++;
// fake 2D context: every method is a no-op, gradients accept stops, measureText ~ length × size
function fakeCtx() {
  const st = { font: "10px x" };
  const grad = { addColorStop() {} };
  return new Proxy(st, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === "measureText") return (s) => { const m = /(\d+(?:\.\d+)?)px/.exec(o.font); return { width: String(s).length * (m ? +m[1] : 10) * .55 }; };
      if (/Gradient$/.test(k)) return () => grad;
      return () => {};
    },
    set(o, k, v) { o[k] = v; return true; }
  });
}
const img = { width: 800, height: 600 };
for (const tpl of M.QT_TEMPLATES) for (const lang of ["en", "ar"]) for (const [W, H] of [[1080, 1920], [1080, 1080], [1920, 1080], [216, 384]]) {
  const f = M.qtTpDefaults(tpl, lang), D = tpl.dur(f);
  assert.ok(D > 2 && D < 15, tpl.id + " duration");
  for (const t of [0, .3, 1, 2, 3.3, D * .9, D]) {
    for (const A of [{}, { img, img2: img }]) {
      const x = fakeCtx(), P = Object.assign({}, M.QT_TP_PALETTES[tpl.pal]);
      try { tpl.draw(x, W, H, t, f, P, A); } catch (e) { throw new Error(tpl.id + " " + lang + " " + W + "x" + H + " t=" + t + ": " + e.message); }
    }
  }
  n++;
}
console.log("templates tests:", n, "passed");
assert.deepStrictEqual(M.TP.tokens("to *big results*.").map((t) => [t.w, t.hi]), [["to", false], ["big", true], ["results.", true]], "closing star before punctuation");
console.log("token punctuation ok");
