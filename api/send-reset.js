const { ServerClient } = require("postmark");
const crypto = require("crypto");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { to } = body;

    if (!to) {
      return res.status(400).json({ ok: false, error: "Missing 'to' field" });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const resetUrl = `https://estimateapp.app/reset?token=${token}`;

    const client = new ServerClient(process.env.POSTMARK_API_TOKEN);
    const from = process.env.FROM_EMAIL || "no-reply@estimateapp.app";

    const pm = await client.sendEmail({
      From: from,
      To: to,
      Subject: "Reset your EstiMate admin password",
      TextBody: `Click the following link to reset your password:\n\n${resetUrl}\n\nIf you didn’t request this, you can ignore this email.`,
      MessageStream: process.env.POSTMARK_STREAM || "outbound"
    });

    return res.status(200).json({ ok: true, token, resetUrl, pmStatus: pm?.ErrorCode ?? 0 });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Unknown error" });
  }
};
