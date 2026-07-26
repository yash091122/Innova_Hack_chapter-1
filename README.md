# FactForge

**Autonomous Multi-Agent Research & Fact-Verification System**

FactForge takes a user-submitted topic, runs it through a 4-agent AI pipeline with a self-correcting feedback loop, and returns a citation-backed report with per-claim confidence scores — with live streaming progress in the UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| AI Pipeline | LangGraph.js (`@langchain/langgraph`) |
| LLM | Anthropic Claude (claude-sonnet-4-5) |
| Search | Tavily API |
| Database | Supabase (Postgres) |
| Streaming | Server-Sent Events (SSE) |
| Pipeline Viz | React Flow |
| Charts | Recharts |
| PDF Export | jsPDF (client-side) |

---

## Quick Start

### 1. Install dependencies

```bash
cd factforge
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

Required keys:
- `ANTHROPIC_API_KEY` from [console.anthropic.com](https://console.anthropic.com)
- `TAVILY_API_KEY` from [tavily.com](https://tavily.com)
- `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` from Supabase project Settings > API
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same values, client-side)

### 3. Set up Supabase

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','error')),
  pipeline_state JSONB,
  final_report_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

### 4-Agent Pipeline with Feedback Loop

```
Agent 1 (Research) -> Agent 2 (Verification) -> Agent 3 (Contradiction Check)
                                                         |
                         HIGH severity & attempts < 2   |   else
                         <--- feedback loop ------------|----------> Agent 4 (Synthesis)
```

The feedback loop is implemented as a **real LangGraph conditional edge** using `addConditionalEdges()` — not a while-loop:

```typescript
.addConditionalEdges("contradiction_check", routeAfterContradiction, {
  set_reresearch_target: "set_reresearch_target",
  synthesis: "synthesis",
})
```

### Confidence Score Formula

```
score = (corroborating_sources x 0.4 + source_trust_tier x 0.3 + verification_certainty x 0.3) x 100
```

Penalties for contradicted/unverifiable status, high severity, and re-researched claims.

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/verify` | POST | Start pipeline, returns sessionId |
| `/api/verify/stream?sessionId=...` | GET | SSE stream of agent progress |
| `/api/verify/report?sessionId=...` | GET | Final report JSON |
| `/api/verify/export?sessionId=...&format=pdf` | GET | Download report |
| `/api/history` | GET | List past sessions |

---

## Demo Mode

Click **"Try demo"** on the landing page to see a pre-cached scenario run instantly without any API calls — perfect for hackathon demos with rate limit concerns.

---

## Project Structure

```
src/
  agents/         - 4 agent implementations (research, verification, contradiction, synthesis)
  graph/          - LangGraph StateGraph pipeline with conditional edges
  lib/            - Anthropic, Tavily, Supabase, SSE stream store, demo data
  components/     - AgentPipeline (React Flow), LiveStatusPanel, ClaimCard, ReportView, ExportButton
  app/            - Next.js pages and API routes
  types/          - TypeScript interfaces
```
# Innova_Hack_chapter-1
