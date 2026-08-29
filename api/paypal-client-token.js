export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !secret) {
      return res.status(500).json({ error: "Missing PayPal credentials" });
    }

    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

    const response = await fetch(
      "https://api-m.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body:
          "grant_type=client_credentials&response_type=client_token&domains[]=quicktinyv2.vercel.app"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Could not create client token",
        details: data
      });
    }

    return res.status(200).json({
      clientToken: data.access_token
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
}
