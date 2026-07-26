"use client";

/**
 * /verify/[sessionId] — Live pipeline status + final results page
 * STRICT: Official Lucide SVG icons only. No unicode symbol characters.
 */

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ShieldCheck,
  Search,
  GitCompare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Activity
} from "lucide-react";
import LiveStatusPanel from "@/components/LiveStatusPanel";
import ReportView from "@/components/ReportView";
import type { PipelineStage, ClaimState, SSEEvent } from "@/types";

// Lazy-load React Flow to avoid SSR issues
const AgentPipeline = dynamic(() => import("@/components/AgentPipeline"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-3xl border border-slate-800 bg-slate-950/60 animate-pulse soft-card flex items-center justify-center text-slate-500 text-xs font-semibold">
      Loading Pipeline Graph...
    </div>
  ),
});

const STAGE_LABELS: Record<string, string> = {
  idle: "Initializing...",
  research: "Agent 1: Research",
  verification: "Agent 2: Verification",
  contradiction_check: "Agent 3: Contradiction Check",
  synthesis: "Agent 4: Synthesis",
  done: "Pipeline Complete",
  error: "Pipeline Error",
};

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [currentStage, setCurrentStage] = useState<PipelineStage>("idle");
  const [loopTriggered, setLoopTriggered] = useState(false);
  const [claimProgress, setClaimProgress] = useState<{
    current: number;
    total: number;
  }>({ current: 0, total: 0 });
  const [isDone, setIsDone] = useState(false);
  const [report, setReport] = useState<{
    topic: string;
    claims: ClaimState[];
    finalReportMarkdown: string;
  } | null>(null);

  // Reset loop animation after a delay
  useEffect(() => {
    if (loopTriggered) {
      const t = setTimeout(() => setLoopTriggered(false), 5000);
      return () => clearTimeout(t);
    }
  }, [loopTriggered]);

  const handleStageChange = useCallback((stage: PipelineStage) => {
    setCurrentStage(stage);
    if (stage !== "contradiction_check" && stage !== "research") {
      setLoopTriggered(false);
    }
  }, []);

  const handleLoopTriggered = useCallback(() => {
    setLoopTriggered(true);
  }, []);

  const handleProgressUpdate = useCallback((current: number, total: number) => {
    setClaimProgress({ current, total });
  }, []);

  const handleDone = useCallback((event: SSEEvent) => {
    setCurrentStage("done");
    setIsDone(true);

    if (event.pipelineState) {
      const ps = event.pipelineState as {
        topic?: string;
        claims?: ClaimState[];
        finalReportMarkdown?: string;
      };

      if (ps.claims && ps.topic) {
        setReport({
          topic: ps.topic,
          claims: ps.claims,
          finalReportMarkdown: ps.finalReportMarkdown ?? "",
        });
      } else {
        fetchReport();
      }
    } else {
      fetchReport();
    }
  }, [sessionId]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/verify/report?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setReport({
          topic: data.topic,
          claims: data.claims,
          finalReportMarkdown: data.finalReportMarkdown,
        });
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
    }
  };

  const progressPercent =
    currentStage === "done"
      ? 100
      : {
          idle: 5,
          research: 25,
          verification: 50,
          contradiction_check: 75,
          synthesis: 90,
          error: 0,
        }[currentStage] ?? 0;

  return (
    <main className="min-h-screen relative z-0 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Nav */}
      <nav className="w-full glass-nav sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
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

          <div className="flex items-center gap-3">
            {currentStage === "done" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pipeline Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                {STAGE_LABELS[currentStage] ?? currentStage}
              </span>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 z-10 relative">
        <AnimatePresence mode="wait">
          {!isDone && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Progress Header Card */}
              <div className="glass-card p-6 rounded-3xl border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <h1 className="text-xl font-extrabold text-white tracking-tight">
                      Running Verification Pipeline
                    </h1>
                  </div>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Feedback Loop Alert */}
              <AnimatePresence>
                {loopTriggered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs shadow-lg mb-6">
                      <RefreshCw className="w-5 h-5 text-amber-400 animate-spin flex-shrink-0" />
                      <div>
                        <span className="font-bold text-amber-300">Feedback Loop Triggered!</span>
                        <span className="text-amber-200/80 ml-2">
                          Contradiction detected — routing affected claim back to Agent 1 for targeted re-research.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid: Graph + Live Status Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                    Multi-Agent Graph Topology
                  </h2>
                  <AgentPipeline
                    currentStage={currentStage}
                    loopTriggered={loopTriggered}
                    claimProgress={
                      claimProgress.total > 0 ? claimProgress : undefined
                    }
                  />

                  {/* 4 Steps quick indicator */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {[
                      { stage: "research", label: "Research", icon: Search },
                      { stage: "verification", label: "Verify", icon: ShieldCheck },
                      { stage: "contradiction_check", label: "Detect", icon: GitCompare },
                      { stage: "synthesis", label: "Synthesize", icon: Sparkles },
                    ].map(({ stage, label, icon: IconComp }) => {
                      const stageOrder = [
                        "research",
                        "verification",
                        "contradiction_check",
                        "synthesis",
                      ];
                      const isActive = currentStage === stage;
                      const isDoneStage =
                        stageOrder.indexOf(currentStage) >
                        stageOrder.indexOf(stage);

                      return (
                        <div
                          key={stage}
                          className={`rounded-2xl p-4 text-center border transition-all duration-300 ${
                            isActive
                              ? "bg-slate-900 shadow-lg border-emerald-500/50 scale-105"
                              : isDoneStage
                              ? "bg-emerald-950/20 border-emerald-500/30 opacity-90"
                              : "glass-card border-slate-800 opacity-50"
                          }`}
                        >
                          <div className="flex justify-center mb-1">
                            <IconComp
                              className={`w-5 h-5 ${
                                isActive
                                  ? "text-emerald-400 animate-pulse"
                                  : isDoneStage
                                  ? "text-emerald-400"
                                  : "text-slate-500"
                              }`}
                            />
                          </div>
                          <div
                            className={`text-xs font-bold ${
                              isActive
                                ? "text-white"
                                : isDoneStage
                                ? "text-emerald-400"
                                : "text-slate-500"
                            }`}
                          >
                            {label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-2 h-[480px]">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pl-1">
                    Live Telemetry Log
                  </h2>
                  <div className="h-full">
                    <LiveStatusPanel
                      sessionId={sessionId}
                      onStageChange={handleStageChange}
                      onLoopTriggered={handleLoopTriggered}
                      onProgressUpdate={handleProgressUpdate}
                      onDone={handleDone}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {isDone && report && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ReportView
                sessionId={sessionId}
                topic={report.topic}
                claims={report.claims}
                finalReportMarkdown={report.finalReportMarkdown}
              />
            </motion.div>
          )}

          {isDone && !report && (
            <motion.div
              key="loading-report"
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              <p className="text-slate-400 font-semibold text-sm">Compiling final citation report...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
