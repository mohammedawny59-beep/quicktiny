// Tests for student.js: GPA scales, cumulative/target GPA, weighted grades, final exam needed, Saudi weighted percentage.
const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const S = require(ROOT + "/student.js");
let n = 0; const near = (a, b, m) => { assert.ok(Math.abs(a - b) < 1e-9, m + ": " + a + " vs " + b); n++; };

// 4-point: 3h A (12) + 3h B+ (9.9) + 2h A- (7.4) + 4h C (8) = 37.3 / 12
near(S.qtGpa([{ credits: 3, letter: "A" }, { credits: 3, letter: "B+" }, { credits: 2, letter: "A-" }, { credits: 4, letter: "C" }], "4").gpa, 37.3 / 12, "4-point semester GPA");
// 5-point (Saudi): 3h A+ (15) + 3h B (12) + 2h F (2, still counts) = 29 / 8
const g5 = S.qtGpa([{ credits: 3, letter: "A+" }, { credits: 3, letter: "B" }, { credits: 2, letter: "F" }], "5");
near(g5.gpa, 29 / 8, "5-point GPA with F = 1"); near(g5.credits, 8, "credits");
// Rows without credits or grade are ignored.
near(S.qtGpa([{ credits: 3, letter: "A" }, { credits: "", letter: "B" }, { credits: 3, letter: "" }], "4").gpa, 4, "blank rows ignored");
assert.ok(isNaN(S.qtGpa([], "4").gpa)); n++;
// Cumulative: previous 3.2 over 60h + this semester 45 points over 15h = (192 + 45) / 75
near(S.qtGpaCumulative(3.2, 60, 45, 15), 237 / 75, "cumulative GPA");
near(S.qtGpaCumulative(NaN, 0, 45, 15), 3, "no previous record");
// Target: from 2.8 over 90h to 3.0 with 15h -> (3*105 - 2.8*90) / 15 = 4.2
near(S.qtGpaNeeded(2.8, 90, 3.0, 15), 4.2, "needed semester GPA");
assert.strictEqual(S.qtGpaRating5(4.5), 0); assert.strictEqual(S.qtGpaRating5(4.49), 1); assert.strictEqual(S.qtGpaRating5(3.75), 1);
assert.strictEqual(S.qtGpaRating5(2.75), 2); assert.strictEqual(S.qtGpaRating5(2), 3); assert.strictEqual(S.qtGpaRating5(1.99), 4); n += 6;
assert.strictEqual(S.qtLetterFromPercent5(95), "A+"); assert.strictEqual(S.qtLetterFromPercent5(89.99), "B+"); assert.strictEqual(S.qtLetterFromPercent5(59), "F"); n += 3;

// Weighted: 18/20 @20 + 25/30 @30 + 41/50 @50 = 18 + 25 + 41 = 84
near(S.qtWeighted([{ score: 18, max: 20, weight: 20 }, { score: 25, max: 30, weight: 30 }, { score: 41, max: 50, weight: 50 }]).pct, 84, "weighted grade");
// Weights that don't add to 100 are normalised; blank scores are skipped (grade so far).
const part = S.qtWeighted([{ score: 90, weight: 20 }, { score: 70, weight: 30 }, { score: "", weight: 50 }]);
near(part.pct, (90 * 20 + 70 * 30) / 50, "grade so far"); near(part.weight, 50, "weight so far");
// Final needed: 78% so far, final worth 40%, want 80% -> (80 - 78*0.6) / 0.4 = 83
near(S.qtFinalNeeded(78, 40, 80), 83, "final exam needed");
assert.ok(isNaN(S.qtFinalNeeded(78, 0, 80))); n++;

// Saudi weighted percentage 30/30/40: 96 high school, 82 Qudurat, 88 Tahsili -> 28.8 + 24.6 + 35.2 = 88.6
near(S.qtSaudiWeighted(96, 82, 88, [30, 30, 40]), 88.6, "Saudi 30/30/40");
// 50/50 without Tahsili ignores the third score.
near(S.qtSaudiWeighted(90, 80, NaN, [50, 50, 0]), 85, "Saudi 50/50");
assert.ok(isNaN(S.qtSaudiWeighted(90, NaN, 80, [30, 30, 40]))); n++;
console.log("student tests:", n, "passed");
