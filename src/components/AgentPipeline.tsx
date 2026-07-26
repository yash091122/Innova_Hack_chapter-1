"use client";

/**
 * AgentPipeline — React Flow visualization of the 4-agent pipeline
 * STRICT: Official Lucide SVG icons only. No unicode symbol characters.
 */

import React, { useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Handle,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  GitCompare,
  Sparkles,
  CheckCircle2,
  Loader2,
  RefreshCw,
  LucideIcon
} from "lucide-react";
import type { PipelineStage } from "@/types";

interface AgentPipelineProps {
  currentStage: PipelineStage;
  loopTriggered: boolean;
  claimProgress?: { current: number; total: number };
}

const STAGE_TO_NODE: Record<string, string> = {
  research: "research",
  verification: "verification",
  contradiction_check: "contradiction",
  synthesis: "synthesis",
  done: "synthesis",
};

const NODE_CONFIG: Record<string, { title: string; subtitle: string; icon: LucideIcon }> = {
  research: {
    title: "Agent 1",
    subtitle: "Research",
    icon: Search,
  },
  verification: {
    title: "Agent 2",
    subtitle: "Verification",
    icon: ShieldCheck,
  },
  contradiction: {
    title: "Agent 3",
    subtitle: "Contradiction",
    icon: GitCompare,
  },
  synthesis: {
    title: "Agent 4",
    subtitle: "Synthesis",
    icon: Sparkles,
  },
};

// Custom node component with dark glass styling
function AgentNode({
  data,
}: {
  data: {
    id: string;
    isActive: boolean;
    isComplete: boolean;
    isLoop: boolean;
    title: string;
    subtitle: string;
    icon: LucideIcon;
  };
}) {
  const IconComponent = data.icon;

  return (
    <div
      className={`
        relative w-48 px-4 py-3.5 rounded-2xl border transition-all duration-500 backdrop-blur-xl
        ${data.isActive
          ? "border-emerald-400 bg-slate-900/95 shadow-[0_0_25px_rgba(16,185,129,0.25)] scale-105"
          : data.isComplete
          ? "border-emerald-500/40 bg-slate-900/80 shadow-md"
          : "border-slate-800 bg-slate-950/60 opacity-60"
        }
        ${data.isLoop ? "border-amber-400 bg-slate-900/95 shadow-[0_0_25px_rgba(245,158,11,0.3)]" : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "transparent", border: "none", width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "transparent", border: "none", width: 8, height: 8 }}
      />

      {data.isActive && (
        <div className="absolute inset-0 rounded-2xl border border-emerald-400 animate-pulse opacity-40" />
      )}

      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
            data.isActive
              ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
              : data.isComplete
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
              : "bg-slate-900 border-slate-800 text-slate-500"
          }`}
        >
          {data.isActive ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : (
            <IconComponent className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className={`text-xs font-bold ${data.isActive ? "text-white" : "text-slate-200"}`}>
            {data.title}
          </div>
          <div className="text-[11px] text-slate-400 font-medium truncate">{data.subtitle}</div>
        </div>
      </div>

      {data.isActive && (
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Processing...
          </span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {data.isComplete && !data.isActive && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 font-semibold border-t border-slate-800/60 pt-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Complete</span>
        </div>
      )}

      {data.isLoop && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-400 font-semibold border-t border-slate-800/60 pt-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Re-researching</span>
        </div>
      )}
    </div>
  );
}

export default function AgentPipeline({
  currentStage,
  loopTriggered,
  claimProgress,
}: AgentPipelineProps) {
  const nodeTypes = useMemo(() => ({ agentNode: AgentNode }), []);
  const activeNodeId = STAGE_TO_NODE[currentStage] ?? null;

  const stageOrder = ["research", "verification", "contradiction", "synthesis"];
  const activeIdx = stageOrder.indexOf(activeNodeId ?? "");

  const initialNodes: Node[] = [
    {
      id: "research",
      type: "agentNode",
      position: { x: 0, y: 80 },
      data: {
        id: "research",
        isActive: activeNodeId === "research",
        isComplete: activeIdx > 0 && !loopTriggered,
        isLoop: loopTriggered && activeNodeId === "research",
        ...NODE_CONFIG.research,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: "verification",
      type: "agentNode",
      position: { x: 230, y: 80 },
      data: {
        id: "verification",
        isActive: activeNodeId === "verification",
        isComplete: activeIdx > 1,
        isLoop: false,
        ...NODE_CONFIG.verification,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: "contradiction",
      type: "agentNode",
      position: { x: 460, y: 80 },
      data: {
        id: "contradiction",
        isActive: activeNodeId === "contradiction",
        isComplete: activeIdx > 2 && !loopTriggered,
        isLoop: loopTriggered,
        ...NODE_CONFIG.contradiction,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: "synthesis",
      type: "agentNode",
      position: { x: 690, y: 80 },
      data: {
        id: "synthesis",
        isActive: activeNodeId === "synthesis",
        isComplete: currentStage === "done",
        isLoop: false,
        ...NODE_CONFIG.synthesis,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
  ];

  const initialEdges: Edge[] = [
    {
      id: "r-v",
      source: "research",
      target: "verification",
      animated: activeNodeId === "research" || activeNodeId === "verification",
      style: { stroke: activeIdx >= 1 ? "#10b981" : "#334155", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: activeIdx >= 1 ? "#10b981" : "#334155" },
    },
    {
      id: "v-c",
      source: "verification",
      target: "contradiction",
      animated: activeNodeId === "verification" || activeNodeId === "contradiction",
      style: { stroke: activeIdx >= 2 ? "#10b981" : "#334155", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: activeIdx >= 2 ? "#10b981" : "#334155" },
    },
    {
      id: "c-s",
      source: "contradiction",
      target: "synthesis",
      animated: activeNodeId === "synthesis",
      style: { stroke: activeIdx >= 3 ? "#10b981" : "#334155", strokeWidth: 2 },
      label: "Verified",
      labelStyle: { fill: "#94a3b8", fontSize: 10, fontWeight: 600 },
      markerEnd: { type: MarkerType.ArrowClosed, color: activeIdx >= 3 ? "#10b981" : "#334155" },
    },
    {
      id: "feedback-loop",
      source: "contradiction",
      target: "research",
      animated: loopTriggered,
      type: "smoothstep",
      style: {
        stroke: loopTriggered ? "#f59e0b" : "#334155",
        strokeWidth: loopTriggered ? 3 : 1.5,
        strokeDasharray: loopTriggered ? undefined : "6 4",
      },
      label: loopTriggered ? "Issue Detected!" : "Feedback Loop",
      labelStyle: {
        fill: loopTriggered ? "#f59e0b" : "#64748b",
        fontSize: 10,
        fontWeight: loopTriggered ? "bold" : "normal",
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: loopTriggered ? "#f59e0b" : "#334155" },
    },
  ];

  const nodes = initialNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      isActive: activeNodeId === node.id,
      isComplete:
        stageOrder.indexOf(node.id) < activeIdx &&
        !(loopTriggered && node.id === "research"),
      isLoop: loopTriggered && node.id === "contradiction",
    },
  }));

  return (
    <div className="w-full h-72 rounded-3xl overflow-hidden glass-card border border-slate-800 flex flex-col justify-between">
      <div className="flex-1 w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1e293b" gap={20} size={1} />
        </ReactFlow>
      </div>

      {claimProgress && claimProgress.total > 0 && (
        <div className="px-5 py-3 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-center gap-4">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(claimProgress.current / claimProgress.total) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {claimProgress.current} of {claimProgress.total} claims processed
          </span>
        </div>
      )}
    </div>
  );
}
