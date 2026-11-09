// Shared PayPal + license helpers. Files under api/_lib are not exposed as endpoints.
import crypto from "node:crypto";

export const PRODUCT = {
  description: "QuickTiny Pro",
  customId: "quicktiny-pro-v1",
  currency: "USD",
  value: "4.99",
};

const API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

export async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("Missing PayPal credentials");

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const response = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error("PayPal authentication failed");
  const data = await response.json();
  return data.access_token;
}

export async function paypalRequest(path, { method = "GET", body, token } = {}) {
  const accessToken = token || (await getAccessToken());
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await response.json(); } catch (e) { data = null; }
  return { ok: response.ok, status: response.status, data };
}

// PayPal ids are uppercase alphanumerics; reject anything else before it reaches a URL.
export function isValidPayPalId(id) {
  return typeof id === "string" && /^[A-Z0-9]{8,40}$/.test(id);
}

function amountMatches(amount) {
  return !!amount &&
    amount.currency_code === PRODUCT.currency &&
    Number(amount.value) === Number(PRODUCT.value);
}

// Orders created before custom_id was added only carry the description.
function unitIsQuickTinyPro(unit) {
  if (!unit) return false;
  return unit.custom_id === PRODUCT.customId || unit.description === PRODUCT.description;
}

/**
 * Checks a PayPal order object and reports whether it is a paid,
 * non-refunded QuickTiny Pro purchase.
 * Returns { valid, reason, captureId }.
 */
export function checkPaidOrder(order) {
  if (!order || !Array.isArray(order.purchase_units) || order.purchase_units.length !== 1) {
    return { valid: false, reason: "not_quicktiny_order" };
  }
  const unit = order.purchase_units[0];
  if (!unitIsQuickTinyPro(unit)) return { valid: false, reason: "not_quicktiny_order" };
  if (!amountMatches(unit.amount)) return { valid: false, reason: "wrong_amount" };

  const captures = (unit.payments && unit.payments.captures) || [];
  const paid = captures.find(function (c) {
    return c.status === "COMPLETED" && amountMatches(c.amount);
  });
  if (!paid) {
    const refunded = captures.some(function (c) {
      return c.status === "REFUNDED" || c.status === "PARTIALLY_REFUNDED" || c.status === "REVERSED";
    });
    return { valid: false, reason: refunded ? "refunded" : "not_paid" };
  }
  return { valid: true, captureId: paid.id };
}

// ---------- License keys: "<orderId>.<hmac>" ----------
// Signed so the verify endpoint can reject made-up keys without calling PayPal.

function licenseSecret() {
  if (process.env.LICENSE_SECRET) return process.env.LICENSE_SECRET;
  if (!process.env.PAYPAL_CLIENT_SECRET) throw new Error("Missing license secret");
  // Fallback: derive a separate key so no extra env var is strictly required.
  return crypto.createHmac("sha256", process.env.PAYPAL_CLIENT_SECRET)
    .update("quicktiny-license-v1").digest("hex");
}

function sign(orderId) {
  return crypto.createHmac("sha256", licenseSecret())
    .update(`qt-pro:${orderId}`).digest("base64url").slice(0, 32);
}

export function createLicense(orderId) {
  return `QT-${orderId}.${sign(orderId)}`;
}

export function parseLicense(license) {
  if (typeof license !== "string") return null;
  const match = /^QT-([A-Z0-9]{8,40})\.([A-Za-z0-9_-]{32})$/.exec(license.trim());
  if (!match) return null;
  const expected = Buffer.from(sign(match[1]));
  const given = Buffer.from(match[2]);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  return { orderId: match[1] };
}

export function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
}
