
// api/send-username.js
import { NextResponse } from "next/server";

const FROM_EMAIL = process.env.POSTMARK_FROM;           // e.g. support@estimateapp.app
const POSTMARK_TOKEN = process.env.POSTMARK_SERVER_TOKEN;

function ok() {
  return NextResponse.json({ success: true }, { status: 200 });
}
function bad(message, code = 400) {
  return NextResponse.json({ success: false, error: message }, { status: code });
}

export async function POST(request) {
  try {
    const { toEmail, username } = await request.json();

    if (!POSTMARK_TOKEN) return bad("Server misconfigured: POSTMARK_SERVER_TOKEN missing", 500);
    if (!FROM_EMAIL)     return bad("Server misconfigured: POSTMARK_FROM missing", 500);

    // Basic validation
    if (!toEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(toEmail)) {
      return bad("Invalid toEmail");
    }
    if (!username || typeof username !== "string" || !username.trim()) {
      return bad("Invalid username");
    }

    // Send via Postmark
    const resp = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": POSTMARK_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        From: FROM_EMAIL,
        To: toEmail,
        Subject: "Your EstiMate admin username",
        TextBody:
          `Here is your EstiMate admin username:\n\n` +
          `Username: ${username}\n\n` +
          `If you didn’t request this, you can ignore this email.`,
        MessageStream: "outbound",
      }),
    });

    if (!resp.ok) {
      const e = await resp.text();
      console.error("Postmark error:", e);
      return bad("Email failed", 502);
    }

    return ok();
  } catch (err) {
    console.error("send-username error:", err);
    return bad("Internal error", 500);
  }
}