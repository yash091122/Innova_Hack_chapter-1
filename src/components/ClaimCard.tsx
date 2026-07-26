"use client";

/**
 * ClaimCard — Individual claim with confidence badge, source, and re-verification tag
 * STRICT: Official Lucide SVG icons only. No unicode symbol characters.
 */

import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Clock
} from "lucide-react";
import type { ClaimState } from "@/types";

interface ClaimCardProps {
  claim: ClaimState;
  index: number;
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return null;

  const tier =
    score >= 75
      ? { label: "HIGH CONFIDENCE", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" }
      : score >= 40
      ? { label: "MED CONFIDENCE", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" }
      : { label: "LOW CONFIDENCE", color: "bg-red-500/10 text-red-400 border-red-500/30" };

  const ringColor =
    score >= 75 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      {/* Radial score indicator */}
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="#e2e8f0"
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
          <span className="text-xs font-bold text-slate-900 font-mono">{score}%</span>
        </div>
      </div>

      <span
        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wider ${tier.color}`}
      >
        {tier.label}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: ClaimState["verificationStatus"] }) {
  switch (status) {
    case "confirmed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Confirmed
        </span>
      );
    case "partially_confirmed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          Partial
        </span>
      );
    case "contradicted":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="w-3.5 h-3.5" />
          Contradicted
        </span>
      );
    case "unverifiable":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
          <HelpCircle className="w-3.5 h-3.5" />
          Unverifiable
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          Pending
        </span>
      );
  }
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={`
        group relative rounded-3xl border p-5 transition-all duration-300 backdrop-blur-xl
        hover:shadow-2xl hover:-translate-y-0.5
        ${isProblematic
          ? "border-rose-200 bg-rose-50/80"
          : "glass-card-light border-white bg-white/80 hover:border-slate-200"
        }
      `}
    >
      {/* Top row: claim index + status + badges */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-emerald-600 font-mono shadow-sm">
          #{index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <StatusBadge status={claim.verificationStatus} />

            {wasRereserached && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <RefreshCw className="w-3 h-3 text-amber-400" />
                Re-verified {claim.attemptCount}x
              </span>
            )}

            {claim.severity === "high" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                <ShieldAlert className="w-3 h-3" />
                High Severity
              </span>
            )}
          </div>

          {/* Claim text */}
          <p className="text-base text-slate-900 font-medium leading-relaxed mb-3">
            {claim.claim}
          </p>

          {/* Source snippet */}
          {claim.sourceSnippet && (
            <blockquote className="border-l-2 border-emerald-500/40 pl-3 mb-3 text-xs text-slate-600 italic line-clamp-2 bg-slate-50 py-1.5 rounded-r-lg">
              "{claim.sourceSnippet}"
            </blockquote>
          )}

          {/* Source link */}
          <a
            href={claim.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
            <span>{hostname}</span>
          </a>
        </div>

        {/* Confidence badge (right side) */}
        <ConfidenceBadge score={claim.confidenceScore} />
      </div>

      {/* Confidence reason */}
      {claim.confidenceReason && (
        <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-2">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] pt-0.5">Rationale:</span>
          <span className="flex-1">{claim.confidenceReason}</span>
        </div>
      )}
    </motion.div>
  );
}
