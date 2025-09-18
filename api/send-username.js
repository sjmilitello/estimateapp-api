module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { to, username } = req.body;
    if (!to || !username) {
      return res.status(400).json({ ok: false, error: "Missing to/username" });
    }

    const resp = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": process.env.POSTMARK_API_TOKEN
      },
      body: JSON.stringify({
        From: "noreply@estimateapp.app",   // must be a verified sender
        To: to,
        Subject: "Your EstiMate Username",
        TextBody: `Your username is: ${username}`
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ ok: false, error: data.Message || "Postmark error" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
