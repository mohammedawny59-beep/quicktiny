export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ status: "QuickTiny PayPal webhook ready" });
  }

  console.log("PayPal webhook:", req.body);

  return res.status(200).json({ received: true });
}
