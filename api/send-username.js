// /api/send-username.js
import Postmark from "postmark";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const client = new Postmark.ServerClient(process.env.POSTMARK_TOKEN || "");
    const from = process.env.POSTMARK_FROM || "";
    if (!process.env.POSTMARK_TOKEN || !from) {
      return res.status(500).json({ ok: false, error: "Postmark env not set" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { to, username } = body;
    if (!to || !username) {
      return res.status(400).json({ ok: false, error: "Missing to or username" });
    }

    const result = await client.sendEmail({
      From: from,
      To: to,
      Subject: "Your EstiMate admin username",
      TextBody: `Your admin username is: ${username}`,
      MessageStream: process.env.POSTMARK_STREAM || "outbound"
    });

    return res.status(200).json({ ok: true, pmStatus: 200, pmData: result });
  } catch (err) {
    const msg = err?.message || "Unknown error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
