"use client";

/**
 * /history — Past verification sessions
 * STRICT: Official Lucide SVG icons only. No unicode symbol characters.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  History,
  Plus,
  Inbox,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
  FileText
} from "lucide-react";
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Done
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Running
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  return (
    <main className="min-h-screen relative z-0 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Nav */}
      <nav className="w-full glass-nav sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-[1px] shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <span className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              VerifAI
            </span>
          </button>

          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-emerald-400" />
            Verification History
          </span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Past Reports</h1>
            <p className="text-xs text-slate-400 mt-1">Review citation-backed verification runs</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>New Verification</span>
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-slate-400 text-xs font-medium">Loading session history...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-red-400 text-sm font-medium">{error}</div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-20 glass-card rounded-3xl border border-slate-800 p-12 max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-emerald-400 shadow-inner">
              <Inbox className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-white font-bold text-lg mb-1">No verification history yet</p>
            <p className="text-slate-400 text-xs mb-6">Start your first autonomous multi-agent verification run now.</p>
            <button
              onClick={() => router.push("/")}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
            >
              <span>Start first verification</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map((session, i) => {
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
                  glass-card rounded-2xl p-5 border border-slate-800 transition-all duration-200
                  ${session.status === "done"
                    ? "cursor-pointer hover:border-emerald-500/40 hover:bg-slate-900/90 shadow-md"
                    : "cursor-default opacity-70"
                  }
                `}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-base truncate mb-1">
                      {session.topic}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
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
                        <span className="flex items-center gap-1 text-slate-400 font-medium">
                          <FileText className="w-3 h-3 text-emerald-400" />
                          {claims.length} claims
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {avgScore !== null && (
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {avgScore}%
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Score</span>
                      </div>
                    )}

                    {getStatusBadge(session.status)}

                    {session.status === "done" && (
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    )}
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
