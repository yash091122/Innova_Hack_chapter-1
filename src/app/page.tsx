"use client";

/**
 * Landing Page — VerifAI Hero with animated gradient and topic input
 */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const EXAMPLE_TOPICS = [
  "Effects of social media on teenage mental health",
  "Climate change and Arctic ice loss trends",
  "COVID-19 vaccine efficacy against new variants",
  "Artificial intelligence impact on job markets",
];

export default function HomePage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (topicText: string, isDemo = false) => {
    const trimmed = topicText.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmed, demo: isDemo }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to start verification");
      }

      const { sessionId } = await res.json();
      router.push(`/verify/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(topic);
    }
  };

  return (
    <main className="min-h-screen animated-gradient flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-sm font-bold shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            V
          </div>
          <span className="text-lg font-bold text-white">VerifAI</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <a
            href="/history"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            History
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            GitHub
          </a>
        </motion.div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm text-white/70 shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
        >
          <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
          4-Agent AI Pipeline · Powered by Claude
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-center leading-tight mb-6 max-w-4xl"
        >
          Fact-check anything with{" "}
          <span className="gradient-text">4 AI agents</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/50 text-center max-w-2xl mb-12 leading-relaxed"
        >
          Submit a topic or claim. VerifAI researches it, cross-checks with
          independent sources, detects contradictions, and returns a
          citation-backed report with per-claim confidence scores — live.
        </motion.p>

        {/* Input box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full max-w-2xl"
        >
          <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl neumorphic-inset transition-all duration-300 focus-within:border-white/20 focus-within:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <textarea
              ref={inputRef}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a topic or claim to verify..."
              rows={3}
              className="w-full bg-transparent px-6 pt-5 pb-14 text-white placeholder-white/30 resize-none outline-none text-base leading-relaxed"
              disabled={loading}
            />

            {/* Bottom bar */}
            <div className="absolute bottom-0 inset-x-0 px-4 pb-4 flex items-center justify-between">
              <span className="text-xs text-white/25">
                ⌘↵ to submit
              </span>
              <div className="flex items-center gap-2">
                {/* Demo button */}
                <motion.button
                  onClick={() =>
                    handleSubmit(EXAMPLE_TOPICS[0], true)
                  }
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white/90 border border-white/10 hover:border-white/20 transition-all disabled:opacity-40"
                >
                  Try demo
                </motion.button>

                {/* Submit button */}
                <motion.button
                  onClick={() => handleSubmit(topic)}
                  disabled={loading || !topic.trim()}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 py-2 rounded-xl bg-white/90 hover:bg-white text-sm font-semibold text-black neumorphic-raised transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Verify →
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-sm text-red-400 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Example topics */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {EXAMPLE_TOPICS.map((t) => (
              <motion.button
                key={t}
                onClick={() => setTopic(t)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-1.5 rounded-full text-xs text-white/50 border border-white/10 hover:border-white/30 hover:text-white/90 hover:bg-white/10 backdrop-blur-md transition-all"
              >
                {t}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 flex flex-wrap justify-center gap-6 text-sm text-white/40"
        >
          {[
            { icon: "🔍", label: "Research Agent" },
            { icon: "🔎", label: "Verification Agent" },
            { icon: "🔬", label: "Contradiction Detector" },
            { icon: "📝", label: "Synthesis Agent" },
            { icon: "🔄", label: "Self-correcting loop" },
            { icon: "📊", label: "Confidence scores" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-white/20">
        Built with Claude · Tavily · LangGraph · Next.js 15
      </footer>
    </main>
  );
}
