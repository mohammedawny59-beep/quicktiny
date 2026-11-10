// Submit URLs to IndexNow (Bing, Yandex, Seznam, Naver… share submissions).
// usage:
//   node tools/indexnow.mjs --all                 every URL in sitemap.xml
//   node tools/indexnow.mjs --since <git-ref>     only URLs added to sitemap.xml since <git-ref>
//   node tools/indexnow.mjs --dry-run ...         print what would be sent
// The key is the 32-hex .txt file at the repo root that contains its own name (already served by the site).
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "quicktinyv2.vercel.app", BASE = "https://" + HOST;
const args = process.argv.slice(2), dry = args.includes("--dry-run");
const keyFile = fs.readdirSync(ROOT).find((f) => /^[0-9a-f]{32}\.txt$/.test(f) && fs.readFileSync(path.join(ROOT, f), "utf8").trim() === f.slice(0, 32));
if (!keyFile) { console.error("No IndexNow key file found at the repo root."); process.exit(1); }
const key = keyFile.slice(0, 32);
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const now = locs(fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8"));
let urls = now;
const si = args.indexOf("--since");
if (si !== -1) {
  let before = [];
  try { before = locs(execSync("git show " + args[si + 1] + ":sitemap.xml", { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); } catch (e) {}
  const old = new Set(before); urls = now.filter((u) => !old.has(u));
} else if (!args.includes("--all")) { console.error("Pass --all or --since <git-ref>."); process.exit(1); }
urls = urls.filter((u) => u.startsWith(BASE));
if (!urls.length) { console.log("Nothing new to submit."); process.exit(0); }
console.log((dry ? "[dry run] " : "") + "Submitting " + urls.length + " URL(s) with key " + key.slice(0, 6) + "…");
if (dry) { urls.forEach((u) => console.log("  " + u)); process.exit(0); }
for (let i = 0; i < urls.length; i += 10000) {
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key, keyLocation: BASE + "/" + keyFile, urlList: urls.slice(i, i + 10000) }),
  });
  const body = (await r.text()).slice(0, 300);
  console.log("IndexNow response:", r.status, r.statusText, body);
  if (r.status !== 200 && r.status !== 202) process.exitCode = 1;
}
