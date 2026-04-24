export default async function handler(req, res) {
  const { expect } = req.query;
  if (!expect || !/^\d+$/.test(String(expect))) {
    return res.status(400).json({ error: "invalid_expect", message: "expect must be digits" });
  }
  try {
    const upstream = await fetch(`https://history.macaumarksix.com/history/macaujc3/expect/${expect}`, {
      headers: { "user-agent": "Mozilla/5.0", "accept": "application/json,text/plain,*/*" }
    });
    const text = await upstream.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    res.status(upstream.status).send(text);
  } catch (error) {
    res.status(500).json({ error: "history_proxy_failed", message: error.message });
  }
}
