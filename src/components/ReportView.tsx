"use client";

/**
 * ReportView — Final report with Markdown rendering, analytics chart, and export
 * STRICT: Official Lucide SVG icons only. No unicode symbol characters.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  BarChart3,
  RefreshCw,
  FileText,
  Sparkles,
  Layers
} from "lucide-react";
import ClaimCard from "./ClaimCard";
import ExportButton from "./ExportButton";
import type { ClaimState } from "@/types";

interface ReportViewProps {
  sessionId: string;
  topic: string;
  claims: ClaimState[];
  finalReportMarkdown: string;
}

export default function ReportView({
  sessionId,
  topic,
  claims,
  finalReportMarkdown,
}: ReportViewProps) {
  const stats = useMemo(() => {
    const confirmed = claims.filter((c) => c.verificationStatus === "confirmed").length;
    const partial = claims.filter((c) => c.verificationStatus === "partially_confirmed").length;
    const contradicted = claims.filter((c) => c.verificationStatus === "contradicted").length;
    const unverifiable = claims.filter((c) => c.verificationStatus === "unverifiable").length;
    const avgScore =
      claims.length > 0
        ? Math.round(
            claims.reduce((sum, c) => sum + (c.confidenceScore ?? 0), 0) /
              claims.length
          )
        : 0;
    const looped = claims.filter((c) => c.attemptCount > 0).length;

    return { confirmed, partial, contradicted, unverifiable, avgScore, looped };
  }, [claims]);

  const chartData = useMemo(
    () =>
      claims.map((c, i) => ({
        name: `#${i + 1}`,
        score: c.confidenceScore ?? 0,
        status: c.verificationStatus,
      })),
    [claims]
  );

  const getBarColor = (status: string) => {
    if (status === "confirmed") return "#10b981";
    if (status === "partially_confirmed") return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Verification Complete
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{topic}</h1>
        </div>
        <ExportButton
          sessionId={sessionId}
          topic={topic}
          reportMarkdown={finalReportMarkdown}
        />
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {[
          { label: "Confirmed", value: stats.confirmed, color: "text-emerald-400", icon: CheckCircle2, bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Partial", value: stats.partial, color: "text-amber-400", icon: AlertTriangle, bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Contradicted", value: stats.contradicted, color: "text-red-400", icon: XCircle, bg: "bg-red-500/10 border-red-500/20" },
          { label: "Unverifiable", value: stats.unverifiable, color: "text-slate-400", icon: HelpCircle, bg: "bg-slate-800/80 border-slate-700" },
          { label: "Avg Score", value: `${stats.avgScore}%`, color: "text-sky-400", icon: BarChart3, bg: "bg-sky-500/10 border-sky-500/20" },
          { label: "Re-verified", value: stats.looped, color: "text-orange-400", icon: RefreshCw, bg: "bg-orange-500/10 border-orange-500/20" },
        ].map((stat) => {
          const IconComp = stat.icon;
          return (
            <div
              key={stat.label}
              className={`rounded-2xl p-4 text-center border backdrop-blur-xl ${stat.bg}`}
            >
              <div className="flex items-center justify-center mb-1">
                <IconComp className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          );
        })}
      </motion.div>

      {/* Confidence chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl glass-card p-6 border border-slate-800"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Confidence Distribution by Claim</span>
            </h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={28}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 12,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    color: "#f8fafc",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  formatter={(v) => [`${v ?? 0}%`, "Confidence Score"]}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(entry.status)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Claims grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <span>Verified Claims ({claims.length})</span>
        </h2>
        <div className="space-y-4">
          {claims.map((claim, i) => (
            <ClaimCard key={claim.id} claim={claim} index={i} />
          ))}
        </div>
      </div>

      {/* Full markdown report */}
      {finalReportMarkdown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl glass-card p-8 border border-slate-800"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Executive Synthesis Report</span>
          </h2>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{finalReportMarkdown}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
}
