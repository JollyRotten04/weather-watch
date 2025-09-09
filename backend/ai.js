import express from "express";
import fetch from "node-fetch";

const router = express.Router();

const HF_API_KEY = process.env.HF_API_KEY; // load from .env in production

router.post("/ai/feedback", async (req, res) => {
  const { chartData } = req.body;

  const prompt = `
  You are a weather assistant. Analyze the following chart data and provide:
  1. Summary
  2. Recommendations
  3. Trend Analysis

  Weather data: ${chartData}
  `;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    const result = await response.json();
    res.json({ feedback: result[0]?.generated_text || "No response" });
  } catch (error) {
    console.error("❌ AI request failed:", error);
    res.status(500).json({ error: "AI request failed" });
  }
});

export default router;
