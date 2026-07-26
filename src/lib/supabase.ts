/**
 * VerifAI — Supabase Client & Session Helpers
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { PipelineState, SessionRow } from "@/types";

// ─── Client factories ─────────────────────────────────────────────────────────

let _serverClient: SupabaseClient | null = null;
let _publicClient: SupabaseClient | null = null;

/** Server-side Supabase client (uses service role key for full access) */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!_serverClient) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn("[Supabase] Environment variables missing. Operating in local-only mode.");
      return null;
    }
    _serverClient = createClient(url, key);
  }
  return _serverClient;
}

/** Public Supabase client for browser usage (uses anon key) */
export function getSupabasePublicClient(): SupabaseClient | null {
  if (!_publicClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn("[Supabase] Public client environment variables missing.");
      return null;
    }
    _publicClient = createClient(url, key);
  }
  return _publicClient;
}

// ─── SQL Schema (for README / setup) ─────────────────────────────────────────
export const SUPABASE_SCHEMA_SQL = `
-- Run this in the Supabase SQL editor to set up VerifAI tables

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','error')),
  pipeline_state JSONB,
  final_report_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Index for fast history queries
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
`;

// ─── Session CRUD helpers ─────────────────────────────────────────────────────

/**
 * Create a new session record and return its ID.
 */
export async function createSession(topic: string, userId?: string): Promise<string> {
  const client = getSupabaseServerClient();
  if (!client) {
    throw new Error("Supabase environment variables are not set.");
  }

  const { data, error } = await client
    .from("sessions")
    .insert({ topic, status: "pending", user_id: userId ?? null })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }
  return data.id as string;
}

/**
 * Update session status and optionally pipeline state.
 */
export async function updateSession(
  sessionId: string,
  updates: {
    status?: SessionRow["status"];
    pipeline_state?: PipelineState;
    final_report_markdown?: string;
  }
): Promise<void> {
  const client = getSupabaseServerClient();
  if (!client) return;

  const { error } = await client
    .from("sessions")
    .update(updates)
    .eq("id", sessionId);

  if (error) {
    console.error(`[Supabase] Failed to update session ${sessionId}:`, error);
  }
}

/**
 * Fetch a session by ID.
 */
export async function getSession(sessionId: string): Promise<SessionRow | null> {
  const client = getSupabaseServerClient();
  if (!client) return null;

  const { data, error } = await client
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch session: ${error.message}`);
  }
  return data as SessionRow;
}

/**
 * Fetch the N most recent sessions (for the history page).
 */
export async function listSessions(limit = 20): Promise<SessionRow[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  const { data, error } = await client
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Supabase] Failed to list sessions:", error);
    return [];
  }
  return (data ?? []) as SessionRow[];
}
