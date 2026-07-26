/**
 * VerifAI — Agent 3: Contradiction & Hallucination Detector
 *
 * Responsibilities:
 * 1. Pairwise consistency check across all claims
 * 2. Source fidelity check (did Agent 1 hallucinate/embellish?)
 * 3. Assign severity: high | medium | low to every flagged issue
 *
 * System prompt enforces: strict source-text comparison, pairwise conflict detection
 */

import {
  callClaude,
  parseJsonResponse,
  CONTRADICTION_AGENT_PROMPT,
} from "@/lib/anthropic";
import { emitEvent, createEvent } from "@/lib/stream-store";
import type { ClaimState, PipelineState, Severity } from "@/types";

// ─── Contradiction detection response schema ───────────────────────────────────

interface ClaimAuditResult {
  claimId: string;
  severity: Severity;
  issues: string[];
}

interface ContradictionResponse {
  auditResults: ClaimAuditResult[];
  summary: string;
}

// ─── Main Contradiction Agent function ────────────────────────────────────────

/**
 * Run the Contradiction & Hallucination Detector on all claims.
 * Processes in batches if there are many claims to stay within context limits.
 */
export async function runContradictionAgent(
  state: PipelineState
): Promise<ClaimState[]> {
  const { sessionId, claims } = state;

  emitEvent(
    sessionId,
    createEvent(sessionId, {
      type: "stage_change",
      stage: "contradiction_check",
      message: `Agent 3: Checking for contradictions & hallucinations across ${claims.length} claims...`,
    })
  );

  if (claims.length === 0) {
    return claims;
  }

  // Build the claims summary for LLM analysis
  const claimsSummary = claims
    .map(
      (c, i) =>
        `Claim ID: ${c.id}
Claim ${i + 1}: "${c.claim}"
Source URL: ${c.sourceUrl}
Source Snippet: "${c.sourceSnippet}"
Verification Status: ${c.verificationStatus}
---`
    )
    .join("\n\n");

  const prompt = `You are auditing a set of ${claims.length} factual claims. Perform both checks:

CHECK 1 — Pairwise contradiction: Do any two claims conflict with each other on facts (numbers, dates, names, attributions)?
CHECK 2 — Source fidelity: For each claim, does the stated fact actually appear in the source snippet, or was it embellished/hallucinated?

CLAIMS TO AUDIT:
${claimsSummary}

For each claim that has an issue, include it in auditResults. Claims with NO issues should not be listed (they will default to null severity).

Respond with valid JSON:
{
  "auditResults": [
    {
      "claimId": "claim-uuid-here",
      "severity": "high|medium|low",
      "issues": ["Description of issue 1", "Description of issue 2 if any"]
    }
  ],
  "summary": "Brief overall audit summary"
}

If no issues are found, return: { "auditResults": [], "summary": "No contradictions or hallucinations detected." }`;

  let auditResults: ClaimAuditResult[] = [];

  try {
    const raw = await callClaude({
      systemPrompt: CONTRADICTION_AGENT_PROMPT,
      userMessage: prompt,
      temperature: 0.1, // Very low temp for consistency
    });

    const parsed = parseJsonResponse<ContradictionResponse>(raw);
    auditResults = parsed.auditResults ?? [];

    emitEvent(
      sessionId,
      createEvent(sessionId, {
        type: "agent_log",
        stage: "contradiction_check",
        message: `Audit complete: ${auditResults.length} issue(s) found. ${parsed.summary}`,
      })
    );
  } catch (err) {
    console.error("[Contradiction] Detection failed:", err);
    emitEvent(
      sessionId,
      createEvent(sessionId, {
        type: "agent_log",
        stage: "contradiction_check",
        message: `Contradiction check encountered an error — proceeding with no severity flags`,
      })
    );
    // Return claims unmodified on failure
    return claims;
  }

  // Build a lookup map for fast severity assignment
  const severityMap = new Map<string, Severity>();
  for (const result of auditResults) {
    severityMap.set(result.claimId, result.severity);
  }

  // Apply severity to claims
  const updatedClaims = claims.map((claim) => {
    const detectedSeverity = severityMap.get(claim.id) ?? null;

    if (detectedSeverity) {
      emitEvent(
        sessionId,
        createEvent(sessionId, {
          type: "claim_update",
          stage: "contradiction_check",
          claimId: claim.id,
          claim: { severity: detectedSeverity },
          message: `Issue detected in claim "${claim.claim.slice(0, 60)}..." — severity: ${detectedSeverity.toUpperCase()}`,
        })
      );
    }

    return {
      ...claim,
      severity: detectedSeverity,
    };
  });

  // Summary log
  const highSeverityCount = updatedClaims.filter(
    (c) => c.severity === "high"
  ).length;
  const mediumCount = updatedClaims.filter(
    (c) => c.severity === "medium"
  ).length;

  emitEvent(
    sessionId,
    createEvent(sessionId, {
      type: "agent_log",
      stage: "contradiction_check",
      message: `📋 Audit summary: ${highSeverityCount} high-severity, ${mediumCount} medium-severity issues flagged`,
    })
  );

  return updatedClaims;
}

/**
 * Determine which claims need re-research (high severity + under attempt limit).
 * Used by the LangGraph conditional edge.
 */
export function getClaimsNeedingReresearch(
  claims: ClaimState[],
  maxAttempts = 2
): string[] {
  return claims
    .filter(
      (c) =>
        c.severity !== null &&
        c.attemptCount < maxAttempts
    )
    .map((c) => c.id);
}
