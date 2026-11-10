// Every qtEvent("name") used by the site must be on the allow-list in api/qt-event.js, or the endpoint rejects it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const api = fs.readFileSync(path.join(ROOT, "api/qt-event.js"), "utf8");
const allowed = new Set([...api.slice(0, api.indexOf("]);")).matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]));
const used = new Map();
for (const f of fs.readdirSync(ROOT).filter((f) => f.endsWith(".js"))) {
  const s = fs.readFileSync(path.join(ROOT, f), "utf8");
  for (const m of s.matchAll(/qtEvent\("([a-z0-9_]+)"\s*\)/g)) used.set(m[1], f);
  // Prefix + variable, e.g. qtEvent("home_file_" + group): every value must be listed with that prefix.
  for (const m of s.matchAll(/qtEvent\("([a-z0-9_]+_)"\s*\+/g)) if (![...allowed].some((a) => a.startsWith(m[1]))) used.set(m[1] + "*", f);
}
const missing = [...used].filter(([e]) => !allowed.has(e));
if (missing.length) { console.error("events not on the allow-list:", missing.map(([e, f]) => e + " (" + f + ")").join(", ")); process.exit(1); }
console.log("event allow-list:", used.size, "events used, all allowed");
