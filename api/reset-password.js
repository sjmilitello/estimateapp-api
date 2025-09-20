const crypto = require("crypto");
function verify(token, secret) {
  try {
    const [payloadB64, sig] = String(token || "").split(".");
    if (!payloadB64 || !sig) return { ok:false, error:"Bad token" };
    const expect = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return { ok:false, error:"Bad signature" };
    const payload = JSON.parse(Buffer.from(payloadB64.replace(/-/g,"+").replace(/_/g,"/"), "base64").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now()/1000)) return { ok:false, error:"Token expired" };
    return { ok:true, payload };
  } catch {
    return { ok:false, error:"Invalid token" };
  }
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { token, newPassword } = body;
    if (!token || !newPassword) return res.status(400).json({ ok:false, error:"Missing token or newPassword" });
    if (String(newPassword).length < 8) return res.status(400).json({ ok:false, error:"Password too short" });

    const secret = process.env.RESET_SECRET;
    if (!secret) return res.status(500).json({ ok:false, error:"Server misconfig: RESET_SECRET" });

    const v = verify(token, secret);
    if (!v.ok) return res.status(400).json({ ok:false, error:v.error });

    // TODO: Update the password in your datastore here.
    // For your current build (no DB), just return ok:true.

    return res.status(200).json({ ok:true });
  } catch (err) {
    return res.status(500).json({ ok:false, error: err?.message || "Unknown error" });
  }
};
