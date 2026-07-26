/**
 * POST /api/verify
 * Accepts { topic, demo? } and kicks off the LangGraph pipeline.
 * Returns { sessionId, topic, createdAt }.
 */

import { NextRequest, NextResponse, after } from "next/server";
import { createSession } from "@/lib/supabase";
import { emitEvent, createEvent } from "@/lib/stream-store";
import { DEMO_TOPIC, DEMO_PIPELINE_STATE } from "@/lib/demo-data";
import type { VerifyRequest } from "@/types";

export const runtime = "nodejs"; // LangGraph requires Node.js (not edge)
export const maxDuration = 300; // 5 minute timeout for Next.js Pro plans

export async function POST(request: NextRequest) {
  let body: VerifyRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { topic, demo = false } = body;

  if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
    return NextResponse.json(
      { error: "topic is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (topic.trim().length > 500) {
    return NextResponse.json(
      { error: "topic must be 500 characters or less" },
      { status: 400 }
    );
  }

  // ── Demo mode: return pre-cached data immediately ────────────────────────────
  if (demo) {
    const sessionId = "demo-" + Date.now();

    // Emit demo completion event immediately
    setTimeout(() => {
      emitEvent(
        sessionId,
        createEvent(sessionId, {
          type: "done",
          stage: "done",
          message: "🎯 Demo mode: instant results loaded",
          pipelineState: { ...DEMO_PIPELINE_STATE, sessionId, currentStage: "done" },
        })
      );
    }, 500);

    return NextResponse.json({
      sessionId,
      topic: DEMO_TOPIC,
      createdAt: new Date().toISOString(),
      demo: true,
    });
  }

  // ── Live mode: create session + run pipeline in background ───────────────────
  let sessionId: string;

  try {
    sessionId = await createSession(topic.trim());
  } catch (err) {
    // If Supabase isn't configured, generate a local session ID and continue
    console.warn("[API] Supabase unavailable, using local session ID:", err);
    sessionId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // Run pipeline in background (non-blocking)
  // The pipeline communicates progress via SSE events
  after(async () => {
    try {
      const { runPipeline } = await import("@/graph/pipeline");
      await runPipeline(sessionId, topic.trim());
    } catch (err) {
      console.error(`[Pipeline] Background execution failed for ${sessionId}:`, err);
      emitEvent(
        sessionId,
        createEvent(sessionId, {
          type: "error",
          stage: "error",
          message: `Pipeline failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        })
      );
    }
  });

  return NextResponse.json({
    sessionId,
    topic: topic.trim(),
    createdAt: new Date().toISOString(),
    demo: false,
  });
}
