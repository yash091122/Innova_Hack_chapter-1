"use client";

/**
 * /verify/[sessionId] — Live pipeline status + final results page
 */

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import LiveStatusPanel from "@/components/LiveStatusPanel";
import ReportView from "@/components/ReportView";
import type { PipelineStage, ClaimState, SSEEvent } from "@/types";

// Lazy-load React Flow to avoid SSR issues
const AgentPipeline = dynamic(() => import("@/components/AgentPipeline"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-3xl border border-gray-200/60 bg-white/40 animate-pulse soft-card" />
  ),
});

const STAGE_LABELS: Record<string, string> = {
  idle: "Initializing...",
  research: "Agent 1: Research",
  verification: "Agent 2: Verification",
  contradiction_check: "Agent 3: Contradiction Check",
  synthesis: "Agent 4: Synthesis",
  done: "Complete ✓",
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
          idle: 0,
          research: 25,
          verification: 50,
          contradiction_check: 75,
          synthesis: 90,
          error: 0,
        }[currentStage] ?? 0;

  return (
    <main className="min-h-screen relative z-0">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto z-10 border-b border-gray-200/50">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm font-bold shadow-sm text-gray-900 group-hover:bg-gray-50 transition-colors">
            V
          </div>
          <span className="text-lg font-bold text-gray-900 group-hover:text-gray-600 transition-colors">
            VerifAI
          </span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">
            {STAGE_LABELS[currentStage] ?? currentStage}
          </span>
          {currentStage !== "done" && currentStage !== "idle" && (
            <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 z-10 relative">
        <AnimatePresence mode="wait">
          {!isDone && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="glass-card p-6 rounded-3xl mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-xl font-bold text-gray-900">
                    Running verification pipeline
                  </h1>
                  <span className="text-sm font-bold text-gray-500">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>

              <AnimatePresence>
                {loopTriggered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-orange-50 border border-orange-200 text-sm shadow-sm mb-6">
                      <span className="text-xl">🔄</span>
                      <div>
                        <span className="font-semibold text-orange-800">Feedback loop triggered!</span>
                        <span className="text-orange-600/80 ml-2">
                          Issue detected — routing claim back to Agent 1 for re-research
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
                    Agent Pipeline
                  </h2>
                  <AgentPipeline
                    currentStage={currentStage}
                    loopTriggered={loopTriggered}
                    claimProgress={
                      claimProgress.total > 0 ? claimProgress : undefined
                    }
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {[
                      { stage: "research", label: "Research", icon: "🔍" },
                      { stage: "verification", label: "Verify", icon: "🔎" },
                      { stage: "contradiction_check", label: "Detect", icon: "🔬" },
                      { stage: "synthesis", label: "Synthesize", icon: "📝" },
                    ].map(({ stage, label, icon }) => {
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
                          className={`rounded-2xl p-4 text-center transition-all duration-300 ${
                            isActive
                              ? "bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-200/60 scale-105 z-10"
                              : isDoneStage
                              ? "bg-emerald-50/50 border border-emerald-100/50 opacity-80"
                              : "glass-card opacity-60"
                          }`}
                        >
                          <div className="text-2xl mb-1">{icon}</div>
                          <div
                            className={`text-xs font-bold ${
                              isActive
                                ? "text-gray-900"
                                : isDoneStage
                                ? "text-emerald-600"
                                : "text-gray-400"
                            }`}
                          >
                            {label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-2 h-[450px]">
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 pl-1">
                    Live Status
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
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              <p className="text-gray-500 font-medium">Loading report...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
