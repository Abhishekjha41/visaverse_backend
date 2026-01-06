import { callAI } from "./aiClient"; // Ensure path is correct

// ... (Interface imports if any)

const systemPrompt = `
You are an expert Document Screener for Visa Applications.
Your job is to analyze resumes, CVs, offer letters, or SOPs and find red flags.

STRICT OUTPUT RULES:
1. Return ONLY a valid JSON object.
2. Do NOT use Markdown code blocks (no \`\`\`json).
3. Do NOT add any conversational text like "Here is the analysis".
4. The output must start with { and end with }.

JSON SCHEMA:
{
  "score": number (0-100),
  "summary": "string (1-2 sentences)",
  "issues": ["string", "string"],
  "suggestions": ["string", "string"]
}
`;

/**
 * Improved JSON Extractor that handles Markdown and dirty inputs
 */
function safeExtractJSON(text: string): string {
  if (!text) throw new Error("Empty AI response");

  console.log("🔹 RAW AI RESPONSE:", text); // Debugging line added

  // 1. Remove Markdown code blocks if present
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "");

  // 2. Find the first '{' and the last '}'
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in AI response");
  }

  // 3. Extract just the JSON part
  return cleaned.slice(start, end + 1);
}

export async function analyzeDocument(text: string) {
  const userPrompt = `
    ANALYZE THIS DOCUMENT TEXT:
    "${text.slice(0, 5000)}" 
    
    (Note: Text is truncated to first 5000 chars for efficiency)
  `;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    
    // Parse the cleaned JSON
    const jsonString = safeExtractJSON(raw);
    const parsed = JSON.parse(jsonString);

    return {
      score: parsed.score || 0,
      summary: parsed.summary || "Could not analyze document.",
      issues: parsed.issues || [],
      suggestions: parsed.suggestions || []
    };

  } catch (err) {
    console.error("❌ Document analysis failed:", err);
    // Return safe default so frontend doesn't break
    return {
      score: 0,
      summary: "AI Service is temporarily unavailable or returned invalid data.",
      issues: ["System Error: Could not parse AI response"],
      suggestions: ["Please try again later."]
    };
  }
}