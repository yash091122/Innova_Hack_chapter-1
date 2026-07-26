/**
 * VerifAI — Pre-cached Demo Data
 * Used when ?demo=true to bypass all API calls (hackathon safety net)
 */

import type { PipelineState } from "@/types";

export const DEMO_TOPIC = "Effects of social media on teenage mental health";

export const DEMO_PIPELINE_STATE: PipelineState = {
  sessionId: "demo-session-001",
  topic: DEMO_TOPIC,
  subQuestions: [
    "What does research show about social media use and depression in teenagers?",
    "How does Instagram/TikTok use correlate with anxiety in adolescents?",
    "What are the mechanisms by which social media affects teen self-esteem?",
    "Are there positive effects of social media on teenage mental health?",
    "What is the recommended daily social media limit for teenagers?",
  ],
  claims: [
    {
      id: "claim-001",
      claim:
        "Teenagers who spend more than 3 hours per day on social media are twice as likely to experience depression and anxiety symptoms.",
      sourceUrl: "https://www.nimh.nih.gov/health/topics/child-and-adolescent-mental-health",
      sourceSnippet:
        "Research indicates that adolescents spending more than 3 hours daily on social platforms show significantly elevated rates of depression and anxiety, approximately double compared to peers with lower usage.",
      verificationStatus: "confirmed",
      severity: null,
      attemptCount: 0,
      history: [],
      confidenceScore: 82,
      confidenceReason: "Confirmed by 3 independent sources including NIH; consistent across multiple studies",
      corroboratingSourcesCount: 3,
      sourceTrustTier: 1.0,
      verificationCertainty: 0.85,
      subQuestion: "What does research show about social media use and depression in teenagers?",
    },
    {
      id: "claim-002",
      claim:
        "A 2023 Surgeon General's Advisory stated that social media poses a 'profound risk of harm' to the mental health of children and adolescents.",
      sourceUrl: "https://www.hhs.gov/about/news/2023/06/06/surgeon-general-issues-new-advisory-about-effects-social-media-use-has-youth-mental-health.html",
      sourceSnippet:
        "Surgeon General Dr. Vivek Murthy released an advisory in June 2023 warning that social media use poses a 'profound risk of harm' to the mental health and well-being of children and adolescents.",
      verificationStatus: "confirmed",
      severity: null,
      attemptCount: 0,
      history: [],
      confidenceScore: 95,
      confidenceReason: "Directly sourced from official U.S. government advisory; confirmed by multiple news outlets",
      corroboratingSourcesCount: 4,
      sourceTrustTier: 1.0,
      verificationCertainty: 0.98,
      subQuestion: "What does research show about social media use and depression in teenagers?",
    },
    {
      id: "claim-003",
      claim:
        "Instagram's own internal research showed the platform makes body image issues worse for 1 in 3 teenage girls.",
      sourceUrl: "https://www.wsj.com/articles/facebook-knows-instagram-is-toxic-for-teen-girls-company-documents-show-11631620739",
      sourceSnippet:
        "Internal Meta research, revealed by the Wall Street Journal, found that Instagram makes body image issues worse for 32% of teen girls who already felt bad about their bodies.",
      verificationStatus: "partially_confirmed",
      severity: "low",
      attemptCount: 1,
      history: [
        {
          attempt: 0,
          claim: "Instagram's own research showed the platform makes body image issues worse for all teenage girls.",
          sourceUrl: "https://www.wsj.com/articles/facebook-knows-instagram-is-toxic-for-teen-girls-company-documents-show-11631620739",
          verificationStatus: "contradicted",
          timestamp: new Date(Date.now() - 120000).toISOString(),
        },
      ],
      confidenceScore: 61,
      confidenceReason: "Leaked internal documents confirmed; claim adjusted after re-research to reflect the 1 in 3 figure specifically",
      corroboratingSourcesCount: 2,
      sourceTrustTier: 0.8,
      verificationCertainty: 0.65,
      subQuestion: "How does Instagram/TikTok use correlate with anxiety in adolescents?",
    },
    {
      id: "claim-004",
      claim:
        "Social media platforms enable peer support networks that can positively impact mental health for LGBTQ+ teenagers who lack support in their immediate communities.",
      sourceUrl: "https://www.thetrevorproject.org/research-briefs/social-media-mental-health-lgbtq-youth/",
      sourceSnippet:
        "The Trevor Project's research found that LGBTQ+ youth who had access to affirming social spaces online, including social media, reported lower rates of depression and higher sense of belonging.",
      verificationStatus: "confirmed",
      severity: null,
      attemptCount: 0,
      history: [],
      confidenceScore: 74,
      confidenceReason: "Confirmed by Trevor Project research and academic studies; nuanced positive effect for specific subgroup",
      corroboratingSourcesCount: 2,
      sourceTrustTier: 0.7,
      verificationCertainty: 0.75,
      subQuestion: "Are there positive effects of social media on teenage mental health?",
    },
    {
      id: "claim-005",
      claim:
        "The American Psychological Association recommends that adolescents 13–17 limit social media use and that parents monitor content rather than imposing strict hour limits.",
      sourceUrl: "https://www.apa.org/topics/social-media-internet/social-media-health-advisory",
      sourceSnippet:
        "The APA's 2023 health advisory recommends that adolescent social media use should be actively monitored for harmful content by parents, with context-sensitive limits rather than one-size-fits-all hour restrictions.",
      verificationStatus: "partially_confirmed",
      severity: null,
      attemptCount: 0,
      history: [],
      confidenceScore: 68,
      confidenceReason: "APA guidance confirmed; however, specific age range of 13-17 not explicitly stated in available sources",
      corroboratingSourcesCount: 2,
      sourceTrustTier: 1.0,
      verificationCertainty: 0.7,
      subQuestion: "What is the recommended daily social media limit for teenagers?",
    },
    {
      id: "claim-006",
      claim:
        "Cyberbullying affects approximately 37% of young people between the ages of 12 and 17, with social media being the primary venue.",
      sourceUrl: "https://cyberbullying.org/facts",
      sourceSnippet:
        "According to the Cyberbullying Research Center, about 37% of young people between the ages of 12 and 17 have been bullied online, with social media platforms being the most common location.",
      verificationStatus: "confirmed",
      severity: null,
      attemptCount: 0,
      history: [],
      confidenceScore: 71,
      confidenceReason: "Confirmed by Cyberbullying Research Center data; consistent with multiple studies on online harassment",
      corroboratingSourcesCount: 3,
      sourceTrustTier: 0.7,
      verificationCertainty: 0.75,
      subQuestion: "What are the mechanisms by which social media affects teen self-esteem?",
    },
  ],
  currentStage: "done",
  finalReportMarkdown: `# Effects of Social Media on Teenage Mental Health

## Executive Summary

Research consistently demonstrates significant relationships between social media use and teenage mental health outcomes. The U.S. Surgeon General issued a landmark 2023 advisory declaring social media poses a "profound risk of harm" to youth mental health. While heavy use (3+ hours/day) is linked to doubled depression and anxiety rates, the picture is nuanced — social media can serve as a positive lifeline for LGBTQ+ youth seeking community. Major health authorities recommend contextual monitoring over blanket time restrictions.

---

## Verified Claims

### 1. Heavy Social Media Use Doubles Teen Depression Risk
**[HIGH CONFIDENCE — Score: 82/100]**

> Teenagers who spend more than 3 hours per day on social media are twice as likely to experience depression and anxiety symptoms.

- **Source:** [National Institute of Mental Health](https://www.nimh.nih.gov/health/topics/child-and-adolescent-mental-health)
- **Confidence Reason:** Confirmed by 3 independent sources including NIH; consistent across multiple studies
- **Status:** Confirmed

### 2. Surgeon General's 2023 Warning
**[HIGH CONFIDENCE — Score: 95/100]**

> A 2023 Surgeon General's Advisory stated that social media poses a "profound risk of harm" to the mental health of children and adolescents.

- **Source:** [HHS.gov — Surgeon General Advisory](https://www.hhs.gov/about/news/2023/06/06/surgeon-general-issues-new-advisory-about-effects-social-media-use-has-youth-mental-health.html)
- **Confidence Reason:** Directly sourced from official U.S. government advisory; confirmed by multiple news outlets
- **Status:** Confirmed

### 3. Instagram Internal Research on Body Image Re-verified 1×
**[MEDIUM CONFIDENCE — Score: 61/100]**

> Instagram's own internal research showed the platform makes body image issues worse for 1 in 3 teenage girls.

- **Source:** [Wall Street Journal](https://www.wsj.com/articles/facebook-knows-instagram-is-toxic-for-teen-girls-company-documents-show-11631620739)
- **Confidence Reason:** Leaked internal documents confirmed; claim adjusted after re-research to reflect the accurate 1-in-3 figure
- **Status:** Partially Confirmed — original claim overstated; corrected after re-research

### 4. Positive Effects for LGBTQ+ Youth
**[MEDIUM CONFIDENCE — Score: 74/100]**

> Social media platforms enable peer support networks that can positively impact mental health for LGBTQ+ teenagers who lack support in their immediate communities.

- **Source:** [The Trevor Project](https://www.thetrevorproject.org/research-briefs/social-media-mental-health-lgbtq-youth/)
- **Confidence Reason:** Confirmed by Trevor Project research and academic studies; nuanced positive effect for specific subgroup
- **Status:** Confirmed

### 5. APA Recommendations
**[MEDIUM CONFIDENCE — Score: 68/100]**

> The American Psychological Association recommends that adolescents 13–17 limit social media use and that parents monitor content rather than imposing strict hour limits.

- **Source:** [APA Health Advisory](https://www.apa.org/topics/social-media-internet/social-media-health-advisory)
- **Confidence Reason:** APA guidance confirmed; however, specific age range of 13-17 not explicitly stated in all available sources
- **Status:** Partially Confirmed

### 6. Cyberbullying Prevalence
**[MEDIUM CONFIDENCE — Score: 71/100]**

> Cyberbullying affects approximately 37% of young people between the ages of 12 and 17, with social media being the primary venue.

- **Source:** [Cyberbullying Research Center](https://cyberbullying.org/facts)
- **Confidence Reason:** Confirmed by Cyberbullying Research Center data; consistent with multiple studies on online harassment
- **Status:** Confirmed

---

## Methodology

This report was generated by **VerifAI's 4-agent pipeline**:

1. **Research Agent** — Broke the topic into sub-questions and searched the web via Tavily, extracting source-grounded claims
2. **Verification Agent** — Independently cross-checked each claim with fresh web searches, requiring 2+ corroborating sources for "confirmed" status
3. **Contradiction Detector** — Checked claim pairs for logical inconsistencies and verified claim fidelity against source snippets
4. **Synthesis Agent** — Computed confidence scores using a weighted formula (corroboration × 0.4 + source trust × 0.3 + verification certainty × 0.3) and compiled this report

One claim triggered the **feedback loop** (Claim 3 — Instagram body image), where the contradiction detector flagged a "high" severity overstatement and routed it back to the Research Agent for re-research.

---

*Disclaimer: This report was generated by an AI research system. While claims have been verified against web sources, readers should conduct their own due diligence before making decisions based on this information.*`,
  startedAt: new Date(Date.now() - 45000).toISOString(),
  completedAt: new Date().toISOString(),
  error: null,
};
