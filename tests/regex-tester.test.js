const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const R = require(ROOT + "/regex-tester.js");
const d = (p, f) => R.qtRegexExplain(p, f || "").map((x) => x.token + " => " + x.desc);
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

let e = d("^(?<user>[\\w.]+)@example\\.com$", "m");
ok(e[0] === "^ => Start of a line", "multiline ^");
ok(e[1] === '(?<user> => Capture group #1 named "user"', "named group");
ok(/^\[\\w\.\]\+ => Match one of: a word character .*, "\.", one or more times/.test(e[2]), "class + quantifier");
ok(e.includes('@example\\.com => Match the text "@example.com"'), "escaped literal merged");
e = d("colou?r");
ok(e.join("|") === 'colo => Match the text "colo"|u? => Match the character "u", optionally (zero or one time)|r => Match the text "r"', "quantifier splits last literal");
e = d("(ab)+");
ok(/^\)\+ => End of capture group #1 — repeat the whole group one or more times/.test(e[2]), "group quantifier");
e = d("\\b(\\w+)\\s+\\1\\b", "gi");
ok(e.includes("\\1 => Match the same text as group #1 again"), "backreference");
e = d("[\\u0600-\\u06FF]+(?<!\\$)", "u");
ok(/U\+0600 "؀" to U\+06FF "ۿ"/.test(e[0]), "unicode range in class");
ok(e.includes(") => End of negative lookbehind"), "lookbehind close");
ok(d("a{2,4}?")[0] === "a{2,4}? => Match the character \"a\", between 2 and 4 times — as few as possible (lazy)", "lazy range");

const py = R.qtRegexCode("py", "(?<y>\\d{4})\\k<y>", "gim");
ok(py.includes('re.compile(r"(?P<y>\\d{4})(?P=y)", re.IGNORECASE | re.MULTILINE)') || py.includes("re.compile(r'(?P<y>\\d{4})(?P=y)', re.IGNORECASE | re.MULTILINE)"), "python conversion");
const php = R.qtRegexCode("php", "a\\\\b\\d'/x", "g").match(/'(.*)'/)[1].replace(/\\(['\\])/g, "$1");
ok(php === "/a\\\\b\\d'\\/x/", "php escaping round-trip: " + php);
ok(R.qtRegexCode("java", "\\d\"", "i").includes('Pattern.compile("\\\\d\\"", Pattern.CASE_INSENSITIVE)'), "java string escaping");
ok(R.qtRxJsLiteral("a/b", "g") === "/a\\/b/g", "js literal escapes slash");
console.log("regex tests:", n, "passed");
