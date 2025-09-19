/**
 * Simple diagnostics route to confirm env variables on the server.
 * Returns which Postmark token is present and which one your code should use.
 */
module.exports = async (req, res) => {
  const apiToken    = process.env.POSTMARK_API_TOKEN;
  const serverToken = process.env.POSTMARK_API_TOKEN;

  return res.status(200).json({
    ok: true,
    has_API_TOKEN: !!apiToken,
    has_SERVER_TOKEN: !!serverToken,
    activeToken: apiToken ? "POSTMARK_API_TOKEN" : (serverToken ? "POSTMARK_API_TOKEN (WRONG — update code)" : "none")
  });
};
