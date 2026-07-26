/**
 * GET /api/history
 * Returns list of past sessions from Supabase.
 */

import { NextResponse } from "next/server";
import { listSessions } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = await listSessions(20);
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("[History API] Error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve history", sessions: [] },
      { status: 500 }
    );
  }
}
