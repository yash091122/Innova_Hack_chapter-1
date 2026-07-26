import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FactForge — Autonomous Multi-Agent Fact Verification",
  description:
    "Submit any topic or claim. FactForge's 4-agent AI pipeline researches, cross-checks, and detects contradictions — returning a citation-backed report with confidence scores.",
  keywords: ["fact check", "AI research", "verification", "LangGraph", "Claude"],
  openGraph: {
    title: "FactForge — Autonomous Fact Verification",
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
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
