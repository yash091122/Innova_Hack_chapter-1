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
    if (status === "confirmed") return "#10b981"; // green-500
    if (status === "partially_confirmed") return "#f59e0b"; // yellow-500
    return "#ef4444"; // red-500
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm text-emerald-600 font-bold tracking-wide uppercase">
              Verification Complete
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{topic}</h1>
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
          { label: "Confirmed", value: stats.confirmed, color: "text-green-600" },
          { label: "Partial", value: stats.partial, color: "text-yellow-600" },
          { label: "Contradicted", value: stats.contradicted, color: "text-red-600" },
          { label: "Unverifiable", value: stats.unverifiable, color: "text-gray-500" },
          { label: "Avg Score", value: `${stats.avgScore}`, color: "text-gray-900" },
          { label: "Re-verified", value: stats.looped, color: "text-orange-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl soft-card px-3 py-4 text-center border-gray-100"
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Confidence chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl soft-card p-6"
        >
          <h3 className="text-sm font-bold text-gray-500 mb-6 uppercase tracking-wider">
            Confidence Scores by Claim
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={24}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    color: "#111827",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                  formatter={(v) => [`${v ?? 0}/100`, "Confidence"]}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
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
        <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">
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
          className="rounded-3xl soft-card p-8"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>📄</span> Full Report
          </h2>
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:text-gray-900 prose-blockquote:border-gray-200">
            <ReactMarkdown>{finalReportMarkdown}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
}
