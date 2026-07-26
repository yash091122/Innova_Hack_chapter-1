"use client";

/**
 * LiveStatusPanel — SSE-driven real-time agent progress log
 * STRICT: Official Lucide SVG icons only. No unicode symbol characters.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Activity,
  ChevronRight,
  Wifi,
  WifiOff
} from "lucide-react";
import type { SSEEvent, PipelineStage } from "@/types";

interface LiveStatusPanelProps {
  sessionId: string;
  onStageChange?: (stage: PipelineStage) => void;
  onLoopTriggered?: (claimId: string | undefined) => void;
  onProgressUpdate?: (current: number, total: number) => void;
  onDone?: (event: SSEEvent) => void;
}

interface LogEntry {
  id: number;
  event: SSEEvent;
}

export default function LiveStatusPanel({
  sessionId,
  onStageChange,
  onLoopTriggered,
  onProgressUpdate,
  onDone,
}: LiveStatusPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const es = new EventSource(`/api/verify/stream?sessionId=${sessionId}`);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);
        const id = ++counterRef.current;

        setLogs((prev) => [...prev.slice(-99), { id, event }]); // Keep last 100

        // Notify parent components
        if (event.stage && (event.type === "stage_change" || event.type === "loop_triggered")) {
          onStageChange?.(event.stage);
        }
        if (event.type === "loop_triggered") {
          onLoopTriggered?.(event.claimId);
        }
        if (event.claimIndex != null && event.totalClaims != null) {
          onProgressUpdate?.(event.claimIndex, event.totalClaims);
        }
        if (event.type === "done") {
          onDone?.(event);
          es.close();
          setConnected(false);
        }
        if (event.type === "error") {
          es.close();
          setConnected(false);
        }
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
    };
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getEventStyle = (event: SSEEvent) => {
    switch (event.type) {
      case "stage_change":
        return { color: "text-emerald-400 font-semibold", icon: Play };
      case "loop_triggered":
        return { color: "text-amber-400 font-semibold", icon: RefreshCw };
      case "done":
        return { color: "text-teal-300 font-semibold", icon: CheckCircle2 };
      case "error":
        return { color: "text-red-400 font-semibold", icon: XCircle };
      case "claim_update":
        return { color: "text-sky-300", icon: Activity };
      default:
        return { color: "text-slate-400", icon: ChevronRight };
    }
  };

  return (
    <div className="h-full flex flex-col rounded-3xl glass-card border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900/60">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-bold text-white">
          {connected ? "Live Pipeline Log" : "Pipeline Log"}
        </span>
        
        <div className="ml-auto flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <Wifi className="w-3 h-3 animate-pulse" />
              Live Stream
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">
              <WifiOff className="w-3 h-3" />
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs bg-slate-950/80">
        {logs.length === 0 ? (
          <div className="text-slate-500 font-medium text-center py-12 flex flex-col items-center gap-2">
            <Activity className="w-6 h-6 animate-pulse text-slate-600" />
            <span>Initializing agent execution telemetry...</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map(({ id, event }) => {
              const { color, icon: IconComp } = getEventStyle(event);
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-white/5 transition-colors ${color}`}
                >
                  <span className="flex-shrink-0 text-slate-500 font-medium text-[11px] pt-0.5">
                    {new Date(event.timestamp).toLocaleTimeString("en", {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className="flex-shrink-0 pt-0.5">
                    <IconComp className="w-3.5 h-3.5" />
                  </span>
                  <span className="break-all leading-relaxed">{event.message}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={logEndRef} />
      </div>

      {/* Connection status footer */}
      {connected && (
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-emerald-400 rounded-full animate-pulse"
                    style={{
                      height: `${10 + i * 3}px`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-slate-400">Receiving live agent events...</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">{logs.length} entries</span>
          </div>
        </div>
      )}
    </div>
  );
}
