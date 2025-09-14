// api/send-reset.js
import { NextResponse } from "next/server";

const FROM_EMAIL = process.env.POSTMARK_FROM;            // e.g. no-reply@estimateapp.app
const POSTMARK_TOKEN = process.env.POSTMARK_SERVER_TOKEN;
const BASE_URL = process.env.PUBLIC_APP_BASE_URL;        // e.g. https://estimateapp.app

function ok() { return NextResponse.json({ success: true }, { status: 200 }); }
function bad(message, code = 400) {
  return NextResponse.json({ success: false, error: message }, { status: code });
}

export async function POST(request) {
  try {
    const { toEmail, token } = await request.json();

    if (!POSTMARK_TOKEN) return bad("Server misconfigured: POSTMARK_SERVER_TOKEN missing", 500);
    if (!FROM_EMAIL)     return bad("Server misconfigured: POSTMARK_FROM missing", 500);
    if (!BASE_URL)       return bad("Server misconfigured: PUBLIC_APP_BASE_URL missing", 500);

    if (!toEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(toEmail)) {
      return bad("Invalid toEmail");
    }
    if (!token || typeof token !== "string" || !token.trim()) {
      return bad("Invalid token");
    }

    const resetUrl = `${BASE_URL}/reset?token=${encodeURIComponent(token)}`;

    const resp = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": POSTMARK_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        From: FROM_EMAIL,
        To: toEmail,
        Subject: "Reset your EstiMate admin password",
        TextBody:
          `Tap this link to reset your EstiMate admin password:\n\n` +
          `${resetUrl}\n\n` +
          `If you didn’t request this, you can ignore this email.`,
        HtmlBody:
          `<p>Tap this link to reset your EstiMate admin password:</p>` +
          `<p><a href="${resetUrl}">${resetUrl}</a></p>` +
          `<p>If you didn’t request this, you can ignore this email.</p>`,
        MessageStream: "outbound"
      })
    });

    if (!resp.ok) {
      const e = await resp.text();
      console.error("Postmark error:", e);
      return bad("Email failed", 502);
    }

    return ok();
  } catch (err) {
    console.error("send-reset error:", err);
    return bad("Internal error", 500);
  }
}