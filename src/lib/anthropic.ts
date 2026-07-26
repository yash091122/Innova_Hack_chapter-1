/**
 * VerifAI — Google Gemini SDK Wrapper
 * Drop-in replacement for anthropic.ts — same exported API, Gemini under the hood.
 * All 4 agents import from this file via the same function names.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerationConfig,
} from "@google/generative-ai";

// ─── Client singleton ─────────────────────────────────────────────────────────

let _client: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file."
      );
    }
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
}

// ─── Model config ─────────────────────────────────────────────────────────────

export const CLAUDE_MODEL = "gemini-3.5-flash"; // Kept as CLAUDE_MODEL for import compatibility
export const MAX_TOKENS = 4096;

const GENERATION_CONFIG: GenerationConfig = {
  maxOutputTokens: MAX_TOKENS,
  temperature: 0.3,
  responseMimeType: "text/plain",
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ─── Per-Agent System Prompts ─────────────────────────────────────────────────

/**
 * Agent 1 — Research Agent
 * Grounded claim extractor; no hallucination allowed
 */
export const RESEARCH_AGENT_PROMPT = `You are a meticulous research agent whose ONLY job is to extract verifiable factual claims from provided web search results.

STRICT RULES you must follow without exception:
1. Only state claims that are DIRECTLY and EXPLICITLY supported by the provided source text you are given. 
2. Do NOT add any knowledge from your training data or outside the provided snippets.
3. Always attach the EXACT source URL for each claim — the URL must come from the search results you were given.
4. Extract only DISTINCT, SPECIFIC factual claims — no vague generalities.
5. Each claim must be a single, falsifiable statement (e.g., "NASA reported Arctic sea ice extent reached X km² in 2023").
6. If a source snippet does not clearly support a specific fact, do not include that fact.
7. Never combine facts from multiple sources into a single claim without clearly attributing each part.

Your output must always be valid JSON matching the specified schema. Do not add commentary outside the JSON.`;

/**
 * Agent 2 — Verification Agent  
 * Skeptical cross-checker; high confirmation bar
 */
export const VERIFICATION_AGENT_PROMPT = `You are a skeptical fact-verification agent. Your job is to rigorously cross-check a given claim against independent sources you have been provided.

STRICT RULES:
1. A claim is only "confirmed" if AT LEAST 2 independent sources explicitly support it.
2. If sources partially agree but differ on details, mark "partially_confirmed" and note the discrepancy.
3. If any source explicitly contradicts the claim, mark "contradicted" and quote the contradicting text.
4. If you cannot find relevant independent sources, mark "unverifiable" — never guess.
5. "Independent" means sources different from the original claim's source URL.
6. Be skeptical: absence of corroboration should lower your confidence, not raise it.
7. When marking "contradicted", always explain what the contradiction is specifically.
8. Your verification certainty score (0.0–1.0) must reflect how strongly the evidence supports or refutes the claim.

Your output must always be valid JSON matching the specified schema. Do not add commentary outside the JSON.`;

/**
 * Agent 3 — Contradiction & Hallucination Detector
 * Logical consistency enforcer; flags fabrication
 */
export const CONTRADICTION_AGENT_PROMPT = `You are a logical consistency auditor and hallucination detector. You receive a list of claims and their source snippets, and must find problems.

You perform TWO checks:

CHECK 1 — PAIRWISE CONTRADICTION:
Compare every pair of claims for factual conflicts:
- Same entity described differently (e.g., two claims give different dates, numbers, names, or locations for the same event)
- Logically incompatible statements (X cannot be both true simultaneously)
- When flagging, specify WHICH two claims conflict and HOW they conflict

CHECK 2 — SOURCE FIDELITY (Hallucination Detection):
For each claim, compare it against its cited sourceSnippet:
- If the claim states a fact NOT explicitly present in the snippet, flag it as a hallucination
- If numbers, names, or dates in the claim differ from the snippet, flag it
- If the claim makes an inference not supported by the snippet, flag it

SEVERITY RATING:
- "high": The discrepancy directly undermines the core assertion of the claim
- "medium": The discrepancy is material but not central to the claim's main point
- "low": Minor wording differences or peripheral details

Your output must always be valid JSON matching the specified schema. Do not add commentary outside the JSON.`;

/**
 * Agent 4 — Synthesis Agent
 * Objective summarizer; produces the final report
 */
export const SYNTHESIS_AGENT_PROMPT = `You are a rigorous research synthesis agent. You receive a set of verified and audited factual claims and produce a comprehensive, well-structured research report.

YOUR RESPONSIBILITIES:
1. Compute a confidence score (0–100) for each claim using this formula:
   score = (corroborating_sources_count * 0.4 + source_trust_tier * 0.3 + verification_certainty * 0.3) * 100
   Normalize to 0–100. Never round to exactly 0 or 100 unless the evidence is absolutely clear.

2. Write a concise one-line human-readable reason for each score, such as:
   - "Confirmed by 3 independent sources; no contradictions found"
   - "Single source; contradicted by 1 alternative source"
   - "Unverifiable after 2 attempts; no independent corroboration found"

3. Generate a final Markdown research report with this structure:
   - H1 title with the research topic
   - Executive summary paragraph (3-5 sentences)
   - Claims section: each claim as a subsection with confidence badge, source link, and one-line reason
   - IMPORTANT: Any claim that hit max re-research attempts AND is still "contradicted" or "unverifiable" MUST be clearly marked with WARNING
   - Methodology section briefly describing the 4-agent verification process
   - Disclaimer about AI-generated research

FORMAT RULES:
- Use Markdown with headers, bullet points, and inline code where appropriate
- Citation links should use [source](url) Markdown syntax  
- Confidence badges: use [HIGH CONFIDENCE], [MEDIUM CONFIDENCE], or [LOW CONFIDENCE] labels
- Be objective and avoid editorializing

Your output must always be valid JSON matching the specified schema. Do not add commentary outside the JSON.`;

// ─── LLM call wrapper with retry ─────────────────────────────────────────────

interface CallOptions {
  systemPrompt: string;
  userMessage: string;
  maxRetries?: number;
  temperature?: number;
}

const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite-001",
  "gemini-2.0-flash-001",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-3.5-flash"
];

let currentModelIndex = 0;

/**
 * Call Gemini with automatic model rotation on quota errors, plus retry on transient errors.
 * Named callClaude for import compatibility with agent files.
 * Returns the raw text content of the response.
 */
export async function callClaude(options: CallOptions): Promise<string> {
  const { systemPrompt, userMessage, maxRetries = 2, temperature = 0.3 } =
    options;

  const client = getGeminiClient();
  let lastError: Error | null = null;
  const maxTotalAttempts = maxRetries + FALLBACK_MODELS.length;

  for (let attempt = 0; attempt <= maxTotalAttempts; attempt++) {
    const currentModelName = FALLBACK_MODELS[currentModelIndex];
    
    // Each call creates a fresh model instance with the specific system instruction
    const model = client.getGenerativeModel({
      model: currentModelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        ...GENERATION_CONFIG,
        temperature,
      },
      safetySettings: SAFETY_SETTINGS,
    });

    try {
      const result = await model.generateContent(userMessage);
      const response = result.response;
      const text = response.text();

      if (!text || text.trim() === "") {
        throw new Error("Empty response from Gemini API");
      }

      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const errMsg = lastError.message;

      const isQuotaError =
        errMsg.includes("429") ||
        errMsg.includes("quota") ||
        errMsg.includes("RESOURCE_EXHAUSTED");
        
      const isNotFound = 
        errMsg.includes("404") || 
        errMsg.includes("not found") || 
        errMsg.includes("no longer available");

      const isTransient =
        errMsg.includes("503") ||
        errMsg.includes("500") ||
        errMsg.includes("overloaded");

      // Automatic model rotation for Quota or 404 Not Found errors
      if (isQuotaError || isNotFound) {
        const previousModel = currentModelName;
        currentModelIndex = (currentModelIndex + 1) % FALLBACK_MODELS.length;
        console.warn(`[Model Rotation] Model ${previousModel} failed (${isQuotaError ? 'Quota Exceeded' : 'Not Found'}). Switching to ${FALLBACK_MODELS[currentModelIndex]}...`);
        continue; // Immediately retry with the next model
      }

      if (attempt < maxTotalAttempts && isTransient) {
        // Exponential back-off for transient errors: 2s, 4s, etc.
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      
      // If it's a hard error (not transient/quota) or we exhausted models, we should break
      if (!isTransient && !isQuotaError && !isNotFound) {
        break;
      }
    }
  }

  throw lastError ?? new Error("Gemini API call failed after retries and model rotation");
}

/**
 * Parse JSON from Gemini's response, handling markdown code fences.
 * Identical to the original Anthropic version for compatibility.
 */
export function parseJsonResponse<T>(raw: string): T {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract JSON object or array from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    throw new Error(
      `Failed to parse Gemini response as JSON: ${cleaned.slice(0, 200)}`
    );
  }
}
