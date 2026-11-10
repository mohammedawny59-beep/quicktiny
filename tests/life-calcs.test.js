const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const C = require(ROOT + "/life-calcs.js");
let n = 0; const eq = (a, b, m) => { assert.strictEqual(a, b, m + ": " + a + " vs " + b); n++; };
const near = (a, b, tol, m) => { assert.ok(Math.abs(a - b) <= tol, m + ": " + a + " vs " + b); n++; };

// Dates
let d = C.qtDateDiff("2026-01-01", "2026-12-31");
eq(d.days, 364, "days excl end"); eq(C.qtDateDiff("2026-01-01", "2026-12-31", true).days, 365, "incl end");
eq(C.qtDateDiff("2024-01-01", "2025-01-01").days, 366, "leap year");
d = C.qtDateDiff("2020-03-15", "2023-06-14", true); eq(d.y + "/" + d.m + "/" + d.d, "3/3/0", "y/m/d");
eq(C.qtDateDiff("2026-11-16", "2026-11-23").workdays, 5, "Mon→Mon = 5 workdays (Sat/Sun weekend)");
eq(C.qtDateDiff("2026-11-15", "2026-11-22", false, [5, 6]).workdays, 5, "Sun→Sun = 5 workdays (Fri/Sat weekend)");
eq(C.qtDateDiff("2026-12-31", "2026-01-01").sign, -1, "reversed");
eq(C.qtAddDays("2026-11-10", 100), "2027-02-18", "add 100 days");
eq(C.qtAddDays("2026-03-01", -1), "2026-02-28", "subtract across month");

// BMI
const b = C.qtBmi(70, 175); near(b.bmi, 22.857, 0.001, "bmi"); eq(b.cat, "normal", "normal");
eq(C.qtBmi(50, 175).cat, "under", "under"); eq(C.qtBmi(80, 170).cat, "over", "over"); eq(C.qtBmi(130, 170).cat, "ob3", "obesity III");
near(b.min, 56.66, 0.01, "healthy min"); eq(C.qtBmi(0, 170), null, "invalid");

// Pregnancy (Naegele's rule)
let p = C.qtDueDate({ lmp: "2026-01-01" }, "2026-03-12");
eq(p.due, "2026-10-08", "due = LMP + 280"); eq(p.weeks + "w" + p.days, "10w0", "gestational age"); eq(p.trimester, 1, "trimester");
eq(C.qtDueDate({ lmp: "2026-01-01", cycle: 32 }, "2026-03-12").due, "2026-10-12", "cycle adjust +4");
eq(C.qtDueDate({ conception: "2026-01-15" }, "2026-03-12").due, "2026-10-08", "conception + 266");
eq(C.qtDueDate({ lmp: "2026-01-01" }, "2026-08-01").trimester, 3, "3rd trimester");

// Loans
let l = C.qtLoan({ amount: 100000, rate: 5, months: 60, method: "reducing" });
near(l.monthly, 1887.12, 0.01, "amortized payment"); near(l.interest, 13227.4, 0.5, "total interest"); eq(l.schedule.length, 5, "5 yearly rows");
near(l.schedule[4].balance, 0, 0.01, "paid off");
l = C.qtLoan({ amount: 100000, rate: 3, months: 60, method: "flat" });
near(l.monthly, 1916.67, 0.01, "flat payment"); near(l.interest, 15000, 0.01, "flat profit");
assert.ok(l.apr > 5.5 && l.apr < 5.8, "flat 3% ≈ 5.6% effective: " + l.apr); n++;
near(C.qtPmt(1000, 0, 10), 100, 1e-9, "zero rate");
l = C.qtLoan({ amount: 100000, rate: 5, months: 60, method: "reducing", fee: 1000 });
assert.ok(l.apr > 5.3 && l.total > 113227, "fee raises APR: " + l.apr); n++;
eq(C.qtLoan({ amount: 0, rate: 5, months: 12 }), null, "invalid loan");
console.log("life calc tests:", n, "passed");
