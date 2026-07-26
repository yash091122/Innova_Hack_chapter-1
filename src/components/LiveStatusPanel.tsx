"use client";

/**
 * LiveStatusPanel — SSE-driven real-time agent progress log
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const getEventColor = (event: SSEEvent): string => {
    switch (event.type) {
      case "stage_change": return "text-white";
      case "loop_triggered": return "text-orange-400 font-semibold";
      case "done": return "text-green-400 font-semibold";
      case "error": return "text-red-400";
      case "claim_update": return "text-blue-300";
      default: return "text-white/70";
    }
  };

  const getEventIcon = (event: SSEEvent): string => {
    switch (event.type) {
      case "stage_change": return "▶";
      case "loop_triggered": return "🔄";
      case "done": return "✅";
      case "error": return "❌";
      case "claim_update": return "•";
      default: return "›";
    }
  };

  return (
    <div className="h-full flex flex-col rounded-2xl border border-white/10 bg-gray-950/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/30">
        <div
          className={`w-2 h-2 rounded-full ${
            connected ? "bg-green-400 animate-pulse" : "bg-gray-500"
          }`}
        />
        <span className="text-sm font-medium text-white/80">
          {connected ? "Live Pipeline Log" : "Pipeline Log"}
        </span>
        <span className="ml-auto text-xs text-white/30">
          {logs.length} events
        </span>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-white/30 text-center py-8">
            Waiting for pipeline to start...
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map(({ id, event }) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 ${getEventColor(event)}`}
              >
                <span className="flex-shrink-0 text-white/30">
                  {new Date(event.timestamp).toLocaleTimeString("en", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className="flex-shrink-0">{getEventIcon(event)}</span>
                <span className="break-all">{event.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={logEndRef} />
      </div>

      {/* Connection status footer */}
      {connected && (
        <div className="px-4 py-2 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-white/70 rounded-full animate-pulse"
                  style={{
                    height: `${8 + i * 4}px`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-white/40">Streaming live updates...</span>
          </div>
        </div>
      )}
    </div>
  );
}
