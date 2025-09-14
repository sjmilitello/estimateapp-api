export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    envSeen: {
      POSTMARK_SERVER_TOKEN: !!process.env.POSTMARK_SERVER_TOKEN,
      FROM_EMAIL: process.env.FROM_EMAIL || null,
    },
    nodeVersion: process.version,
  });
}
