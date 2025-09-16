// api/send-reset.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, token } = req.body;
  if (!to || !token) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const resetLink = `https://estimateapp.app/reset?token=${encodeURIComponent(token)}`;

  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": "f008e990-c6de-46d0-ad52-3354522d97e1" // your Server API token
      },
      body: JSON.stringify({
        From: "no-reply@estimateapp.app",
        To: to,
        Subject: "Reset your EstiMate password",
        TextBody: `Hello,\n\nTo reset your EstiMate password, click the link below:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn’t request this, please ignore this email.`
      })
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : 400).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send reset email" });
  }
}