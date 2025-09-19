const { ServerClient } = require("postmark");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { to, username } = body;

    if (!to || !username) {
      return res.status(400).json({ ok: false, error: "Missing to or username" });
    }

    const client = new ServerClient(process.env.POSTMARK_API_TOKEN);

    const result = await client.sendEmail({
      From: process.env.FROM_EMAIL || "no-reply@estimateapp.app",
      To: to,
      Subject: "Your EstiMate admin username",
      TextBody: `Your admin username is: ${username}`,
      MessageStream: process.env.POSTMARK_STREAM || "outbound"
    });

    return res.status(200).json({ ok: true, pmStatus: result.ErrorCode });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Unknown error" });
  }
};
