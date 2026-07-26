/**
 * VerifAI — LangGraph Pipeline
 *
 * Implements the 4-agent pipeline as a real LangGraph StateGraph with:
 * - Explicit nodes for each agent
 * - A REAL conditional edge from contradiction_check → research (feedback loop)
 *   using addConditionalEdges(), NOT a while-loop workaround
 *
 * Graph topology:
 *   START → research → verification → contradiction_check
 *                         ↑               ↓ (conditional)
 *                         └──── loop ─────┘ (issue detected)
 *                                         ↓ (no issues / max attempts)
 *                                     synthesis → END
 */

import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { runResearchAgent } from "@/agents/research";
import { runVerificationAgent } from "@/agents/verification";
import { runContradictionAgent, getClaimsNeedingReresearch } from "@/agents/contradiction";
import { runSynthesisAgent } from "@/agents/synthesis";
import { emitEvent, createEvent } from "@/lib/stream-store";
import { updateSession } from "@/lib/supabase";
import type { PipelineState, ClaimState } from "@/types";

// ─── LangGraph State Annotation ────────────────────────────────────────────────

/**
 * State annotation for LangGraph.
 * Defines the shape of state passed between graph nodes.
 */
const PipelineAnnotation = Annotation.Root({
  sessionId: Annotation<string>(),
  topic: Annotation<string>(),
  subQuestions: Annotation<string[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  claims: Annotation<ClaimState[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  currentStage: Annotation<PipelineState["currentStage"]>({
    reducer: (_, next) => next,
    default: () => "idle",
  }),
  finalReportMarkdown: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  startedAt: Annotation<string>(),
  completedAt: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  error: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  // Internal: tracks which claim is being re-researched (null = full research)
  _reresearchClaimId: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
});

type GraphState = typeof PipelineAnnotation.State;

// ─── Node: Research ────────────────────────────────────────────────────────────

async function researchNode(state: GraphState): Promise<Partial<GraphState>> {
  const pipelineState = graphStateToPipelineState(state);

  const { subQuestions, claims } = await runResearchAgent(
    pipelineState,
    state._reresearchClaimId ?? undefined
  );

  return {
    subQuestions,
    claims,
    currentStage: "research",
    _reresearchClaimId: null, // Reset after re-research
  };
}

// ─── Node: Verification ────────────────────────────────────────────────────────

async function verificationNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const pipelineState = graphStateToPipelineState(state);
  const updatedClaims = await runVerificationAgent(pipelineState);

  return {
    claims: updatedClaims,
    currentStage: "verification",
  };
}

// ─── Node: Contradiction Check ────────────────────────────────────────────────

async function contradictionNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const pipelineState = graphStateToPipelineState(state);
  const updatedClaims = await runContradictionAgent(pipelineState);

  return {
    claims: updatedClaims,
    currentStage: "contradiction_check",
  };
}

// ─── Node: Synthesis ───────────────────────────────────────────────────────────

async function synthesisNode(state: GraphState): Promise<Partial<GraphState>> {
  const pipelineState = graphStateToPipelineState(state);
  const { claims, finalReportMarkdown } = await runSynthesisAgent(pipelineState);

  return {
    claims,
    finalReportMarkdown,
    currentStage: "synthesis",
    completedAt: new Date().toISOString(),
  };
}

/**
 * Conditional edge function for LangGraph's addConditionalEdges().
 * Routes from contradiction_check to either the re-research path or synthesis.
 *
 * After Agent 3 (contradiction check):
 * - If any claim has an issue (severity !== null) AND attemptCount < 2 → route to "set_reresearch_target" helper node
 *   which then routes back to "research" for targeted re-research on just that claim
 * - Otherwise → proceed to "synthesis"
 */
function routeAfterContradiction(state: GraphState): string {
  const claimsToReresearch = getClaimsNeedingReresearch(state.claims, 2);

  if (claimsToReresearch.length > 0) {
    return "set_reresearch_target";
  }
  return "synthesis";
}


// ─── Node: Set Re-research Target (helper node for the feedback loop) ──────────

/**
 * Helper node inserted between contradiction_check and research.
 * Sets the _reresearchClaimId so the research node knows which claim to re-research.
 */
async function setReresearchTargetNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const claimsToReresearch = getClaimsNeedingReresearch(state.claims, 2);
  const targetId = claimsToReresearch[0] ?? null;

  emitEvent(
    state.sessionId,
    createEvent(state.sessionId, {
      type: "loop_triggered",
      stage: "contradiction_check",
      claimId: targetId ?? undefined,
      message: `Feedback loop: targeting claim for re-research`,
    })
  );

  return {
    _reresearchClaimId: targetId,
  };
}

// ─── Graph Assembly ────────────────────────────────────────────────────────────

function buildGraph() {
  const graph = new StateGraph(PipelineAnnotation)
    // Register all nodes
    .addNode("research", researchNode)
    .addNode("verification", verificationNode)
    .addNode("contradiction_check", contradictionNode)
    .addNode("set_reresearch_target", setReresearchTargetNode)
    .addNode("synthesis", synthesisNode)

    // Linear edges for the happy path
    .addEdge(START, "research")
    .addEdge("research", "verification")
    .addEdge("verification", "contradiction_check")

    // THE KEY CONDITIONAL EDGE: implements the feedback loop
    // Routes to "set_reresearch_target" → "research" OR directly to "synthesis"
    .addConditionalEdges("contradiction_check", routeAfterContradiction, {
      set_reresearch_target: "set_reresearch_target",
      synthesis: "synthesis",
    })

    // After setting target, loop back to research
    .addEdge("set_reresearch_target", "research")

    // Terminal edge
    .addEdge("synthesis", END);

  return graph.compile();
}

// ─── State conversion helpers ──────────────────────────────────────────────────

function graphStateToPipelineState(state: GraphState): PipelineState {
  return {
    sessionId: state.sessionId,
    topic: state.topic,
    subQuestions: state.subQuestions,
    claims: state.claims,
    currentStage: state.currentStage,
    finalReportMarkdown: state.finalReportMarkdown,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
    error: state.error,
  };
}

// ─── Main entry point ──────────────────────────────────────────────────────────

/**
 * Run the complete VerifAI LangGraph pipeline.
 * Emits SSE events throughout and saves final state to Supabase.
 */
export async function runPipeline(
  sessionId: string,
  topic: string
): Promise<PipelineState> {
  const graph = buildGraph();

  const initialState: GraphState = {
    sessionId,
    topic,
    subQuestions: [],
    claims: [],
    currentStage: "idle",
    finalReportMarkdown: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    _reresearchClaimId: null,
  };

  // Mark session as running in Supabase
  await updateSession(sessionId, { status: "running" });

  emitEvent(
    sessionId,
    createEvent(sessionId, {
      type: "stage_change",
      stage: "research",
      message: `🚀 VerifAI pipeline started for topic: "${topic}"`,
    })
  );

  let finalState: GraphState;

  try {
    // Execute the LangGraph state machine
    finalState = await graph.invoke(initialState);

    // Mark done in Supabase
    const pipelineState = graphStateToPipelineState(finalState);
    await updateSession(sessionId, {
      status: "done",
      pipeline_state: { ...pipelineState, currentStage: "done" },
      final_report_markdown: finalState.finalReportMarkdown ?? undefined,
    });

    emitEvent(
      sessionId,
      createEvent(sessionId, {
        type: "done",
        stage: "done",
        message: `🎉 Pipeline complete! Report ready with ${finalState.claims.length} verified claims.`,
        pipelineState: { ...pipelineState, currentStage: "done" },
      })
    );

    return { ...graphStateToPipelineState(finalState), currentStage: "done" };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Pipeline] Error in session ${sessionId}:`, err);

    await updateSession(sessionId, { status: "error" });

    emitEvent(
      sessionId,
      createEvent(sessionId, {
        type: "error",
        stage: "error",
        message: `❌ Pipeline error: ${errorMsg}`,
      })
    );

    throw err;
  }
}
