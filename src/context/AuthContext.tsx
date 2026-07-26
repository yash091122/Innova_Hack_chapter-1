"use client";

/**
 * FactForge — Supabase Authentication Context & Hook
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { getSupabasePublicClient } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null, user: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabasePublicClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, pass: string): Promise<{ error: Error | null }> => {
    const supabase = getSupabasePublicClient();
    if (!supabase) {
      return { error: new Error("Supabase is not configured properly.") };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    return { error: error as Error | null };
  };

  const signUpWithEmail = async (email: string, pass: string): Promise<{ error: Error | null; user: User | null }> => {
    const supabase = getSupabasePublicClient();
    if (!supabase) {
      return { error: new Error("Supabase is not configured properly."), user: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
    });
    return { error: error as Error | null, user: data.user ?? null };
  };

  const signOut = async () => {
    const supabase = getSupabasePublicClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
