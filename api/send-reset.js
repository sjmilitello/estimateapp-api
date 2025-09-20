const crypto = require("crypto");
const { ServerClient } = require("postmark");

function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
}
function sign(payload, secret) {
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  return `${payloadB64}.${sig}`;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { to } = body;
    if (!to) return res.status(400).json({ ok:false, error:"Missing 'to'" });

    const secret = process.env.RESET_SECRET;
    if (!secret) return res.status(500).json({ ok:false, error:"Server misconfig: RESET_SECRET" });

    const rnd = crypto.randomBytes(24).toString("hex");
    const exp = Math.floor(Date.now()/1000) + 15*60; // 15 minutes
    const token = sign({ jti:rnd, exp }, secret);
    const resetUrl = `https://estimateapp.app/reset?token=${token}`;

    const client = new ServerClient(process.env.POSTMARK_API_TOKEN);
    const pm = await client.sendEmail({
      From: process.env.FROM_EMAIL || "no-reply@estimateapp.app",
      To: to,
      Subject: "Reset your EstiMate admin password",
      TextBody: `Tap this link to reset your password:\n\n${resetUrl}\n\nThis link expires in 15 minutes.`,
      MessageStream: process.env.POSTMARK_STREAM || "outbound"
    });

    return res.status(200).json({ ok:true, resetUrl, pmStatus: pm.ErrorCode || 0 });
  } catch (err) {
    return res.status(500).json({ ok:false, error: err?.message || "Unknown error" });
  }
};
