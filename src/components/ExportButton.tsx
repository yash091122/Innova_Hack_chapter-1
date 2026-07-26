"use client";

/**
 * ExportButton — PDF and Markdown download
 * STRICT: Official Lucide SVG icons only. No unicode symbol characters.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { FileCode, FileDown, Loader2 } from "lucide-react";

interface ExportButtonProps {
  sessionId: string;
  topic: string;
  reportMarkdown: string;
}

export default function ExportButton({
  sessionId,
  topic,
  reportMarkdown,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState<"pdf" | "md" | null>(null);

  const handleMarkdownExport = async () => {
    setExporting("md");
    try {
      const blob = new Blob([reportMarkdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `verifai-report-${topic.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setExporting(null), 1000);
    }
  };

  const handlePdfExport = async () => {
    setExporting("pdf");
    try {
      // Dynamically import jsPDF to keep bundle size small
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxWidth = pageWidth - margin * 2;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(30, 30, 30);
      doc.text("VerifAI Research Report", margin, margin + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Topic: ${topic}`, margin, margin + 14);
      doc.text(
        `Generated: ${new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        margin,
        margin + 21
      );

      // Horizontal rule
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, margin + 26, pageWidth - margin, margin + 26);

      // Render markdown as plain text
      let y = margin + 36;
      const lines = reportMarkdown.split("\n");

      for (const line of lines) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        const cleaned = line
          .replace(/^#{1,6}\s+/, "")
          .replace(/\*\*(.+?)\*\*/g, "$1")
          .replace(/\[(.+?)\]\(.+?\)/g, "$1")
          .replace(/^[-*]\s+/, "  • ")
          .replace(/`(.+?)`/g, "$1");

        if (line.startsWith("# ")) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(30, 30, 30);
        } else if (line.startsWith("## ")) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(60, 60, 60);
        } else if (line.startsWith("### ")) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(80, 80, 80);
        } else if (line.startsWith("---")) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, y, pageWidth - margin, y);
          y += 4;
          continue;
        } else if (line.trim() === "") {
          y += 4;
          continue;
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(40, 40, 40);
        }

        const wrapped = doc.splitTextToSize(cleaned, maxWidth);
        doc.text(wrapped, margin, y);
        y += wrapped.length * (doc.getFontSize() * 0.4) + 2;
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `VerifAI — Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      const filename = `verifai-report-${topic.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF export failed:", err);
      // Fall back to markdown export
      await handleMarkdownExport();
    } finally {
      setTimeout(() => setExporting(null), 1000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <motion.button
        onClick={handleMarkdownExport}
        disabled={exporting !== null}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
      >
        {exporting === "md" ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        ) : (
          <FileCode className="w-4 h-4 text-emerald-400" />
        )}
        <span>Markdown (.md)</span>
      </motion.button>

      <motion.button
        onClick={handlePdfExport}
        disabled={exporting !== null}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
      >
        {exporting === "pdf" ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
        ) : (
          <FileDown className="w-4 h-4 text-slate-950" />
        )}
        <span>Export PDF</span>
      </motion.button>
    </div>
  );
}
