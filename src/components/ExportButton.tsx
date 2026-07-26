"use client";

/**
 * ExportButton — PDF and Markdown download
 */

import { useState } from "react";
import { motion } from "framer-motion";

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
      doc.setTextColor(30, 30, 30); // dark gray
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

      // Render markdown as plain text (simplified)
      let y = margin + 36;
      const lines = reportMarkdown.split("\n");

      for (const line of lines) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        const cleaned = line
          .replace(/^#{1,6}\s+/, "") // Remove headers
          .replace(/\*\*(.+?)\*\*/g, "$1") // Bold
          .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Links
          .replace(/^[-*]\s+/, "  • ") // Lists
          .replace(/`(.+?)`/g, "$1"); // Code

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
        whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.8)" }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white/50 text-sm font-medium text-gray-700 hover:text-gray-900 shadow-sm transition-all disabled:opacity-50"
      >
        {exporting === "md" ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        .md
      </motion.button>

      <motion.button
        onClick={handlePdfExport}
        disabled={exporting !== null}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-900 hover:bg-black text-white text-sm font-semibold shadow-lg shadow-gray-900/20 transition-all disabled:opacity-50"
      >
        {exporting === "pdf" ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
        Export PDF
      </motion.button>
    </div>
  );
}
