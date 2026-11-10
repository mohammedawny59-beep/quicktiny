const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const Z = require(ROOT + "/zatca.js");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// Reference example widely used in ZATCA phase-1 documentation and SDKs.
const ref = Z.qtZatcaTLV({ seller: "Bobs Records", vat: "310122393500003", time: "2022-04-25T15:30:00Z", total: "1000.00", vatTotal: "150.00" });
ok(ref === "AQxCb2JzIFJlY29yZHMCDzMxMDEyMjM5MzUwMDAwMwMUMjAyMi0wNC0yNVQxNTozMDowMFoEBzEwMDAuMDAFBjE1MC4wMA==", "reference TLV: " + ref);

// Arabic seller name: length is counted in UTF-8 bytes, not characters
const ar = Z.qtZatcaTLV({ seller: "مؤسسة الرياض", vat: "300000000000003", time: "2026-11-10T14:30:00+03:00", total: "1150.00", vatTotal: "150.00" });
const raw = Buffer.from(ar, "base64");
ok(raw[0] === 1 && raw[1] === Buffer.byteLength("مؤسسة الرياض", "utf8"), "UTF-8 byte length for Arabic name");
const d = Z.qtZatcaDecode(ar);
ok(!d.error && d.tags[1] === "مؤسسة الرياض" && d.tags[2] === "300000000000003" && d.tags[4] === "1150.00" && d.tags[5] === "150.00", "round trip");
ok(Z.qtZatcaCheck(d.tags).issues.length === 0, "valid invoice has no issues: " + Z.qtZatcaCheck(d.tags).issues.join(" / "));

// Validation
ok(Z.qtVatNumberValid("310122393500003"), "valid VAT number");
ok(!Z.qtVatNumberValid("210122393500003"), "must start with 3");
ok(!Z.qtVatNumberValid("31012239350000"), "must be 15 digits");
ok(!Z.qtVatNumberValid("310122393500001"), "must end with 3");
const badVat = Z.qtZatcaCheck({ 1: "x", 2: "123", 3: "2026-01-01T10:00:00Z", 4: "115.00", 5: "15.00" });
ok(badVat.issues.some((s) => /الرقم الضريبي/.test(s)), "flags bad VAT number");
const wrongVat = Z.qtZatcaCheck({ 1: "x", 2: "310122393500003", 3: "2026-01-01T10:00:00Z", 4: "115.00", 5: "10.00" });
ok(wrongVat.issues.some((s) => /15%/.test(s)), "flags VAT amount mismatch");
const missing = Z.qtZatcaCheck({ 1: "x", 2: "310122393500003" });
ok(missing.issues.length === 3, "flags 3 missing tags");
ok(Z.qtZatcaDecode("https://example.com").error, "rejects non-base64");
ok(Z.qtZatcaDecode("AQxCb2Jz").error, "rejects truncated TLV");

// Overlong field
assert.throws(() => Z.qtZatcaTLV({ seller: "x".repeat(300), vat: "3", time: "t", total: "1", vatTotal: "1" })); n++;

// Local ISO timestamp format
ok(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/.test(Z.qtIsoLocal(new Date(2026, 10, 10, 9, 5, 7))), "ISO local format");
console.log("zatca tests:", n, "passed");
