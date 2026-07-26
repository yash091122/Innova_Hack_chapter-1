import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "VerifAI — Autonomous Multi-Agent Fact Verification",
  description:
    "Submit any topic or claim. VerifAI's 4-agent AI pipeline researches, cross-checks, and detects contradictions — returning a citation-backed report with confidence scores.",
  keywords: ["fact check", "AI research", "verification", "LangGraph", "Claude"],
  openGraph: {
    title: "VerifAI — Autonomous Fact Verification",
    description: "4-agent AI pipeline for rigorous, citation-backed fact checking",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Liquid Glassmorphism Background (Global) */}
        <div className="liquid-bg-container">
          <div className="liquid-blob green" />
          <div className="liquid-blob orange" />
          <div className="liquid-blob pink" />
        </div>
        {children}
      </body>
    </html>
  );
}
