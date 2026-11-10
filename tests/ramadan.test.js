// Tests for ramadan.js: zakat al-fitr, fidya, Ramadan/Eid dates (Umm al-Qura) and countdown splitting.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const H = require(ROOT + "/hijri.js");
global.qtToHijri = H.qtToHijri; global.qtFromHijri = H.qtFromHijri;
const R = require(ROOT + "/ramadan.js");
let n = 0; const near = (a, b, m) => { assert.ok(Math.abs(a - b) < 1e-9, m + ": " + a + " vs " + b); n++; };
const iso = (d) => d.toISOString().slice(0, 10);

// Zakat al-fitr: 5 people × 3 kg = 15 kg; at 8 per kg = 120.
const f = R.qtFitr(5, 3, 8); near(f.kg, 15, "kg"); near(f.cash, 120, "cash");
near(R.qtFitr(4, 2.5).kg, 10, "2.5 kg each"); assert.ok(isNaN(R.qtFitr(4, 2.5).cash)); n++;
near(R.qtFitr(2.7, 3).persons, 2, "whole persons");
near(R.qtFidya(10, 15).total, 150, "fidya"); assert.ok(isNaN(R.qtFidya(10, 0).total)); n++;

// Ramadan 1447 AH (Umm al-Qura): 1 Ramadan = 18 Feb 2026, Eid = 20 Mar 2026.
const before = R.qtRamadanInfo(new Date(Date.UTC(2026, 0, 10, 12)));
assert.strictEqual(before.year, 1447); assert.strictEqual(iso(before.start), "2026-02-18"); assert.strictEqual(iso(before.eid), "2026-03-20"); assert.strictEqual(before.inRamadan, false); n += 4;
const during = R.qtRamadanInfo(new Date(Date.UTC(2026, 1, 27, 12)));
assert.strictEqual(during.inRamadan, true); assert.strictEqual(during.day, 10); assert.strictEqual(during.year, 1447); n += 3;
// From Eid day (and today, Nov 2026) the next Ramadan is 1448 AH.
const eid = R.qtRamadanInfo(new Date(Date.UTC(2026, 2, 20, 12)));
assert.strictEqual(eid.year, 1448); assert.strictEqual(eid.inRamadan, false); n += 2;
const now = R.qtRamadanInfo(new Date(Date.UTC(2026, 10, 10, 12)));
assert.strictEqual(now.year, 1448); assert.strictEqual(iso(now.start), "2027-02-08"); n += 2;
assert.ok(now.days === 29 || now.days === 30); n++;

assert.deepStrictEqual(R.qtSplit(((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000), { d: 2, h: 3, m: 4, s: 5 }); n++;
assert.deepStrictEqual(R.qtSplit(-5), { d: 0, h: 0, m: 0, s: 0 }); n++;
console.log("ramadan tests:", n, "passed");
