"use client";

/**
 * /verify/[sessionId] — Live pipeline status + final results page
 * Light glassmorphism theme matching landing page design
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
    <div className="w-full h-72 rounded-3xl border border-white bg-white/50 backdrop-blur-xl animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold shadow-lg">
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

const STAGE_ICONS: Record<string, { gradient: string }> = {
  idle: { gradient: "from-slate-300 to-slate-400" },
  research: { gradient: "from-teal-300 via-emerald-400 to-cyan-400" },
  verification: { gradient: "from-amber-200 via-orange-400 to-rose-400" },
  contradiction_check: { gradient: "from-pink-300 via-rose-400 to-fuchsia-400" },
  synthesis: { gradient: "from-indigo-300 via-purple-400 to-violet-500" },
  done: { gradient: "from-emerald-400 to-teal-500" },
  error: { gradient: "from-rose-400 to-red-500" },
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

  const stageGradient = STAGE_ICONS[currentStage]?.gradient ?? "from-slate-300 to-slate-400";

  return (
    <main className="min-h-screen relative z-0 selection:bg-emerald-300 selection:text-slate-900 text-slate-900">
      {/* Background Ambient Color Glows */}
      <div className="absolute top-0 right-0 w-[700px] h-[600px] bg-gradient-to-b from-emerald-300/35 via-teal-200/25 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-pink-300/35 via-purple-200/25 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-orange-200/20 to-violet-200/20 blur-3xl pointer-events-none -z-10" />

      {/* Nav */}
      <nav className="w-full sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
              Fact<span className="text-slate-500 font-medium">Forge</span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            {currentStage === "done" ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-extrabold border border-emerald-200/60 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pipeline Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 text-slate-700 text-xs font-bold border border-white shadow-sm">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${stageGradient} flex items-center justify-center`}>
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                </div>
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
              <motion.div 
                className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-xl"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${stageGradient} flex items-center justify-center shadow-md`}>
                      <Activity className="w-5 h-5 text-white animate-pulse drop-shadow" />
                    </div>
                    <div>
                      <h1 className="font-codystar text-xl sm:text-2xl font-extrabold tracking-widest text-slate-950 uppercase">
                        RUNNING VERIFICATION
                      </h1>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        4-Agent Autonomous Research Pipeline Active
                      </p>
                    </div>
                  </div>
                  <span className="font-codystar text-2xl font-bold text-emerald-600">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-sm"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </motion.div>

              {/* Feedback Loop Alert */}
              <AnimatePresence>
                {loopTriggered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-amber-50 border border-amber-200/60 text-xs shadow-md">
                      <RefreshCw className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0" />
                      <div>
                        <span className="font-bold text-amber-700">Feedback Loop Triggered!</span>
                        <span className="text-amber-600/80 ml-2">
                          Contradiction detected — routing affected claim back to Agent 1 for targeted re-research.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid: Graph + Live Status Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <motion.div 
                  className="lg:col-span-3 space-y-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">
                    Multi-Agent Graph Topology
                  </h2>
                  <AgentPipeline
                    currentStage={currentStage}
                    loopTriggered={loopTriggered}
                    claimProgress={
                      claimProgress.total > 0 ? claimProgress : undefined
                    }
                  />

                  {/* 4 Steps quick indicator with orb gradients */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {[
                      { stage: "research", label: "Research", icon: Search, gradient: "from-teal-300 via-emerald-400 to-cyan-400", glowColor: "rgba(52, 211, 153, 0.3)" },
                      { stage: "verification", label: "Verify", icon: ShieldCheck, gradient: "from-amber-200 via-orange-400 to-rose-400", glowColor: "rgba(251, 146, 60, 0.3)" },
                      { stage: "contradiction_check", label: "Detect", icon: GitCompare, gradient: "from-pink-300 via-rose-400 to-fuchsia-400", glowColor: "rgba(244, 114, 182, 0.3)" },
                      { stage: "synthesis", label: "Synthesize", icon: Sparkles, gradient: "from-indigo-300 via-purple-400 to-violet-500", glowColor: "rgba(167, 139, 250, 0.3)" },
                    ].map(({ stage, label, icon: IconComp, gradient, glowColor }) => {
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
                        <motion.div
                          key={stage}
                          whileHover={{ scale: 1.03 }}
                          className={`rounded-2xl p-4 text-center border transition-all duration-300 backdrop-blur-xl ${
                            isActive
                              ? "bg-white/90 shadow-xl border-white scale-105"
                              : isDoneStage
                              ? "bg-emerald-50/80 border-emerald-200/40"
                              : "bg-white/50 border-white/60 opacity-50"
                          }`}
                          style={{
                            boxShadow: isActive ? `0 8px 30px ${glowColor}` : undefined,
                          }}
                        >
                          <div className="flex justify-center mb-2">
                            <div
                              className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md border border-white/60 ${
                                isActive ? "animate-pulse" : ""
                              }`}
                              style={{
                                boxShadow: isActive ? `0 0 20px ${glowColor}` : undefined,
                              }}
                            >
                              <IconComp className="w-5 h-5 text-white drop-shadow" />
                            </div>
                          </div>
                          <div
                            className={`text-xs font-extrabold ${
                              isActive
                                ? "text-slate-900"
                                : isDoneStage
                                ? "text-emerald-600"
                                : "text-slate-500"
                            }`}
                          >
                            {label}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                <motion.div 
                  className="lg:col-span-2 h-[480px]"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4 pl-1">
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
                </motion.div>
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
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-slate-500 font-bold text-sm">Compiling final citation report...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-200/60 text-center text-xs font-semibold text-slate-400 z-20">
        FactForge Fact-Verification Platform
      </footer>
    </main>
  );
}
