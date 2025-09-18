// /api/reset-password.js
import crypto from "node:crypto";

function parseToken(token) {
  const [h, p, s] = String(token).split(".");
  if (!h || !p || !s) return null;
  return { headerB64: h, payloadB64: p, sigB64: s };
}
function verify(token, secret) {
  const parts = parseToken(token);
  if (!parts) return { ok: false, error: "Malformed token" };

  const mac = crypto.createHmac("sha256", secret)
    .update(`${parts.headerB64}.${parts.payloadB64}`)
    .digest("base64url");

  try {
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(parts.sigB64))) {
      return { ok: false, error: "Bad signature" };
    }
  } catch {
    return { ok: false, error: "Bad signature" };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts.payloadB64, "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "Invalid payload" };
  }
  if (!payload.exp || Date.now() / 1000 > payload.exp) {
    return { ok: false, error: "Token expired" };
  }
  return { ok: true, payload };
}

export default async function handler(req, res) {
  const secret = process.env.APP_TOKEN_SECRET;
  if (!secret) {
    return res.status(500).json({ ok: false, error: "APP_TOKEN_SECRET not set" });
  }

  if (req.method === "GET") {
    const token = req.query?.token;
    if (!token) return res.status(400).json({ ok: false, error: "Missing token" });
    const v = verify(token, secret);
    if (!v.ok) return res.status(400).json({ ok: false, error: v.error });
    return res.status(200).json({ ok: true });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { token, newPassword } = body;
    if (!token || !newPassword) {
      return res.status(400).json({ ok: false, error: "Missing token or newPassword" });
    }
    const v = verify(token, secret);
    if (!v.ok) return res.status(400).json({ ok: false, error: v.error });

    // No DB write here — the iOS app updates its Keychain after this returns ok:true
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
