// Renders a 1200×630 share image per tool family and points each page's og:image / twitter:image at it.
// Needs puppeteer-core (any install) and Edge or Chrome:  PUPPETEER_CORE=<path to puppeteer-core> node tools/og_images.mjs [browserPath]
// Output: assets/og/<key>.jpg (via a PNG screenshot converted to JPEG by the browser itself).
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://quicktinyv2.vercel.app";
const browserPath = process.argv[2] || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const puppeteer = (await import(pathToFileURL(process.env.PUPPETEER_CORE || "puppeteer-core").href.replace(/^file:\/\/\/(?!.*\.m?js$).*$/, (u) => u + "/lib/esm/puppeteer/puppeteer-core.js"))).default;
const fams = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/specs/og_families.json"), "utf8"));
const b64 = (p) => fs.readFileSync(path.join(ROOT, p)).toString("base64");
const SORA = b64("fonts/sora-latin.woff2");
fs.mkdirSync(path.join(ROOT, "assets/og"), { recursive: true });

function html(f) {
  const ar = f.lang === "ar";
  return `<!doctype html><html lang="${f.lang}" dir="${ar ? "rtl" : "ltr"}"><head><meta charset="utf-8"><style>
@font-face{font-family:Sora;src:url(data:font/woff2;base64,${SORA}) format("woff2");font-weight:400 800}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;background:#05060f;color:#fff;font-family:${ar ? '"Segoe UI",Tahoma,Arial' : "Sora,'Segoe UI',Arial"},sans-serif;position:relative}
.glow1{position:absolute;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(107,107,255,.55),transparent 65%);top:-260px;${ar ? "left" : "right"}:-180px}
.glow2{position:absolute;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,rgba(59,226,255,.28),transparent 65%);bottom:-300px;${ar ? "right" : "left"}:-120px}
.wrap{position:absolute;inset:0;padding:70px 80px;display:flex;align-items:center;gap:56px}
.icon{width:300px;height:300px;flex:none;filter:drop-shadow(0 30px 60px rgba(91,91,255,.55))}
.txt{flex:1;min-width:0}
.brand{font-family:Sora,sans-serif;font-weight:700;font-size:34px;letter-spacing:-.01em;margin-bottom:26px;direction:ltr;text-align:${ar ? "right" : "left"}}
.brand span{color:#3be2ff}
h1{font-weight:800;font-size:${f.title.length > 22 ? 62 : 74}px;line-height:1.08;letter-spacing:${ar ? "0" : "-.03em"};background:linear-gradient(120deg,#fff 30%,#b9bcff 70%,#7ff0ff);-webkit-background-clip:text;color:transparent;padding-bottom:6px}
p{margin-top:22px;font-size:30px;color:#c7c9e8;line-height:1.35}
.pills{margin-top:34px;display:flex;gap:12px;flex-wrap:wrap}
.pill{font-size:22px;padding:9px 20px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#e4e6ff}
</style></head><body><div class="glow1"></div><div class="glow2"></div>
<div class="wrap"><img class="icon" src="data:image/webp;base64,${b64("assets/icons/" + f.icon + ".webp")}">
<div class="txt"><div class="brand">QuickTiny<span>.</span></div><h1>${f.title}</h1><p>${f.sub}</p>
<div class="pills">${(ar ? ["مجاني", "بدون تسجيل", "بدون رفع ملفات"] : ["Free", "No sign-up", "Runs in your browser"]).map((x) => `<span class="pill">${x}</span>`).join("")}</div></div></div></body></html>`;
}

const port = 9350 + Math.floor(Math.random() * 40);
const prof = path.join(ROOT, ".og-profile-" + Date.now());
const edge = spawn(browserPath, ["--headless=new", "--disable-gpu", "--remote-debugging-port=" + port, "--no-first-run", "--user-data-dir=" + prof, "about:blank"], { stdio: "ignore" });
let browser; for (let i = 0; i < 40 && !browser; i++) { try { browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:" + port }); } catch (e) { await new Promise((r) => setTimeout(r, 250)); } }
const page = await browser.newPage(); await page.setViewport({ width: 1200, height: 630 });
const map = {};
for (const f of fams) {
  await page.setContent(html(f), { waitUntil: "load" }); await page.evaluate(() => document.fonts.ready);
  const out = path.join(ROOT, "assets/og", f.key + ".jpg");
  await page.screenshot({ path: out, type: "jpeg", quality: 86 });
  f.pages.forEach((p) => (map[p] = "/assets/og/" + f.key + ".jpg"));
  console.log("rendered", f.key, Math.round(fs.statSync(out).size / 1024) + " KB");
}
await browser.close(); edge.kill(); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}

let n = 0;
for (const [slug, img] of Object.entries(map)) {
  const file = path.join(ROOT, slug + ".html");
  if (!fs.existsSync(file)) { console.warn("missing page", slug); continue; }
  let s = fs.readFileSync(file, "utf8"), o = s;
  s = s.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${BASE}${img}$2`).replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${BASE}${img}$2`);
  if (s !== o) { fs.writeFileSync(file, s); n++; }
}
console.log("pages updated:", n);
