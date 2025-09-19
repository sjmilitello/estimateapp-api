const { ServerClient } = require("postmark");
const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { to } = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (!to) {
      return res.status(400).json({ ok: false, error: "Missing to address" });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const resetUrl = `https://estimateapp.app/reset?token=${token}`;

    const client = new ServerClient(process.env.POSTMARK_API_TOKEN);

    const result = await client.sendEmail({
      From: process.env.FROM_EMAIL || "no-reply@estimateapp.app",
      To: to,
      Subject: "Reset your EstiMate admin password",
      TextBody: `Click the following link to reset your password:\n\n${resetUrl}\n\nIf you didn’t request this, you can ignore this email.`,
      MessageStream: process.env.POSTMARK_STREAM || "outbound"
    });

    return res.status(200).json({ ok: true, token, resetUrl, pmStatus: result.ErrorCode });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Unknown error" });
  }
};
