export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  const apiKey = process.env.AIML_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const response = await fetch("https://api.aimlapi.com/v2/video/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/sora-2-t2v",
        prompt,
        duration: 5,
        resolution: "720p",
        aspect_ratio: "16:9",
      }),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { return res.status(500).json({ error: `Invalid response: ${text.slice(0, 200)}` }); }

    if (!response.ok) return res.status(response.status).json({ error: data?.detail || data?.message || data?.error || `HTTP ${response.status}` });

    const id = data.id || data.generation_id;
    if (!id) return res.status(500).json({ error: `No ID returned: ${text.slice(0, 200)}` });

    return res.status(200).json({ id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
