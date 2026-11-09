import { paypalRequest, parseLicense, checkPaidOrder, readJsonBody } from "./_lib/paypal.js";

// POST { license } -> { valid: true } or { valid: false, reason }
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store");

  const { license } = readJsonBody(req);
  const parsed = parseLicense(license);
  if (!parsed) {
    return res.status(200).json({ valid: false, reason: "invalid_key" });
  }

  try {
    // The signature proves we issued the key; PayPal tells us it's still paid (not refunded).
    const order = await paypalRequest(`/v2/checkout/orders/${parsed.orderId}`);
    if (!order.ok) {
      if (order.status === 404) return res.status(200).json({ valid: false, reason: "not_found" });
      return res.status(503).json({ error: "Could not reach PayPal" });
    }
    const check = checkPaidOrder(order.data);
    return res.status(200).json(check.valid ? { valid: true } : { valid: false, reason: check.reason });
  } catch (error) {
    console.error("verify-license error", error.message);
    return res.status(503).json({ error: "Could not verify right now" });
  }
}
