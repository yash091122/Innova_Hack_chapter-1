"use client";

/**
 * AgentPipeline — React Flow visualization of the 4-agent pipeline
 * Shows active stage with pulse animation and animated feedback loop edge
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

const NODE_LABELS: Record<string, { title: string; subtitle: string; icon: string }> = {
  research: {
    title: "Agent 1",
    subtitle: "Research",
    icon: "🔍",
  },
  verification: {
    title: "Agent 2",
    subtitle: "Verification",
    icon: "🔎",
  },
  contradiction: {
    title: "Agent 3",
    subtitle: "Contradiction Check",
    icon: "🔬",
  },
  synthesis: {
    title: "Agent 4",
    subtitle: "Synthesis",
    icon: "📝",
  },
};

// Custom node component
function AgentNode({
  data,
}: {
  data: {
    id: string;
    isActive: boolean;
    isComplete: boolean;
    isLoop: boolean;
    label: string;
    subtitle: string;
    icon: string;
  };
}) {
  return (
    <div
      className={`
        relative w-44 px-4 py-3 rounded-2xl border-2 transition-all duration-500
        ${data.isActive
          ? "border-white/40 bg-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          : data.isComplete
          ? "border-white/20 bg-white/5 backdrop-blur-md"
          : "border-white/10 bg-transparent"
        }
        ${data.isLoop ? "border-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.4)]" : ""}
      `}
    >
      {/* React Flow edge connection handles — required for custom nodes */}
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

      {/* Pulse ring for active node */}
      {data.isActive && (
        <div className="absolute inset-0 rounded-2xl border-2 border-white/40 animate-ping opacity-20" />
      )}

      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon}</span>
        <div>
          <div className="text-xs font-bold text-white">{data.label}</div>
          <div className="text-xs text-white/70">{data.subtitle}</div>
        </div>
      </div>

      {data.isActive && (
        <div className="mt-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}

      {data.isComplete && !data.isActive && (
        <div className="mt-1 text-xs text-white/70 font-medium">✓ Done</div>
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
      position: { x: 0, y: 100 },
      data: {
        id: "research",
        isActive: activeNodeId === "research",
        isComplete: activeIdx > 0 && !loopTriggered,
        isLoop: loopTriggered && activeNodeId === "research",
        ...NODE_LABELS.research,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: "verification",
      type: "agentNode",
      position: { x: 220, y: 100 },
      data: {
        id: "verification",
        isActive: activeNodeId === "verification",
        isComplete: activeIdx > 1,
        isLoop: false,
        ...NODE_LABELS.verification,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: "contradiction",
      type: "agentNode",
      position: { x: 440, y: 100 },
      data: {
        id: "contradiction",
        isActive: activeNodeId === "contradiction",
        isComplete: activeIdx > 2 && !loopTriggered,
        isLoop: loopTriggered,
        ...NODE_LABELS.contradiction,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: "synthesis",
      type: "agentNode",
      position: { x: 660, y: 100 },
      data: {
        id: "synthesis",
        isActive: activeNodeId === "synthesis",
        isComplete: currentStage === "done",
        isLoop: false,
        ...NODE_LABELS.synthesis,
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
      style: { stroke: activeIdx >= 1 ? "#ffffff" : "#374151", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: activeIdx >= 1 ? "#ffffff" : "#374151" },
    },
    {
      id: "v-c",
      source: "verification",
      target: "contradiction",
      animated: activeNodeId === "verification" || activeNodeId === "contradiction",
      style: { stroke: activeIdx >= 2 ? "#ffffff" : "#374151", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: activeIdx >= 2 ? "#ffffff" : "#374151" },
    },
    {
      id: "c-s",
      source: "contradiction",
      target: "synthesis",
      animated: activeNodeId === "synthesis",
      style: { stroke: activeIdx >= 3 ? "#ffffff" : "#374151", strokeWidth: 2 },
      label: "No issues",
      labelStyle: { fill: "#6b7280", fontSize: 10 },
      markerEnd: { type: MarkerType.ArrowClosed, color: activeIdx >= 3 ? "#ffffff" : "#374151" },
    },
    {
      id: "feedback-loop",
      source: "contradiction",
      target: "research",
      animated: loopTriggered,
      type: "smoothstep",
      style: {
        stroke: loopTriggered ? "#f97316" : "#374151",
        strokeWidth: loopTriggered ? 3 : 1.5,
        strokeDasharray: loopTriggered ? undefined : "6 4",
      },
      label: loopTriggered ? "🔄 Issue detected!" : "Loop (issue detected)",
      labelStyle: {
        fill: loopTriggered ? "#f97316" : "#6b7280",
        fontSize: 10,
        fontWeight: loopTriggered ? "bold" : "normal",
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: loopTriggered ? "#f97316" : "#374151" },
      data: { curved: true },
    },
  ];

  // Update node data reactively
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
    <div className="w-full h-64 rounded-2xl overflow-hidden border border-white/10 bg-gray-950/50">
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
        <Background color="#1f2937" gap={20} size={1} />
      </ReactFlow>

      {/* Claim progress indicator */}
      {claimProgress && claimProgress.total > 0 && (
        <div className="px-4 py-2 bg-black/40 border-t border-white/10 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.5)] rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(claimProgress.current / claimProgress.total) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-white/50 whitespace-nowrap">
            {claimProgress.current}/{claimProgress.total} claims
          </span>
        </div>
      )}
    </div>
  );
}
