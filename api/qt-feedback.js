// Visitor feedback: a 👍/👎 on a tool and optional "suggest a tool" text.
// Stored as one small private JSON file per entry in Vercel Blob (BLOB_READ_WRITE_TOKEN, set by connecting a
// Blob store to the project). Without the token the entry is only logged. No IP address or identifier is kept.
// Read the entries with: node tools/feedback.mjs (needs the same token in the environment).

const MAX_TEXT = 500;
const seen = new Map(); // best-effort per-instance throttle: ip -> [timestamps]

function cleanPage(value) {
  if (typeof value !== "string") return "/";
  const page = value.split("?")[0].split("#")[0].slice(0, 120);
  return /^\/[a-z0-9/_-]*$/i.test(page) ? page : "/";
}

function throttled(ip) {
  const now = Date.now(), list = (seen.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now); seen.set(ip, list);
  if (seen.size > 5000) seen.clear();
  return list.length > 12;
}

async function store(entry) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return false;
  const day = entry.t.slice(0, 10);
  const pathname = `feedback/${day}/${entry.kind}.json`;
  const res = await fetch("https://vercel.com/api/blob/?" + new URLSearchParams({ pathname }), {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "x-api-version": "13",
      "x-vercel-blob-access": "private",
      "x-content-type": "application/json",
      "x-add-random-suffix": "1",
    },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error("blob " + res.status + " " + (await res.text()).slice(0, 200));
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const b = req.body && typeof req.body === "object" ? req.body : {};
  if (b.website) return res.status(204).end(); // honeypot field filled in by bots
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  if (throttled(ip)) return res.status(429).end();

  const vote = b.vote === "up" || b.vote === "down" ? b.vote : null;
  const text = typeof b.text === "string" ? b.text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, MAX_TEXT) : "";
  if (!vote && !text) return res.status(400).end();

  const entry = {
    kind: text ? "suggestion" : "vote",
    vote,
    text,
    page: cleanPage(b.page),
    lang: b.lang === "ar" ? "ar" : "en",
    t: new Date().toISOString(),
  };
  let saved = false;
  try { saved = await store(entry); }
  catch (e) { console.error(JSON.stringify({ level: "error", message: "quicktiny_feedback_store_failed", error: String(e.message || e) })); }
  console.log(JSON.stringify({ level: "info", message: "quicktiny_feedback", saved, ...entry }));
  return res.status(204).end();
}
