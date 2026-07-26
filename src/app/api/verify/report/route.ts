/**
 * GET /api/verify/report?sessionId=...
 * Returns the final compiled report for a completed session.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/supabase";
import { DEMO_PIPELINE_STATE } from "@/lib/demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId query parameter is required" },
      { status: 400 }
    );
  }

  // Handle demo sessions
  if (sessionId.startsWith("demo-")) {
    return NextResponse.json({
      sessionId,
      topic: DEMO_PIPELINE_STATE.topic,
      claims: DEMO_PIPELINE_STATE.claims,
      finalReportMarkdown: DEMO_PIPELINE_STATE.finalReportMarkdown,
      currentStage: "done",
      completedAt: DEMO_PIPELINE_STATE.completedAt,
    });
  }

  try {
    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status === "pending" || session.status === "running") {
      return NextResponse.json(
        { error: "Pipeline is still running", status: session.status },
        { status: 202 }
      );
    }

    if (session.status === "error") {
      return NextResponse.json(
        { error: "Pipeline failed", status: "error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      topic: session.topic,
      claims: session.pipeline_state?.claims ?? [],
      finalReportMarkdown: session.final_report_markdown ?? "",
      currentStage: session.pipeline_state?.currentStage ?? "done",
      completedAt: session.updated_at,
    });
  } catch (err) {
    console.error("[Report API] Error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve report" },
      { status: 500 }
    );
  }
}
