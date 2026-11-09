import { paypalRequest, readJsonBody } from "./_lib/paypal.js";

// Events we record. Refunds/reversals need no extra action: /api/verify-license
// asks PayPal for the live capture status, so a refunded license stops validating.
const LOGGED_EVENTS = new Set([
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
  "PAYMENT.CAPTURE.DENIED",
  "CUSTOMER.DISPUTE.CREATED",
  "CUSTOMER.DISPUTE.RESOLVED",
]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error("paypal-webhook: PAYPAL_WEBHOOK_ID is not set; ignoring event");
    return res.status(503).json({ error: "Webhook not configured" });
  }

  const event = readJsonBody(req);
  const h = req.headers;

  try {
    // Ask PayPal to confirm the event really came from PayPal.
    const verify = await paypalRequest("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: {
        auth_algo: h["paypal-auth-algo"],
        cert_url: h["paypal-cert-url"],
        transmission_id: h["paypal-transmission-id"],
        transmission_sig: h["paypal-transmission-sig"],
        transmission_time: h["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: event,
      },
    });

    if (!verify.ok || !verify.data || verify.data.verification_status !== "SUCCESS") {
      console.warn("paypal-webhook: signature verification failed");
      return res.status(400).json({ error: "Invalid signature" });
    }

    if (LOGGED_EVENTS.has(event.event_type)) {
      const resource = event.resource || {};
      console.log(JSON.stringify({
        message: "quicktiny_paypal_event",
        type: event.event_type,
        eventId: event.id,
        resourceId: resource.id,
        status: resource.status,
        amount: resource.amount,
      }));
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("paypal-webhook error", error.message);
    return res.status(500).json({ error: "Server error" });
  }
}
