// Runs every test in tests/ and the static site check. Usage: node tests/run-all.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const dir = path.dirname(fileURLToPath(import.meta.url));
const files = fs.readdirSync(dir).filter((f) => /\.test\.m?js$/.test(f)).sort().concat(["site-check.mjs"]);
let failed = 0;
for (const f of files) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(dir, f)], { encoding: "utf8" });
  const out = (r.stdout + r.stderr).trim().split("\n");
  const okRun = r.status === 0;
  if (!okRun) failed++;
  console.log(`${okRun ? "PASS" : "FAIL"}  ${f}  (${Date.now() - t0} ms)  ${out[out.length - 1] || ""}`);
  if (!okRun) console.log("      " + out.slice(-25).join("\n      "));
}
console.log(failed ? `\n${failed} of ${files.length} failed` : `\nall ${files.length} passed`);
process.exit(failed ? 1 : 0);
