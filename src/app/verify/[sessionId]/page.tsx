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
    <div className="w-full h-64 rounded-2xl border border-white/10 bg-gray-950/50 animate-pulse" />
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
    // Reset loop when leaving contradiction check
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
        // Fetch from API if not in event payload
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
    <main className="min-h-screen animated-gradient">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto border-b border-white/5">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-sm font-bold shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            V
          </div>
          <span className="text-lg font-bold text-white group-hover:text-white/80 transition-colors">
            VerifAI
          </span>
        </button>

        <div className="flex items-center gap-3">
          {/* Stage indicator */}
          <span className="text-sm text-white/50">
            {STAGE_LABELS[currentStage] ?? currentStage}
          </span>
          {currentStage !== "done" && currentStage !== "idle" && (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Live progress view */}
          {!isDone && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Overall progress bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl font-bold text-white">
                    Running verification pipeline
                  </h1>
                  <span className="text-sm text-white/40">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.5)] rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Loop alert banner */}
              <AnimatePresence>
                {loopTriggered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-sm">
                      <span className="text-xl">🔄</span>
                      <div>
                        <span className="font-semibold">Feedback loop triggered!</span>
                        <span className="text-orange-300/70 ml-2">
                          Issue detected — routing claim back to Agent 1 for re-research
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main grid: pipeline viz + live log */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Pipeline visualization (wider) */}
                <div className="lg:col-span-3 space-y-4">
                  <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider">
                    Agent Pipeline
                  </h2>
                  <AgentPipeline
                    currentStage={currentStage}
                    loopTriggered={loopTriggered}
                    claimProgress={
                      claimProgress.total > 0 ? claimProgress : undefined
                    }
                  />

                  {/* Stage info cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                          className={`rounded-xl p-3 border text-center transition-all ${
                            isActive
                              ? "border-white/40 bg-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                              : isDoneStage
                              ? "border-green-500/30 bg-green-950/20"
                              : "border-white/5 bg-white/3"
                          }`}
                        >
                          <div className="text-lg">{icon}</div>
                          <div
                            className={`text-xs font-medium mt-1 ${
                              isActive
                                ? "text-white"
                                : isDoneStage
                                ? "text-green-400"
                                : "text-white/40"
                            }`}
                          >
                            {label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Live log */}
                <div className="lg:col-span-2 h-[420px]">
                  <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">
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

          {/* Results view */}
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

          {/* Loading state if done but no report yet */}
          {isDone && !report && (
            <motion.div
              key="loading-report"
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
              <p className="text-white/50">Loading report...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
