/**
 * VerifAI — Agent 4: Synthesis Agent
 *
 * Responsibilities:
 * 1. Compute confidence score (0–100) per claim using weighted formula
 * 2. Generate one-line human-readable reason per score
 * 3. Compile final Markdown research report
 *
 * System prompt enforces: objective reporting, flagging unresolved claims
 */

import {
  callClaude,
  parseJsonResponse,
  SYNTHESIS_AGENT_PROMPT,
} from "@/lib/anthropic";
import { emitEvent, createEvent } from "@/lib/stream-store";
import type { ClaimState, PipelineState } from "@/types";

// ─── Confidence score computation ─────────────────────────────────────────────

/**
 * Compute confidence score for a claim using the specified formula:
 * score = (corroborating_sources * 0.4 + source_trust_tier * 0.3 + verification_certainty * 0.3) * 100
 * Normalized to 0–100.
 *
 * Penalties applied for:
 * - contradicted/unverifiable status
 * - high severity flags
 * - multiple re-research attempts
 */
function computeConfidenceScore(claim: ClaimState): number {
  const { corroboratingSourcesCount, sourceTrustTier, verificationCertainty } =
    claim;

  // Normalize corroborating sources (max expected: 5)
  const normalizedSources = Math.min(corroboratingSourcesCount / 5, 1.0);

  // Base score per formula
  let score =
    (normalizedSources * 0.4 +
      sourceTrustTier * 0.3 +
      verificationCertainty * 0.3) *
    100;

  // Apply penalties
  if (claim.verificationStatus === "contradicted") score *= 0.5;
  else if (claim.verificationStatus === "unverifiable") score *= 0.4;
  else if (claim.verificationStatus === "partially_confirmed") score *= 0.8;

  if (claim.severity === "high") score *= 0.7;
  else if (claim.severity === "medium") score *= 0.85;

  if (claim.attemptCount > 0) score *= 0.9; // Re-researched penalty

  return Math.round(Math.min(99, Math.max(1, score)));
}

// ─── Report generation schemas ────────────────────────────────────────────────

interface ClaimSynthesis {
  claimId: string;
  confidenceReason: string;
}

interface SynthesisResponse {
  claimReasons: ClaimSynthesis[];
  reportMarkdown: string;
}

// ─── Main Synthesis Agent function ────────────────────────────────────────────

/**
 * Run the Synthesis Agent:
 * 1. Compute confidence scores for all claims
 * 2. Generate reasons via LLM
 * 3. Compile final Markdown report
 */
export async function runSynthesisAgent(
  state: PipelineState
): Promise<{ claims: ClaimState[]; finalReportMarkdown: string }> {
  const { sessionId, topic, claims } = state;

  emitEvent(
    sessionId,
    createEvent(sessionId, {
      type: "stage_change",
      stage: "synthesis",
      message: `📝 Agent 4: Computing confidence scores & generating final report...`,
    })
  );

  // ── Step 1: Compute confidence scores (deterministic, no LLM needed)
  const scoredClaims = claims.map((claim) => ({
    ...claim,
    confidenceScore: computeConfidenceScore(claim),
  }));

  emitEvent(
    sessionId,
    createEvent(sessionId, {
      type: "agent_log",
      stage: "synthesis",
      message: `📊 Confidence scores computed for ${scoredClaims.length} claims`,
    })
  );

  // ── Step 2: Generate one-line reasons + full Markdown report via LLM

  const claimsForLLM = scoredClaims
    .map(
      (c, i) =>
        `Claim ${i + 1} (ID: ${c.id}):
Statement: "${c.claim}"
Source: ${c.sourceUrl}
Verification: ${c.verificationStatus}
Severity: ${c.severity ?? "none"}
Confidence Score: ${c.confidenceScore}/100
Corroborating Sources: ${c.corroboratingSourcesCount}
Re-researched: ${c.attemptCount > 0 ? `Yes (${c.attemptCount}x)` : "No"}
---`
    )
    .join("\n\n");

  const prompt = `You are synthesizing a research report on the topic: "${topic}"

Here are all verified claims with their computed confidence scores:

${claimsForLLM}

TASK:
1. For each claim ID, write a concise one-line reason explaining its confidence score (e.g., "Confirmed by 3 independent sources; no contradictions found")
2. Generate a complete Markdown research report with:
   - H1 title with the research topic
   - Executive summary (3-5 sentences covering key findings)
   - For each claim: subsection with confidence badge, source link, one-line reason, and verification status
   - IMPORTANT: Any claim that was re-researched OR has "contradicted"/"unverifiable" status MUST be clearly flagged with ⚠️ WARNING
   - Methodology section
   - Disclaimer

Respond with valid JSON:
{
  "claimReasons": [
    { "claimId": "claim-uuid", "confidenceReason": "One-line reason" }
  ],
  "reportMarkdown": "# Full Markdown Report\\n\\n..."
}`;

  let finalClaims = scoredClaims;
  let finalReportMarkdown: string;

  try {
    const raw = await callClaude({
      systemPrompt: SYNTHESIS_AGENT_PROMPT,
      userMessage: prompt,
      temperature: 0.4,
      maxRetries: 2,
    });

    const parsed = parseJsonResponse<SynthesisResponse>(raw);

    // Apply reasons from LLM to claims
    const reasonsMap = new Map<string, string>();
    for (const r of parsed.claimReasons ?? []) {
      reasonsMap.set(r.claimId, r.confidenceReason);
    }

    finalClaims = scoredClaims.map((c) => ({
      ...c,
      confidenceReason:
        reasonsMap.get(c.id) ??
        generateFallbackReason(c),
    }));

    finalReportMarkdown = parsed.reportMarkdown ?? generateFallbackReport(topic, finalClaims);
  } catch (err) {
    console.error("[Synthesis] LLM call failed, using fallback:", err);
    finalClaims = scoredClaims.map((c) => ({
      ...c,
      confidenceReason: generateFallbackReason(c),
    }));
    finalReportMarkdown = generateFallbackReport(topic, finalClaims);
  }

  emitEvent(
    sessionId,
    createEvent(sessionId, {
      type: "agent_log",
      stage: "synthesis",
      message: `✅ Final report generated — ${finalClaims.length} claims processed`,
    })
  );

  return { claims: finalClaims, finalReportMarkdown };
}

// ─── Fallback helpers ─────────────────────────────────────────────────────────

function generateFallbackReason(claim: ClaimState): string {
  const { verificationStatus, corroboratingSourcesCount, severity, attemptCount } = claim;

  if (verificationStatus === "confirmed" && !severity) {
    return `Confirmed by ${corroboratingSourcesCount} independent source(s); no contradictions detected`;
  }
  if (verificationStatus === "partially_confirmed") {
    return `Partially supported by sources; some details differ across sources`;
  }
  if (verificationStatus === "contradicted") {
    return `Contradicted by independent sources${attemptCount > 0 ? " even after re-research" : ""}`;
  }
  if (verificationStatus === "unverifiable") {
    return `Insufficient independent sources found to verify or deny this claim`;
  }
  return `Score reflects available evidence and source reliability`;
}

function generateFallbackReport(
  topic: string,
  claims: ClaimState[]
): string {
  const confirmed = claims.filter((c) => c.verificationStatus === "confirmed");
  const contradicted = claims.filter(
    (c) =>
      c.verificationStatus === "contradicted" ||
      c.verificationStatus === "unverifiable"
  );

  const claimSections = claims
    .map((c) => {
      const badge =
        (c.confidenceScore ?? 0) >= 75
          ? "[HIGH CONFIDENCE]"
          : (c.confidenceScore ?? 0) >= 40
          ? "[MEDIUM CONFIDENCE]"
          : "[LOW CONFIDENCE]";

      const warning =
        c.attemptCount > 0 ||
        c.verificationStatus === "contradicted" ||
        c.verificationStatus === "unverifiable"
          ? " ⚠️"
          : "";

      return `### ${c.claim.slice(0, 80)}...${warning}
**${badge} — Score: ${c.confidenceScore ?? "N/A"}/100**

${c.claim}

- **Source:** [${c.sourceUrl}](${c.sourceUrl})
- **Status:** ${c.verificationStatus}
- **Reason:** ${c.confidenceReason ?? "N/A"}
${c.attemptCount > 0 ? `- **⚠️ Re-researched:** ${c.attemptCount}x through feedback loop` : ""}`;
    })
    .join("\n\n");

  return `# Research Report: ${topic}

## Executive Summary

This report presents ${claims.length} verified factual claims about "${topic}". ${confirmed.length} claims were confirmed by independent sources, while ${contradicted.length} claim(s) could not be fully verified or were found to be contradicted.

---

## Claims

${claimSections}

---

## Methodology

This report was generated by VerifAI's 4-agent pipeline: Research Agent (Tavily search + claim extraction), Verification Agent (independent cross-checking), Contradiction Detector (pairwise + source fidelity checks), and Synthesis Agent (confidence scoring + report generation).

---

*⚠️ Disclaimer: This is AI-generated research. Verify critical claims independently before making decisions.*`;
}
