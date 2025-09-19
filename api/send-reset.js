// /api/send-reset.js
const { ServerClient } = require("postmark");
const crypto = require("crypto");
const url = require("url");

// Allow only your app domains for Universal Links
const ALLOWED_HOSTS = new Set([
  "estimateapp.app",
  "www.estimateapp.app",
]);

function safeBaseUrl(input, fallback) {
  try {
    const u = new url.URL((input || "").trim() || fallback);
    // Force https and strip any path/query
    if (!ALLOWED_HOSTS.has(u.host)) return new url.URL(fallback).toString().replace(/\/$/, "");
    u.protocol = "https:";
    u.pathname = "/";
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, ""); // no trailing slash
  } catch {
    return new url.URL(fallback).toString().replace(/\/$/, "");
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const to = (body.to || "").trim();
    if (!to) {
      return res.status(400).json({ ok: false, error: "Missing to address" });
    }

    // Prefer the client-provided base, otherwise env, then hard default
    const appBaseUrl = safeBaseUrl(
      body.appBaseUrl,
      process.env.APP_BASE_URL || "https://estimateapp.app"
    );

    // Token to include in link (you'll verify this in /api/reset-password)
    const token = crypto.randomBytes(24).toString("hex");

    // Final Universal Link (must match your AASA paths and Xcode Associated Domains)
    const resetUrl = `${appBaseUrl}/reset?token=${encodeURIComponent(token)}`;

    const client = new ServerClient(process.env.POSTMARK_API_TOKEN);
    const From = process.env.FROM_EMAIL || "no-reply@estimateapp.app";
    const MessageStream = process.env.POSTMARK_STREAM || "outbound";

    const Subject = "Reset your EstiMate admin password";
    const TextBody =
      `Tap the link to reset your password:\n\n${resetUrl}\n\n` +
      `If you didn’t request this, you can ignore this email.`;
    const HtmlBody =
      `<p>Tap the button below to reset your password.</p>` +
      `<p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;` +
      `background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;"` +
      ` target="_blank" rel="noopener">Reset Password</a></p>` +
      `<p>Or copy and paste this link into your browser:<br>` +
      `<a href="${resetUrl}">${resetUrl}</a></p>` +
      `<p>If you didn’t request this, you can ignore this email.</p>`;

    const pm = await client.sendEmail({
      From,
      To: to,
      Subject,
      TextBody,
      HtmlBody,
      MessageStream,
      TrackOpens: true,
    });

    return res.status(200).json({
      ok: true,
      token,           // helpful during dev; remove in prod if you want
      resetUrl,        // helpful during dev
      pmStatus: pm.ErrorCode || 0
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Unknown error" });
  }
};