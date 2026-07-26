"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <div className="w-full flex justify-center z-50 pt-8 px-4 relative">
      <header className="flex items-center justify-between gap-6 sm:gap-12 p-2 bg-white/80 backdrop-blur-xl border border-white/50 rounded-full shadow-xl shadow-emerald-900/5 w-auto">
        {/* Brand Logo & Name */}
        <div
          className="flex items-center gap-3 cursor-pointer group px-2"
          onClick={() => router.push("/")}
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="text-slate-900 font-black text-lg pr-2 tracking-wide">
            FactForge
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="/#features"
            className="text-slate-600 hover:text-slate-900 text-[15px] font-bold transition-colors"
          >
            Features
          </a>
        </nav>

        {/* Actions - Pill */}
        <div className="flex items-center bg-slate-100/80 backdrop-blur-sm rounded-full p-1 pl-4 sm:pl-5 shadow-inner border border-slate-200/50">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-slate-900 text-sm font-semibold max-w-[120px] sm:max-w-[160px] truncate">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="p-1.5 sm:p-2 rounded-full hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/auth")}
              className="flex items-center gap-2 pr-2 sm:pr-3 text-slate-900 text-sm font-bold hover:opacity-80 transition-opacity"
            >
              <span>Login</span>
              <User className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>
    </div>
  );
}
