// /api/send-reset.js
import crypto from "node:crypto";
import Postmark from "postmark";

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}
function sign(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}
function createToken(payload, secret, expiresInSeconds = 15 * 60) {
  const headerB64 = b64url({ alg: "HS256", typ: "JWT" });
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payloadB64 = b64url({ ...payload, exp });
  const toSign = `${headerB64}.${payloadB64}`;
  const sigB64 = sign(toSign, secret);
  return `${toSign}.${sigB64}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const secret = process.env.APP_TOKEN_SECRET;
    if (!secret) {
      return res.status(500).json({ ok: false, error: "APP_TOKEN_SECRET not set" });
    }
    const client = new Postmark.ServerClient(process.env.POSTMARK_TOKEN || "");
    const from = process.env.POSTMARK_FROM || "";
    if (!process.env.POSTMARK_TOKEN || !from) {
      return res.status(500).json({ ok: false, error: "Postmark env not set" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { to } = body;
    if (!to) {
      return res.status(400).json({ ok: false, error: "Missing to" });
    }

    // token contains nothing sensitive—just an expiry; password is set locally in app
    const token = createToken({ purpose: "reset" }, secret, 15 * 60);

    const base = process.env.APP_BASE_URL || `https://${req.headers.host}`;
    const resetUrl = `${base}/api/reset-password?token=${encodeURIComponent(token)}`;

    const result = await client.sendEmail({
      From: from,
      To: to,
      Subject: "Reset your EstiMate admin password",
      TextBody:
`Tap the link below to reset your admin password:

${resetUrl}

If you didn’t request this, ignore this email.
This link expires in 15 minutes.`,
      MessageStream: process.env.POSTMARK_STREAM || "outbound"
    });

    return res.status(200).json({ ok: true, token, resetUrl, pmData: result });
  } catch (err) {
    const msg = err?.message || "Unknown error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
