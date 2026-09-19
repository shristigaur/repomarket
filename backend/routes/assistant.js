require('dotenv').config();

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error('[Assistant] GEMINI_API_KEY is missing. Assistant chat requests cannot be generated.');
}

const SYSTEM_INSTRUCTION = 'You are the Micro-SaaS Liquidation Assistant. You help buyers evaluate code quality, understand project valuations, check tech stack compatibility, and guide sellers on how to list their abandoned repositories. Respond in plain text only. Do not use any Markdown syntax, including asterisks for bold text, headers, horizontal lines, or backticks for code. Keep paragraphs short, simple, clear, and easy to read.';

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .map((entry) => {
      const role = entry?.role === 'assistant' ? 'model' : entry?.role;
      const text = typeof entry?.content === 'string'
        ? entry.content.trim()
        : Array.isArray(entry?.parts)
          ? entry.parts.filter((part) => typeof part?.text === 'string').map((part) => part.text).join('\n').trim()
          : '';

      if (!['user', 'model'].includes(role) || !text) return null;
      return { role, parts: [{ text }] };
    })
    .filter(Boolean);
}

router.post('/chat', async (req, res) => {
  const rawMessage = req.body?.message;
  const rawHistory = req.body?.history;
  const message = typeof rawMessage === 'string' ? rawMessage.trim().slice(0, 2000) : '';
  const history = normalizeHistory(rawHistory);

  if (!message) {
    return res.status(400).json({ error: 'A non-empty message is required.' });
  }

  if (!geminiApiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
  }

  try {
    const client = new GoogleGenerativeAI(geminiApiKey);
    const model = client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      systemInstruction: SYSTEM_INSTRUCTION
    });
    const result = await model.generateContent({
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 512 }
    });
    const textResponse = result.response.text().trim();

    console.log('Sending response to frontend:', textResponse);
    return res.status(200).json({ reply: textResponse });
  } catch (error) {
    console.error('Assistant Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate response' });
  }
});

module.exports = router;
