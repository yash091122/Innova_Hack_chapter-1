/**
 * GET /api/verify/export?sessionId=...&format=pdf|md
 * Returns downloadable PDF or Markdown file.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/supabase";
import { DEMO_PIPELINE_STATE } from "@/lib/demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const format = searchParams.get("format") ?? "md";

  if (!sessionId) {
    return new Response("sessionId query parameter is required", {
      status: 400,
    });
  }

  if (format !== "pdf" && format !== "md") {
    return new Response('format must be "pdf" or "md"', { status: 400 });
  }

  let reportMarkdown: string;
  let topic: string;

  // Handle demo sessions
  if (sessionId.startsWith("demo-")) {
    reportMarkdown = DEMO_PIPELINE_STATE.finalReportMarkdown ?? "";
    topic = DEMO_PIPELINE_STATE.topic;
  } else {
    try {
      const session = await getSession(sessionId);

      if (!session) {
        return new Response("Session not found", { status: 404 });
      }

      if (session.status !== "done") {
        return new Response("Report not yet available", { status: 202 });
      }

      reportMarkdown = session.final_report_markdown ?? "";
      topic = session.topic;
    } catch (err) {
      console.error("[Export API] Error:", err);
      return new Response("Failed to retrieve report", { status: 500 });
    }
  }

  const safeFilename = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 50);

  // For Markdown export — return raw markdown
  if (format === "md") {
    return new Response(reportMarkdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="verifai-report-${safeFilename}.md"`,
      },
    });
  }

  // For PDF export — return the markdown and let the client render it as PDF
  // (Client-side jsPDF handles actual PDF generation)
  // This endpoint returns the markdown with PDF content-type header as a signal
  return new Response(
    JSON.stringify({
      markdown: reportMarkdown,
      topic,
      generatedAt: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `inline; filename="verifai-report-${safeFilename}.json"`,
      },
    }
  );
}
