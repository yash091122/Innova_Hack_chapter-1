"use client";

/**
 * Landing Page — FactForge Landing Page
 * Exact recreation of the attached reference design:
 * - Top header with nav links & pill buttons + Supabase Auth status
 * - Hero section with big Codystar "VERIFY AI CLAIMS" title & "START FREE DEMO" button
 * - Floating diagonal 4-agent glowing orb illustration with red dotted loop & stat badge
 * - 4 Agent Feature Glass Cards (Research, Verification, Contradiction Detection, Synthesis)
 * - Codystar "TRY LIVE DEMO CLAIMS" section with 4 trace cards
 * - Idea Input Console where user writes their idea after signin/signup
 * - STRICT: Official Lucide SVG icons only. No text unicode symbols.
 */

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Search,
  GitCompare,
  Sparkles,
  ArrowRight,
  User,
  RotateCcw,
  SearchCheck,
  Brain,
  Flame,
  Fish,
  Crown,
  Loader2,
  XCircle,
  Send,
  LogOut,
  Sparkle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

// Reusable component for a single Glowing Glass Orb (User's Exact Component)
const GlassOrb = ({
  gradient,
  glowColor,
  delay = "0s",
  label
}: {
  gradient: string;
  glowColor: string;
  delay?: string;
  label: string;
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center group">
      {/* Background Ripples - multiple stationary & animating to match image */}
      <div
        className="absolute w-[180%] h-[180%] rounded-full border border-white/30 pointer-events-none opacity-50"
      />
      <div
        className="absolute w-[140%] h-[140%] rounded-full border-[1.5px] border-white/20 animate-ping opacity-60 pointer-events-none"
        style={{ animationDuration: "4s", animationDelay: delay }}
      />
      <div
        className="absolute w-[200%] h-[200%] rounded-full border-[1.5px] border-black/5 animate-ping opacity-30 pointer-events-none"
        style={{ animationDuration: "4s", animationDelay: `calc(${delay} + 1s)` }}
      />

      {/* The Actual Orb */}
      <div
        className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${gradient} border border-white/60 backdrop-blur-md transition-transform duration-500 hover:scale-105 flex items-center justify-center shadow-lg`}
        style={{
          boxShadow: `0 0 40px ${glowColor}, inset -10px -10px 20px rgba(0,0,0,0.1), inset 10px 10px 20px rgba(255,255,255,0.8)`
        }}
      >
        {/* Top-left high specular highlight */}
        <div className="absolute top-2 left-3 w-7 h-7 sm:w-8 sm:h-8 bg-white/80 rounded-full filter blur-[3px] pointer-events-none" />
      </div>

      {/* Permanent Label Below */}
      <span className="absolute -bottom-10 font-black tracking-wider text-slate-900 text-[10px] sm:text-xs uppercase whitespace-nowrap z-30">
        {label}
      </span>
    </div>
  );
};

const DEMO_CLAIMS = [
  {
    title: "Humans use 10% brain",
    icon: Brain,
  },
  {
    title: "Red Bull Bulls",
    icon: Flame,
  },
  {
    title: "Napoleon extremely short",
    icon: Crown,
  },
  {
    title: "Goldfish memory",
    icon: Fish,
  },
];

function HomeContent() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInputConsole, setShowInputConsole] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // If redirected with ?focus=true or user is signed in, auto open input console
  useEffect(() => {
    if (searchParams?.get("focus") === "true" || user) {
      setShowInputConsole(true);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [searchParams, user]);

  const handleSubmit = async (topicText: string, isDemo = false) => {
    const trimmed = topicText.trim();
    if (!trimmed) return;

    // 1 Free Trial Limit for Unauthenticated Users
    if (!isDemo && !user) {
      const hasUsedTrial = localStorage.getItem("factforge_free_trial_used");
      if (hasUsedTrial === "true") {
        setError("You have used your 1 free trial. Please sign in to verify more claims.");
        return;
      }
    }

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

      // Mark the trial as used upon successful submission
      if (!isDemo && !user) {
        localStorage.setItem("factforge_free_trial_used", "true");
      }

      const { sessionId } = await res.json();
      router.push(`/verify/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between text-slate-900 selection:bg-emerald-300 selection:text-slate-900 relative overflow-x-hidden">
      
      {/* Background Ambient Color Radiance */}
      <div className="absolute top-0 right-0 w-[700px] h-[600px] bg-gradient-to-b from-emerald-300/35 via-teal-200/25 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-pink-300/35 via-purple-200/25 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* TOP HEADER NAV BAR */}
      <Navbar />


      {/* MAIN CONTAINER */}
      <div className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-col gap-14 z-10 flex-1">
        
        {/* HERO SECTION: TITLE + HERO ORB ILLUSTRATION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          
          {/* Left Column: Codystar Title & CTA */}
          <div className="lg:col-span-5 space-y-6">
            <h1 className="font-codystar text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-widest leading-[1.05] text-slate-950 uppercase">
              VERIFY<br />
              AI CLAIMS
            </h1>

            <p className="text-base sm:text-lg text-slate-700 font-semibold leading-relaxed max-w-md">
              Autonomous Multi-Agent Fact-Verification<br />
              for Unwavering Reliability
            </p>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowInputConsole(true);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="px-8 py-4 rounded-full bg-slate-950 hover:bg-black text-white text-xs font-extrabold tracking-widest uppercase shadow-xl shadow-slate-900/20 hover:scale-105 transition-all flex items-center gap-3"
              >
                <span>START FREE DEMO</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Right Column: Diagonal Orbs with Wispy Connections (Exact Match) */}
          <div className="lg:col-span-7 relative flex items-center justify-center min-h-[420px] w-full">
            
            <div className="relative w-full max-w-xl h-[400px] flex items-center justify-center">
              
              {/* SVG Wispy Fiber-Optic Connecting Lines between diagonal orbs */}
              <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" viewBox="0 0 600 400">
                {/* 
                  Orb positions (center coords in viewBox):
                  Agent 1 (Cyan):   ~85, 310
                  Agent 2 (Orange):  ~230, 210
                  Agent 3 (Pink):    ~380, 130
                  Agent 4 (Purple):  ~520, 50
                */}

                {/* Wispy fiber bundle: Agent 1 -> Agent 2 */}
                <g fill="none" stroke="white" opacity="0.7">
                  <path d="M 85 310 Q 140 230 230 210" strokeWidth="2.5" opacity="0.9" />
                  <path d="M 85 310 Q 130 245 230 210" strokeWidth="1" />
                  <path d="M 85 310 Q 150 240 230 210" strokeWidth="0.7" />
                  <path d="M 85 310 Q 120 260 230 210" strokeWidth="0.5" />
                  <path d="M 85 310 Q 160 250 230 210" strokeWidth="0.5" />
                  <path d="M 85 310 Q 135 270 230 210" strokeWidth="0.4" />
                  <path d="M 85 310 Q 170 260 230 210" strokeWidth="0.4" />
                </g>

                {/* Wispy fiber bundle: Agent 2 -> Agent 3 */}
                <g fill="none" stroke="white" opacity="0.7">
                  <path d="M 230 210 Q 300 145 380 130" strokeWidth="2.5" opacity="0.9" />
                  <path d="M 230 210 Q 290 155 380 130" strokeWidth="1" />
                  <path d="M 230 210 Q 310 155 380 130" strokeWidth="0.7" />
                  <path d="M 230 210 Q 280 170 380 130" strokeWidth="0.5" />
                  <path d="M 230 210 Q 320 160 380 130" strokeWidth="0.5" />
                  <path d="M 230 210 Q 270 175 380 130" strokeWidth="0.4" />
                  <path d="M 230 210 Q 330 165 380 130" strokeWidth="0.4" />
                </g>

                {/* Wispy fiber bundle: Agent 3 -> Agent 4 */}
                <g fill="none" stroke="white" opacity="0.7">
                  <path d="M 380 130 Q 445 65 520 50" strokeWidth="2.5" opacity="0.9" />
                  <path d="M 380 130 Q 435 75 520 50" strokeWidth="1" />
                  <path d="M 380 130 Q 455 75 520 50" strokeWidth="0.7" />
                  <path d="M 380 130 Q 425 90 520 50" strokeWidth="0.5" />
                  <path d="M 380 130 Q 465 80 520 50" strokeWidth="0.5" />
                  <path d="M 380 130 Q 415 95 520 50" strokeWidth="0.4" />
                  <path d="M 380 130 Q 470 85 520 50" strokeWidth="0.4" />
                </g>

                {/* Tiny glowing particles on the fiber lines */}
                <g fill="white" opacity="0.85">
                  <circle cx="120" cy="275" r="2" />
                  <circle cx="155" cy="250" r="1.5" />
                  <circle cx="260" cy="185" r="2" />
                  <circle cx="310" cy="160" r="1.5" />
                  <circle cx="410" cy="110" r="2" />
                  <circle cx="460" cy="80" r="1.5" />
                </g>

                {/* Red Dotted Feedback Loop: Agent 3 -> down -> back to Agent 1 */}
                <path
                  d="M 380 155 Q 400 280 350 340 Q 280 370 85 335"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="6 5"
                  opacity="0.7"
                />
                {/* Small arrow head at the end of feedback loop */}
                <polygon points="85,330 95,338 90,328" fill="#f43f5e" opacity="0.7" />
              </svg>

              {/* Container for Orbs - Positioned Diagonally (bottom-left to top-right) */}
              <div className="relative z-10 w-full h-full">
                
                {/* Agent 1: Research (Cyan/Green) — bottom-left */}
                <div className="absolute" style={{ left: '5%', bottom: '10%' }}>
                  <GlassOrb
                    gradient="from-teal-300 via-emerald-400 to-cyan-400"
                    glowColor="rgba(52, 211, 153, 0.5)"
                    delay="0s"
                    label="RESEARCH"
                  />
                </div>

                {/* Agent 2: Verification (Orange) — center-left */}
                <div className="absolute" style={{ left: '30%', bottom: '40%' }}>
                  <GlassOrb
                    gradient="from-amber-200 via-orange-400 to-rose-400"
                    glowColor="rgba(251, 146, 60, 0.5)"
                    delay="0.4s"
                    label="VERIFICATION"
                  />
                </div>

                {/* Agent 3: Contradiction (Pink) — center-right */}
                <div className="absolute" style={{ left: '55%', top: '18%' }}>
                  <GlassOrb
                    gradient="from-pink-300 via-rose-400 to-fuchsia-400"
                    glowColor="rgba(244, 114, 182, 0.5)"
                    delay="0.8s"
                    label="CONTRADICTION"
                  />
                </div>

                {/* Agent 4: Synthesis (Purple) — top-right */}
                <div className="absolute" style={{ right: '2%', top: '0%' }}>
                  <GlassOrb
                    gradient="from-indigo-300 via-purple-400 to-violet-500"
                    glowColor="rgba(167, 139, 250, 0.5)"
                    delay="1.2s"
                    label="SYNTHESIS"
                  />
                </div>
              </div>




            </div>

          </div>

        </div>

        {/* INPUT CONSOLE DRAWER (Idea Input Page where user writes their idea) */}
        <AnimatePresence>
          {(showInputConsole || topic) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full my-2"
            >
              <div className="bg-white/90 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white shadow-2xl max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
                      <Sparkle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Idea Verification Console</h2>
                      <p className="text-xs text-slate-500 font-medium">Write your idea, claim, or hypothesis to deploy the 4-agent swarm</p>
                    </div>
                  </div>
                  <button onClick={() => setShowInputConsole(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit(topic)}
                      placeholder="Write your idea, statement, or research claim here..."
                      className="w-full bg-slate-50/80 px-6 py-4 rounded-full text-slate-900 placeholder-slate-400 outline-none border border-slate-200 font-medium text-base sm:text-lg focus:border-emerald-500 focus:bg-white shadow-inner transition-all pr-36"
                    />
                    <button
                      onClick={() => handleSubmit(topic)}
                      disabled={loading || !topic.trim()}
                      className="absolute right-2 top-2 bottom-2 px-6 rounded-full bg-slate-950 hover:bg-black text-white text-xs font-bold shadow-md transition-all disabled:opacity-40 flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-emerald-400" />}
                      <span>Run Verification</span>
                    </button>
                  </div>

                  {!user && (
                    <div className="flex items-center justify-between text-xs text-slate-500 bg-amber-50 border border-amber-200/80 px-4 py-2.5 rounded-full font-medium">
                      <span>Sign in to automatically save your verified reports to Supabase PostgreSQL database</span>
                      <button onClick={() => router.push("/auth")} className="text-amber-700 font-bold hover:underline">
                        Sign In Now →
                      </button>
                    </div>
                  )}
                </div>

                {error && <p className="text-xs font-bold text-rose-600 text-center">{error}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4 AGENT FEATURE GLASS CARDS ROW */}
        <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* CARD 1: RESEARCH */}
          <div className="glass-card-light p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 min-h-[220px]">
            <div>
              <div className="w-16 h-16 rounded-full orb-cyan flex items-center justify-center mb-6 shadow-md">
                <Search className="w-7 h-7 text-white drop-shadow-md" />
              </div>
              <h3 className="text-base font-black tracking-wider text-slate-950 uppercase mb-2">RESEARCH</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Autonomous Multi-Agent Fact-Verification Unwavering reliability
              </p>
            </div>
          </div>

          {/* CARD 2: VERIFICATION */}
          <div className="glass-card-light p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 min-h-[220px]">
            <div>
              <div className="w-16 h-16 rounded-full orb-orange flex items-center justify-center mb-6 shadow-md">
                <ShieldCheck className="w-7 h-7 text-white drop-shadow-md" />
              </div>
              <h3 className="text-base font-black tracking-wider text-slate-950 uppercase mb-2">VERIFICATION</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Autonomous Multi-Agent Fact-verification unwavering data reliability
              </p>
            </div>
          </div>

          {/* CARD 3: CONTRADICTION DETECTION */}
          <div className="glass-card-light p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 min-h-[220px]">
            <div>
              <div className="w-16 h-16 rounded-full orb-pink flex items-center justify-center mb-6 shadow-md">
                <GitCompare className="w-7 h-7 text-white drop-shadow-md" />
              </div>
              <h3 className="text-base font-black tracking-wider text-slate-950 uppercase mb-2">CONTRADICTION DETECTION</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Conoine agent 3: contradiction & & hallucination detector
              </p>
            </div>
          </div>

          {/* CARD 4: SYNTHESIS */}
          <div className="glass-card-light p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 min-h-[220px]">
            <div>
              <div className="w-16 h-16 rounded-full orb-purple flex items-center justify-center mb-6 shadow-md">
                <Sparkles className="w-7 h-7 text-white drop-shadow-md" />
              </div>
              <h3 className="text-base font-black tracking-wider text-slate-950 uppercase mb-2">SYNTHESIS</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Autonomous Multi-Agent rentradictation syntthesis to Synthesis & Report
              </p>
            </div>
          </div>

        </div>

        {/* DEMO CLAIMS SECTION WITH CODYSTAR TITLE */}
        <div id="pricing" className="space-y-8 pt-4">
          <div className="text-center">
            <h2 className="font-codystar text-3xl sm:text-4xl font-extrabold tracking-widest text-slate-950 uppercase">
              TRY LIVE DEMO CLAIMS
            </h2>
          </div>

          {/* 4 DEMO TRACE GLASS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEMO_CLAIMS.map((claim, idx) => {
              const IconComp = claim.icon;
              return (
                <div
                  key={idx}
                  className="glass-card-light p-6 flex flex-col justify-between items-center text-center hover:shadow-2xl transition-all duration-300 min-h-[220px]"
                >
                  <div className="w-full">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                      DEMO CLAIM TRACE
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mb-6">
                      {claim.title}
                    </h4>
                  </div>

                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                      <IconComp className="w-6 h-6 text-slate-700" />
                    </div>

                    <button
                      onClick={() => handleSubmit(claim.title, true)}
                      disabled={loading}
                      className="w-full py-2.5 px-6 rounded-full bg-white hover:bg-slate-950 hover:text-white text-slate-900 text-xs font-bold border border-slate-200 shadow-sm transition-all text-center"
                    >
                      Run Trace
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500 z-20">
        <div>
          <span>FactForge Fact-Verification Platform</span>
          <span className="block sm:inline sm:ml-2 text-slate-400 font-normal">Copyright © . All rights reserved.</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Powered by the Multi-Agent Engine</span>
        </div>
      </footer>

    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
