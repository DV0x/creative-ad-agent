# AI Evals: Tools, Platforms, Workflows, and Practical Implementation

**Audience**: Semi-technical PM who uses Claude Code but is not an engineer.
**Date**: March 28, 2026
**Confidence key**: HIGH = multiple primary sources agree | MEDIUM = solid evidence but gaps | LOW = limited or conflicting evidence

---

## Table of Contents

1. [The Eval Landscape in 60 Seconds](#the-eval-landscape-in-60-seconds)
2. [Eval Maturity: Where Are You?](#eval-maturity-where-are-you)
3. [Eval Platforms and Tools Compared](#eval-platforms-and-tools-compared)
4. [Open Source Eval Frameworks](#open-source-eval-frameworks)
5. [Cost and Observability Tools](#cost-and-observability-tools)
6. [Eval Metrics Reference](#eval-metrics-reference)
7. [Real-World Eval Workflows](#real-world-eval-workflows)
8. [Building Your Golden Dataset](#building-your-golden-dataset)
9. [Eval-Driven Prompt Iteration](#eval-driven-prompt-iteration)
10. [The PM Eval Playbook](#the-pm-eval-playbook)
11. [Limitations and Counter-Arguments](#limitations-and-counter-arguments)
12. [What Changes in 12 Months](#what-changes-in-12-months)
13. [Gaps and Uncertainties](#gaps-and-uncertainties)
14. [Sources](#sources)

---

## The Eval Landscape in 60 Seconds

The AI eval ecosystem has matured rapidly. As of early 2026:

- **57% of organizations** have AI agents in production (LangChain State of AI Agents 2026 report)
- **Quality is the #1 barrier** to production deployment, cited by 32% of respondents
- **52.4%** of organizations run offline evaluations; only **37.3%** run online (production) evals
- **Human review (59.8%)** remains the most common eval method; **LLM-as-judge (53.3%)** is catching up fast
- **89%** have implemented observability, outpacing eval adoption at 52%

The gap between "we're observing our AI" and "we're evaluating our AI" is the biggest opportunity for product teams right now. Observability tells you *what happened*. Evals tell you *whether it was good*.

**Confidence: HIGH** -- These numbers come from LangChain's survey of 1,300+ industry professionals, the most comprehensive primary source available.

---

## Eval Maturity: Where Are You?

Most teams progress through four stages. Be honest about where you are -- it determines what tools you need.

| Stage | Description | What It Looks Like | Tool Needs |
|-------|-------------|-------------------|------------|
| **Stage 0: Vibes** | Manual spot-checks | "I tried it a few times and it seemed fine" | None (this is the problem) |
| **Stage 1: Test Sets** | Pass/fail criteria run on demand | Spreadsheet of 20-50 test cases, someone runs them manually before launch | Promptfoo, spreadsheet |
| **Stage 2: CI/CD Evals** | Automated evals block bad releases | Every prompt change triggers an eval suite in GitHub Actions | Braintrust, Promptfoo, LangSmith |
| **Stage 3: Flywheel** | Production data flows back into eval suite | Production failures automatically become test cases | Braintrust + observability tool, Langfuse |

**Key insight**: Most teams are stuck between Stage 0 and Stage 1. Getting from Stage 0 to Stage 1 delivers the highest ROI and requires the least tooling.

**Confidence: HIGH** -- Multiple sources (Braintrust, Hamel Husain's blog, Anthropic's guide) converge on this maturity model independently.

---

## Eval Platforms and Tools Compared

### Tier 1: Full Eval Platforms (eval-first, not just observability)

#### Braintrust
- **What it is**: End-to-end eval platform with offline testing, online scoring, CI/CD integration, and a no-code playground
- **Best for**: Teams that want one platform for everything -- especially if your PM wants to run evals without writing code
- **Key features**:
  - `Eval()` function takes 3 inputs: data (test cases), task (your AI logic), scores (grading functions)
  - Production traces become test cases with one click
  - GitHub Actions integration posts eval results directly on PRs
  - "Loop" AI agent automates dataset generation and prompt optimization
  - Playground UI lets PMs test prompt variants side-by-side without code
  - 25+ built-in scorers (Factuality, Relevance, etc.)
- **Pricing**:
  - Free: $0/month -- 1 GB storage, 10k scores, 14-day retention, unlimited users
  - Starter: Usage-based, no platform fee (new March 2026)
  - Pro: $249/month -- 5 GB, 50k scores, 30-day retention, priority support
  - Enterprise: Custom
- **PM-friendliness**: HIGH -- playground UI, no-code dataset management, visual experiment comparison
- **Confidence: HIGH** -- Primary source (braintrust.dev), pricing verified directly

#### LangSmith (by LangChain)
- **What it is**: Evaluation + observability platform, tightly integrated with LangChain/LangGraph
- **Best for**: Teams already using LangChain, or that want strong tracing + eval in one tool
- **Key features**:
  - Offline evals against curated datasets, online scoring of production traffic
  - Multi-turn agent evaluations (first-party concept as of late 2025)
  - LLM-as-judge, human annotation queues, pairwise comparison, custom evaluators
  - RAG-specific metrics (context precision, faithfulness)
  - pytest/Vitest integration, GitHub CI/CD
  - "Insights Agent" surfaces patterns from production data
- **Pricing**:
  - Developer (Free): 5,000 traces/month, 14-day retention, 1 seat
  - Plus: $39/seat/month, 10k base traces, up to 10 seats
  - Enterprise: Custom
  - Trace overage: $2.50/1k (base) or $5.00/1k (extended, 400-day retention)
- **PM-friendliness**: MEDIUM -- UI is decent but more developer-oriented than Braintrust. Annotation queues are good for human review workflows.
- **Gotcha**: Tightest integration is with LangChain. If you are NOT using LangChain, the value proposition weakens.
- **Confidence: HIGH** -- Primary source (langchain.com/pricing), well-documented

#### Galileo
- **What it is**: Eval platform specializing in hallucination detection at scale
- **Best for**: Teams where factual accuracy is critical (RAG apps, customer support, content generation)
- **Key features**:
  - ChainPoll: proprietary multi-model consensus method for hallucination detection, outperforms SelfCheckGPT, G-Eval, and TRUE
  - Luna: fine-tuned eval models that are 97% cheaper than using GPT-3.5 for evaluation ($175/month for 1M queries vs. $6,248 for GPT-3.5)
  - 20+ out-of-box evaluations for RAG, agents, safety
  - Evaluation Metrics (EFMs) that work without ground-truth data
- **Pricing**:
  - Free: 5,000 traces/month
  - Pro: ~$100/month
  - Enterprise: Custom
- **PM-friendliness**: MEDIUM -- UI is polished, but the value proposition is specialized (hallucination detection). If hallucination is your primary concern, this is the strongest option.
- **Confidence: MEDIUM** -- ChainPoll paper is published, Luna cost claims come from Galileo's own benchmarks. Independent verification limited.

#### Maxim AI
- **What it is**: End-to-end simulation, evaluation, and observability for agent systems
- **Best for**: Teams building multi-step agents that need pre-production scenario simulation
- **Key features**:
  - Agent simulation across thousands of scenarios
  - Visual execution graphs for agent workflows
  - Library of pre-built evaluators + custom (LLM-as-judge, statistical, programmatic, human)
  - Synthetic and multimodal dataset support
  - Playground++ for prompt engineering
- **Pricing**:
  - Free: 10k logs/month
  - Pro: $29/seat/month
  - Business: $49/seat/month
  - Enterprise: Custom
- **PM-friendliness**: HIGH -- visual tools, simulation UI, good for non-engineers
- **Confidence: MEDIUM** -- Limited independent reviews. Much of the information comes from their own content marketing.

#### Humanloop (SUNSET)
- **What it is**: Was an LLM evals platform for enterprises with strong prompt management
- **Status**: Humanloop joined Anthropic in mid-2025. The platform was sunset on September 8, 2025.
- **Relevance**: Some of Humanloop's thinking has influenced Anthropic's eval tooling direction, but the product itself is no longer available.
- **Confidence: HIGH** -- Confirmed on humanloop.com

### Tier 2: Developer-First Eval Tools (require some coding)

#### Promptfoo (now OpenAI)
- **What it is**: Open-source CLI + library for evaluating prompts, models, and RAG systems. Also includes red teaming / vulnerability scanning.
- **Status as of March 2026**: Acquired by OpenAI (announced March 9, 2026). Will remain open source under MIT license. Being integrated into OpenAI Frontier platform.
- **Best for**: Engineers and technical PMs who are comfortable with YAML config files and the command line
- **Key features**:
  - YAML-based config: define prompts, providers, test cases, and assertions in one file
  - Supports 60+ providers (OpenAI, Anthropic, Google, Ollama, etc.)
  - Red teaming: scans for 50+ vulnerability types (security, privacy, compliance, ethics)
  - Runs entirely locally -- no data sent anywhere
  - Web UI for results viewing (`promptfoo view`)
  - Visual setup wizard: `promptfoo eval setup` opens browser-based configuration
- **Getting started** (3 commands):
  ```bash
  npx promptfoo@latest init --example getting-started
  npx promptfoo@latest eval
  npx promptfoo@latest view
  ```
- **Minimal YAML config**:
  ```yaml
  prompts:
    - 'Translate to {{language}}: {{input}}'
  providers:
    - openai:gpt-4o
    - anthropic:messages:claude-sonnet-4-20250514
  tests:
    - vars:
        language: French
        input: Hello world
      assert:
        - type: contains
          value: 'Bonjour'
  ```
- **Pricing**: Free (open source, MIT license). No hosted service -- runs on your machine.
- **PM-friendliness**: MEDIUM -- YAML is approachable but not no-code. The visual setup wizard helps. Red teaming features are unique and valuable for security-conscious teams.
- **Risk factor**: OpenAI acquisition creates uncertainty. The commitment to keep it open source is stated, but long-term priorities may shift toward OpenAI Frontier integration.
- **Confidence: HIGH** -- GitHub repo has 5k+ stars, used by Fortune 500. Acquisition is confirmed.

#### DeepEval (by Confident AI)
- **What it is**: Open-source Python framework for LLM evaluation, designed to feel like pytest
- **Best for**: Python developers who want eval as part of their test suite
- **Key features**:
  - 50+ built-in metrics (Faithfulness, Hallucination, Answer Relevancy, Toxicity, Bias, etc.)
  - G-Eval framework for creating custom metrics in natural language
  - Synthetic dataset generation
  - Agent-specific metrics: Task Completion, Tool Correctness, Plan Quality, Step Efficiency
  - Integrates with OpenAI Agents, LangChain, CrewAI
  - Confident AI cloud platform for visualization (optional)
- **Pricing**: Free (open source). Confident AI cloud is paid (pricing on request).
- **PM-friendliness**: LOW -- requires Python and pytest knowledge. But the natural-language metric definition via G-Eval lowers the barrier for defining *what* to measure.
- **Confidence: HIGH** -- Active GitHub project (5k+ stars), solid documentation

#### RAGAS (Retrieval Augmented Generation Assessment)
- **What it is**: Open-source Python framework specifically for evaluating RAG systems
- **Best for**: Teams building RAG applications (search, Q&A over documents, knowledge bases)
- **Key features**:
  - Reference-free evaluation -- no ground truth needed for many metrics
  - Key metrics: Faithfulness, Answer Relevancy, Context Precision, Context Recall
  - Synthetic test data generation
  - Integrates with LangChain and major observability tools
  - Quick start via `ragas quickstart` CLI command
- **Pricing**: Free (open source)
- **PM-friendliness**: LOW -- requires Python. But the metrics concepts are straightforward for PMs to understand and request from engineers.
- **Confidence: HIGH** -- Published academic paper (arXiv 2309.15217), widely cited, production-tested

### Tier 3: Observability Platforms with Eval Features

These tools focus on tracing and monitoring but have added evaluation capabilities. They are NOT eval-first tools -- think of them as "observability + some eval."

#### Langfuse
- **What it is**: Open-source LLM engineering platform (tracing, evals, prompt management)
- **Best for**: Teams that want open-source observability with eval capabilities, or need self-hosting
- **Key features**:
  - Full tracing with LLM-specific context (tokens, costs, model params)
  - LLM-as-judge evals with execution tracing (see exactly how the evaluator worked)
  - Human annotation, user feedback collection
  - Prompt management and A/B testing
  - Datasets and experiments
  - Self-hostable (Helm/Kubernetes) or cloud
- **Pricing**: Free tier available; cloud pricing based on usage. Self-hosted is free.
- **PM-friendliness**: MEDIUM -- good UI for trace inspection and annotation, but setup requires engineering
- **Confidence: HIGH** -- Active open-source project (YC W23), widely adopted

#### Arize Phoenix
- **What it is**: Open-source AI observability and evaluation platform
- **Best for**: Teams that want a free, self-hosted observability+eval tool with no feature gates
- **Key features**:
  - Tracing at span level (see exactly where an app breaks)
  - Built-in LLM evaluators + integration with RAGAS, DeepEval, Cleanlab
  - Experiment tracking for prompt/model changes
  - Phoenix Evals library (hallucination, summarization, retrieval relevance)
  - Framework-agnostic, vendor-agnostic
- **Pricing**:
  - Phoenix (open source): Completely free, self-hosted, no feature gates, no usage limits
  - Arize cloud: From $50/month
  - Arize AX (enterprise on-prem): $50k-100k/year
- **PM-friendliness**: MEDIUM -- the UI is visual and accessible, but initial setup is engineering work
- **Confidence: HIGH** -- Open-source, well-maintained GitHub repo

#### W&B Weave (Weights & Biases)
- **What it is**: LLM observability and evaluation extension of the W&B ML platform
- **Best for**: Teams already using W&B for ML experiment tracking
- **Key features**:
  - Automatic tracing via `@weave.op` decorator
  - Evaluation framework with customizable scorers
  - Side-by-side experiment comparison
  - Direct integration with W&B Model Registry (audit trail)
  - Domain expert review in UI
- **Pricing**: Part of W&B pricing (free tier available, paid tiers for teams)
- **PM-friendliness**: LOW -- heavily developer-oriented
- **Confidence: MEDIUM** -- Solid platform but less focused on eval than Braintrust/LangSmith

#### Opik (by Comet)
- **What it is**: Open-source LLM evaluation and monitoring platform
- **Best for**: Teams wanting open-source tracing + eval with pytest integration
- **Key features**:
  - LLM-as-judge metrics for hallucination, moderation, RAG assessment
  - Pytest integration for "model unit tests"
  - Agent Optimizer for prompt/agent enhancement
  - Guardrails features
  - Production monitoring dashboards
- **Pricing**: Free (full open source). Comet cloud platform for additional features.
- **PM-friendliness**: LOW -- requires coding
- **Confidence: MEDIUM** -- Newer entrant, less independent validation

---

## Cost and Observability Tools

These tools are not eval-first but are critical for tracking the *cost and performance* side of your AI system, which is part of a complete eval picture.

| Tool | Focus | Key Feature | Pricing | Setup Effort |
|------|-------|-------------|---------|-------------|
| **Helicone** | Cost tracking + caching | Change one URL to start logging. 300+ model pricing database. | Free tier, open source | 5 minutes |
| **LiteLLM** | Unified API proxy + cost tracking | Budget limits per user/team/key. Works with 100+ providers. | Open source | Moderate |
| **Langfuse** | Tracing + cost | Token/cost tracking built into traces. Breakdowns by feature. | Free tier, self-hostable | Moderate |
| **Datadog LLM Observability** | Enterprise monitoring | Integrates with existing Datadog. Eval scores on traces. | Min 100k requests/month | Low (if on Datadog) |

**Key insight for PMs**: Cost tracking is the *easiest* eval to implement and delivers immediate value. If you are doing nothing else, track cost per request.

---

## Eval Metrics Reference

### Quality Metrics (what most people think of as "evals")

| Metric | What It Measures | When to Use | Method |
|--------|-----------------|-------------|--------|
| **Answer Relevancy** | Does the output address the input? | Any Q&A or chat system | LLM-as-judge |
| **Correctness** | Is the output factually right? | When you have ground truth | Comparison to reference |
| **Faithfulness** | Does the output stick to the provided context? | RAG systems | QAG scorer: extract claims, verify against context |
| **Hallucination** | Does the output fabricate information? | Any system where accuracy matters | SelfCheckGPT, ChainPoll, NLI scoring |
| **Toxicity** | Is the output offensive or harmful? | User-facing applications | BERT-based Detoxify models |
| **Bias** | Does the output show racial/gender/political bias? | User-facing, especially sensitive domains | LLM-as-judge with criteria |
| **Prompt Alignment** | Does the output follow specific instructions? | Structured output, branded content | Check each instruction separately |

### RAG-Specific Metrics

| Metric | What It Measures | Why It Matters |
|--------|-----------------|----------------|
| **Context Precision** | How well do relevant docs rank higher than irrelevant? | Bad ranking = good docs get buried |
| **Context Recall** | What fraction of the expected answer is supported by retrieved docs? | Low recall = your retrieval is missing key information |
| **Context Relevancy** | What fraction of retrieved content is actually relevant? | Low relevancy = you are stuffing the context with noise |

### Agent-Specific Metrics

| Metric | What It Measures | Why It Matters |
|--------|-----------------|----------------|
| **Task Completion** | Did the agent accomplish the goal? | The bottom line for any agent |
| **Tool Correctness** | Did the agent call the right tools? | Wrong tool = wrong result, even if output looks OK |
| **Step Efficiency** | Did the agent take unnecessary steps? | More steps = more cost, more latency, more failure points |
| **Plan Quality** | Is the agent's plan logical and complete? | Bad plans lead to cascading failures |

### Operational Metrics

| Metric | What It Measures | Target Range |
|--------|-----------------|-------------|
| **Latency (TTFT)** | Time to first token | Depends on use case; <2s for chat |
| **End-to-end latency** | Total response time | Depends on complexity |
| **Cost per request** | Tokens used x price per token | Track trend, not absolute |
| **Token efficiency** | Tokens used relative to output quality | Fewer tokens for same quality = better |
| **Error rate** | Failed requests / total requests | <1% for production |

**Confidence: HIGH** -- Metrics are well-documented across multiple frameworks (DeepEval, RAGAS, Braintrust, Confident AI).

---

## Real-World Eval Workflows

### How Good Teams Actually Run Evals

Based on blog posts from Braintrust, Anthropic, Hamel Husain (independent consultant), and the Pragmatic Engineer newsletter, here is what the actual workflow looks like at companies doing this well:

#### The Development Cycle

1. **Build a feature or change a prompt**
2. **Run your eval suite** (20-200 test cases) before merging
3. **Review results**: Did quality go up, down, or stay flat?
4. **If quality dropped**: Investigate which specific test cases regressed. Fix or accept the tradeoff.
5. **If quality improved**: Merge, deploy, monitor production.

#### The Production Flywheel

1. **Sample 1-5% of production requests** and run them through your eval scoring pipeline
2. **When you find a failure**: Add it to your test dataset
3. **Run the updated eval suite** against current and candidate changes
4. **Deploy improvements** and repeat

Braintrust's suggested weekly cadence for PMs:
- **Monday**: Review production traces; identify 20 problematic responses
- **Tuesday**: Convert those into 5 new eval cases
- **Wednesday**: Run full eval suite against current and candidate models
- **Thursday**: Data determines shipping decisions
- **Friday**: The flywheel accelerates

#### Anthropic's Recommended Starting Point

From Anthropic's engineering blog ("Demystifying Evals for AI Agents"):

1. Start with **20-50 tasks** from actual user failures (not hypothetical cases)
2. Convert manual testing procedures into test cases
3. Create reference solutions proving tasks are solvable
4. Build balanced problem sets (both positive and negative cases)
5. Design stable, isolated environments preventing cross-trial contamination
6. Read transcripts regularly to verify grader fairness

**Key quote**: "Automated evals work best combined with production monitoring, A/B testing, user feedback, transcript review, and systematic human studies. No single method catches all issues."

#### Hamel Husain's Three Levels (widely cited)

1. **Level 1 -- Unit Tests**: Break features into scenarios with clear assertions. Create test cases using synthetic data. Run frequently via CI/CD. This is the foundation.
2. **Level 2 -- Human + Model Evaluation**: Log all LLM interactions. Remove friction from data inspection. Start with binary good/bad labels (not 1-5 scales). Use LLMs as critique models, then calibrate against human judgments.
3. **Level 3 -- A/B Testing**: Deploy only after earlier validation stages confirm readiness. Similar to traditional A/B testing.

**Critical insight from Hamel**: "You are doing it wrong if you aren't looking at lots of data." The single highest-ROI activity is looking at actual outputs -- not building fancy automation.

**Confidence: HIGH** -- Multiple independent practitioners converge on these patterns.

---

## Building Your Golden Dataset

A golden dataset is your source of truth -- the curated collection of inputs, expected outputs, and evaluation criteria that you test against.

### Sizing Guidelines

| Stage | Size | Purpose |
|-------|------|---------|
| Getting started | 20-50 examples | Catch obvious failures |
| Production-ready | 200-500 examples | Cover major use cases + edge cases |
| Mature system | 1,000+ examples | Comprehensive coverage with regular additions |

### What Each Entry Contains

- **Input**: The query or prompt
- **Expected output**: The correct or ideal response (human-validated)
- **Metadata**: Category, difficulty level, intent
- **Evaluation criteria**: What dimensions matter for this case

### Where to Get Test Cases

1. **Production logs**: Extract representative real interactions (with privacy filtering)
2. **User research**: Collect actual prompts users submit
3. **Domain expert authoring**: SMEs write must-pass scenarios
4. **Red team/adversarial cases**: Deliberately try to break the system
5. **Synthetic generation**: Use an LLM to generate variations of golden examples

### Maintenance Rules

- **Version control** your dataset alongside your prompts
- **Continuously add** production failure cases
- **Retire saturated tests** (when pass rate hits 100%, the test no longer provides signal)
- **Update content** as your product scope changes

**Confidence: HIGH** -- Consistent guidance across Maxim AI, Arize, Confident AI, and practitioner blogs.

---

## Eval-Driven Prompt Iteration

### The Core Loop

```
Change prompt --> Run eval on fixed dataset --> Compare scores to previous version --> Ship or iterate
```

This replaces the "I tried it a few times and it seemed fine" approach with repeatable, measurable comparison.

### A/B Testing Prompts

**No-code approach** (Braintrust Playground):
1. Create multiple prompt variants in the UI
2. Add scorers (built-in or custom)
3. Link a dataset of 20-50 representative inputs
4. Click Run -- variants execute in parallel
5. Compare quality scores, latency, cost, and token usage for each variant

**Code approach** (Promptfoo):
```yaml
prompts:
  - file://prompt_v1.txt
  - file://prompt_v2.txt
providers:
  - anthropic:messages:claude-sonnet-4-20250514
tests:
  - vars: { query: "What's your return policy?" }
    assert:
      - type: llm-rubric
        value: "Response should be concise and mention 30-day window"
```

### Sample Sizes

Start with **20-50 representative examples**. Quality matters more than quantity. "Well-chosen test cases that reflect real usage provide better signals than large collections of artificial examples" (Braintrust).

### What to Measure When Comparing Prompts

1. **Task accuracy**: Does it answer correctly?
2. **Output quality**: Is the format/tone/style right?
3. **Response speed**: Latency per variant
4. **Cost per request**: Token usage differences
5. **Consistency**: Does it work on edge cases too, or did you improve one thing and break another?

**Key warning**: "Adding an example might improve one scenario while breaking another." Always test on your full dataset, not just the case you're trying to fix.

**Confidence: HIGH** -- Established practice, documented by multiple platforms.

---

## The PM Eval Playbook

### If You Are Starting From Zero

**Week 1: Define "good"**
- Pick your most important AI feature
- Write down 10 examples of good output and 10 examples of bad output
- This IS your first eval dataset

**Week 2: Run your first eval**
- Option A (no code): Use Braintrust Playground -- paste your prompt, add your test cases, add a built-in scorer, click Run
- Option B (light code): `npx promptfoo@latest init`, edit the YAML, `npx promptfoo@latest eval`
- Option C (spreadsheet): Manually run your 20 test cases through the AI, score them pass/fail, track in a sheet. This is low-tech but it works.

**Week 3: Make it a habit**
- Run the eval before any prompt change ships
- Add 2-3 new test cases each week from production failures
- Start a weekly "eval review" with your team

**Week 4: Automate**
- Set up Braintrust or Promptfoo in CI/CD so evals run on every PR
- Now you cannot ship a regression without seeing it

### What PMs Should Own

According to Braintrust and multiple practitioner blogs, PMs should own:
1. **Success criteria**: What does "good" mean for each feature?
2. **Dataset curation**: Which test cases matter? (This is a product decision, not an engineering one.)
3. **Rubric design**: What dimensions are we scoring on?
4. **Labeling samples**: PMs should label at least some data themselves
5. **Result analysis**: What patterns do the failures show? What hypothesis should we test next?

PMs should NOT need to own:
- Infrastructure setup
- CI/CD integration
- Custom scorer implementation
- Production monitoring plumbing

### The "Evals Are the New PRD" Framing

Braintrust's argument (compelling for AI products):

Traditional PRDs fail for AI because output is non-deterministic. You cannot write a spec that says "the model should be helpful and concise" and verify it. But you CAN write an eval that tests whether specific inputs produce outputs meeting specific, measurable criteria.

Evals combine:
- **Specification**: Define desired behavior through test scenarios
- **Acceptance criteria**: Establish measurable quality rubrics
- **Roadmap**: Set regression thresholds and improvement targets

Instead of writing a PRD, the PM defines: "Here is the eval. Make this number go up."

**Who would disagree**: Traditional PMs who see their role as writing specifications, not running tests. Engineers who think evaluation is their domain. The counter-argument is that evals without strategic context (user needs, market positioning, roadmap priorities) become optimization without direction. Both perspectives have merit.

---

## Limitations and Counter-Arguments

### The Case Against Over-Investing in Evals

**1. Benchmark saturation creates false confidence.**
High scores on evals do not mean your system works well in production. Models that ace benchmarks "may still stumble when faced with the messy, context-rich, and often ambiguous scenarios encountered in production." HumanEval and GSM8K are already saturated -- top models score near-perfect, making them useless for differentiation.

**2. LLM-as-judge has real limits.**
LLM judges reach ~80% agreement with humans, which is roughly human-human agreement. But for domain-specific tasks, agreement drops to 64-68%, well below expert baselines. Over-reliance on automated evaluation "can mask important failure modes, introduce new biases, and ultimately lead to overconfidence."

**3. Generic metrics create a false sense of security.**
Off-the-shelf "helpfulness scores" and "hallucination scores" often do not correlate with actual user satisfaction. The Pragmatic Engineer guide explicitly warns: "Avoid off-shelf metrics -- generic hallucination scores often don't correlate with actual user needs."

**4. The cost of eval infrastructure.**
Building and maintaining eval suites takes time. Small teams may get more value from simply reading 50 outputs per week than from building automated eval pipelines.

### The Steel-Man Counter-Argument

**"Just look at the outputs."** For early-stage products with low traffic, manually reviewing outputs is faster, cheaper, and more insightful than any automated eval. The ROI of eval infrastructure scales with traffic and team size. A solo PM with 100 users/day should spend time reading outputs, not building eval pipelines.

**What would change this**: If the product has more than ~1,000 AI interactions per day, or if multiple people need to make prompt changes independently, manual review breaks down and automation becomes necessary.

---

## What Changes in 12 Months

1. **OpenAI's Promptfoo acquisition** will likely tighten integration with OpenAI's ecosystem. If you use non-OpenAI models, watch for provider support changes. The commitment to remain open-source and model-agnostic is stated but unproven over time.

2. **Humanloop's absorption into Anthropic** may produce Anthropic-native eval tooling. Worth watching the Anthropic developer platform for new eval features.

3. **Eval tooling consolidation**: The market has 15+ tools doing overlapping things. Expect acquisitions and shutdowns. Bet on tools with either (a) strong open-source communities or (b) deep platform integration (Braintrust, LangSmith).

4. **Agent evals become the bottleneck**: As agent systems get more complex (multi-step, tool-using, long-running), eval becomes harder. Tools that can simulate multi-turn agent scenarios (Maxim, LangSmith's multi-turn evals) will gain advantage.

5. **Cost of LLM-as-judge drops**: Galileo's Luna models show the trend -- specialized, fine-tuned eval models that cost 97% less than using general-purpose LLMs as judges. This makes automated evals accessible to small teams.

6. **"Vibes to evals" becomes mandatory**: As AI features become table-stakes, quality differentiation requires measurement. The 52% eval adoption rate will climb rapidly.

**Confidence: MEDIUM** -- Trend extrapolation from current data. Specific timelines are uncertain.

---

## Gaps and Uncertainties

1. **Independent pricing verification**: Most pricing comes from the platforms themselves. Actual costs (overage charges, hidden fees) are hard to verify without using the tools.

2. **Maxim AI independent validation**: Most of the evidence for Maxim's capabilities comes from their own content marketing. Independent reviews are sparse.

3. **Promptfoo post-acquisition trajectory**: The OpenAI acquisition is less than a month old. How the open-source project evolves under OpenAI ownership is genuinely unknown.

4. **Real-world eval ROI data**: No source provides concrete data on "we invested X hours in eval infrastructure and it saved Y in production incidents." The ROI case is argued logically but not empirically quantified.

5. **Small team eval patterns**: Most guidance targets mid-to-large teams. Practical patterns for 1-3 person teams building AI products are under-documented.

6. **Non-English eval tooling**: Almost all tools and metrics are English-first. Evaluation of multilingual AI outputs is poorly covered.

7. **Multimodal evals**: Evaluation of image, audio, and video outputs (as opposed to text) is a growing need but tooling is immature. Galileo and Maxim claim multimodal support but details are thin.

8. **Claude Code specific eval integration**: While Anthropic has published eval guidance and Claude Code supports skill evaluation (`run_eval.py`, `run_loop.py` with `--holdout` flags for train/validation splits), there is no first-party "Anthropic Eval Platform" comparable to what OpenAI is building with Promptfoo.

---

## Sources

### Primary Sources (direct from tool makers or original research)

- [Braintrust: How to Eval](https://www.braintrust.dev/articles/how-to-eval) -- Primary documentation of the Eval() framework
- [Braintrust: Evals for PMs](https://www.braintrust.dev/blog/evals-for-pms) -- PM-specific eval workflow guide
- [Braintrust: Evals Are the New PRD](https://www.braintrust.dev/blog/evals-are-the-new-prd) -- Argument for eval-driven product development
- [Braintrust: Pricing](https://www.braintrust.dev/pricing) -- Pricing tiers (verified March 2026)
- [Braintrust: A/B Testing LLM Prompts](https://www.braintrust.dev/articles/ab-testing-llm-prompts) -- Practical A/B testing guide
- [Braintrust: Best AI Evaluation Tools 2026](https://www.braintrust.dev/articles/best-ai-evaluation-tools-2026) -- Tool comparison (note: Braintrust-authored, potential bias)
- [Braintrust: Starter Plan Announcement](https://www.braintrust.dev/blog/starter-plan) -- March 2026 pricing update
- [LangSmith: Evaluation Platform](https://www.langchain.com/langsmith/evaluation) -- Official feature documentation
- [LangSmith: Pricing](https://www.langchain.com/pricing) -- Pricing tiers
- [LangChain: Insights Agent and Multi-turn Evals](https://blog.langchain.com/insights-agent-multiturn-evals-langsmith/) -- October 2025 feature release
- [LangChain: State of AI Agents 2026](https://www.langchain.com/state-of-agent-engineering) -- Survey of 1,300+ professionals
- [Promptfoo: Getting Started](https://www.promptfoo.dev/docs/getting-started/) -- Setup documentation
- [Promptfoo: GitHub](https://github.com/promptfoo/promptfoo) -- Open-source repository
- [Promptfoo: Joining OpenAI](https://www.promptfoo.dev/blog/promptfoo-joining-openai/) -- Acquisition announcement
- [OpenAI: Promptfoo Acquisition](https://openai.com/index/openai-to-acquire-promptfoo/) -- Official announcement (March 9, 2026)
- [Arize Phoenix: GitHub](https://github.com/Arize-ai/phoenix) -- Open-source repository
- [Arize Phoenix: What is Phoenix](https://docs.arize.com/phoenix) -- Documentation
- [Arize Phoenix: Pricing](https://phoenix.arize.com/pricing/) -- Free self-hosted, cloud pricing
- [Langfuse: Evaluation Overview](https://langfuse.com/docs/evaluation/overview) -- Evaluation documentation
- [Langfuse: GitHub](https://github.com/langfuse/langfuse) -- Open-source repository (YC W23)
- [DeepEval: Getting Started](https://deepeval.com/docs/getting-started) -- Framework documentation
- [DeepEval: Metrics Introduction](https://deepeval.com/docs/metrics-introduction) -- Metric catalog
- [DeepEval: GitHub](https://github.com/confident-ai/deepeval) -- Open-source repository
- [RAGAS: Documentation](https://docs.ragas.io/) -- RAG evaluation framework
- [RAGAS: Available Metrics](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/) -- Metric reference
- [RAGAS: arXiv Paper](https://arxiv.org/abs/2309.15217) -- Original academic paper
- [Galileo: ChainPoll Documentation](https://docs.galileo.ai/galileo-ai-research/chainpoll) -- Hallucination detection method
- [Humanloop: Joining Anthropic](https://humanloop.com/) -- Sunset announcement
- [Anthropic: Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) -- Anthropic's eval engineering guide
- [W&B Weave: Documentation](https://docs.wandb.ai/weave) -- Evaluation framework docs
- [Opik by Comet: GitHub](https://github.com/comet-ml/opik) -- Open-source repository
- [Maxim AI: Platform](https://www.getmaxim.ai/) -- Platform overview
- [Evidently AI: Open Source LLM Evaluation](https://www.evidentlyai.com/blog/open-source-llm-evaluation) -- Framework documentation

### Practitioner and Analysis Sources

- [Hamel Husain: Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/) -- Practitioner guide (widely cited)
- [Pragmatic Engineer: A Pragmatic Guide to LLM Evals for Devs](https://newsletter.pragmaticengineer.com/p/evals) -- Developer-focused eval guide
- [Datadog: Building an LLM Evaluation Framework](https://www.datadoghq.com/blog/llm-evaluation-framework-best-practices/) -- Enterprise eval best practices
- [Product School: AI Evals for Product Managers](https://productschool.com/blog/artificial-intelligence/ai-evals-product-managers) -- PM-focused guide
- [Mind the Product: How to Implement Effective AI Evaluations](https://www.mindtheproduct.com/how-to-implement-effective-ai-evaluations/) -- Implementation guide
- [Confident AI: LLM Evaluation Metrics Guide](https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation) -- Comprehensive metrics reference
- [Claude Code Eval Loop](https://www.mager.co/blog/2026-03-08-claude-code-eval-loop/) -- Skill evaluation workflow
- [LangChain: LLM-as-Judge Calibration](https://www.langchain.com/articles/llm-as-a-judge) -- Judge calibration best practices
- [TechCrunch: OpenAI Acquires Promptfoo](https://techcrunch.com/2026/03/09/openai-acquires-promptfoo-to-secure-its-ai-agents/) -- Acquisition reporting
- [Helicone: Monitor LLM Costs](https://www.helicone.ai/blog/monitor-and-optimize-llm-costs) -- Cost monitoring guide
- [Traceloop: Token Cost Tracking](https://www.traceloop.com/blog/from-bills-to-budgets-how-to-track-llm-token-usage-and-cost-per-user) -- Per-user cost tracking
- [Galileo: Luna Cost Comparison](https://venturebeat.com/ai/galileos-luna-redefines-genai-evaluation-boasting-97-lower-costs-and-11x-faster-speeds/) -- VentureBeat reporting on Luna
- [PromptLayer: A/B Testing Prompts](https://blog.promptlayer.com/you-should-be-a-b-testing-your-prompts/) -- A/B testing methodology
- [Langfuse: A/B Testing](https://langfuse.com/docs/prompt-management/features/a-b-testing) -- A/B testing documentation
- [Ian Webster: LLM Eval Tools Spreadsheet](https://www.ianww.com/llm-tools) -- 50+ tool comparison spreadsheet
