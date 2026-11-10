// Tests for tools/social_post.mjs: OAuth 1.0a signing (Twitter's published example), page picking, text length.
import assert from "node:assert";
import { oauth1Header, pickPages, composeText } from "../tools/social_post.mjs";
let n = 0;
// Example from Twitter's "Creating a signature" documentation.
const { signature } = oauth1Header("POST", "https://api.twitter.com/1.1/statuses/update.json?include_entities=true",
  { status: "Hello Ladies + Gentlemen, a signed OAuth request!" },
  { consumerKey: "xvz1evFS4wEEPTGEFPHBog", consumerSecret: "kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw", token: "370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb", tokenSecret: "LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE" },
  "kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg", 1318622958);
assert.strictEqual(signature, "hCtSmYh+iHYCEqBWrE7C7hYmtUk=", "OAuth1 signature matches the reference"); n++;
const B = "https://quicktinyv2.vercel.app";
const picked = pickPages([B + "/ar/prayer-times/riyadh", B + "/compress-image-to-50kb", B + "/guides/flat-rate-vs-apr", B + "/embed/vat-calculator", B + "/loan-calculator", "https://evil.example/x"], 3);
assert.deepStrictEqual(picked, [B + "/guides/flat-rate-vs-apr", B + "/loan-calculator", B + "/compress-image-to-50kb"], "guides first, tools next, no city/embed/external"); n++;
const long = { url: B + "/ar/guides/gold-zakat-calculation", lang: "ar", title: "طريقة حساب زكاة الذهب بالأمثلة (عيار 24 و21 و18)", desc: "شرح ".repeat(200) };
const t = composeText(long, 280);
const weighted = t.replace(long.url, "x".repeat(23)).length;
assert.ok(weighted <= 280, "fits X limit: " + weighted); n++;
assert.ok(t.includes(long.url) && t.includes("#QuickTiny"), "keeps link and tag"); n++;
console.log("social post tests:", n, "passed");
