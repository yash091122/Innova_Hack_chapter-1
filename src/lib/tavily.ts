/**
 * VerifAI — Tavily Search API Wrapper
 * Provides web search with retry logic and error handling
 */

import type { TavilySearchResult, TavilySearchResponse } from "@/types";

const TAVILY_BASE_URL = "https://api.tavily.com";

function getTavilyApiKey(): string {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    throw new Error(
      "TAVILY_API_KEY environment variable is not set. Please add it to your .env.local file."
    );
  }
  return key;
}

/**
 * Perform a Tavily web search with retry on transient errors.
 * Returns an array of search results.
 */
export async function tavilySearch(
  query: string,
  options: {
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
    excludeDomains?: string[];
    includeDomains?: string[];
  } = {}
): Promise<TavilySearchResult[]> {
  const {
    maxResults = 5,
    searchDepth = "basic",
    excludeDomains = [],
    includeDomains = [],
  } = options;

  const apiKey = getTavilyApiKey();

  const payload = {
    api_key: apiKey,
    query,
    max_results: maxResults,
    search_depth: searchDepth,
    include_answer: false,
    include_raw_content: false,
    exclude_domains: excludeDomains,
    ...(includeDomains.length > 0 ? { include_domains: includeDomains } : {}),
  };

  let lastError: Error | null = null;

  // Retry once on failure
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const response = await fetch(`${TAVILY_BASE_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Tavily API error ${response.status}: ${errorText}`
        );
      }

      const data: TavilySearchResponse = await response.json();
      return data.results ?? [];
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isTransient =
        lastError.message.includes("timeout") ||
        lastError.message.includes("429") ||
        lastError.message.includes("500") ||
        lastError.message.includes("503");

      if (attempt === 0 && isTransient) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      break;
    }
  }

  console.error(`[Tavily] Search failed for query "${query}":`, lastError);
  // Return empty array rather than crashing the pipeline
  return [];
}

/**
 * Extract domain from URL for trust-tier classification.
 * Returns a score from 0.0 (unknown) to 1.0 (high trust).
 */
export function getSourceTrustTier(url: string): number {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    // Tier 1: Academic, government, major research institutions
    if (
      hostname.endsWith(".gov") ||
      hostname.endsWith(".edu") ||
      hostname.includes("pubmed") ||
      hostname.includes("nature.com") ||
      hostname.includes("science.org") ||
      hostname.includes("who.int") ||
      hostname.includes("un.org") ||
      hostname.includes("nasa.gov") ||
      hostname.includes("nih.gov")
    ) {
      return 1.0;
    }

    // Tier 2: Reputable news organizations and established media
    if (
      hostname.includes("reuters.com") ||
      hostname.includes("apnews.com") ||
      hostname.includes("bbc.com") ||
      hostname.includes("nytimes.com") ||
      hostname.includes("theguardian.com") ||
      hostname.includes("washingtonpost.com") ||
      hostname.includes("economist.com") ||
      hostname.includes("ft.com") ||
      hostname.includes("wsj.com") ||
      hostname.includes("bloomberg.com") ||
      hostname.includes("npr.org")
    ) {
      return 0.8;
    }

    // Tier 3: Known reference sources
    if (
      hostname.includes("wikipedia.org") ||
      hostname.includes("britannica.com") ||
      hostname.includes("merriam-webster.com")
    ) {
      return 0.6;
    }

    // Tier 4: Other known sources
    if (hostname.includes("techcrunch.com") || hostname.includes("wired.com")) {
      return 0.5;
    }

    // Default: unknown domain
    return 0.3;
  } catch {
    return 0.2;
  }
}

/**
 * Format search results into a compact text block for LLM consumption.
 */
export function formatSearchResultsForLLM(
  results: TavilySearchResult[]
): string {
  if (results.length === 0) {
    return "No search results found.";
  }

  return results
    .map(
      (r, i) =>
        `[Source ${i + 1}]
Title: ${r.title}
URL: ${r.url}
Content: ${r.content.slice(0, 600)}
---`
    )
    .join("\n\n");
}
