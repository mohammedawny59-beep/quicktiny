import { PRODUCT, paypalRequest } from "./_lib/paypal.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // The price is fixed here on the server; the browser never sends an amount.
    const result = await paypalRequest("/v2/checkout/orders", {
      method: "POST",
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            description: PRODUCT.description,
            custom_id: PRODUCT.customId,
            amount: { currency_code: PRODUCT.currency, value: PRODUCT.value },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "QuickTiny",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
            },
          },
        },
      },
    });

    if (!result.ok || !result.data || !result.data.id) {
      console.error("create-order failed", result.status, result.data && result.data.name);
      return res.status(502).json({ error: "Could not create order" });
    }

    return res.status(200).json({ id: result.data.id });
  } catch (error) {
    console.error("create-order error", error.message);
    return res.status(500).json({ error: "Server error" });
  }
}
