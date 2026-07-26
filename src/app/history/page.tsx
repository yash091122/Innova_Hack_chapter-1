"use client";

/**
 * /history — Past verification sessions
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { SessionRow } from "@/types";

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load history");
        setLoading(false);
      });
  }, []);

  const statusConfig: Record<string, { color: string; label: string }> = {
    done: { color: "text-green-400", label: "Done" },
    running: { color: "text-blue-400", label: "Running" },
    pending: { color: "text-yellow-400", label: "Pending" },
    error: { color: "text-red-400", label: "Error" },
  };

  return (
    <main className="min-h-screen animated-gradient">
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto border-b border-white/5">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-sm font-bold shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            V
          </div>
          <span className="text-lg font-bold text-white">VerifAI</span>
        </button>
        <span className="text-sm text-white/40">Verification History</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Past Reports</h1>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-xl bg-white/90 hover:bg-white text-sm font-medium text-black neumorphic-raised transition-all"
          >
            + New Verification
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-white/40">{error}</div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-white/40">No verification history yet.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 text-white/70 hover:text-white text-sm transition-colors"
            >
              Start your first verification →
            </button>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map((session, i) => {
            const cfg = statusConfig[session.status] ?? { color: "text-gray-400", label: session.status };
            const claims = session.pipeline_state?.claims ?? [];
            const avgScore =
              claims.length > 0
                ? Math.round(
                    claims.reduce((s, c) => s + (c.confidenceScore ?? 0), 0) /
                      claims.length
                  )
                : null;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() =>
                  session.status === "done"
                    ? router.push(`/verify/${session.id}`)
                    : null
                }
                className={`
                  glass-card rounded-2xl p-5 transition-all duration-200
                  ${session.status === "done"
                    ? "cursor-pointer hover:border-white/20 hover:bg-white/5"
                    : "cursor-default opacity-70"
                  }
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {session.topic}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                      <span>
                        {new Date(session.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {claims.length > 0 && (
                        <span>{claims.length} claims</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {avgScore !== null && (
                      <span className="text-sm font-bold text-white">
                        {avgScore}/100
                      </span>
                    )}
                    <span className={`text-xs font-medium ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
