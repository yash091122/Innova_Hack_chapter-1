/**
 * VerifAI — Agent 2: Verification Agent
 *
 * Responsibilities:
 * 1. Run 2–3 fresh, independent Tavily searches per claim
 * 2. LLM compares claim against independent results
 * 3. Classifies: confirmed | partially_confirmed | contradicted | unverifiable
 *
 * System prompt enforces: skeptical cross-checker, 2+ sources required for "confirmed"
 */

import {
  callClaude,
  parseJsonResponse,
  VERIFICATION_AGENT_PROMPT,
} from "@/lib/anthropic";
import {
  tavilySearch,
  formatSearchResultsForLLM,
} from "@/lib/tavily";
import { emitEvent, createEvent } from "@/lib/stream-store";
import type { ClaimState, PipelineState, VerificationStatus } from "@/types";

// ─── Verification response schema ─────────────────────────────────────────────

interface VerificationResponse {
  verificationStatus: VerificationStatus;
  verificationCertainty: number; // 0.0–1.0
  corroboratingSourcesCount: number;
  explanation: string;
  contradictingQuote?: string;
}

// ─── Single-claim verifier ────────────────────────────────────────────────────

async function verifyClaim(claim: ClaimState): Promise<Partial<ClaimState>> {
  // Generate 2-3 diverse search queries to cross-check this claim
  const searchQueries = [
    // Direct verification query
    claim.claim.slice(0, 100),
    // Sub-question based query (different angle)
    `${claim.subQuestion} research evidence`,
    // Specific fact query if claim contains numbers or names
    `fact check: ${claim.claim.slice(0, 80)}`,
  ].slice(0, 3);

  // Get the original domain to exclude it (enforce independence)
  let excludedDomain: string[] = [];
  try {
    excludedDomain = [new URL(claim.sourceUrl).hostname];
  } catch {
    // ignore invalid URLs
  }

  // Run all searches concurrently
  const searchPromises = searchQueries.map((q) =>
    tavilySearch(q, {
      maxResults: 3,
      searchDepth: "basic",
      excludeDomains: excludedDomain,
    })
  );

  const searchResultSets = await Promise.all(searchPromises);

  // Deduplicate results by URL
  const seen = new Set<string>();
  const allResults = searchResultSets.flat().filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  if (allResults.length === 0) {
    return {
      verificationStatus: "unverifiable",
      corroboratingSourcesCount: 0,
      verificationCertainty: 0,
    };
  }

  const sourcesText = formatSearchResultsForLLM(allResults.slice(0, 7));

  const prompt = `Please verify this specific claim using the independent sources provided below.

CLAIM TO VERIFY:
"${claim.claim}"

Original source URL (do NOT use this — we need independent verification): ${claim.sourceUrl}

INDEPENDENT SOURCES FOUND:
${sourcesText}

Verify the claim against these INDEPENDENT sources. Remember:
- "confirmed" = at least 2 independent sources explicitly support the claim
- "partially_confirmed" = sources partially agree but differ on key details
- "contradicted" = at least one source explicitly contradicts the claim  
- "unverifiable" = insufficient independent sources to confirm or deny

Respond with valid JSON:
{
  "verificationStatus": "confirmed|partially_confirmed|contradicted|unverifiable",
  "verificationCertainty": 0.85,
  "corroboratingSourcesCount": 2,
  "explanation": "Brief explanation of your verification finding",
  "contradictingQuote": "Only include if contradicted — the exact quote that contradicts the claim"
}`;

  const raw = await callClaude({
    systemPrompt: VERIFICATION_AGENT_PROMPT,
    userMessage: prompt,
    temperature: 0.2,
  });

  const parsed = parseJsonResponse<VerificationResponse>(raw);

  return {
    verificationStatus: parsed.verificationStatus ?? "unverifiable",
    corroboratingSourcesCount: Math.max(0, parsed.corroboratingSourcesCount ?? 0),
    verificationCertainty: Math.min(1, Math.max(0, parsed.verificationCertainty ?? 0)),
  };
}

// ─── Main Verification Agent function ─────────────────────────────────────────

/**
 * Run the Verification Agent on all claims that have status "pending".
 * Skips already-verified claims (idempotent for the feedback loop).
 */
export async function runVerificationAgent(
  state: PipelineState
): Promise<ClaimState[]> {
  const { sessionId, claims } = state;

  const pendingClaims = claims.filter(
    (c) => c.verificationStatus === "pending"
  );

  emitEvent(
    sessionId,
    createEvent(sessionId, {
      type: "stage_change",
      stage: "verification",
      message: `🔎 Agent 2: Verifying ${pendingClaims.length} claim(s) with independent sources...`,
      totalClaims: pendingClaims.length,
    })
  );

  const updatedClaims = [...claims];

  for (let i = 0; i < updatedClaims.length; i++) {
    const claim = updatedClaims[i];

    // Only verify claims that are still pending
    if (claim.verificationStatus !== "pending") continue;

    emitEvent(
      sessionId,
      createEvent(sessionId, {
        type: "agent_log",
        stage: "verification",
        claimId: claim.id,
        claimIndex: i + 1,
        totalClaims: claims.length,
        message: `🔍 Verifying claim ${i + 1}/${claims.length}: "${claim.claim.slice(0, 70)}..."`,
      })
    );

    let updates: Partial<ClaimState>;

    try {
      updates = await verifyClaim(claim);
    } catch (err) {
      console.error(`[Verification] Failed on claim ${claim.id}:`, err);
      // Fail gracefully — mark unverifiable, don't crash
      updates = {
        verificationStatus: "unverifiable",
        corroboratingSourcesCount: 0,
        verificationCertainty: 0,
      };
    }

    updatedClaims[i] = { ...claim, ...updates };

    emitEvent(
      sessionId,
      createEvent(sessionId, {
        type: "claim_update",
        stage: "verification",
        claimId: claim.id,
        claim: updates,
        message: `📊 Claim ${i + 1}: ${updates.verificationStatus ?? "unknown"} (certainty: ${((updates.verificationCertainty ?? 0) * 100).toFixed(0)}%)`,
      })
    );
  }

  emitEvent(
    sessionId,
    createEvent(sessionId, {
      type: "agent_log",
      stage: "verification",
      message: `✅ Verification complete for all ${updatedClaims.length} claims`,
    })
  );

  return updatedClaims;
}
