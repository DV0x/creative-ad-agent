# How agent companies build in 2026, how ad-creative companies build, and the eval landscape

**Date:** 2026-09-06
**Why this exists:** to freeze ONE loop that powers the ad-creative engine now and other agents later, with the best eval support, and to stop the framework question for good.
**Method:** three parallel research passes (YC and AI-native agent stacks; ad-creative company pipelines; evals tooling and image-grading methods), plus direct verification of Mastra's eval layer and eve, pi, Pydantic AI, and the Vercel AI SDK earlier the same day. Every claim below is marked VERIFIED (cited) or INFERRED.

---

## 0. The decision, in one paragraph

Freeze on **Mastra (TypeScript)** for the engine and the chat layer, the **Vercel AI SDK** stream to the React client, **any model per stage** through Mastra's router, and **Mastra's own scorers, datasets and experiments** as the inner eval loop with **Langfuse** as the OpenTelemetry sink for traces and human review. Render stays plain code. The image-grading rig is ours: a rubric decomposed into binary checks, a vision judge from a different model family than the writer, a verbatim numeral check, a brand-similarity and native-look gate, and claim grounding against the brand's facts. Sections 1 to 3 are the evidence. Section 4 is the freeze and the rules that keep it frozen.

---

## 1. How YC and AI-native companies build agents

### 1.1 The numbers (VERIFIED)

| Fact | Number | Source |
|---|---|---|
| YC Spring 2025 startups that were agent companies | 67 of 144, 46% | PitchBook, 2025-06-11 |
| Practitioners with agents in production | 57.3%, up from 51% | LangChain State of Agent Engineering 2026, n=1,340, surveyed Nov to Dec 2025 |
| Have observability vs have evals | 89% vs 52% | same |
| Top production barrier | Quality, 32% | same |
| Engineers using agents daily | 80.8%, median 5 agents each | Temporal State of Development 2026, n=550+, Apr to May 2026 |
| Leaders reporting measurable ROI from agents | 80% | Anthropic + Material, State of AI Agents 2026, n=500+ |

Two quotes that frame everything. LangChain: "using multiple models is the norm." Temporal: "the teams pulling ahead solved for state, cost, and reliability."

### 1.2 Which layer, which companies (VERIFIED unless marked)

| Layer | Named users | Evidence |
|---|---|---|
| Vercel AI SDK | 20M+ monthly npm downloads; Perplexity, Jasper, v0, Thomson Reuters CoCounsel; base layer under Mastra | vercel.com/blog/ai-sdk-6; leadcognition.io |
| Mastra (YC W25) | $22M Series A Apr 2026; Brex Agent 3 (thousands of sandboxes a day), Fireworks, MongoDB (50k runs a month), a Salesforce agentic IDE on non-Claude models, Replit, PayPal | mastra.ai; latent.space/p/brex; ycombinator.com/companies/mastra |
| LangGraph | ~400 enterprise platform deployments: Klarna, Uber, LinkedIn, JPMorgan; 349 open roles name it | uvik.net; agentic-engineering-jobs.com |
| Claude Agent SDK | Vega Security, Wondr Health, Notability, Eve Legal, Dust | claude.com/programs/startups |
| OpenAI Agents SDK | ~10.3M monthly downloads; 100+ models via adapter | uvik.net |
| Pydantic AI | Dosu (54 agents, 697k runs), Qualio, MindsDB, Datalayer | pydantic.dev/case-studies |
| Durable execution | Temporal (reference layer); Inngest at Cohere's Otto, Resend, GitBook, Replit, ElevenLabs | inngest.com/customers |
| Sandboxes | E2B under Rivet (W23), Scott AI (W25), Manus, Genspark; Modal at Lovable, Quora; Daytona at LangChain, Mintlify, Mastra, Clay | e2b.dev/blog/yc-companies-ai-agents 2026-03-02; modal.com; daytona.io |
| Evals and observability | Langfuse (YC W23, MIT, self-host) and Braintrust (framework-agnostic, eval-first) dominate citations | langfuse.com; braintrust.dev |
| Tool protocol | MCP: 200+ servers, Linux Foundation stewardship, adopted by OpenAI and Google; mcp-use (YC S25) 170k downloads | morphllm.com 2026-06; r/mcp |

### 1.3 The patterns

- **Hybrid, not framework-or-nothing.** Most teams use a framework where the work is standard and custom code where they differentiate (Anthropic and Material report). The frontier products, Cognition's Devin, Decagon, Sierra, are bespoke and explicitly do not use LangGraph or CrewAI.
- **Multi-model by design at the top.** Decagon runs a network of small fine-tuned models, one per job. Sierra's "constellation of models" composes retrieval, classification, tools and policy from different models under one supervisor that checks output before it ships. Provider-native SDKs pull the other way, which is why teams reach for OpenRouter or a gateway.
- **Durable execution is the infrastructure layer that is still catching up.** Temporal, Inngest, and Vercel Workflow all grew in 2026. Inngest's pitch, "durability belongs in code, not new infrastructure," won consumer-facing teams that did not want a Temporal cluster.
- **Sandboxes are the throughline.** E2B's summary of the 2025 to 2026 YC batches: "everything comes down to writing and running code in an isolated sandbox."
- **Observability is solved, evals are not.** 89% versus 52%. Quality is now the production killer.
- **Harness-shaped versus workflow-shaped is unresolved.** Claude Agent SDK and eve on one side, Mastra and LangGraph on the other. Both camps added features in 2026 rather than converging.

### 1.4 Six architectures worth knowing

1. **Cognition, Devin.** A stateless cloud "brain" separated from a containerized devbox. Parallel child agents. Routine checks routed to smaller models. fast.io, Jul 2026.
2. **Decagon.** In-house research arm trains small specialized models, one for end-of-speech, one for workflow execution, one for hallucination detection, SFT then RL. Model-independent by design. decagon.ai/blog, Nov 2025 and May 2026.
3. **Sierra.** Composable isolated task abstractions plus a real-time supervisor that checks scope and policy before responding. Ships its own SDK for "agent engineers." sierra.ai/blog/constellation-of-models, May 2026.
4. **Browser Use.** Deliberately un-abstracted. Dropped Playwright for raw CDP, built its own LLM gateway for a 6x latency cut, and published "The Bitter Lesson of Agent Harnesses" arguing against wrapping the model at all. browser-use.com/posts, 2026.
5. **Mastra.** Workflows with suspend and resume, memory, RAG, evals and tracing on top of the AI SDK. Used as a product by 100k+ developers and as infrastructure by other startups. mastra.ai.
6. **E2B.** Firecracker micro-VMs under Rivet's Sandbox Agent SDK, Manus, and Genspark. e2b.dev, Mar 2026.

### 1.5 Trending

- **Up:** MCP as the default tool connection. Evals in CI as the expected bar. Model-agnostic architecture at the most sophisticated companies.
- **Flat or down:** fine-tuning adoption is flat despite agent growth. Vibe coding without an eval loop is being called out by name.
- **Unverified, flagged:** claims that "35% of YC W26 is agent-native" and that YC open-sourced a multiplayer harness called QM come from one aggregator site and could not be confirmed against YC or PitchBook.

---

## 2. How ad-creative companies build

Public material is thin: marketing pages, not engineering blogs. This section marks company claims as VERIFIED (the company said it) and third-party analysis as INFERRED.

### 2.1 The table

| Company | Pipeline shape | Models | Framework named | Eval or quality method | Learns per brand |
|---|---|---|---|---|---|
| Pencil (Brandtech) | Brand assets in, multi-model generation, outcome score, launch to Meta | Model-agnostic: OpenAI, Google, Adobe, Runway, Bria | Proprietary "Pencil Pro" | Outcome score trained on a claimed $1B of spend across 4,000 brands, unaudited | Yes, enterprise ring-fenced per-client model |
| AdCreative.ai (Appier) | Brand kit and ad-account connect, template or generative fill, Creative Scoring | Proprietary | Not disclosed | "Creative Scoring" CNN, claims over 90% accuracy, unaudited. One independent 30-day test (n=22) found roughly a 2x CTR gap between score tiers, not 90% accuracy | Yes, from connected ad-account data |
| Creatify | URL to video; node-based "AdFlow" editor, model-swappable per node | Nano Banana, Kling, Seedance, user's choice | Proprietary node graph | Ad performance data guides variant iteration; no scoring model disclosed | Workflow-level winner feedback |
| Omneky | Brief to 50 to 500 variants, automated brand check, performance score, launch, pattern mining | "Brand LLM" for copy | Not disclosed | Pre-launch score, method undisclosed | "Perpetual improvement loop," claimed |
| Vidmob | Ingest media, computer-vision tagging, rules engine PASS or FAIL against client guidelines | Not a generator | AWS, Google Vision, SageMaker, named | The most transparent method in the survey: CV tags plus guideline-weighted rules, then correlated with media results | Reporting only |
| Jasper | Brand ingestion, proprietary compositing places the real product in new scenes | Own models | Own "Arc" stack | "Automated brand governance," no score disclosed | Not disclosed |
| Canva | One input routed to five engines | Proprietary foundation model, Leonardo Phoenix, Runway Gen-3 | Proprietary router | Brand-kit consistency only | Learns brand kit from assets, in-context |
| Adobe GenStudio | Brief to Content Production Agent to Firefly APIs to ad platforms | Firefly; Firefly Foundry custom per enterprise | Adobe agent plus AEM | C2PA provenance, not quality | Yes, custom-trained model per enterprise |
| Google Pomelli | Crawl site to "Business DNA" to campaign ideas to assets | Gemini, implied | Google internal | None disclosed | Not disclosed |
| Meta Advantage+ and Muse | Human creative in, AI variations and backgrounds, Muse image layer | Muse, proprietary | Meta delivery stack | None separate; optimization lives in the auction | Platform-wide, implicit |
| Icon.com | Scans brand, competitors, reviews, ad account; "Competitor Clone," "New Concept," "Winner Iteration" | Not disclosed | Not disclosed | Winner iteration implies performance selection; no method | Implied |
| makelocalads | URL to strategy tree to batch on Nano Banana 2, GPT-Image 2, or Seedream 4.5 | Multi-model, user's choice | Not disclosed | Publishes its own model comparisons; no fabrication check or independent judge, consistent with our teardown | Not disclosed |
| Superside AI | Brief plus "Brand Brain" to AI production to mandatory human creative-director review | Custom "AI Brand Models" per client | Internal tooling | Human is the final gate, explicitly | Brand Brain accumulates feedback per account |
| Photoroom | Product photo in, proprietary fidelity-preserving models plus external models | Proprietary plus gpt-image-2 | Own multi-model layer | "Enterprise Guarantee": customer pays only for images that pass agreed fidelity criteria | Not disclosed |
| Krea 2 | Foundation model, not an ad product | Own DiT, Qwen 3 VL encoder | torchtitan, FSDP2, Megatron | RL with four reward models plus a per-prompt rubric reward that decomposes the prompt into verifiable requirements | Not applicable |
| Monks | Insights to creation to delivery via Monks.Flow | NVIDIA NIM-hosted, Runway | NVIDIA NIM on Kubernetes, named | Claims 2.8x acceleration, unaudited | Not disclosed |
| Stagwell | Propellers, CUE, SmartAssets on Google Cloud | Gemini via Vertex | Vertex AI, BigQuery, Cloud Run, named | SmartAssets performance feed, undisclosed | Implied |
| Lapis | Crawl, brand extraction, personas, generation, sizing, performance forecast | Diffusion, unnamed | Not disclosed | "Performance forecasting," methodology undisclosed | "Self-improving," claimed |

No public material was found for Creyaa, Jellyfish, or Higgsfield's own pipeline.

### 2.2 What almost everyone does

Ingest a brand kit or URL, run generative or template calls, auto-resize for platforms, and call it "on-brand at scale." Brand-consistency enforcement is the single most universal claim, and in nearly every case the mechanism is undisclosed.

### 2.3 What few do

- **Disclose a real eval mechanism.** Only Vidmob (rules plus computer vision) and Krea (RL reward models with a decomposed rubric) show methodology.
- **Train a per-client model.** Pencil, Adobe Firefly Foundry, and Superside, all enterprise-only, all one-time training on a client corpus.
- **Name real infrastructure.** Only Monks and Stagwell name a stack. **No ad-creative generator names LangGraph, Mastra, an agents SDK, Temporal, or ComfyUI as part of its product.** Those appear only in third-party DIY tutorials.

### 2.4 What nobody does, on the public record

- A dedicated **claims or fabrication checker** verifying generated copy against real product facts.
- An **independent audit** of any "performance prediction" or "creative score."
- **Learning from a human's edit to a specific generation.** Every learning-loop claim is either aggregate ad-account data retraining a scoring layer, or a one-time enterprise custom model.

### 2.5 What the "performance-trained" claims rest on

Pencil: a claimed $1B of spend, unaudited. AdCreative.ai: a CNN and a 90% claim, unaudited, with one independent test showing a much weaker signal. Vidmob: not a prediction at all, a compliance score later correlated with results. Krea: reward models trained on a synthetic preference-pair pipeline whose dataset is unpublished. In short, every performance-prediction claim in the category is a vendor assertion, the only transparent scorer is a compliance auditor, and the only transparent generative eval method is not built for ads.

### 2.6 What this means for us

Our three claims, a truth layer with sources and a forbidden list, an independent judge, and a ledger that learns from founder edits, are unoccupied on the public record. The scorecard we plan is the first independent audit of the category. Krea's decomposed rubric reward is the same idea as our binary floor checks, applied to model training instead of output review, which is a good sign we are grading the right way.

---

## 3. The eval landscape

### 3.1 Platforms (VERIFIED unless marked)

| Platform | Language | Framework fit | Trace to dataset to eval | Judge | Human review | CI gate | Online | Solo-dev cost | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Braintrust | Py, TS, Go, Ruby | Any via OTel; official `@mastra/braintrust` exporter dated 2026-08-20; Claude Agent SDK, OpenAI Agents SDK, AI SDK | One-click "production traces become evals" | LLM, code, human | Annotation plus a "Loop" agent that writes scorers | Yes | Yes | ~10k scores free, then ~$2.50 per 1k, INFERRED from third parties; official pricing sales-gated | Notion, Dropbox, Coursera; Vercel's CTO uses it |
| Langfuse | Py, TS, any via OTel | First-class AI SDK exporter; Claude Agent SDK via OpenInference; Mastra exporter | Yes | Yes | Scores and comments | Documented | Yes | MIT, self-host free; cloud free tier | YC W23; the open-source observability leader |
| LangSmith | Py, TS | LangChain and LangGraph native | Yes | Yes incl. pairwise | Annotation queues | Yes | Yes | ~5k traces free, INFERRED | Rides LangChain's base |
| Pydantic Evals plus Logfire | Python | Pydantic AI native; any OTel | Yes | Yes | Logfire UI | Yes | Yes | Free SDK, Logfire free tier | Python only |
| Mastra scorers | TypeScript | Mastra native | Datasets to `startExperiment()`, Studio | Built-in library plus custom | Studio panel plus feedback storage | Via CLI or API | Live sampled scoring | Free, bundled | Newest; see 3.4 |
| Arize Phoenix | OTel, 26+ Python and 11+ TS integrations | Mastra, AI SDK, Claude Agent SDK, ADK | Versioned datasets and experiments | Ready-made evaluators | Basic | Documented | Managed tier | Free OSS, local-first | 10k stars Jun 2026 |
| DeepEval and Confident AI | Python and TypeScript | Native Mastra and AI SDK integrations, plus LangGraph, Pydantic AI, ADK | pytest-style | G-Eval and others | Dashboard, MCP server | Any CI | Yes | Apache 2.0 framework, paid cloud | 18k stars, 500+ companies |
| W&B Weave | Python-first | ML ecosystem | Yes | Scorers | Basic | Documented | Basic | Free personal, $60 Pro | Small footprint |
| Humanloop | Py, TS | OpenAI Agents SDK | Yes | Yes | Strong | Yes | Yes | Enterprise-gated | "Joining Anthropic," 2026 |
| Promptfoo | Py, TS, CLI | Any | Basic | Yes | Limited | Core use | Limited | Free OSS | CI and red-team |
| OpenAI Evals API | REST | Any | Yes | Yes | Limited | Yes | No | Usage-billed | **Read-only 2026-10-31, shut down 2026-11-30. Do not build on it.** |

### 3.2 Grading generated ad images: what works (VERIFIED)

- **Reference-free vision judge is the dominant pattern.** Send a vision model the rubric and the image and score alignment directly, since there is no single correct image. LangWatch, AWS Strands Evals, and Future AGI ship this as a built-in evaluator. Vendor caveat, consistent with the papers: reliable for coarse alignment such as "is the product present," weaker at fine perception such as counting small details.
- **The academic grounding.** MLLM-as-a-Judge (ICML 2024, arXiv 2402.04788) established the paradigm and documented systematic vision-judge bias. EVALALIGN (arXiv 2406.16562) built human-aligned reference-free scoring for prompt faithfulness. GPT-ImgEval (arXiv 2504.02782) named "inconsistency," unwanted changes when none were requested, a top failure of image editing, which is exactly the product-fidelity risk in our pipeline.
- **A calibration recipe to copy.** A May 2026 rubric paper (arXiv 2604.02406) used GPT-4o as judge with per-criterion rubric prompts, ran five passes per image because judging is stochastic, and separately measured human inter-annotator agreement.
- **Text in images is still broken across the board.** OCRGenBench (arXiv 2507.15085): 1,060 human-annotated triplets, 19 current models, most under 60 out of 100 on rendered-text accuracy. A verbatim numeral and headline check on every ad that carries a price, stat, or offer is mandatory, not optional.
- **Brand consistency and native look.** CLIP embeddings score brand similarity, and a frozen CLIP embedding plus a small classifier detects AI-generated images at ~95% on CIFAKE and ~85% few-shot on a custom set (arXiv 2505.10664). That is a cheap "does this still look native" gate.
- **Claim grounding.** Google Cloud's Check Grounding API does sentence-level entailment against a supplied fact set in under 500ms. Typeface, Pixis, Stability Brand Studio, and Playad claim proprietary grounding but publish no method, INFERRED low confidence.
- **No ad-specific human-rating tool exists.** Human review happens in the general platforms' annotation UIs.

### 3.3 What practitioners agree on (VERIFIED)

1. **Error analysis before any evaluator.** Hamel Husain and Shreya Shankar, hamel.dev updated July 2026 and the forthcoming O'Reilly book: skipping error analysis is the number one mistake. Our May 2026 open coding of 24 campaigns was this step.
2. **Binary pass or fail over Likert.** 1 to 5 scales produce hedging and need bigger samples. Our floor checks are already binary.
3. **Similarity metrics are not evals.** Use them to surface traces, never as the grade.
4. **Calibrate the judge continuously.** Judges drift as models change. Galileo, May 2026. Mastra experiments can target a scorer to measure it against ground truth, which is exactly this.
5. **Use an independent judge model.** Self-preference bias is measured: GPT-4 rates its own outputs higher even unprompted (arXiv 2410.21819). Our S118 conclusion, independently confirmed.
6. **CI gates and online evals are both expected**, and the threshold is a team decision, never a platform default.

### 3.4 Mastra's eval layer, verified directly against the docs

- `createScorer` with a separate judge model. A four-step pipeline, preprocess, analyze, generateScore, generateReason, where each step is plain code or an LLM prompt with a Zod output schema.
- Datasets with versioning, schema enforcement, and CSV or JSON import.
- Experiments that target an agent, a workflow, or a scorer itself, so judge accuracy against human labels is a first-class run. Results persist and compare across prompts, models, and code changes.
- Live scoring with deterministic sampling per trace, filters by request context, and scoring of historical traces in Studio.
- Human feedback, ratings, comments, and corrections, stored against traces and spans.
- Exporters: Mastra storage for Studio, Langfuse, Datadog, Braintrust via the official exporter, and any OpenTelemetry backend.
- **Caveat:** the judge prompt inside a scorer is text. Grading an image means a code step that calls a vision model through the AI SDK and returns a structured verdict. Workable, a few dozen lines, but not a checkbox.

### 3.5 Portability

Trace-level portability is real: the AI SDK emits OpenTelemetry spans, Langfuse and Braintrust both consume them, so swapping the generation framework later does not re-instrument the eval side. Datasets, evaluators, and dashboards stay vendor-specific once a trace lands. One schema wrinkle: Arize's OpenInference uses `llm.*` attributes while the OTel GenAI convention uses `gen_ai.*`. Check before assuming two OTel tools are interchangeable.

---

## 4. The freeze

### 4.1 One loop

| Layer | Choice | Why, in one line |
|---|---|---|
| Engine | Mastra workflows, TypeScript, inside the existing sandbox container | Typed steps, parallel capture lanes, retries, suspend and resume for founder review; runs where the Durable Object already spawns Node |
| Chat and edits | Mastra agent with the workflow and its steps as tools | Open-ended turns on top of a fixed pipeline; the harness-shaped part where it belongs |
| Client | Vercel AI SDK stream over the existing WebSocket | The most-used JS AI layer; the React client renders tool events natively |
| Models | Per stage through Mastra's router, OpenRouter or AI Gateway behind it | Multi-model is the industry norm; the scorecard's model axis becomes a config change |
| Render | Plain code, KIE gpt-image-2 first, others as a second scorecard axis | Not an LLM problem |
| Memory | Our ledger files and D1; Mastra memory only if needed later | Per-brand rules from edits are the product; observational memory stays off |
| Tools | MCP where we already have servers | The one universal skill in hiring data and the default protocol |
| Inner eval loop | Mastra scorers, datasets, experiments, Studio | Free, local, versioned, judge calibration built in |
| Outer eval loop | Langfuse, self-hosted or free cloud, via the Mastra exporter | MIT, YC-alum, first-class AI SDK support, portable across any future framework; Braintrust is the upgrade if human review queues ever matter |

### 4.2 The image-grading rig, ours to build

1. **Decompose the rubric into binary checks.** Right brand, right locale, hook visible, references used, action CTA, no fabrication, distinct message per batch. This matches both the practitioner consensus and Krea's rubric decomposition.
2. **Judge from a different model family than the writer.** If Kimi writes, Gemini or Claude judges, never the same family. Measured self-preference bias demands it.
3. **Five passes, majority vote,** per the 2026 rubric paper, because vision judging is stochastic.
4. **Verbatim numeral and headline check** against the brief, since most image models score under 60 on rendered text. This is the verify pass we already run, promoted to a scorer.
5. **Brand-similarity and native-look gate** with CLIP embeddings and the AI-detector classifier.
6. **Claim grounding** against facts.json and the forbidden list. Our anchor law, as a scorer.
7. **Human labels on a fixed set** with inter-annotator agreement measured, then an experiment targeting the scorer to track judge accuracy over time.

### 4.3 Why this also powers the next agents

The hotel ops agent, the brokerage intake, and anything after them are the same shape: a fixed workflow for the boring part, an agent on top for the conversation, typed tools, per-model choice, scorers and datasets in the same Studio. Nothing in the freeze is ad-specific except the rig in 4.2.

### 4.4 Rules that keep it frozen

- Pin `@mastra/core`, `ai`, and `zod`. Tag the version before the benchmark. No upgrades mid-scorecard.
- One framework. No eve, no pi, no Pydantic AI in the product. pi is allowed in the terminal as a coding agent.
- Do not use Mastra's Cloudflare Workers deployer. There is an open bundle-size bug and Workers have CPU limits a render wait would hit. The container has neither problem.
- Do not build on the OpenAI Evals API. It shuts down 2026-11-30.
- Revisit eve at general availability, not before.
- The next framework comparison, if any, happens after the scorecard is published, not before.

---

## 5. Sources

**YC and agent stacks:** pitchbook.com 2025-06-11 · langchain.com State of Agent Engineering 2026 · temporal.io/reports/state-of-development-2026 · Anthropic + Material State of AI Agents 2026 · ycombinator.com/companies/mastra · latent.space/p/brex · claude.com/programs/startups · agentic-engineering-jobs.com · inngest.com/customers · e2b.dev/blog/yc-companies-ai-agents 2026-03-02 · modal.com/resources · daytona.io · langfuse.com/handbook · braintrust.dev · morphllm.com/ai-agent-framework 2026-06 · decagon.ai/blog · sierra.ai/blog/constellation-of-models 2026-05 · browser-use.com/posts · fast.io Devin architecture 2026-07.

**Creative companies:** campaignlive.com 2023-06-15 · trypencil.com · adcreative.ai/creative-scoring · creatify.ai blog 2026-04-15 · omneky.com/blog 2026-04-08 · help.vidmob.com 2026-03-26 · jasper.ai/image/pipelines · canva.com/newsroom · businesswire.com and news.adobe.com 2025-10-28 · blog.google 2025-10-28 · facebook.com/business/news · icon.com · makelocalads.com/blog · superside.com/llm-info 2026-08-03 · photoroom.com/blog 2026-08-27 · krea.ai/blog/krea-2-technical-report · prnewswire.com Monks 2025-03-20 · stagwellglobal.com 2024-06-17 · trylapis.com/resources 2026-07-10 · internal: COMPETITOR_MAKELOCALADS_TEARDOWN_2026-08-06.md.

**Evals:** braintrust.dev docs, Mastra exporter 2026-08-20 · langfuse.com docs · pydantic.dev/docs/ai/evals · mastra.ai/docs/evals (overview, custom-scorers, datasets, experiments, observability) · arize.com Phoenix · deepeval.com · promptfoo.dev · openai.com Evals API deprecation notice · hamel.dev evals FAQ, Jul 2026 · Galileo judge calibration guide 2026-05 · arXiv 2402.04788 · arXiv 2406.16562 · arXiv 2504.02782 · arXiv 2604.02406 · arXiv 2507.15085 · arXiv 2505.10664 · arXiv 2410.21819 · APIScout OTel portability note 2026-08.
