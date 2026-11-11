// Tests for salary.js (Saudi net salary and GOSI contributions).
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const S = require(ROOT + "/salary.js");
let n = 0; const near = (a, b, m) => { assert.ok(Math.abs(a - b) < 1e-6, m + ": " + a + " vs " + b); n++; };
// New-system annuity schedule: 9% until 3 Jul 2025, then +0.5 each 3 July up to 11%.
near(S.qtGosiNewAnnuity(new Date(Date.UTC(2025, 0, 1))), 9, "Jan 2025");
near(S.qtGosiNewAnnuity(new Date(Date.UTC(2025, 6, 3))), 9.5, "3 Jul 2025");
near(S.qtGosiNewAnnuity(new Date(Date.UTC(2026, 10, 11))), 10, "Nov 2026");
near(S.qtGosiNewAnnuity(new Date(Date.UTC(2028, 6, 3))), 11, "Jul 2028");
near(S.qtGosiNewAnnuity(new Date(Date.UTC(2031, 0, 1))), 11, "capped at 11");
// Saudi, old system: basic 10,000 + housing 2,500 + transport 1,000 -> base 12,500.
const a = S.qtSalary({ basic: 10000, housing: 2500, transport: 1000, saudi: true, system: "old" });
near(a.gross, 13500, "gross"); near(a.base, 12500, "contribution base");
near(a.employee.total, 12500 * 0.0975, "employee 9.75%"); near(a.net, 13500 - 1218.75, "net");
near(a.employer.total, 12500 * 0.1175, "employer 11.75%"); near(a.cost, 13500 + 1468.75, "employer cost");
// New system in Nov 2026: 10% + 0.75%.
const b = S.qtSalary({ basic: 10000, housing: 2500, saudi: true, system: "new", date: new Date(Date.UTC(2026, 10, 11)) });
near(b.employee.total, 12500 * 0.1075, "new-system employee 10.75%");
// Non-Saudi: no employee deduction, employer pays 2% hazards only.
const c = S.qtSalary({ basic: 8000, housing: 2000, saudi: false });
near(c.employee.total, 0, "non-Saudi employee"); near(c.employer.total, 200, "non-Saudi hazards 2%"); near(c.net, 10000, "non-Saudi net");
// Cap at 45,000.
const d = S.qtSalary({ basic: 50000, housing: 12500, saudi: true, system: "old" });
near(d.base, 45000, "cap"); near(d.employee.total, 45000 * 0.0975, "capped deduction");
// Manual annuity override.
near(S.qtSalary({ basic: 10000, saudi: true, system: "new", annuity: 11 }).employee.total, 10000 * 0.1175, "override 11%");
console.log("salary tests:", n, "passed");
