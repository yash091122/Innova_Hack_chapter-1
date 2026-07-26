"use client";

/**
 * /auth — Sign In & Sign Up Page for FactForge
 * Matches reference glassmorphism design & Codystar typography
 * STRICT: Official Lucide React SVG icons only. No unicode text symbols.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, user } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // If user is already logged in, redirect to home page with input console open
  useEffect(() => {
    if (user) {
      router.push("/?focus=true");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (mode === "signin") {
        const { error: err } = await signInWithEmail(email, password);
        if (err) throw err;
        router.push("/?focus=true");
      } else {
        const { error: err, user: newUse } = await signUpWithEmail(email, password);
        if (err) throw err;
        setSuccessMsg("Account created! Redirecting to Research Console...");
        setTimeout(() => {
          router.push("/?focus=true");
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between text-slate-900 selection:bg-emerald-300 selection:text-slate-900 relative overflow-x-hidden">
      
      {/* Ambient Radial Background Glows */}
      <div className="absolute top-0 right-0 w-[700px] h-[600px] bg-gradient-to-b from-emerald-300/35 via-teal-200/25 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-pink-300/35 via-purple-200/25 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* HEADER */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-slate-600 hover:text-slate-950 font-bold text-xs">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            Fact<span className="text-slate-500 font-medium">Forge</span>
          </span>
        </div>
      </header>

      {/* AUTH CONTAINER CARD */}
      <div className="w-full max-w-md mx-auto px-6 py-10 z-10 flex-1 flex flex-col justify-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-light p-8 shadow-2xl border border-white space-y-6"
        >
          {/* Header Title */}
          <div className="text-center space-y-2">
            <h1 className="font-codystar text-3xl font-extrabold tracking-widest text-slate-950 uppercase">
              {mode === "signin" ? "SIGN IN" : "SIGN UP"}
            </h1>
            <p className="text-xs text-slate-600 font-semibold">
              {mode === "signin"
                ? "Enter your credentials to access the 4-Agent Research OS"
                : "Create your free account to run autonomous fact verification"}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 rounded-full bg-white/70 border border-slate-200/80 shadow-xs">
            <button
              onClick={() => { setMode("signin"); setError(""); }}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                mode === "signin"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                mode === "signup"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 pl-2">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-white pl-11 pr-4 py-3 rounded-full text-slate-900 placeholder-slate-400 text-xs font-semibold outline-none border border-slate-200 focus:border-emerald-500 shadow-inner transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 pl-2">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-white pl-11 pr-4 py-3 rounded-full text-slate-900 placeholder-slate-400 text-xs font-semibold outline-none border border-slate-200 focus:border-emerald-500 shadow-inner transition-all"
                />
              </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-600 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Banner */}
            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-full bg-slate-950 hover:bg-black text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-slate-900/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2 pt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === "signin" ? "Sign In to Research OS" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </>
              )}
            </button>

          </form>

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-500 font-medium border-t border-slate-200/60 pt-4">
            <span>Secured with Supabase Authentication & PostgreSQL</span>
          </div>

        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs font-semibold text-slate-500">
        FactForge Fact-Verification Platform
      </footer>

    </main>
  );
}
