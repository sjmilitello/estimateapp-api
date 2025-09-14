// api/send-username.js
import { NextResponse } from "next/server";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { to, username } = req.body;

    if (!to || !username) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": process.env.POSTMARK_API_TOKEN
      },
      body: JSON.stringify({
        From: "no-reply@estimateapp.app",   // must be a verified Postmark sender
        To: to,
        Subject: "Your EstiMate App Username",
        TextBody: `Your username is: ${username}`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Postmark error:", error);
      return res.status(500).json({ error: error });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}