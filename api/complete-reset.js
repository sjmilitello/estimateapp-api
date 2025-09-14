// api/complete-reset.js
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv"; // requires Vercel KV env vars

// Optional: restrict which origins can call this
const ALLOWED_ORIGINS = [
  "https://estimateapp.app",
  "https://your-vercel-deployment.vercel.app",
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://localhost:3000",
];

function ok(data) {
  return NextResponse.json({ success: true, ...data }, { status: 200 });
}
function bad(message, code = 400) {
  return NextResponse.json({ success: false, error: message }, { status: code });
}

export async function POST(request) {
  try {
    // (Optional) Basic CORS allow-list
    const origin = request.headers.get("origin");
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return bad("Origin not allowed", 403);
    }

    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return bad("Missing token");
    }

    // Look up the token in KV (set during send-reset)
    const key = `reset:${token}`;
    const payload = await kv.get(key); // { toEmail, createdAt } if present

    if (!payload) {
      // Not found or already consumed/expired
      return bad("Invalid or expired token", 410);
    }

    // Invalidate immediately (one-time use)
    await kv.del(key);

    // Return the email (or any metadata you stored) so the app can proceed.
    // Your Swift code should now allow the user to set a new password locally.
    return ok({ email: payload.toEmail });
  } catch (err) {
    console.error("complete-reset error:", err);
    return bad("Internal server error", 500);
  }
}