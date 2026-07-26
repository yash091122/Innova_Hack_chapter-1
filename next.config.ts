import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure API routes with LangGraph use Node.js runtime, not Edge
  serverExternalPackages: ["@langchain/langgraph", "@langchain/core", "@google/generative-ai"],

  // Next.js 16 uses Turbopack by default — configure it instead of webpack
  turbopack: {},
};

export default nextConfig;
