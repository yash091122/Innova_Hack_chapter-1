"use client";

/**
 * ClaimCard — Individual claim with confidence badge, source, and re-verification tag
 */

import { motion } from "framer-motion";
import type { ClaimState } from "@/types";

interface ClaimCardProps {
  claim: ClaimState;
  index: number;
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return null;

  const tier =
    score >= 75
      ? { label: "HIGH", color: "bg-green-500/20 text-green-300 border-green-500/40" }
      : score >= 40
      ? { label: "MED", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" }
      : { label: "LOW", color: "bg-red-500/20 text-red-300 border-red-500/40" };

  const ringColor =
    score >= 75 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Radial score indicator */}
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="#1f2937"
            strokeWidth="3"
          />
          <motion.circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke={ringColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${score} 100`}
            initial={{ strokeDasharray: "0 100" }}
            animate={{ strokeDasharray: `${score} 100` }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{score}</span>
        </div>
      </div>

      <span
        className={`px-2 py-0.5 rounded-md text-xs font-bold border ${tier.color}`}
      >
        {tier.label}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: ClaimState["verificationStatus"] }) {
  const config: Record<
    string,
    { label: string; color: string; dot: string }
  > = {
    confirmed: {
      label: "Confirmed",
      color: "text-green-400",
      dot: "bg-green-400",
    },
    partially_confirmed: {
      label: "Partial",
      color: "text-yellow-400",
      dot: "bg-yellow-400",
    },
    contradicted: {
      label: "Contradicted",
      color: "text-red-400",
      dot: "bg-red-400",
    },
    unverifiable: {
      label: "Unverifiable",
      color: "text-gray-400",
      dot: "bg-gray-400",
    },
    pending: {
      label: "Pending",
      color: "text-blue-400",
      dot: "bg-blue-400",
    },
  };

  const cfg = config[status] ?? config.pending;

  return (
    <span className={`flex items-center gap-1.5 text-xs ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function ClaimCard({ claim, index }: ClaimCardProps) {
  const isProblematic =
    claim.verificationStatus === "contradicted" ||
    claim.verificationStatus === "unverifiable" ||
    claim.severity === "high";

  const wasRereserached = claim.attemptCount > 0;

  const hostname = (() => {
    try {
      return new URL(claim.sourceUrl).hostname.replace("www.", "");
    } catch {
      return claim.sourceUrl.slice(0, 30);
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`
        group relative rounded-2xl border p-5 transition-all duration-300
        hover:shadow-lg hover:shadow-white/5
        ${isProblematic
          ? "border-red-500/30 bg-red-950/10 hover:border-red-500/50"
          : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
        }
      `}
    >
      {/* Top row: claim number + badges */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={claim.verificationStatus} />

            {wasRereserached && (
              <span className="px-2 py-0.5 rounded-md text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">
                🔄 Re-verified {claim.attemptCount}×
              </span>
            )}

            {claim.severity === "high" && (
              <span className="px-2 py-0.5 rounded-md text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                ⚠️ High Severity
              </span>
            )}
          </div>

          {/* Claim text */}
          <p className="text-sm text-white/90 leading-relaxed mb-3">
            {claim.claim}
          </p>

          {/* Source snippet */}
          {claim.sourceSnippet && (
            <blockquote className="border-l-2 border-white/30 pl-3 mb-3 text-xs text-white/50 italic line-clamp-2">
              "{claim.sourceSnippet}"
            </blockquote>
          )}

          {/* Source link */}
          <a
            href={claim.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors border-b border-transparent hover:border-white/50 pb-0.5"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            {hostname}
          </a>
        </div>

        {/* Confidence badge (right side) */}
        <ConfidenceBadge score={claim.confidenceScore} />
      </div>

      {/* Confidence reason */}
      {claim.confidenceReason && (
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/50">
          {claim.confidenceReason}
        </div>
      )}
    </motion.div>
  );
}
