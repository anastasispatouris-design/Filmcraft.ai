export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { generation_id } = req.query;
  if (!generation_id) return res.status(400).json({ error: "generation_id is required" });

  const apiKey = process.env.AIML_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const response = await fetch(
      `https://api.aimlapi.com/v2/video/generations?generation_id=${generation_id}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    const text = await response.text();
    if (!response.ok) return res.status(response.status).json({ error: `Poll HTTP ${response.status}: ${text.slice(0, 200)}` });

    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
