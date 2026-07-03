# AI PM Eval Masterclass -- Comprehensive Critique

**Date:** 2026-03-28
**Document reviewed:** `/docs/ai-pm-eval-masterclass.html` (1,812 lines, 18 chapters, ~45 min read)
**Target reader:** Unemployed PM, zero eval knowledge, semi-technical, wants to become top 1% eval expert to land AI PM roles

---

## EXECUTIVE SUMMARY

The masterclass is strong on conceptual foundations and PM-specific framing. It successfully explains *why* evals matter and *how to think about them*. However, it has critical gaps that would prevent the target reader from actually *doing* evals or *landing a job*. The document teaches the philosophy of evals well but falls short on the craft of evals. A true beginner would finish reading and think "I understand the concept -- but I still can't build one."

The five most consequential gaps:
1. No prerequisite AI knowledge is explained (tokens, prompts, temperature, system prompts)
2. No concrete, copy-paste-ready implementation examples
3. No mention of actual eval tools (Braintrust, promptfoo, RAGAS, etc.)
4. No RAG evaluation, hallucination detection, or bias/fairness coverage
5. No career section (interview prep, resume language, case study format)

---

## 1. KNOWLEDGE GAPS -- Concepts Assumed But Never Explained

### 1.1 Foundational AI Concepts Missing Entirely

The document assumes the reader already understands how LLMs work. For a reader with "ZERO eval knowledge," these gaps are blockers:

**Tokens** -- The word "tokens" appears in Chapter 03 ("Response is under 500 tokens?") and Chapter 09 ("Token count within budget") with no definition. The reader does not know that tokens are the unit LLMs process text in, that a token is roughly 3/4 of a word, that pricing is per-token, or that token limits constrain both input and output.

**System prompts** -- Never mentioned. The reader cannot understand how evals connect to the prompts they are evaluating without understanding what a system prompt is, how it shapes behavior, and that changing a system prompt is the primary lever PMs pull.

**Temperature and sampling** -- Never mentioned. The document acknowledges non-determinism ("Give a great answer today and a different one tomorrow") but never explains *why* this happens. Temperature is the single most important parameter governing non-determinism. A PM who does not understand temperature cannot design evals that account for variance.

**Prompt engineering** -- The phrase appears nowhere. The document talks about "prompts" in the context of judge prompts but never explains that the primary thing being evaluated is usually *the prompt itself*. The connection between prompt iteration and eval runs is the core loop of AI product development, and it is absent.

**Context window** -- Never mentioned. The reader cannot understand why an agent's quality might degrade on long conversations (the multi-turn problem in Chapter 14) without understanding context windows.

**Fine-tuning vs. prompting** -- Never mentioned. The reader cannot understand the full landscape of what evals are used for (comparing a fine-tuned model vs. a prompted model) without this distinction.

**API calls** -- The document references "cost per request" and "token efficiency" but never explains that LLM interactions happen via API calls with measurable cost per call.

### 1.2 Concepts Introduced Without Sufficient Explanation

**Hallucination** -- Defined in the vocabulary section as "how often the model makes up facts" but the mechanisms, detection techniques, and mitigation strategies are never covered. This is the single most-asked-about topic in AI PM interviews (per Hamel Husain and multiple hiring manager interviews).

**Elo Rating** -- Defined as "ranking models by head-to-head comparison" but the reader has no idea how to interpret an Elo score, what Chatbot Arena is in practice, or why this matters for their product decisions.

**Contamination** -- Defined but never explained in practical terms. When does contamination actually affect a PM? How do you detect it? The reader is left with a metaphor ("giving students the exam") but no actionable knowledge.

### 1.3 Conceptual Jumps Between Sections

- **Chapter 03 to Chapter 04:** Chapter 03 ends with the "typical stack" diagram. Chapter 04 is vocabulary. The reader has not yet been told *how* any of this connects to their daily work. A "So what does this mean for your week?" bridge is missing.
- **Chapter 06 to Chapter 07:** Chapter 06 covers test case design. Chapter 07 covers rubrics. But the reader does not understand that rubrics and test cases are used *together* -- that each test case is scored against the rubric. This connection is implicit but never stated explicitly.
- **Chapter 08 to Chapter 09:** Jumps from LLM-as-Judge (sophisticated) to Structural Evals (simple). The ordering should be reversed -- structural evals are simpler and should come first, as the "typical stack" in Chapter 03 already establishes.

---

## 2. MISSING TOPICS -- Important Eval Areas Completely Absent

### 2.1 RAG Evaluation (Critical Gap)

RAG (Retrieval-Augmented Generation) is the architecture behind the majority of enterprise AI products in 2026. A 2025 AI-engineering survey reports that 70% of engineers either have RAG in production or will within 12 months. The masterclass never mentions RAG once.

A PM evaluating a RAG system needs to understand:
- **Retrieval metrics:** Context precision, context recall, MRR, nDCG
- **Generation metrics:** Faithfulness (is the answer grounded in retrieved docs?), answer relevancy, citation coverage
- **The two-layer eval:** Retrieval and generation must be evaluated separately because a bad answer could be caused by bad retrieval (right answer not found) or bad generation (right docs found but misinterpreted)

This is arguably the single biggest topic gap in the document.

### 2.2 Hallucination Detection Techniques (Critical Gap)

The document mentions hallucination rate as a metric but provides zero techniques for detecting hallucinations. Current approaches include:

- **Self-consistency checking:** Generate multiple responses, check if they agree
- **Fact decomposition:** Break output into individual claims, verify each
- **Citation verification:** Check if cited sources actually support the claims
- **Entailment-based scoring:** Use NLI models to check if output follows from input
- **Cross-reference with ground truth:** Compare claims against a verified knowledge base

A PM who cannot articulate hallucination detection methods will fail an AI PM interview.

### 2.3 Bias and Fairness Evaluation (Critical Gap)

Never mentioned. In 2025-2026, bias evaluation is table stakes for any AI product, especially B2C. Topics that should be covered:
- **Demographic parity:** Does the model perform equally across user groups?
- **Representation bias:** Does the model default to certain demographics in outputs?
- **Self-enhancement bias in judges:** An LLM judging its own outputs tends to rate them higher (documented by University of Zurich, 2025)
- **Position bias in pairwise comparison:** LLM judges prefer the first or second option depending on the model
- **Source attribution bias:** LLMs rate content differently based on attributed source

### 2.4 Multi-Modal Evaluation (Moderate Gap)

The document is entirely text-focused. Many AI products generate images, audio, or video. The masterclass should at least acknowledge that:
- Image evals require different metrics (FID, CLIP score, human preference)
- Multi-modal agents need eval at each modality
- The creative agent this document is built around generates images -- yet image eval is not covered

### 2.5 Non-Determinism Handling (Critical Gap)

The document acknowledges non-determinism in Chapter 01 but never tells the reader how to handle it in practice. Research shows:
- Agents achieving 60% pass@1 on benchmarks may exhibit only 25% consistency across multiple trials
- Best practice: Run each test case 3-5 times minimum, 10+ for creative/variable outputs
- Use scorer aggregation (mean, median, worst-case) depending on risk tolerance
- Temperature=0 does NOT guarantee determinism (documented by multiple researchers including work published at EMNLP 2025)

### 2.6 Statistical Significance (Moderate Gap)

The document shows score comparisons ("Week 1: 4.1, Week 4: 3.5 -- REGRESSION") but never discusses whether a change is statistically significant. Is a 0.2 point drop on 15 test cases meaningful? The reader does not know. At minimum, cover:
- Confidence intervals on eval scores
- Minimum sample sizes for meaningful comparisons
- When a "regression" is just noise

### 2.7 Evaluation Governance and Documentation (Moderate Gap)

No mention of:
- How to version rubrics and track changes over time
- How to document eval decisions and rationale
- How to maintain an eval registry across multiple product features
- How to hand off eval systems when team members change

### 2.8 Error Analysis as Starting Point (Critical Gap)

Hamel Husain and Shreya Shankar (creators of the #1 eval course on Maven, which is the top-grossing course on the platform) emphasize that **error analysis must precede eval construction**. Their approach:
1. Review real user traces first
2. Apply qualitative research methods (open coding, axial coding)
3. Build a failure taxonomy from observed patterns
4. THEN design evals targeting those specific patterns

The masterclass jumps to eval design without this crucial step. The "Good Output" document template in Chapter 05 is close but is theoretical (imagined failure modes) rather than empirical (observed failure modes from real data).

### 2.9 Eval Tools and Platforms (Critical Gap)

The document mentions no actual eval tools. A PM needs to know:
- **Braintrust** -- End-to-end eval platform, production monitoring, CI/CD integration
- **promptfoo** -- Open-source CLI for prompt testing and red-teaming, YAML-based configs
- **DeepEval** -- Python-native framework with 50+ built-in metrics
- **RAGAS** -- RAG-specific evaluation without ground truth labels
- **Langfuse** -- Open-source observability and eval
- **LangSmith** -- LangChain ecosystem eval tool
- **Arize Phoenix** -- Observability with eval capabilities

Even if the masterclass does not teach tool usage, it should provide a landscape map so the reader knows what exists.

---

## 3. PRACTICAL GAPS -- What's Missing for Someone Who Needs to DO This

### 3.1 No Complete, Copy-Paste Judge Prompt

Chapter 08 shows the 5-part structure of a judge prompt but never provides a complete, working example. The reader sees:
```
PART 1: ROLE
PART 2: CONTEXT
PART 3: RUBRIC
PART 4: PROCESS
PART 5: OUTPUT FORMAT
```

But never sees a full 50-100 line judge prompt they could copy, modify, and run. This is the single most actionable thing the document could provide.

**What a complete example should look like:**
- Full system prompt for the judge
- Full user message template with placeholders
- Example input/output pair being judged
- Example JSON response from the judge
- Explanation of how to interpret the response

### 3.2 No Step-by-Step Tutorial

The "Week-by-Week Plan" in Chapter 18 is a high-level roadmap, not a tutorial. A beginner needs:
1. Open a spreadsheet (or specific tool)
2. Create these columns: [list]
3. Write your first test case like this: [example]
4. Run it by sending this to Claude/GPT: [exact prompt]
5. Record the output here: [where]
6. Score it using this rubric: [rubric]
7. Here is what a completed eval spreadsheet looks like: [screenshot or table]

### 3.3 No Cost Estimation for Running Evals

The document discusses efficiency evals but never tells the reader what evals themselves cost to run. In 2026:
- Running 50 test cases through an LLM judge (Sonnet 4.6 at $3/$15 per M tokens) costs approximately $2-5 per eval run
- Running 50 test cases through the agent itself (if the agent uses Opus 4.6) could cost $50-150 per full pipeline run
- Budget-conscious teams can use Gemini 2.0 Flash-Lite ($0.075/$0.30) as a judge for 20-50x savings

A PM needs to budget for evals. The document never addresses this.

### 3.4 No Inter-Rater Agreement Calculation

The vocabulary section defines inter-rater agreement. Chapter 08 mentions multi-judge agreement. But neither section explains how to calculate it. At minimum:
- Cohen's Kappa for two raters
- Fleiss' Kappa for three or more raters
- Practical interpretation: 0.8+ = strong agreement, 0.6-0.8 = moderate, below 0.6 = problematic

### 3.5 No Guidance on Which Model to Use as Judge

Chapter 08 says "use a (usually stronger) LLM" but does not address:
- Can you use the same model as both generator and judge? (Generally no -- self-enhancement bias)
- What if you cannot afford a stronger model?
- When is a smaller/cheaper model sufficient as judge?
- How do you validate that your judge model is reliable for your specific domain?

### 3.6 No Worked Example from Start to Finish

The document uses the creative agent as a running example in some places (Chapter 07 weighted scoring) but never walks through a complete eval from "here is the agent's output" to "here is the final score and what we do about it." A single worked example -- even fictional -- would be enormously valuable.

---

## 4. B2C/B2B SCENARIO GAPS -- Missing Eval Patterns for Common AI Products

### 4.1 Chatbot Evaluation

The most common AI product type. Needs coverage of:
- Turn-level vs. conversation-level scoring
- Engagement metrics (conversation length, user satisfaction)
- Escalation rate (how often does the bot fail and hand off to a human?)
- Safety in open-ended conversation

### 4.2 Search and Recommendation Evaluation

- Precision@K, Recall@K, nDCG
- Click-through rate as implicit eval
- Diversity metrics (not just relevance)
- Serendipity vs. filter bubble detection

### 4.3 Code Generation Evaluation

Increasingly relevant for PM tools. Metrics include:
- Pass@k (does the code run?)
- Functional correctness (does it produce the right output?)
- Code quality (readability, efficiency, security)
- HumanEval and MBPP benchmarks

### 4.4 Summarization Evaluation

- ROUGE scores (overlap with reference summary)
- BERTScore (semantic similarity)
- Faithfulness (does the summary add information not in the source?)
- Compression ratio

### 4.5 Translation Evaluation

- BLEU, chrF, COMET scores
- Human adequacy and fluency ratings
- Cultural appropriateness

### 4.6 Agent Planning Evaluation

Chapter 14 covers agentic eval but misses:
- Plan coherence (does the sequence of steps make logical sense?)
- Step success rate (what percentage of planned steps execute successfully?)
- Replanning ability (does the agent recover from failed steps?)
- TPS-Bench and Terminal-Bench as relevant benchmarks

---

## 5. CAREER GAPS -- For Landing an AI PM Job

### 5.1 No Interview Preparation Section

This is arguably the most important gap given the target reader is unemployed and job-seeking. Should include:

**Common AI PM interview questions about evals:**
- "How would you evaluate the quality of our AI feature?"
- "Our model hallucinates 10% of the time. How would you reduce that?"
- "How would you design an eval for [specific product]?"
- "Walk me through how you would decide between Model A and Model B."
- "What metrics would you track for an AI-powered [X]?"
- "How do you balance evaluation cost with comprehensiveness?"

**What hiring managers look for (sourced from ProductCareerhub, TechnoManagers, 2026):**
- Can you articulate what "good" looks like for a specific product?
- Do you understand the difference between building AI products and using AI tools?
- Can you design an eval system, not just talk about one?
- Do you understand the trade-offs (cost vs. quality, speed vs. thoroughness)?

### 5.2 No Resume/Portfolio Language

The reader needs to know how to signal eval expertise:
- "Designed and maintained a 75-case eval suite covering 8 industry segments"
- "Built LLM-as-judge pipeline that achieved 0.85 correlation with human ratings"
- "Reduced hallucination rate from 12% to 3% through eval-driven prompt iteration"
- "Implemented automated quality monitoring sampling 10% of production outputs"

### 5.3 No Case Study Template

For interviews, the reader needs a format:
1. **Context:** What product, what AI feature, what problem
2. **Eval Design:** What dimensions, what test cases, what approach
3. **Execution:** How you ran it, what tools, what it cost
4. **Results:** What you found, what surprised you
5. **Impact:** What changed, what improved, by how much

### 5.4 No Portfolio Project Suggestions

The reader is unemployed. They need to build eval experience. Suggestions:
- "Pick any AI product (Jasper, Copy.ai, Perplexity). Use it 50 times. Build an eval suite."
- "Take a public API (Claude, GPT). Build a simple app. Write evals. Document everything."
- "Contribute to an open-source eval framework (promptfoo, DeepEval)."

---

## 6. STRUCTURAL ISSUES -- With the Document Itself

### 6.1 Section Ordering

**Problem:** Structural Evals (Chapter 09) come after LLM-as-Judge (Chapter 08). The document's own "typical stack" diagram in Chapter 03 establishes that code checks are the base layer and LLM-as-Judge is the middle layer. The progression should match: simple first, complex second.

**Recommended reorder:** Move Structural Evals (current Chapter 09) to before LLM-as-Judge (current Chapter 08).

### 6.2 The ACCT Framework Appears Too Late

The ACCT framework (Accuracy, Completeness, Calibration, Taste) in Chapter 18 is a strong, memorable mnemonic. It should appear in Chapter 05 ("Defining Good") as the starting framework, then be referenced throughout. By placing it in the final chapter, most of the document's examples use ad-hoc dimension names instead of the consistent ACCT framework.

### 6.3 No Glossary/Quick Reference

For a 45-minute read, a one-page glossary at the end would be valuable for quick reference. The vocabulary section (Chapter 04) only covers 10 terms. By the end of the document, dozens of additional terms have been introduced without formal definition (ablation study, contrastive eval, meta-eval, etc.).

### 6.4 Missing "Prerequisites" Section

The document starts with "Why Evals Exist" but should have a "Chapter 00: What You Need to Know First" covering:
- What an LLM is (one paragraph)
- What tokens are
- What a prompt is
- What a system prompt is
- What temperature is
- What an API call is
- How pricing works (input tokens vs. output tokens)

This would take 2-3 minutes of reading and unlock the entire rest of the document for a true beginner.

### 6.5 No "Common Mistakes" Section

The document has individual warnings scattered as callout boxes but no consolidated "Top 10 Mistakes New Eval Builders Make" section. Based on industry literature, this should include:
1. Testing only happy paths
2. Using averages instead of distributions
3. Not versioning rubrics
4. Using the same model as generator and judge
5. Running evals only once (not accounting for non-determinism)
6. Not connecting evals to user outcomes
7. Over-automating before understanding failure modes manually
8. Building infrastructure before doing error analysis
9. Treating eval scores as absolute rather than relative
10. Not refreshing test cases as the product evolves

### 6.6 Repetition

The concept of "generic output is bad" appears in:
- Chapter 05 (The Generic Trap)
- Chapter 07 (Specificity dimension)
- Chapter 13 (B2C specificity)
- Chapter 14 (agent eval)

While reinforcement is valuable, the same point is made without building on it. Each occurrence should add a new angle rather than restating.

---

## 7. FACTUAL AND ACCURACY ISSUES

### 7.1 Model Names May Date Quickly

The document references "Haiku 4.5", "Sonnet 4.6", and "Opus 4.6" in Chapter 12. These are current model names as of March 2026, but model naming changes frequently. Consider using placeholder names or noting the principle (cheap/mid/expensive) alongside specific model names.

### 7.2 Chatbot Arena Description Is Incomplete

The vocabulary section says Chatbot Arena uses Elo rating. While historically true, the platform has evolved. The point about pairwise comparison being more reliable than absolute scoring (Chapter 08, Technique 6) is well-made, but the Elo reference in the vocabulary could be expanded.

### 7.3 "Correlation > 0.8" for Meta-Evals

Chapter 12 states correlation > 0.8 means the judge is reliable. This is reasonable but deserves nuance:
- What kind of correlation? (Pearson, Spearman, Cohen's Kappa?)
- 0.8 on what scale? (If using 1-5 scores, the effective range is narrow)
- Even 0.8 correlation means 36% of variance is unexplained

---

## 8. WHAT THE DOCUMENT DOES WELL

To be fair, the masterclass has significant strengths:

1. **PM-first framing.** "Evals are taste, made measurable" is a brilliant distillation. The document consistently frames evals as a product skill, not a technical skill.

2. **The 5-Question Decomposition Method** (Chapter 05) is original, practical, and well-structured. The "User needs X so they can Y without Z" exercise is immediately actionable.

3. **Failure modes table** (Chapter 05) names real patterns (Generic Trap, Confidence Trap, Lazy Middle, etc.) that most eval guides do not cover.

4. **Weighted scoring examples** (Chapter 07) show that eval weights ARE product strategy. This is a insight many guides miss.

5. **Adversarial Decomposition / flaw-counting** (Chapter 08, Technique 3) is a practical, powerful technique well-explained.

6. **User signals as implicit evals** (Chapter 11) bridges the gap between formal evals and real-world product analytics. The regeneration rate insight is strong.

7. **Stakeholder communication templates** (Chapter 15) are practical and differentiated by audience.

8. **The Maturity Model** (Chapter 17) gives the reader a clear progression path.

9. **Writing quality.** The document is well-written, avoids jargon where possible, uses good analogies, and maintains a consistent voice.

---

## 9. COMPARISON WITH INDUSTRY RESOURCES

### vs. Hamel Husain's "LLM Evals FAQ" (hamel.dev)

The Hamel Husain FAQ emphasizes error analysis as the starting point, argues that 60-80% of development time should go to error analysis rather than building automated checks, and advocates for a "benevolent dictator" model of eval ownership. The masterclass aligns on ownership ("You own the rubric") but misses the error analysis emphasis entirely.

The FAQ also argues AGAINST Likert scales (1-5 scoring) as a starting point, preferring binary pass/fail with specific criteria. The masterclass is heavily oriented around 1-5 scoring. This is a substantive disagreement the masterclass should acknowledge.

### vs. Hamel & Shreya's Maven Course

The Maven course covers RAG evaluation, synthetic data generation, tool selection guidance, and implementation homework. All four are absent from the masterclass. The course also emphasizes that "evals are the new PRDs" -- a framing that would strengthen the masterclass's PM-centric approach.

### vs. Eugene Yan's "An LLM-as-Judge Won't Save The Product"

Eugene Yan argues that tools and automation are secondary to process -- that the real work is examining data, understanding failure modes, and iterating systematically. The masterclass leans more toward the automated/tooling side. Both perspectives are valid, but the masterclass would benefit from acknowledging this tension.

### vs. Pragmatic Engineer's "Pragmatic Guide to LLM Evals"

The Pragmatic Engineer guide covers eval cost management, team organization for evals, and integration with CI/CD pipelines -- practical concerns the masterclass does not address.

---

## 10. SPECIFIC ADDITIONS RECOMMENDED (Priority Order)

### Must-Have (would fundamentally improve the document)

1. **Chapter 00: "Prerequisites -- What You Need to Know About AI"** -- 500 words covering tokens, prompts, system prompts, temperature, API calls, pricing. Without this, a true beginner is lost.

2. **A complete, copy-paste LLM-as-Judge prompt** -- Full working example with input, output, judge prompt, and judge response. This is the single most actionable addition.

3. **RAG Evaluation section** -- At minimum a 500-word overview covering retrieval vs. generation metrics, faithfulness, context precision.

4. **Hallucination detection techniques** -- Practical methods a PM can use or request from their team.

5. **Error analysis methodology** -- Add to Chapter 05. Before defining "good" theoretically, review real outputs empirically. Open coding, axial coding, failure taxonomy.

6. **Eval tools landscape** -- A table listing 5-7 major tools with what they do and when to use them.

7. **Non-determinism handling** -- Run cases multiple times, aggregate scores, understand variance.

8. **Interview preparation section** -- Common questions, what hiring managers look for, case study template, resume language.

### Should-Have (would meaningfully strengthen the document)

9. **Bias and fairness evaluation** -- Position bias in judges, demographic parity, self-enhancement bias.
10. **Step-by-step tutorial** -- A "Your First Eval in 30 Minutes" walkthrough.
11. **Cost estimation guide** -- What evals cost to run at different scales.
12. **Move ACCT framework earlier** -- From Chapter 18 to Chapter 05.
13. **Statistical significance basics** -- When is a score change meaningful?
14. **Pass/fail vs. Likert scale debate** -- When to use binary evals vs. graded scales.
15. **Common mistakes consolidated section** -- Top 10 mistakes, all in one place.

### Nice-to-Have (would improve completeness)

16. **Domain-specific eval patterns** -- Chatbot, search, code gen, summarization.
17. **Portfolio project ideas** -- For the unemployed reader building eval experience.
18. **Glossary/quick reference** -- Comprehensive term definitions.
19. **Multi-modal eval acknowledgment** -- At least a note about image/audio eval.
20. **Eval governance and documentation** -- Versioning, handoff, audit trails.

---

## 11. THE BOTTOM LINE

The masterclass is approximately 70% of the way to being the definitive resource it aims to be. The conceptual foundation is strong. The PM-centric framing is excellent. The writing quality is high.

The 30% gap is almost entirely in two areas:
1. **Practical implementation** -- The reader finishes understanding evals but cannot build one.
2. **Career application** -- The reader finishes understanding evals but cannot demonstrate that knowledge in an interview.

Fill those two gaps and this document delivers on its promise.

---

## Sources

- [Hamel Husain - LLM Evals: Everything You Need to Know](https://hamel.dev/blog/posts/evals-faq/)
- [Lenny's Podcast - Why AI evals are the hottest new skill for product builders](https://www.lennysnewsletter.com/p/why-ai-evals-are-the-hottest-new-skill)
- [Eugene Yan - An LLM-as-Judge Won't Save The Product](https://eugeneyan.com/writing/eval-process/)
- [Product School - Why AI Evaluation Is a Must-Have Skill for Product Managers](https://productschool.com/blog/artificial-intelligence/ai-evals-product-managers)
- [Maven - AI Evals For Engineers & PMs by Hamel Husain and Shreya Shankar](https://maven.com/parlance-labs/evals)
- [Braintrust - Best LLM evaluation platforms 2025](https://www.braintrust.dev/articles/best-llm-evaluation-platforms-2025)
- [Braintrust - Best Promptfoo alternatives in 2026](https://www.braintrust.dev/articles/best-promptfoo-alternatives-2026)
- [Maxim AI - RAG Evaluation: A Complete Guide for 2025](https://www.getmaxim.ai/articles/rag-evaluation-a-complete-guide-for-2025/)
- [Evidently AI - RAG Evaluation Guide](https://www.evidentlyai.com/llm-guide/rag-evaluation)
- [Datadog - Detecting hallucinations with LLM-as-a-judge](https://www.datadoghq.com/blog/ai/llm-hallucination-detection/)
- [Axiom - Handling non-determinism](https://axiom.co/docs/ai-engineering/evaluate/handling-non-determinism)
- [The Context Lab - The Non-Determinism Problem](https://www.thecontextlab.ai/blog/non-determinism-problem-evaluating-agents-reliably)
- [NIST - Expanding the AI Evaluation Toolbox with Statistical Models (Feb 2026)](https://www.nist.gov/news-events/news/2026/02/new-report-expanding-ai-evaluation-toolbox-statistical-models)
- [TechnoManagers - How to Crack the AI PM Interview in 2026](https://www.technomanagers.com/p/how-to-crack-the-ai-pm-interview)
- [ProductCareerHub - PM Interviews Changed. What Hiring Managers Test Now](https://www.productcareerhub.com/p/pm-interviews-ai-positioning)
- [AWS - Evaluating AI Agents: Real-world lessons from building agentic systems at Amazon](https://aws.amazon.com/blogs/machine-learning/evaluating-ai-agents-real-world-lessons-from-building-agentic-systems-at-amazon/)
- [Pragmatic Engineer - A pragmatic guide to LLM evals for devs](https://newsletter.pragmaticengineer.com/p/evals)
- [Fireworks AI - LLM Eval Driven Development with Claude Code](https://fireworks.ai/blog/eval-driven-development-with-claude-code)
- [Statsig - LLM Evaluation Bias](https://www.statsig.com/perspectives/llm-evaluation-bias)
- [LLM API Pricing Comparison 2026](https://aisuperior.com/llm-api-cost-comparison/)
