"use client";

/**
 * Landing Page — VerifAI Hero with light liquid glassmorphism
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
    <main className="min-h-screen flex flex-col relative z-0">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm font-bold shadow-sm text-gray-900">
            V
          </div>
          <span className="text-lg font-bold text-gray-900">VerifAI</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <a
            href="/history"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            History
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            GitHub
          </a>
        </motion.div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-gray-600 font-medium"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          4-Agent AI Pipeline
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-center leading-tight mb-6 max-w-4xl text-gray-900 tracking-tight"
        >
          Fact-check anything with{" "}
          <span className="gradient-text">4 AI agents</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-500 text-center max-w-2xl mb-12 leading-relaxed"
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
          <div className="relative rounded-3xl soft-card transition-all duration-300 focus-within:shadow-[0_8px_30px_rgba(0,0,0,0.06)] bg-white/80 backdrop-blur-xl">
            <textarea
              ref={inputRef}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a topic or claim to verify..."
              rows={3}
              className="w-full bg-transparent px-6 pt-6 pb-16 text-gray-900 placeholder-gray-400 resize-none outline-none text-lg leading-relaxed rounded-3xl input-glow"
              disabled={loading}
            />

            {/* Bottom bar */}
            <div className="absolute bottom-0 inset-x-0 px-4 pb-4 flex items-center justify-between">
              <span className="text-xs text-gray-400 px-2 font-medium">
                ⌘↵ to submit
              </span>
              <div className="flex items-center gap-3">
                {/* Demo button */}
                <motion.button
                  onClick={() =>
                    handleSubmit(EXAMPLE_TOPICS[0], true)
                  }
                  disabled={loading}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.02)" }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 rounded-2xl text-sm font-medium text-gray-500 hover:text-gray-900 transition-all disabled:opacity-40"
                >
                  Try demo
                </motion.button>

                {/* Submit button */}
                <motion.button
                  onClick={() => handleSubmit(topic)}
                  disabled={loading || !topic.trim()}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 py-2.5 rounded-2xl bg-gray-900 hover:bg-black text-white text-sm font-semibold shadow-lg shadow-gray-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
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
                className="mt-4 text-sm text-red-500 text-center font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Example topics */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {EXAMPLE_TOPICS.map((t) => (
              <motion.button
                key={t}
                onClick={() => setTopic(t)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-full text-xs font-medium text-gray-500 bg-white/60 hover:bg-white border border-gray-200/60 shadow-sm hover:shadow transition-all"
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
          className="mt-20 flex flex-wrap justify-center gap-4 text-sm"
        >
          {[
            { icon: "🔍", label: "Research Agent" },
            { icon: "🔎", label: "Verification Agent" },
            { icon: "🔬", label: "Contradiction Detector" },
            { icon: "📝", label: "Synthesis Agent" },
            { icon: "🔄", label: "Self-correcting loop" },
            { icon: "📊", label: "Confidence scores" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 glass-card px-4 py-2 rounded-2xl text-gray-600 font-medium">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400 font-medium z-10">
        Built with Claude · Tavily · LangGraph · Next.js 15
      </footer>
    </main>
  );
}
