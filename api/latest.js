export default async function handler(req, res) {
  try {
    const upstream = await fetch("https://macaumarksix.com/api/macaujc3.com", {
      headers: { "user-agent": "Mozilla/5.0", "accept": "application/json,text/plain,*/*" }
    });
    const text = await upstream.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    res.status(upstream.status).send(text);
  } catch (error) {
    res.status(500).json({ error: "latest_proxy_failed", message: error.message });
  }
}
