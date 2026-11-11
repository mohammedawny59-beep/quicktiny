// Prints visitor feedback stored by api/qt-feedback.js: vote counts per page and the latest suggestions.
// usage: BLOB_READ_WRITE_TOKEN=... node tools/feedback.mjs [--days 30]
// (get the token from Vercel → Storage → your Blob store → .env.local, or `vercel env pull`).
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) { console.error("Set BLOB_READ_WRITE_TOKEN first."); process.exit(1); }
const days = +(process.argv[process.argv.indexOf("--days") + 1] || 30) || 30;
const since = Date.now() - days * 86400000;
const H = { authorization: `Bearer ${token}`, "x-api-version": "13" };

async function list() {
  const out = []; let cursor;
  do {
    const q = new URLSearchParams({ prefix: "feedback/", limit: "1000" }); if (cursor) q.set("cursor", cursor);
    const r = await fetch("https://vercel.com/api/blob?" + q, { headers: H });
    if (!r.ok) throw new Error("list " + r.status + " " + (await r.text()));
    const d = await r.json(); out.push(...d.blobs); cursor = d.hasMore ? d.cursor : null;
  } while (cursor);
  return out.filter((b) => new Date(b.uploadedAt).getTime() >= since);
}

const blobs = await list();
const entries = [];
for (const b of blobs) {
  const r = await fetch(b.downloadUrl || b.url, { headers: { authorization: `Bearer ${token}` } });
  if (r.ok) try { entries.push(await r.json()); } catch (e) {}
}
const votes = {};
for (const e of entries) if (e.vote) { const v = (votes[e.page] ||= { up: 0, down: 0 }); v[e.vote]++; }
console.log(`Feedback in the last ${days} days: ${entries.length} entries\n\nVotes by page (👍 / 👎):`);
Object.entries(votes).sort((a, b) => (b[1].up + b[1].down) - (a[1].up + a[1].down)).forEach(([p, v]) => console.log(`  ${String(v.up).padStart(4)} / ${String(v.down).padEnd(4)} ${p}`));
console.log("\nSuggestions (newest first):");
entries.filter((e) => e.text).sort((a, b) => b.t.localeCompare(a.t)).forEach((e) => console.log(`- [${e.t.slice(0, 10)} ${e.lang} ${e.page}] ${e.text}`));
