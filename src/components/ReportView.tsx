"use client";

/**
 * ReportView — Final report with Markdown rendering, analytics chart, and export
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
    if (status === "confirmed") return "#22c55e";
    if (status === "partially_confirmed") return "#eab308";
    return "#ef4444";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm text-green-400 font-medium">
              Verification Complete
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{topic}</h1>
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
          { label: "Confirmed", value: stats.confirmed, color: "text-green-400" },
          { label: "Partial", value: stats.partial, color: "text-yellow-400" },
          { label: "Contradicted", value: stats.contradicted, color: "text-red-400" },
          { label: "Unverifiable", value: stats.unverifiable, color: "text-gray-400" },
          { label: "Avg Score", value: `${stats.avgScore}`, color: "text-white" },
          { label: "Re-verified", value: stats.looped, color: "text-orange-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-center"
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Confidence chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/3 p-5"
        >
          <h3 className="text-sm font-semibold text-white/70 mb-4">
            Confidence Scores by Claim
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={20}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#f9fafb",
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${v ?? 0}/100`, "Confidence"]}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
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
        <h2 className="text-lg font-semibold text-white mb-4">
          Verified Claims ({claims.length})
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
          className="rounded-2xl border border-white/10 bg-white/3 p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📄</span> Full Report
          </h2>
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-a:text-white/80 prose-a:no-underline hover:prose-a:underline prose-code:text-white/90 prose-blockquote:border-white/30">
            <ReactMarkdown>{finalReportMarkdown}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
}
