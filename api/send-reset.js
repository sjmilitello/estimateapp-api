import { ServerClient } from "postmark";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, resetUrl } = req.body;

  if (!to || !resetUrl) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const client = new ServerClient(process.env.POSTMARK_API_TOKEN);

    await client.sendEmail({
      From: process.env.FROM_EMAIL || "no-reply@estimateapp.app",
      To: to,
      Subject: "Password Reset Request",
      TextBody: `Click this link to reset your password: ${resetUrl}`,
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
