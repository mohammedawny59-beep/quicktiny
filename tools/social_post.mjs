// Announces newly added pages on social channels. Runs from the "Social" GitHub workflow after a deploy.
// It posts ONLY to channels whose credentials exist as repository secrets — with none set, it just logs (dry run).
//   node tools/social_post.mjs --since <git-ref> [--dry-run] [--max 3]
//   node tools/social_post.mjs --urls https://…,https://… [--dry-run]
// Channels (env vars):
//   Telegram : TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (optional TELEGRAM_CHAT_ID_AR for Arabic pages)
//   X        : X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET   (OAuth 1.0a user context, POST /2/tweets)
//   Facebook : FB_PAGE_ID + FB_PAGE_TOKEN (Page access token)             (optional FB_GRAPH_VERSION, default v23.0)
//   LinkedIn : LINKEDIN_TOKEN + LINKEDIN_AUTHOR (urn:li:person:… or urn:li:organization:…) (optional LINKEDIN_VERSION)
// SOCIAL_LANGS=ar,en limits which page languages are announced (default both).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://quicktinyv2.vercel.app";

// ---------- OAuth 1.0a (RFC 5849) ----------
const pct = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
export function oauth1Header(method, url, extraParams, k, nonce, ts) {
  const u = new URL(url), params = [];
  u.searchParams.forEach((v, key) => params.push([key, v]));
  Object.entries(extraParams || {}).forEach(([key, v]) => params.push([key, v]));
  const oauth = { oauth_consumer_key: k.consumerKey, oauth_nonce: nonce || crypto.randomBytes(16).toString("hex"), oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(ts || Math.floor(Date.now() / 1000)), oauth_token: k.token, oauth_version: "1.0" };
  Object.entries(oauth).forEach(([key, v]) => params.push([key, v]));
  const norm = params.map(([a, b]) => [pct(a), pct(b)]).sort((x, y) => (x[0] === y[0] ? (x[1] < y[1] ? -1 : 1) : x[0] < y[0] ? -1 : 1)).map(([a, b]) => a + "=" + b).join("&");
  const baseUrl = u.origin + u.pathname;
  const base = [method.toUpperCase(), pct(baseUrl), pct(norm)].join("&");
  const sig = crypto.createHmac("sha1", pct(k.consumerSecret) + "&" + pct(k.tokenSecret)).update(base).digest("base64");
  oauth.oauth_signature = sig;
  return { header: "OAuth " + Object.keys(oauth).sort().map((key) => pct(key) + '="' + pct(oauth[key]) + '"').join(", "), signature: sig };
}

// ---------- page selection ----------
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
export function pickPages(urls, max) {
  const score = (u) => (/\/guides\//.test(u) ? 0 : /\/(ar\/)?prayer-times\/[^/]+$/.test(u) ? 9 : /-to-\d+(kb|mb)$/.test(u) ? 5 : 1);
  return urls.filter((u) => u.startsWith(BASE) && !/\/embed\//.test(u) && score(u) < 9).sort((a, b) => score(a) - score(b)).slice(0, max);
}
function pageInfo(url) {
  const rel = url.replace(BASE, "").replace(/^\//, "") || "index";
  const f = path.join(ROOT, rel + ".html");
  if (!fs.existsSync(f)) return null;
  const s = fs.readFileSync(f, "utf8");
  const dec = (x) => x.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const title = dec((s.match(/<title>([\s\S]*?)<\/title>/) || [, ""])[1].replace(/\s*\|\s*QuickTiny\s*$/, "").trim());
  const desc = dec((s.match(/<meta name="description" content="([^"]*)"/) || [, ""])[1]);
  return { url, title, desc, lang: url.startsWith(BASE + "/ar/") ? "ar" : "en" };
}
export function composeText(p, limit) {
  const tag = p.lang === "ar" ? "\n\n#QuickTiny #أدوات_مجانية" : "\n\n#QuickTiny #FreeTools";
  const head = p.title + "\n\n";
  // X counts every URL as 23 characters.
  const room = (limit || 280) - head.length - 23 - 2 - tag.length;
  let d = p.desc;
  if (d.length > room) d = room > 20 ? d.slice(0, room - 1).replace(/\s+\S*$/, "") + "…" : "";
  return head + (d ? d + "\n\n" : "") + p.url + tag;
}

// ---------- channels ----------
const env = process.env;
async function postTelegram(p, text) {
  const chat = p.lang === "ar" && env.TELEGRAM_CHAT_ID_AR ? env.TELEGRAM_CHAT_ID_AR : env.TELEGRAM_CHAT_ID;
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text }) });
  return r.status + " " + (await r.text()).slice(0, 120);
}
async function postX(p, text) {
  const url = "https://api.x.com/2/tweets";
  const { header } = oauth1Header("POST", url, {}, { consumerKey: env.X_API_KEY, consumerSecret: env.X_API_SECRET, token: env.X_ACCESS_TOKEN, tokenSecret: env.X_ACCESS_SECRET });
  const r = await fetch(url, { method: "POST", headers: { Authorization: header, "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  return r.status + " " + (await r.text()).slice(0, 120);
}
async function postFacebook(p, text) {
  const v = env.FB_GRAPH_VERSION || "v23.0";
  const body = new URLSearchParams({ message: text.replace(p.url, "").trim(), link: p.url, access_token: env.FB_PAGE_TOKEN });
  const r = await fetch(`https://graph.facebook.com/${v}/${env.FB_PAGE_ID}/feed`, { method: "POST", body });
  return r.status + " " + (await r.text()).slice(0, 120);
}
async function postLinkedIn(p, text) {
  const r = await fetch("https://api.linkedin.com/rest/posts", { method: "POST",
    headers: { Authorization: "Bearer " + env.LINKEDIN_TOKEN, "Content-Type": "application/json", "LinkedIn-Version": env.LINKEDIN_VERSION || "202510", "X-Restli-Protocol-Version": "2.0.0" },
    body: JSON.stringify({ author: env.LINKEDIN_AUTHOR, commentary: text.replace(p.url, "").trim(), visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      content: { article: { source: p.url, title: p.title, description: p.desc.slice(0, 250) } }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false }) });
  return r.status + " " + (await r.text()).slice(0, 120);
}
const CHANNELS = [
  { name: "Telegram", ready: () => env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID, post: postTelegram, limit: 4000 },
  { name: "X", ready: () => env.X_API_KEY && env.X_API_SECRET && env.X_ACCESS_TOKEN && env.X_ACCESS_SECRET, post: postX, limit: 280 },
  { name: "Facebook", ready: () => env.FB_PAGE_ID && env.FB_PAGE_TOKEN, post: postFacebook, limit: 2000 },
  { name: "LinkedIn", ready: () => env.LINKEDIN_TOKEN && env.LINKEDIN_AUTHOR, post: postLinkedIn, limit: 2800 },
];

// ---------- main ----------
async function main() {
  const args = process.argv.slice(2), dry = args.includes("--dry-run"), max = +(args[args.indexOf("--max") + 1] || 3) || 3;
  const langs = (env.SOCIAL_LANGS || "ar,en").split(",").map((s) => s.trim());
  let urls = [];
  if (args.includes("--urls")) urls = args[args.indexOf("--urls") + 1].split(",");
  else if (args.includes("--since")) {
    const ref = args[args.indexOf("--since") + 1], now = locs(fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8"));
    let before = null;
    try { before = locs(execSync("git show " + ref + ":sitemap.xml", { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); } catch (e) {}
    if (!before) { console.log("No previous sitemap for " + ref + " — not announcing anything (avoids re-posting the whole site)."); return; }
    const old = new Set(before); urls = now.filter((u) => !old.has(u));
  } else { console.error("Pass --since <git-ref> or --urls a,b"); process.exit(1); }
  const pages = pickPages(urls, max).map(pageInfo).filter((p) => p && langs.includes(p.lang));
  if (!pages.length) { console.log("No new pages to announce."); return; }
  const active = CHANNELS.filter((c) => c.ready());
  console.log(`${pages.length} page(s); channels configured: ${active.map((c) => c.name).join(", ") || "none (dry run)"}`);
  for (const p of pages) for (const c of active.length && !dry ? active : CHANNELS) {
    const text = composeText(p, c.limit);
    if (dry || !active.length) { console.log(`[dry-run ${c.name}] ${text.replace(/\n/g, " ⏎ ")}`); continue; }
    try { console.log(`${c.name}: ${p.url} → ${await c.post(p, text)}`); } catch (e) { console.log(`${c.name}: ${p.url} → error ${e.message}`); process.exitCode = 1; }
    await new Promise((r) => setTimeout(r, 1500));
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
