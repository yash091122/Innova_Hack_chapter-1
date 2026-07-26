/**
 * GET /api/verify/stream?sessionId=...
 * Server-Sent Events endpoint — streams agent progress to the frontend.
 */

import { NextRequest } from "next/server";
import { subscribeToSession, createEvent, emitEvent } from "@/lib/stream-store";
import { getSession } from "@/lib/supabase";
import { DEMO_PIPELINE_STATE } from "@/lib/demo-data";
import type { SSEEvent } from "@/types";

export const runtime = "nodejs";
// Disable response caching for SSE
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return new Response("sessionId query parameter is required", {
      status: 400,
    });
  }

  // Handle demo sessions specially
  if (sessionId.startsWith("demo-")) {
    return streamDemoEvents(sessionId);
  }

  // Create the SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: SSEEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Client disconnected — ignore
        }
      };

      // Send a heartbeat immediately to establish connection
      sendEvent(
        createEvent(sessionId, {
          type: "agent_log",
          message: "🔌 Connected to FactForge pipeline stream",
          stage: "idle",
        })
      );

      // Check if there's already a completed session in Supabase
      getSession(sessionId)
        .then((session) => {
          if (
            session &&
            (session.status === "done" || session.status === "error")
          ) {
            // Pipeline already finished — send final state immediately
            if (session.pipeline_state) {
              sendEvent(
                createEvent(sessionId, {
                  type: "done",
                  stage: "done",
                  message: "Pipeline already completed — loading saved results",
                  pipelineState: session.pipeline_state,
                })
              );
            }
            controller.close();
            return;
          }

          // Subscribe to live events
          const unsubscribe = subscribeToSession(sessionId, (event) => {
            sendEvent(event);

            // Close stream when pipeline is done or errored
            if (event.type === "done" || event.type === "error") {
              setTimeout(() => {
                try {
                  controller.close();
                } catch {
                  // Already closed
                }
              }, 500);
            }
          });

          // Handle client disconnect
          request.signal.addEventListener("abort", () => {
            unsubscribe();
            try {
              controller.close();
            } catch {
              // Already closed
            }
          });
        })
        .catch((err) => {
          console.error("[SSE] Failed to check session status:", err);
          // Still subscribe to live events even if DB check fails
          const unsubscribe = subscribeToSession(sessionId, sendEvent);
          request.signal.addEventListener("abort", () => {
            unsubscribe();
          });
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}

// ─── Demo SSE stream ───────────────────────────────────────────────────────────

function streamDemoEvents(sessionId: string): Response {
  const demoEvents: Array<{ delay: number; event: SSEEvent }> = [
    {
      delay: 300,
      event: createEvent(sessionId, {
        type: "stage_change",
        stage: "research",
        message: 'Agent 1: Breaking topic into sub-questions...',
      }),
    },
    {
      delay: 800,
      event: createEvent(sessionId, {
        type: "agent_log",
        stage: "research",
        message: `📋 Generated 5 sub-questions for "${DEMO_PIPELINE_STATE.topic}"`,
      }),
    },
    {
      delay: 1500,
      event: createEvent(sessionId, {
        type: "agent_log",
        stage: "research",
        message: '🌐 Searching: "social media depression teenagers" (1/5)',
      }),
    },
    {
      delay: 2200,
      event: createEvent(sessionId, {
        type: "agent_log",
        stage: "research",
        message: 'Extracted 2 claims from sub-question 1',
      }),
    },
    {
      delay: 3000,
      event: createEvent(sessionId, {
        type: "agent_log",
        stage: "research",
        message: '🌐 Searching: "Surgeon General social media advisory 2023" (2/5)',
      }),
    },
    {
      delay: 4000,
      event: createEvent(sessionId, {
        type: "agent_log",
        stage: "research",
        message: '🏁 Research complete: 6 total claims extracted',
      }),
    },
    {
      delay: 4500,
      event: createEvent(sessionId, {
        type: "stage_change",
        stage: "verification",
        message: 'Agent 2: Verifying 6 claims with independent sources...',
        totalClaims: 6,
      }),
    },
    {
      delay: 5500,
      event: createEvent(sessionId, {
        type: "claim_update",
        stage: "verification",
        claimIndex: 1,
        totalClaims: 6,
        message: '📊 Claim 1: confirmed (certainty: 85%)',
      }),
    },
    {
      delay: 6500,
      event: createEvent(sessionId, {
        type: "claim_update",
        stage: "verification",
        claimIndex: 2,
        totalClaims: 6,
        message: '📊 Claim 2: confirmed (certainty: 98%)',
      }),
    },
    {
      delay: 8000,
      event: createEvent(sessionId, {
        type: "stage_change",
        stage: "contradiction_check",
        message: 'Agent 3: Checking for contradictions & hallucinations...',
      }),
    },
    {
      delay: 9500,
      event: createEvent(sessionId, {
        type: "loop_triggered",
        stage: "contradiction_check",
        message: 'Feedback loop triggered: Claim 3 has HIGH severity — routing back to Agent 1!',
      }),
    },
    {
      delay: 11000,
      event: createEvent(sessionId, {
        type: "stage_change",
        stage: "research",
        message: 'Re-researching flagged claim (feedback loop)...',
      }),
    },
    {
      delay: 13000,
      event: createEvent(sessionId, {
        type: "stage_change",
        stage: "synthesis",
        message: 'Agent 4: Computing confidence scores & generating final report...',
      }),
    },
    {
      delay: 15000,
      event: createEvent(sessionId, {
        type: "done",
        stage: "done",
        message: '🎉 Pipeline complete! Report ready with 6 verified claims.',
        pipelineState: { ...DEMO_PIPELINE_STATE, sessionId, currentStage: "done" },
      }),
    },
  ];

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send connection event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify(
            createEvent(sessionId, {
              type: "agent_log",
              message: "🎯 Demo mode active — running pre-cached scenario",
              stage: "idle",
            })
          )}\n\n`
        )
      );

      // Schedule each demo event with its delay
      demoEvents.forEach(({ delay, event }) => {
        setTimeout(() => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
            if (event.type === "done") {
              setTimeout(() => {
                try {
                  controller.close();
                } catch {
                  // Already closed
                }
              }, 300);
            }
          } catch {
            // Stream closed
          }
        }, delay);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
