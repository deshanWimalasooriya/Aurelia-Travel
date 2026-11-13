// Guards server-to-server routes that the Python trip agent calls.
// The agent sends the shared secret as "Authorization: Bearer <AGENT_API_KEY>"
// (its AURELIA_API_KEY setting) or as an "X-Agent-Key" header.
exports.verifyAgentKey = (req, res, next) => {
  const expected = process.env.AGENT_API_KEY;
  if (!expected) {
    return res.status(503).json({ success: false, message: 'Agent integration is not configured (AGENT_API_KEY missing).' });
  }

  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const provided = bearer || req.headers['x-agent-key'];

  if (provided !== expected) {
    return res.status(401).json({ success: false, message: 'Invalid agent key.' });
  }
  next();
};
