import {
  getAccessToken,
  paypalRequest,
  isValidPayPalId,
  checkPaidOrder,
  createLicense,
  readJsonBody,
} from "./_lib/paypal.js";

// POST { transactionId } (the Transaction ID on the PayPal receipt) -> { license }
// Lets buyers restore Pro on a new browser/device without emailing support.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store");

  const body = readJsonBody(req);
  const transactionId = typeof body.transactionId === "string" ? body.transactionId.trim().toUpperCase() : "";
  if (!isValidPayPalId(transactionId)) {
    return res.status(400).json({ error: "That doesn't look like a PayPal transaction ID." });
  }

  try {
    const token = await getAccessToken();
    const capture = await paypalRequest(`/v2/payments/captures/${transactionId}`, { token });
    const orderId = capture.ok && capture.data && capture.data.supplementary_data &&
      capture.data.supplementary_data.related_ids && capture.data.supplementary_data.related_ids.order_id;
    if (!orderId || !isValidPayPalId(orderId)) {
      return res.status(404).json({ error: "No QuickTiny Pro purchase found for that transaction ID." });
    }

    const order = await paypalRequest(`/v2/checkout/orders/${orderId}`, { token });
    const check = order.ok ? checkPaidOrder(order.data) : { valid: false, reason: "not_found" };
    if (!check.valid || check.captureId !== transactionId) {
      const msg = check.reason === "refunded"
        ? "This purchase was refunded."
        : "No QuickTiny Pro purchase found for that transaction ID.";
      return res.status(404).json({ error: msg });
    }

    return res.status(200).json({ license: createLicense(orderId) });
  } catch (error) {
    console.error("restore-license error", error.message);
    return res.status(503).json({ error: "Could not reach PayPal. Please try again." });
  }
}
