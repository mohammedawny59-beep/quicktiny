// Static checks over every HTML page — no browser needed.
//  • sitemap URLs exist as files and every indexable page is in the sitemap
//  • internal links and assets (href/src="/...") resolve to a file
//  • each page has <title>, meta description, a canonical matching its path, and an <h1>
//  • hreflang alternates point to existing pages; no stray Google Fonts; no duplicate ids
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://quicktinyv2.vercel.app";
const SKIP_DIRS = new Set(["node_modules", ".git", ".github", "tests", "tools", "vendor", "api", ".claude", "data"]);
const problems = [];
const bad = (file, msg) => problems.push(file + ": " + msg);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith(".html")) out.push(path.join(dir, e.name));
  }
  return out;
}
const pages = walk(ROOT);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");
const slugOf = (f) => { const r = rel(f).replace(/\.html$/, ""); return r === "index" ? "" : r; };
const exists = (urlPath) => {
  const p = decodeURIComponent(urlPath.split(/[?#]/)[0]).replace(/^\//, "");
  if (p === "") return true;
  const full = path.join(ROOT, p);
  return fs.existsSync(full + ".html") || (fs.existsSync(full) && fs.statSync(full).isFile()) || fs.existsSync(path.join(full, "index.html"));
};

const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const smUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const smSet = new Set(smUrls.map((u) => u.replace(BASE, "").replace(/^\//, "")));
for (const u of smUrls) if (!exists(u.replace(BASE, ""))) bad("sitemap.xml", "missing page for " + u);
if (smSet.size !== smUrls.length) bad("sitemap.xml", "duplicate URLs");

let links = 0;
for (const f of pages) {
  const html = fs.readFileSync(f, "utf8"), r = rel(f), slug = slugOf(f);
  if (/^embed|^d2edb|google[0-9a-f]+\.html|^404/.test(r)) continue;
  const noindex = /<meta name="robots" content="[^"]*noindex/i.test(html);
  if (!/<title>[^<]{5,}<\/title>/.test(html)) bad(r, "missing <title>");
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) bad(r, "missing meta description");
  if (!/<h1[\s>]/.test(html)) bad(r, "missing <h1>");
  const can = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (!noindex) {
    if (!can) bad(r, "missing canonical");
    else if (can.replace(/\/$/, "") !== (BASE + "/" + slug).replace(/\/$/, "")) bad(r, "canonical " + can + " != " + slug);
    if (!smSet.has(slug)) bad(r, "not in sitemap");
  }
  for (const m of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)) {
    if (!exists(m[2].replace(BASE, ""))) bad(r, "hreflang " + m[1] + " points to missing " + m[2]);
  }
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html)) bad(r, "loads Google Fonts (fonts are self-hosted)");
  for (const m of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
    const u = m[1];
    if (u.startsWith("//") || u.startsWith("/api/") || u.startsWith("/_vercel/")) continue;
    links++;
    if (!exists(u)) bad(r, "broken link " + u);
  }
  const ids = {}; for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids[m[1]] = (ids[m[1]] || 0) + 1;
  const dups = Object.keys(ids).filter((k) => ids[k] > 1);
  if (dups.length) bad(r, "duplicate ids: " + dups.join(", "));
}
console.log(`site check: ${pages.length} pages, ${smUrls.length} sitemap URLs, ${links} internal links`);
if (problems.length) { console.log(problems.length + " problem(s):\n  " + problems.join("\n  ")); process.exitCode = 1; }
else console.log("site check: no problems");
