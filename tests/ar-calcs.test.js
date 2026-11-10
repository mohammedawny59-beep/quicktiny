const ROOT = require("path").join(__dirname, "..");
const C = require(ROOT + "/ar-calcs.js");
const T = require(ROOT + "/tafqeet.js");
let pass = 0, fail = 0;
const eq = (name, got, exp, tol = 0.01) => { const ok = typeof exp === "number" ? Math.abs(got - exp) <= tol : got === exp; if (ok) pass++; else { fail++; console.log("FAIL", name, "got", got, "expected", exp); } };
// VAT
let v = C.qtVat([{ qty: 1, price: 1000 }], 15, false, 2); eq("SA add net", v.net, 1000); eq("SA add vat", v.vat, 150); eq("SA add total", v.total, 1150);
v = C.qtVat([{ qty: 1, price: 1150 }], 15, true, 2); eq("SA extract net", v.net, 1000); eq("SA extract vat", v.vat, 150);
v = C.qtVat([{ qty: 3, price: 19.99 }, { qty: 2, price: 5.5 }], 5, false, 2); eq("AE multi net", v.net, 70.97); eq("AE vat", v.vat, 3.55); eq("AE total", v.total, 74.52);
v = C.qtVat([{ qty: 1, price: 99.999 }], 10, true, 3); eq("BH 3dec net", v.net, 90.908); eq("BH vat", v.vat, 9.091);
v = C.qtVat([{ qty: "x", price: 10 }], 15, false, 2); eq("bad qty ignored", v.total, 0);
// Zakat
let z = C.qtZakat({ cash: 20000, goldPrice24: 400, basis: "gold" }); eq("nisab gold", z.nisab, 34000); eq("below nisab", z.due, false);
z = C.qtZakat({ cash: 30000, goldG: { 21: 100 }, goldPrice24: 400, debts: 5000, basis: "gold" });
eq("pure gold 21k", z.pureGold, 87.5); eq("gold value", z.goldValue, 35000); eq("net", z.net, 60000); eq("zakat", z.zakat, 1500);
z = C.qtZakat({ cash: 2000, silverPrice: 4, basis: "silver" }); eq("silver nisab", z.nisab, 2380); eq("silver below", z.due, false);
z = C.qtZakat({ cash: 2500, silverPrice: 4, basis: "silver" }); eq("silver due", z.zakat, 62.5);
z = C.qtZakat({ cash: 100000 }); eq("no price -> unknown", z.nisabKnown, false);
// Service span
let s = C.qtServiceSpan("2019-01-01", "2025-12-31"); eq("span y", s.y, 7); eq("span m", s.m, 0); eq("span d", s.d, 0);
s = C.qtServiceSpan("2020-03-15", "2023-06-14"); eq("span2", s.y + "/" + s.m + "/" + s.d, "3/3/0");
// Saudi EOS
const sa = (start, end, reason, wage = 10000) => C.qtEndOfService({ country: "SA", start, end, wage, reason });
eq("SA 7y end", sa("2019-01-01", "2025-12-31", "end").award, 45000);
eq("SA 7y resign 2/3", sa("2019-01-01", "2025-12-31", "resign").award, 30000);
eq("SA 3y resign 1/3", sa("2023-01-01", "2025-12-31", "resign").award, 5000);
eq("SA 1.5y resign 0", sa("2024-07-01", "2025-12-31", "resign").award, 0);
eq("SA 12y resign full", sa("2014-01-01", "2025-12-31", "resign").award, 95000);
eq("SA art80", sa("2019-01-01", "2025-12-31", "art80").award, 0);
eq("SA art87 3y full", sa("2023-01-01", "2025-12-31", "art87").award, 15000);
// UAE EOS
const ae = (start, end, wage = 10000) => C.qtEndOfService({ country: "AE", start, end, wage });
const daily = 10000 * 12 / 365;
eq("AE 3y", ae("2023-01-01", "2025-12-31").award, 3 * 21 * daily);
eq("AE 10y", ae("2016-01-01", "2025-12-31").award, (105 + 150) * daily);
eq("AE 30y cap", ae("1996-01-01", "2025-12-31").award, 240000);
eq("AE <1y", ae("2025-03-01", "2025-12-31").award, 0);
eq("bad dates", !!C.qtEndOfService({ country: "SA", start: "2025-01-01", end: "2024-01-01" }).error, true);
// tafqeet integration
eq("words", T.qtTafqeet("1150.00", "SAR", { only: true }).text, "فقط ألف ومائة وخمسون ريالاً لا غير");
console.log("calc tests:", pass, "passed,", fail, "failed");
if (fail) process.exitCode = 1;
