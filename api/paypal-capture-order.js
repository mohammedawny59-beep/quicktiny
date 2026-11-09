import {
  getAccessToken,
  paypalRequest,
  isValidPayPalId,
  checkPaidOrder,
  createLicense,
  readJsonBody,
} from "./_lib/paypal.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderID } = readJsonBody(req);
  if (!isValidPayPalId(orderID)) {
    return res.status(400).json({ error: "Invalid orderID" });
  }

  try {
    const token = await getAccessToken();
    const orderPath = `/v2/checkout/orders/${orderID}`;

    // 1. Make sure this is a QuickTiny Pro order for the right price before capturing it.
    const before = await paypalRequest(orderPath, { token });
    if (!before.ok) {
      return res.status(404).json({ error: "Order not found" });
    }
    const pre = checkPaidOrder(before.data);
    if (!pre.valid && pre.reason !== "not_paid") {
      return res.status(400).json({ error: "Order does not match QuickTiny Pro" });
    }

    // 2. Capture, unless it was already captured (e.g. the browser retried).
    if (before.data.status !== "COMPLETED") {
      const capture = await paypalRequest(`${orderPath}/capture`, { method: "POST", token });
      const issue = capture.data && capture.data.details && capture.data.details[0] && capture.data.details[0].issue;
      if (!capture.ok && issue !== "ORDER_ALREADY_CAPTURED") {
        console.error("capture failed", capture.status, issue);
        return res.status(402).json({ error: "Payment could not be captured" });
      }
    }

    // 3. Re-read the order and only issue a license for a completed, matching capture.
    const after = await paypalRequest(orderPath, { token });
    const check = after.ok ? checkPaidOrder(after.data) : { valid: false, reason: "lookup_failed" };
    if (!check.valid) {
      console.error("capture verification failed", orderID, check.reason);
      return res.status(402).json({ error: "Payment could not be confirmed" });
    }

    console.log(JSON.stringify({ message: "quicktiny_pro_purchase", orderID, captureId: check.captureId }));

    return res.status(200).json({
      status: "COMPLETED",
      orderID,
      transactionId: check.captureId,
      license: createLicense(orderID),
    });
  } catch (error) {
    console.error("capture error", error.message);
    return res.status(500).json({ error: "Server error" });
  }
}
