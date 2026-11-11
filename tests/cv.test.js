// Tests for cv.js rendering helpers (escaping, bullets, sections, direction).
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const C = require(ROOT + "/cv.js");
let n = 0;
assert.deepStrictEqual(C.qtCvBullets("- one\n• two\n\n* three  "), ["one", "two", "three"]); n++;
const html = C.qtCvHtml({ lang: "en", name: "<script>x</script>", title: "Dev", email: "a@b.c", exp: [{ a: "Engineer", b: "Acme", from: "2020", notes: "- Built X\n- Led Y" }, {}], skills: "SQL, Python", certs: "" });
assert.ok(!html.includes("<script>"), "escapes user text"); n++;
assert.ok(html.includes("&lt;script&gt;"), "keeps the text visible"); n++;
assert.ok(html.includes("2020 – Present"), "open-ended dates say Present"); n++;
assert.ok((html.match(/<li>/g) || []).length === 4, "2 bullets + 2 skills"); n++;
assert.ok(!html.includes("Certifications"), "empty sections are skipped"); n++;
const ar = C.qtCvHtml({ lang: "ar", name: "سارة", exp: [{ a: "محللة", from: "2021", to: "2023" }], skills: "SQL، Excel" });
assert.ok(ar.includes('dir="rtl"') && ar.includes("الخبرات العملية") && ar.includes("2021 – 2023"), "Arabic CV is RTL with Arabic headings"); n++;
assert.ok((ar.match(/<li>/g) || []).length === 2, "Arabic comma splits skills"); n++;
console.log("cv tests:", n, "passed");
