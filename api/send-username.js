// api/send-username.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { to, username } = req.body || {};
    if (!to || !username) {
      return res.status(400).json({ ok: false, error: '`to` and `username` are required' });
    }

    const PM_TOKEN = process.env.POSTMARK_SERVER_TOKEN;
    const FROM = process.env.FROM_EMAIL || 'no-reply@estimateapp.app';

    const payload = {
      From: FROM,
      To: to,
      Subject: 'Your EstiMate username',
      TextBody: `Your username is: ${username}`,
      MessageStream: 'outbound',
    };

    const r = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Postmark-Server-Token': PM_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let pm;
    try { pm = JSON.parse(text); } catch { pm = { raw: text }; }

    // If Postmark says ErrorCode > 0, treat as failure
    if (!r.ok || (pm && typeof pm.ErrorCode === 'number' && pm.ErrorCode > 0)) {
      return res.status(502).json({ ok: false, pmStatus: r.status, pmData: pm });
    }

    return res.status(200).json({ ok: true, pmData: pm });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}