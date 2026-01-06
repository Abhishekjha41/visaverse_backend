// src/services/aiClient.ts
import dotenv from "dotenv";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "xiaomi/mimo-v2-flash:free";
const APP_URL = process.env.APP_URL || "http://localhost:3001";

if (!OPENROUTER_API_KEY) {
  console.warn(
    "[OpenRouter] OPENROUTER_API_KEY missing. Set it in your .env file."
  );
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Generic call to OpenRouter chat completions.
 * Returns raw content string from first choice.
 */
export async function callAI(system: string, user: string): Promise<string> {
  const body = {
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ] as ChatMessage[],
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": APP_URL,
      "X-Title": "VisaVerse VisaOps Copilot",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter error: ${res.status} ${res.statusText} ${text}`
    );
  }

  const json: any = await res.json();
  const content =
    json.choices?.[0]?.message?.content ??
    json.choices?.[0]?.message?.[0]?.content ??
    "";

  if (!content) {
    throw new Error("OpenRouter: empty response content");
  }

  return content;
}
