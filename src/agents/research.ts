/**
 * FactForge — Agent 1: Research Agent
 *
 * Responsibilities:
 * 1. Break topic into 3–6 sub-questions using LLM
 * 2. Search each sub-question with Tavily
 * 3. Extract distinct factual claims with source URLs and snippets
 *
 * System prompt enforces: only source-grounded claims, exact URL attribution
 */

import { v4 as uuidv4 } from "uuid";
import {
  callClaude,
  parseJsonResponse,
  RESEARCH_AGENT_PROMPT,
} from "@/lib/anthropic";
import {
  tavilySearch,
  formatSearchResultsForLLM,
  getSourceTrustTier,
} from "@/lib/tavily";
import { emitEvent, createEvent } from "@/lib/stream-store";
import type { ClaimState, PipelineState, TavilySearchResult } from "@/types";

// ─── Sub-question generation ─────────────────────────────────────────────────

interface SubQuestionsResponse {
  subQuestions: string[];
}

async function generateSubQuestions(topic: string): Promise<string[]> {
  const prompt = `The user wants to research and fact-check this topic: "${topic}"

Generate 3-6 specific, focused sub-questions that together would give comprehensive coverage of this topic. Each sub-question should be answerable with a targeted web search.

Respond with valid JSON in this exact format:
{
  "subQuestions": ["question 1", "question 2", "question 3", ...]
}`;

  const raw = await callClaude({
    systemPrompt: RESEARCH_AGENT_PROMPT,
    userMessage: prompt,
    temperature: 0.4,
  });

  const parsed = parseJsonResponse<SubQuestionsResponse>(raw);
  return parsed.subQuestions.slice(0, 6); // Cap at 6
}

// ─── Claim extraction ─────────────────────────────────────────────────────────

interface ExtractedClaim {
  claim: string;
  sourceUrl: string;
  sourceSnippet: string;
}

interface ClaimExtractionResponse {
  claims: ExtractedClaim[];
}

async function extractClaimsFromResults(
  subQuestion: string,
  results: TavilySearchResult[]
): Promise<ExtractedClaim[]> {
  if (results.length === 0) return [];

  const sourcesText = formatSearchResultsForLLM(results);

  const prompt = `Sub-question being researched: "${subQuestion}"

Here are web search results to analyze:

${sourcesText}

Extract all distinct, specific factual claims from these search results. 

IMPORTANT RULES:
- Each claim must be explicitly supported by the source text provided above
- Include the EXACT URL from the [Source N] section for each claim
- Include a direct quote or close paraphrase from the source as the snippet (max 200 chars)
- Only extract falsifiable, specific facts (not opinions or predictions)
- Extract 2-5 claims maximum from these results

Respond with valid JSON:
{
  "claims": [
    {
      "claim": "The specific factual statement",
      "sourceUrl": "https://exact-url-from-sources.com/page",
      "sourceSnippet": "The exact quote or close paraphrase from the source (max 200 chars)"
    }
  ]
}`;

  const raw = await callClaude({
    systemPrompt: RESEARCH_AGENT_PROMPT,
    userMessage: prompt,
    temperature: 0.2,
  });

  const parsed = parseJsonResponse<ClaimExtractionResponse>(raw);
  return parsed.claims ?? [];
}

// ─── Main Research Agent function ─────────────────────────────────────────────

export interface ResearchAgentOutput {
  subQuestions: string[];
  claims: ClaimState[];
}

/**
 * Run the Research Agent for the full topic or for a single claim re-research.
 *
 * @param state - Current pipeline state
 * @param targetClaimId - If set, only re-research this specific claim (feedback loop)
 */
export async function runResearchAgent(
  state: PipelineState,
  targetClaimId?: string
): Promise<ResearchAgentOutput> {
  const { sessionId, topic } = state;

  emitEvent(
    sessionId,
    createEvent(sessionId, {
      type: "stage_change",
      stage: "research",
      message: targetClaimId
        ? `Re-researching flagged claim (feedback loop)...`
        : `Agent 1: Breaking topic into sub-questions...`,
    })
  );

  // ── Step 1: Generate sub-questions (skip if re-researching a specific claim)
  let subQuestions = state.subQuestions;

  if (!targetClaimId || subQuestions.length === 0) {
    subQuestions = await generateSubQuestions(topic);

    emitEvent(
      sessionId,
      createEvent(sessionId, {
        type: "agent_log",
        stage: "research",
        message: `📋 Generated ${subQuestions.length} sub-questions for "${topic}"`,
      })
    );
  }

  // ── If re-researching a specific claim, only search for that claim
  if (targetClaimId) {
    const existingClaim = state.claims.find((c) => c.id === targetClaimId);
    if (!existingClaim) {
      return { subQuestions, claims: state.claims };
    }

    emitEvent(
      sessionId,
      createEvent(sessionId, {
        type: "loop_triggered",
        stage: "research",
        claimId: targetClaimId,
        message: `Loop triggered: Re-researching claim "${existingClaim.claim.slice(0, 80)}..."`,
      })
    );

    // Search specifically for this claim's sub-question
    const results = await tavilySearch(existingClaim.subQuestion, {
      maxResults: 5,
      searchDepth: "advanced",
      // Exclude the original source to find fresh perspectives
      excludeDomains: [new URL(existingClaim.sourceUrl).hostname].filter(Boolean),
    });

    const extracted = await extractClaimsFromResults(
      existingClaim.subQuestion,
      results
    );

    if (extracted.length === 0) {
      // No new findings — keep claim as is but increment attempt count
      const updatedClaims = state.claims.map((c) =>
        c.id === targetClaimId
          ? { ...c, attemptCount: c.attemptCount + 1 }
          : c
      );
      return { subQuestions, claims: updatedClaims };
    }

    // Use the best new claim to update the existing one
    const best = extracted[0];
    const updatedClaims = state.claims.map((c) => {
      if (c.id !== targetClaimId) return c;

      // Push current state to history before updating
      const historyEntry = {
        attempt: c.attemptCount,
        claim: c.claim,
        sourceUrl: c.sourceUrl,
        verificationStatus: c.verificationStatus,
        timestamp: new Date().toISOString(),
      };

      return {
        ...c,
        claim: best.claim,
        sourceUrl: best.sourceUrl,
        sourceSnippet: best.sourceSnippet,
        sourceTrustTier: getSourceTrustTier(best.sourceUrl),
        attemptCount: c.attemptCount + 1,
        history: [...c.history, historyEntry],
        // Reset verification so agents 2 & 3 re-process
        verificationStatus: "pending" as const,
        severity: null,
        confidenceScore: null,
        confidenceReason: null,
      };
    });

    return { subQuestions, claims: updatedClaims };
  }

  // ── Step 2: Search each sub-question and extract claims (full research)
  const allClaims: ClaimState[] = [];

  for (let i = 0; i < subQuestions.length; i++) {
    const sq = subQuestions[i];

    emitEvent(
      sessionId,
      createEvent(sessionId, {
        type: "agent_log",
        stage: "research",
        message: `🌐 Searching: "${sq}" (${i + 1}/${subQuestions.length})`,
      })
    );

    const results = await tavilySearch(sq, {
      maxResults: 4,
      searchDepth: "basic",
    });

    if (results.length === 0) {
      emitEvent(
        sessionId,
        createEvent(sessionId, {
          type: "agent_log",
          stage: "research",
          message: `No results found for sub-question ${i + 1}`,
        })
      );
      continue;
    }

    let extracted: ExtractedClaim[] = [];
    try {
      extracted = await extractClaimsFromResults(sq, results);
    } catch (err) {
      console.error(`[Research] Failed to extract claims for "${sq}":`, err);
      continue;
    }

    for (const ec of extracted) {
      const claim: ClaimState = {
        id: uuidv4(),
        claim: ec.claim,
        sourceUrl: ec.sourceUrl,
        sourceSnippet: ec.sourceSnippet,
        verificationStatus: "pending",
        severity: null,
        attemptCount: 0,
        history: [],
        confidenceScore: null,
        confidenceReason: null,
        corroboratingSourcesCount: 0,
        sourceTrustTier: getSourceTrustTier(ec.sourceUrl),
        verificationCertainty: 0,
        subQuestion: sq,
      };
      allClaims.push(claim);
    }

    emitEvent(
      sessionId,
      createEvent(sessionId, {
        type: "agent_log",
        stage: "research",
        message: `Extracted ${extracted.length} claims from sub-question ${i + 1}`,
      })
    );
  }

  emitEvent(
    sessionId,
    createEvent(sessionId, {
      type: "agent_log",
      stage: "research",
      message: `🏁 Research complete: ${allClaims.length} total claims extracted`,
      pipelineState: { subQuestions, claims: allClaims },
    })
  );

  return { subQuestions, claims: allClaims };
}
