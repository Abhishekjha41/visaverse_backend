import { callAI } from "./aiClient";
import { PlanResponse } from "../types";

// --- UPDATED SYSTEM PROMPT ---
const systemPrompt = `
You are "VisaOps Copilot", an AI assistant for global mobility and HR teams.

You are NOT a legal authority and do NOT provide legal advice.
You simulate how a cautious visa officer + corporate immigration consultant would reason.

PRIMARY GOALS:
- Predict likelihood of visa approval for a given employee or candidate profile.
- Identify the most realistic primary and backup visa paths.
- Surface concrete rejection risks (documentation, profile, route choice).
- Suggest specific, practical actions HR can take to improve outcomes.
- Produce output that can be aggregated across many profiles in a portfolio dashboard.

STRICT RULES:
- Output ONLY valid raw JSON.
- No explanations, no markdown, no comments, no extra text.
- Response MUST start with { and end with }.

SCHEMA:
{
  "mobilityScore": {
    "score": number,
    "explanation": "string"
  },
  "approvalSimulation": {
    "approvalProbability": number,
    "confidenceLabel": "Low" | "Medium" | "High",
    "topRejectionRisks": ["string"],
    "fastestImprovements": [
      {
        "action": "string",
        "impactPercent": number
      }
    ]
  },
  "strategy": {
    "primaryPath": "string",
    "backupPaths": ["string"],
    "eligibilityScore": number,
    "riskLevel": "Low" | "Medium" | "High",
    "riskReasons": ["string"],
    "countryRedFlags": ["string"]
  },
  "visaComparison": [
    {
      "visa": "string",
      "approvalProbability": number,
      "processingTime": "string",
      "riskLevel": "Low" | "Medium" | "High"
    }
  ],
  "checklist": [
     {
        "id": "string",
        "category": "identity" | "finances" | "education" | "employment",
        "label": "string",
        "details": "string",
        "importance": "high" | "medium" | "low"
     }
  ],
  "timeline": [
     {
        "title": "string",
        "description": "string",
        "estimatedDuration": "string",
        "delayRisk": "Low" | "Medium" | "High"
     }
  ],
  "relocationTips": ["string"]
}
`;

/**
 * Extract first JSON object from a string (even if model adds text).
 */
function safeExtractJSON(text: string): string {
  if (!text) throw new Error("Empty AI response");

  let depth = 0;
  let start = -1;

  // Scan for the first outermost {} block
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }

  throw new Error("No balanced JSON object found in AI response");
}

/**
 * Last‑resort mock (never crash in demo).
 */
function mockPlan(): PlanResponse {
  return {
    mobilityScore: {
      score: 72,
      explanation: "Strong overall profile with a few improvable areas.",
    },
    approvalSimulation: {
      approvalProbability: 68,
      confidenceLabel: "Medium",
      topRejectionRisks: [
        "Proof of funds may be borderline for long stay.",
        "Employment history not clearly documented.",
      ],
      fastestImprovements: [
        {
          action: "Increase documented savings by at least 20%",
          impactPercent: 12,
        },
        {
          action: "Add detailed employer letter with role & salary",
          impactPercent: 8,
        },
      ],
    },
    strategy: {
      primaryPath: "Skilled worker / employment‑based route",
      backupPaths: [
        "Short‑term project visa",
        "Remote‑work / digital nomad option",
      ],
      eligibilityScore: 70,
      riskLevel: "Medium",
      riskReasons: [
        "Salary band close to minimum for destination country.",
        "Limited prior international travel history.",
      ],
      countryRedFlags: ["Seasonal processing delays and backlogs."],
    },
    visaComparison: [
      {
        visa: "Skilled Worker",
        approvalProbability: 68,
        processingTime: "6–10 weeks",
        riskLevel: "Medium",
      },
      {
        visa: "Short‑term Project",
        approvalProbability: 75,
        processingTime: "3–6 weeks",
        riskLevel: "Low",
      },
      {
        visa: "Study / Upskilling",
        approvalProbability: 82,
        processingTime: "4–8 weeks",
        riskLevel: "Low",
      },
    ],
    checklist: [],
    timeline: [
      {
        title: "Profile & role validation",
        description:
          "Confirm role, salary band, employer details and destination‑country fit.",
        estimatedDuration: "1–2 weeks",
      },
      {
        title: "Document collection",
        description:
          "Gather contracts, bank statements, education records, police checks.",
        estimatedDuration: "2–3 weeks",
      },
      {
        title: "Application build & submission",
        description: "Prepare forms, upload documents, submit and pay fees.",
        estimatedDuration: "1 week",
      },
      {
        title: "Biometrics & decision",
        description: "Provide biometrics and wait for decision.",
        estimatedDuration: "3–6 weeks",
      },
      {
        title: "Post‑approval onboarding",
        description: "Travel, register locally and start work / study.",
        estimatedDuration: "1–2 weeks",
      },
    ],
    relocationTips: [
      "Secure temporary housing near your first workplace or campus.",
      "Open a multi‑currency or international account before you travel.",
      "Book biometrics and visa centre appointments as early as possible.",
    ],
  };
}

/**
 * Generate a full AI-driven visa plan with risk simulation.
 */
export async function generateVisaPlan(profile: any): Promise<PlanResponse> {
  const userPrompt = `
EMPLOYEE / CANDIDATE PROFILE (ANONYMIZED):
${JSON.stringify(profile, null, 2)}

CONTEXT:
- This profile belongs to a global mobility / HR talent pipeline.
- Assume a mid-sized tech company relocating or hiring cross-border.
- Be realistic and conservative about approval odds.
- Prefer legally common, widely used routes in that origin/destination pair.
- Avoid exotic routes that would rarely be used in production HR workflows.

REQUIRED BEHAVIOR:
- Provide at least 3 visa options in "visaComparison".
- Make "topRejectionRisks" concrete and portfolio-aggregate-friendly.
- "fastestImprovements" must be actions HR can realistically take.
- "timeline" must contain exactly 5 steps from initial planning to post-approval onboarding.
- "relocationTips" should be practical, high-signal bullets.

IMPORTANT:
- Do NOT mention law names, sections, or quote regulations.
- Do NOT state anything as guaranteed approval or legal advice.
- Keep everything high-level, pattern-based, and compliance-conscious.
`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    let parsed: any;

    try {
      // try direct JSON
      parsed = JSON.parse(raw);
    } catch {
      // fallback: extract first JSON object
      const jsonOnly = safeExtractJSON(raw);
      parsed = JSON.parse(jsonOnly);
    }

    return parsed as PlanResponse;
  } catch (err) {
    console.error("AI plan generation failed, using mock plan:", err);
    return mockPlan();
  }
}