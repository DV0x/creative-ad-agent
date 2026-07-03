# Eval Knowledge as an AI PM Career Differentiator

**Research Date:** March 28, 2026
**Scope:** Job postings, interview expectations, career advice, case studies, portfolio ideas, and common mistakes related to AI evaluation skills for product managers.

---

## Executive Summary

Evaluation (eval) expertise has rapidly become the single most differentiating skill for AI product managers. Three converging signals confirm this:

1. **Leadership quotes are now hiring signals.** OpenAI CPO Kevin Weil: "Writing evals is going to become a core skill for product managers." YC CEO Garry Tan: "Evals are emerging as the real moat for AI startups." These are not aspirational -- they are being operationalized into job descriptions and interview rubrics.

2. **Dedicated eval PM roles now exist.** Datadog hired a PM II specifically for "LLM Evaluations." Spotify created a PM role for "AI Observability/Evaluation Platform." These are not generic AI PM roles -- they are eval-first positions.

3. **The gap between knowing and doing is enormous.** Most PMs can define evals conceptually. Very few can build an eval suite, run error analysis on production traces, or design an LLM-as-judge that correlates with human judgment. This gap is where career leverage lives.

**Confidence level: HIGH** -- based on cross-referencing 30+ sources including primary job postings, first-person practitioner accounts, course curricula, and case studies from companies shipping AI products at scale.

---

## 1. What AI PM Job Postings Actually Require

### Tier 1: AI-Native Companies (Anthropic, OpenAI, Google)

**Anthropic** (multiple PM roles, $285K-$305K base for Claude Code PM):
- "Combined 5+ years in product management and engineering, with minimum 1 year as professional engineer"
- "Deep technical background with cross-functional engineering team experience"
- "Current knowledge of AI coding tools, model capabilities, and industry trends"
- Eval-specific language is implicit rather than explicit -- they assume you know this if you have the technical background. The Research PM role mentions "synthesize user insights into actionable requirements and evaluations."

**OpenAI** (Model Behavior PM, Safety Systems PM):
- "Developing scalable methodologies for evaluating, tuning, and iterating on model behavior"
- "Synthesizing user research and feedback into targeted improvements"
- The Model Behavior PM role is essentially an eval leadership role. You define what "good" looks like for the model and measure it.

**Google** (Senior PM, AI/ML):
- "Define product goals and roadmaps for data and evaluation needs to fuel Generative AI innovation"
- "Guiding the strategy for model and agent evaluation platforms, ensuring teams can run benchmarks for accuracy, safety, and task completion"
- 8+ years experience typical for senior roles, 3+ years taking technical products from conception to launch.

**Key pattern:** These companies rarely use the word "evals" in postings. They assume technical fluency. The eval work is embedded in phrases like "scalable methodologies for evaluating," "define success criteria," and "model performance benchmarks." If you cannot read between these lines, you are already filtered out.

**Confidence: HIGH** -- sourced directly from Greenhouse job boards and company career pages.

### Tier 2: Platform Companies Building Eval Infrastructure

**Datadog** (PM II - LLM Evaluations, role posted/removed March 2025):
- "Lead the development and execution of the roadmap for LLM Observability"
- "Run beta programs with customers"
- "Partner with AI research teams to conceptualize and productize new ideas"
- This role is literally "PM for an eval product" -- you need to understand evals deeply enough to build tooling for other teams.

**Spotify** (PM - AI Observability/Evaluation Platform, Toronto, $98K-$140K CAD + equity):
- Explicit requirements: "Familiarity with LLM application patterns (prompting, RAG/agents, evaluation basics)"
- Explicit requirements: "Knowledge of LLM evaluation approaches (golden datasets, regression testing, human-in-the-loop review, LLM-as-a-judge)"
- Responsibilities include: "Build golden path instrumentation defaults (SDKs/libraries/templates) that make LLM workloads observable by default"
- Success metrics: "coverage, time-to-first-trace, regressions caught pre-prod, MTTR, cost anomalies detected early"

**Key pattern:** These roles spell out eval skills explicitly because the PM IS building eval products. This is the clearest signal of what "eval expertise" actually means in practice -- it is not abstract knowledge but operational capability.

**Confidence: HIGH** -- direct from job postings on Lever and BuiltInNYC.

### Tier 3: Scale AI and Data-Centric Companies

**Scale AI** (AI PM, Generative AI):
- 3+ years building technical products
- Previous engineering experience, Python and SQL
- "Lead the strategy for a specific data use case, empowering leading AI labs to advance their models"
- Active participation in the AI community including conferences and network

**Key pattern:** Scale's eval work is about data quality for model training -- a different angle. Their PMs need to understand how evaluation data feeds model improvement loops.

**Confidence: MEDIUM** -- limited detail available from Scale career pages.

### Summary of Eval Skills Across Job Tiers

| Skill | Tier 1 (Anthropic/OpenAI/Google) | Tier 2 (Datadog/Spotify) | Tier 3 (Scale) |
|---|---|---|---|
| Design eval frameworks | Assumed/implicit | Explicitly required | Required for data strategy |
| Build LLM-as-judge | Expected in practice | Core to the product | Adjacent |
| Error analysis & taxonomy | Essential for model behavior | Key for observability | Core competency |
| Golden dataset curation | Expected | Explicitly required | Primary job function |
| CI/CD eval integration | Expected in engineering culture | Must build for others | Less relevant |
| Production monitoring | Part of PM role | Core product | Less relevant |
| Python/SQL proficiency | Often required | Required | Required |

---

## 2. AI PM Interview Questions Related to Evals

### What Companies Actually Ask

Based on Aakash Gupta's analysis of OpenAI and Google interviews, plus practitioner reports:

**AI Product Execution (15% of interview at these companies):**
- "You launch a new embedding model API. What are your top three success metrics?"
- "Walk me through how you would evaluate whether AI is the right solution for a given product problem versus a traditional approach."
- "What's your framework for defining success metrics for AI-powered products?"

**AI Technical Knowledge (15%):**
- Explain embeddings or transformer attention to non-technical stakeholders
- Prototype AI features using no-code tools
- "Walk me through your prompt library for common PM tasks"

**AI Product Sense (20%):**
- "Should OpenAI invest in making GPT-4 cheaper or investing in GPT-5?"
- Systems thinking about interconnected AI capabilities
- Understanding of eval-model-product improvement loops

**Behavioral (35% -- the largest category):**
- "Tell me about a time you shipped an AI feature that failed. What did you learn?"
- "How do you manage stakeholder expectations around AI limitations?"
- "Show me an automation you've built that improved team productivity"

### Eval-Specific Interview Patterns

Based on cross-referencing multiple sources, these eval-related questions are emerging:

1. **"Design an evaluation framework for [product]"** -- Tests whether you can translate user needs into measurable criteria, not just list generic metrics like "accuracy."

2. **"How would you know if your LLM feature is getting worse over time?"** -- Tests understanding of drift monitoring, regression testing, and continuous evaluation.

3. **"You notice a 5% drop in your AI feature's CSAT. Walk me through your debugging process."** -- Tests error analysis methodology: do you jump to prompt changes, or do you trace failures systematically?

4. **"When would you use human evaluation vs. LLM-as-judge vs. code-based checks?"** -- Tests practical understanding of the eval toolkit and its tradeoffs.

5. **"Your team wants to ship a new prompt. How do you decide if it's ready?"** -- Tests whether you think in terms of eval gates, regression suites, and deployment confidence.

**What interviewers are actually screening for:** Not whether you know the word "evals," but whether you can articulate a systematic process for defining quality, measuring it, and improving it. The difference between "we should test it" and "here are the 5 specific failure modes I'd test for, here's how I'd measure each, and here's the threshold for shipping."

**Confidence: MEDIUM-HIGH** -- based on reported interview patterns; actual questions vary by company and role.

---

## 3. The Knowledge-Doing Gap: What Career Advisors Say

### The Consensus View

Every major AI PM career resource now identifies evals as a critical skill. But the advice varies dramatically in specificity:

**Generic advice (most common, least useful):**
- "Learn about AI evaluations"
- "Understand model performance metrics"
- "Be familiar with LLM capabilities"

**Specific advice (rare, highly valuable):**

**Hamel Husain and Shreya Shankar** (Maven course instructors, former Airbnb/GitHub engineers, UC Berkeley researcher):
- "Always start with error analysis -- don't jump into writing evals."
- "Can't the AI just eval it? That's the most common misconception. And people want that so much that people do sell it, but it doesn't work."
- "If you try to put helpfulness score, conciseness score in here, or you try to have AI look through your traces, it's not gonna catch stuff very well."
- PMs should spend 60-80% of development time understanding failures through data analysis, not building infrastructure.
- Binary pass/fail judgments outperform Likert scales (1-5 ratings) for annotation.

**Polly Allen** (ex-Amazon Alexa AI Principal PM):
- Tells the story of Alexa nearly telling COVID-era users "If you want to get infected with a virus -- you're in luck!!" -- technically accurate, grammatically perfect, completely inappropriate.
- "Your tech team will optimize whatever metrics you give them -- make sure they're the right ones."
- Recommends "eval jams" -- regular sessions where product and technical teams review failures together.

**Aakash Gupta** (AI PM newsletter, Product Growth):
- The new hiring bar includes 5 AI skills: prompt libraries, automations, GitHub proficiency, side projects, and AI tools fluency.
- Specifically mentions "creating LLM judges for evaluation" as a prompt library skill.
- "In 2025, every product management role is effectively an AI product management role."

### The Real Gap: Three Levels of Eval Competence

Based on synthesizing all career advice sources, eval competence exists on three levels:

**Level 1 -- Conceptual (where most PMs are):**
- Can define what evals are
- Knows terms like "hallucination rate," "accuracy," "LLM-as-judge"
- Has read about eval frameworks
- Cannot actually build or run one

**Level 2 -- Practitioner (where hiring managers want you):**
- Has manually reviewed 50+ LLM outputs and categorized failure modes
- Has written at least one LLM-as-judge prompt and validated it against human judgment
- Has created a golden dataset for a specific use case
- Can set up a basic eval pipeline (even in a notebook)
- Understands why generic metrics like "helpfulness" fail

**Level 3 -- Operator (where the best AI PMs live):**
- Runs eval-driven development as a weekly cadence
- Owns the eval suite for their product and updates it from production traces
- Can diagnose whether a quality problem is a model issue, prompt issue, retrieval issue, or product design issue
- Has implemented eval gates in CI/CD
- Tracks correlation between automated evals and user satisfaction over time

**The career opportunity:** Most PMs are at Level 1. Most job postings require Level 2. Getting to Level 2 is achievable in 30-60 days of focused practice. Getting to Level 3 requires shipping and iterating on a real product.

**Confidence: HIGH** -- consistent across all sources, from course curricula to hiring manager interviews.

### Salary Premium

- Traditional PM average: ~$190K in San Francisco
- AI PM average: ~$254K in San Francisco (30-40% premium)
- Top AI PM compensation (Anthropic, OpenAI, Google): $285K-$400K+ total comp
- Entry-level AI PM: $150K-$220K total comp

The premium is real and growing. Eval skills specifically are not yet tracked as a salary variable, but they are increasingly table stakes for the AI PM roles commanding the highest compensation.

**Confidence: MEDIUM** -- salary data varies by source; ranges are directionally correct.

---

## 4. Real Case Studies: How Teams Actually Do Evals

### Case Study 1: Rechat (Real Estate AI Assistant "Lucy")

**Source:** Hamel Husain's blog, primary account
**What happened:** Lucy, a conversational AI for real estate professionals, hit a performance plateau. Prompt engineering wins created whack-a-mole dynamics -- fixing one failure created others.

**What they did:**
1. Built hundreds of unit tests organized by features (listing finder, contract helper, etc.)
2. Used LLMs to generate synthetic test cases representing real user behavior
3. Created domain-specific viewing tools (not generic dashboards) to review traces
4. Tracked test pass rates over time using existing analytics tools
5. Used evaluation data to identify that fine-tuning (not more prompt engineering) was needed

**PM lesson:** The breakthrough was not a better prompt -- it was a better evaluation system that revealed the right intervention (fine-tuning vs. prompting).

**Confidence: HIGH** -- primary source from the practitioner who built it.

### Case Study 2: Discord (Clyde AI, 200M+ users)

**Source:** ZenML case study database, from Discord engineering talks
**What happened:** Discord deployed Clyde AI to 200+ million users. At that scale, "any failure mode with even a one-in-a-million probability will manifest hundreds of times."

**What they did:**
- Treated evals as unit tests -- "simple deterministic checks" over complex ML-graded evaluations
- Example: Instead of training a classifier for personality traits, they checked if responses began with lowercase letters -- "80% of the value for 1% of the effort"
- Used promptfoo (open-source CLI) for local execution without cloud dependencies
- Every PR required an evaluation, minimum
- Red teaming: used unaligned models to generate adversarial inputs, tested for jailbreaks, PII leaks, hallucinations
- Over-specified prompts showed negative returns -- models perform better with appropriate freedom

**PM lesson:** Start simple. Deterministic checks you can run locally catch most issues. The sophisticated stuff comes later. Also: they never closed the production feedback loop due to privacy concerns -- real constraints exist.

**Confidence: HIGH** -- sourced from engineering talk transcripts and ZenML case study database.

### Case Study 3: Amazon Alexa (Polly Allen's Account)

**Source:** LinkedIn article by ex-Alexa AI Principal PM
**What happened:** In 2020, the system nearly told users about COVID: "If you want to get infected with a virus -- you're in luck!!" The output was technically accurate and grammatically perfect, but contextually disastrous.

**What they did:**
- Connected evaluation metrics to business outcomes, not just technical scores
- Built custom evaluation frameworks using "greatest hits" from real user interactions
- Created rating scales for context awareness, tone appropriateness, cultural sensitivity
- Transformed evaluation from a launch gate into continuous development tool
- Implemented smoke tests for critical use cases and regular "eval jams"

**PM lesson:** Technical metrics (accuracy, grammar) missed the catastrophic failure. Product-level evaluation (context awareness, appropriateness) caught it. PMs must define what "good" means beyond what engineers naturally measure.

**Confidence: HIGH** -- first-person account from senior practitioner.

### Case Study 4: LinkedIn Quality Journey

**Source:** Chip Huyen's blog on AI engineering pitfalls
**Key data point:** LinkedIn needed 1 month to reach 80% quality but required 4 additional months to surpass 95%. Teams consistently underestimate the effort required for the last 15% of quality improvement.

**PM lesson:** The demo-to-production gap is real and predictable. Budget 4-5x more time for the quality tail than the initial prototype.

**Confidence: MEDIUM** -- secondhand reporting of LinkedIn's experience.

---

## 5. Eval Portfolio Ideas: What Would Impress a Hiring Manager

### The Framework: Problem, Eval Design, Iteration, Results

Based on career advice from Reforge, Product School, Maven course outcomes, and hiring manager interviews, an impressive eval portfolio project demonstrates:

1. **You identified a real quality problem** (not a toy example)
2. **You designed domain-specific evals** (not generic metrics)
3. **You iterated based on what the evals revealed** (not just built and stopped)
4. **You can show measurable improvement** (before/after data)

### Specific Project Ideas (Ranked by Impressiveness)

**Tier 1: Production-Grade (most impressive)**

1. **End-to-End Eval Pipeline for a Deployed Product**
   - Take any AI product you use or build (even a personal project)
   - Collect 100+ real interactions
   - Manually categorize failure modes using open coding methodology
   - Build 3 types of evaluators: code-based checks, LLM-as-judge, human review
   - Validate LLM-as-judge against human judgment (show correlation)
   - Demonstrate one iteration cycle: eval -> identify problem -> fix -> re-eval -> improvement
   - Deliverable: GitHub repo + blog post showing the full workflow

2. **Eval-Driven Prompt Optimization Case Study**
   - Pick a specific task (summarization, extraction, classification)
   - Create a golden dataset of 50-100 examples
   - Write 3-5 different evaluation criteria with binary pass/fail rubrics
   - Test 3-5 prompt variations against the eval suite
   - Show which prompt wins and WHY (with error analysis)
   - Deliverable: Notebook + writeup following Problem -> Solution -> Impact framework

3. **LLM-as-Judge Calibration Study**
   - Build an LLM judge for a specific domain (customer support quality, content moderation, code review)
   - Have 3+ humans rate the same 100 outputs
   - Compare LLM judge ratings against human consensus
   - Iterate on the judge prompt to improve correlation
   - Report inter-rater reliability and judge-human agreement
   - Deliverable: Research-style writeup with methodology, data, and findings

**Tier 2: Demonstrative (good for career switchers)**

4. **RAG System Evaluation**
   - Build a simple RAG system on a domain you know well
   - Evaluate retrieval relevance and generation accuracy separately
   - Show how poor retrieval cascades into poor generation
   - Demonstrate that the right eval reveals WHERE in the pipeline the failure occurs
   - Deliverable: Jupyter notebook + blog post

5. **Benchmark Reproduction and Analysis**
   - Take a published benchmark (MMLU, HumanEval, etc.)
   - Reproduce it for 2-3 models
   - Show how prompt structure affects scores (the Charles Feinn case study showed 7+ percentage point swings from prompt variations alone)
   - Discuss what the benchmark actually tells you vs. what it doesn't
   - Deliverable: Blog post with code and analysis

**Tier 3: Quick Wins (minimum viable portfolio)**

6. **Error Taxonomy for a Public AI Product**
   - Use any public AI product (ChatGPT, Claude, Gemini) for a specific task
   - Collect 50 outputs
   - Categorize every failure using open coding (theme extraction) and axial coding (theme grouping)
   - Present a structured failure taxonomy with frequency counts
   - Propose eval criteria based on the taxonomy
   - Deliverable: Blog post or Notion page

### Tools to Use (Signal Technical Competence)

- **Braintrust** -- used by Notion, Zapier, Stripe, Vercel in production
- **Langfuse** -- open-source, good for data control
- **promptfoo** -- open-source CLI, used by Discord
- **Python notebooks** -- always valid, shows you can code
- **Custom Streamlit/Gradio apps** -- Hamel Husain specifically recommends building lightweight custom tools over buying platforms

### What NOT to Do

- Do not just take a course and put the certificate on your resume without a project
- Do not use only generic metrics (helpfulness, coherence) without domain-specific criteria
- Do not skip the human evaluation step -- showing you can look at data manually is the differentiator
- Do not present only the "success" version -- showing your iteration (what failed, what you learned, what you changed) is more impressive

---

## 6. Common PM Eval Mistakes

### Mistake 1: Outsourcing Evals to Engineering

**Who says this:** Hamel Husain, Shreya Shankar (Maven course instructors)
**The problem:** "Too many organizations make the grave mistake of putting an engineering team between the PM and the prompt. This creates a painful game of telephone where your insights get lost in translation."
**Why it matters:** Engineers optimize for technical metrics. PMs understand user context. When engineering alone defines quality, you get models that score well on benchmarks but fail users.
**The fix:** PMs must be "in the driver's seat" for evaluation criteria. Engineers implement the testing infrastructure.

### Mistake 2: Using Generic Metrics

**Who says this:** Hamel Husain, Shreya Shankar, Eugene Yan
**The problem:** "If you try to put helpfulness score, conciseness score, whatever in here, or you try to have AI look through your traces, it's not gonna catch stuff very well." Generic metrics create "an illusion of confidence that is unjustified."
**Why it matters:** Every product has different failure modes. A customer support bot and a code assistant need completely different eval criteria.
**The fix:** Start with error analysis on your specific product's failures. Let metrics emerge from real data, not from a framework template.

### Mistake 3: Trusting Benchmarks for Product Decisions

**Who says this:** HoneyHive, Chip Huyen, practitioners broadly
**The problem:** "High leaderboard scores don't always translate to real-world readiness." GPT-4 achieves 99% on MMLU but may fail on your specific regulatory compliance scenarios.
**The data:** Benchmarks suffer from data contamination and saturation. Top models achieve near-perfect scores, losing discriminative value.
**The fix:** Build custom evaluation datasets reflecting actual user queries, edge cases, and domain-specific success criteria.

### Mistake 4: Skipping Manual Error Analysis

**Who says this:** Hamel Husain, Shreya Shankar, Eugene Yan
**The problem:** Teams jump to automation (LLM-as-judge, eval pipelines) before understanding what is actually breaking. "Many teams jump to infrastructure before manually reviewing 50-100 outputs to identify actual failure patterns."
**The data:** Chip Huyen recommends 15 minutes daily reviewing outputs. Hamel recommends 30 minutes reviewing 20-50 outputs when making changes. Eugene Yan's process starts with "observe data" before anything else.
**The fix:** Look at your data. There is no shortcut. Build the habit of daily trace review.

### Mistake 5: Over-Trusting LLM-as-Judge

**Who says this:** HoneyHive, Chip Huyen, Stack Overflow
**The problem:** LLM judges exhibit systematic biases. Position bias creates 40% GPT-4 inconsistency. Verbosity bias inflates scores by ~15%. LLM judges "can hallucinate, make factual errors, or struggle to follow complex instructions."
**The fix:**
- Use binary pass/fail over Likert scales
- Add few-shot examples to judge prompts
- Use chain-of-thought reasoning in judge prompts
- Validate judge output against human baselines regularly
- A 70% pass rate signals meaningful stress-testing; 100% means your evals are not challenging enough

### Mistake 6: Treating Evals as a One-Time Activity

**Who says this:** Langfuse, HoneyHive, Anthropic engineering blog
**The problem:** Static evaluation datasets ignore drift. "Over 25 months, a given LLM performed 12-14% worse every year based on an updated benchmark."
**The fix:** Maintain living evaluation datasets informed by production data. Update eval criteria as new failure modes emerge. Implement continuous monitoring, not just launch gates.

### Mistake 7: Confusing Product Problems with Model Problems

**Who says this:** Chip Huyen
**The problem:** Teams blame the model when the real issue is product design. Example: A meeting transcript summarizer focused on length optimization when users actually wanted action items specific to them. Intuit's tax chatbot seemed unhelpful until they discovered users hated typing -- adding suggested questions dramatically improved engagement.
**The fix:** Before changing the model or prompt, validate that you're solving the right problem. User research and eval analysis should happen together.

---

## 7. Learning Resources (Ranked by Practitioner Value)

### Tier 1: Directly Builds Eval Capability

1. **Maven Course: AI Evals for Engineers & PMs** (Hamel Husain, Shreya Shankar)
   - Most referenced course across all sources
   - Covers: data collection, error analysis, custom eval design, LLM-as-judge, RAG debugging, CI/CD integration
   - Outcome: practical skills for measuring AI impact, automating testing, identifying where to invest effort
   - Price: ~$750-$1,000 (varies by cohort)

2. **Anthropic Engineering Blog: Demystifying Evals for AI Agents**
   - Free, primary source from the company building Claude
   - 8-step practical roadmap from initial setup through maintenance
   - Covers single-turn, multi-turn, and agent evals
   - Best free resource for understanding eval types and grader design

3. **Hamel Husain's Blog: "Your AI Product Needs Evals"**
   - Free, detailed case study of Rechat
   - Three-level evaluation framework (unit tests, human+model eval, A/B testing)
   - Concrete examples of what eval infrastructure looks like in practice

### Tier 2: Builds Context and Framework Knowledge

4. **Reforge: AI Evals Course**
   - Step-by-step playbook for eval-driven roadmaps
   - Artifacts: AI PRDs, golden datasets, eval rubrics, trace analysis, automated evaluators
   - Good for PMs who learn through structured exercises

5. **Product School: AI Evals Certification**
   - 6 modules: metrics beyond accuracy, failure mode discovery, eval suites, eval gates, scaling evals, responsible AI
   - "Portfolio-ready artifacts" as deliverables
   - Live online, small classes (~20 students)

6. **Lenny's Newsletter: Beyond Vibe Checks**
   - PM-focused guide to eval types (human, code-based, LLM-based)
   - The four-part eval formula: role, context, goal, terminology
   - Good starting point for conceptual understanding

### Tier 3: Supplementary and Case Study Collections

7. **ZenML LLMOps Database** -- 800+ case studies from 150+ companies
8. **Evidently AI: LLM Evaluations Course** -- free, focuses on eval tooling
9. **Braintrust Blog: Evals are the New PRD** -- the weekly workflow for eval-driven development
10. **Eugene Yan: "An LLM-as-Judge Won't Save The Product"** -- process over tools

---

## 8. The Contrarian View: Who Disagrees and Why?

### Argument Against Eval Obsession

**The skeptic's position:** "Most teams don't need sophisticated evals. They need better product thinking."

**Evidence for this view:**
- Discord found that over-specified prompts showed NEGATIVE returns. Sometimes less evaluation infrastructure and more trust in the model works better.
- Chip Huyen documented cases where the problem was product design (wrong feature, wrong UX), not model quality. No eval would fix a product solving the wrong problem.
- Hamel and Shreya themselves say: if your task is well-represented in model pretraining AND your team has deep domain expertise AND you dogfood religiously, you might not need much formal eval infrastructure.

**When this view is correct:** Early-stage products (pre-PMF) where you are still learning what users want. Over-investing in eval infrastructure before you know the right product is premature optimization.

**When this view is dangerous:** At scale (Discord's millions of users), for high-stakes domains (healthcare, finance, legal), or when you have many failure modes interacting (whack-a-mole dynamics).

**My assessment:** The skeptic has a point about timing. Eval expertise matters most AFTER you've found product-market fit and need to scale quality. Before PMF, rapid prototyping and user feedback matter more than formal eval suites. But: learning eval skills during the PMF search makes you faster when you need them. The skill is not wasted even if the infrastructure is premature.

**Confidence: MEDIUM** -- this is a judgment call about timing, not a factual claim.

### Who Would Disagree With This Research?

1. **Traditional PMs transitioning to AI:** Would argue that existing PM skills (user research, prioritization, stakeholder management) matter more than eval-specific technical skills. Partially true -- but the market is paying a 30-40% premium for the technical overlay.

2. **Engineers who build eval tooling:** Would argue PMs should stay out of eval implementation and focus on defining requirements. Hamel and Shreya specifically rebut this -- PMs who delegate eval design lose critical product intuition.

3. **Hiring managers at non-AI-native companies:** Would prioritize domain expertise over eval skills. Valid for industries where AI is a feature, not the product. Less valid for AI-native companies.

---

## 9. What Changes in 12 Months?

### Trends That Could Make Eval Skills MORE Valuable

- **Agent proliferation:** As AI agents take multi-step actions (not just generate text), evaluation becomes dramatically harder. Anthropic's guide specifically addresses the challenge of evaluating agents that modify state, use tools, and make sequential decisions. The PM who can evaluate agent behavior will be extremely scarce.

- **Regulatory pressure:** EU AI Act enforcement, potential US regulation -- all require documented evaluation and monitoring. PMs who can build compliance-ready eval frameworks become essential.

- **Model commoditization:** As model capabilities converge, the differentiator shifts from "which model" to "how well you evaluate and optimize." This is exactly Garry Tan's moat argument.

### Trends That Could Make Eval Skills LESS Valuable (or Transform Them)

- **Better auto-eval tools:** If tools like Braintrust, Langfuse, or new entrants make eval setup trivial, the commodity shifts from "can build evals" to "can interpret eval results." The analytical skill remains; the implementation skill commoditizes.

- **Model self-improvement:** If models become reliably self-evaluating (Constitutional AI, self-play), the manual eval loop shortens. Hamel and Shreya are skeptical this works today ("Can't the AI just eval it? That's the most common misconception"), but it could change.

- **Eval as a service:** Companies like Scale AI could offer turnkey evaluation. If eval becomes outsourceable, the PM's role shifts from building evals to specifying requirements for eval vendors.

**My assessment:** In 12 months, the HOW of evals will get easier (better tools), but the WHAT and WHY will remain firmly in PM territory. The skill to invest in is not "I can set up Braintrust" but "I can identify the right failure modes, design the right criteria, and interpret results to drive product decisions."

**Confidence: MEDIUM** -- technology predictions are inherently uncertain.

---

## 10. Actionable Career Recommendations

### If You Are a PM With No Eval Experience (Level 0 to Level 1)

**Week 1-2:**
- Read Hamel Husain's blog post "Your AI Product Needs Evals" (free, 30 min)
- Read Anthropic's "Demystifying Evals for AI Agents" (free, 45 min)
- Watch the Lenny's Podcast episode with Hamel and Shreya (free, 1 hour)

**Week 3-4:**
- Pick any AI product you use regularly
- Collect 50 outputs from a specific task
- Manually categorize every failure using open coding and axial coding
- Write up your failure taxonomy with frequency counts

**Deliverable:** A blog post titled "I Reviewed 50 [Product] Outputs -- Here's What Breaks and How Often"

### If You Are a PM With Conceptual Knowledge (Level 1 to Level 2)

**Month 1:**
- Take the Maven AI Evals course (or Reforge if budget is tighter)
- Build a golden dataset for a domain you know well (50-100 examples)
- Write your first LLM-as-judge prompt and validate against your own judgment

**Month 2:**
- Set up a basic eval pipeline in a Python notebook
- Test 3 prompt variations against your eval suite
- Show before/after improvement with data

**Deliverable:** GitHub repo with your eval pipeline + a blog post showing your methodology and results

### If You Are an AI PM Looking to Differentiate (Level 2 to Level 3)

**Ongoing practice:**
- Implement the weekly eval cadence (Monday: review traces, Tuesday: curate eval cases, Wednesday: run suite, Thursday: ship or iterate)
- Build correlation tracking between your automated evals and user satisfaction metrics
- Contribute to open-source eval tools or publish your eval framework

**Deliverable:** A talk, blog series, or open-source contribution showing your eval-driven development process in action

### Resume and Interview Preparation

**On your resume:**
- Replace "managed AI product" with specific eval achievements: "Designed eval suite covering 5 failure modes, improving task accuracy from 73% to 91%"
- Mention specific tools: Braintrust, Langfuse, promptfoo, custom Python pipelines
- Quantify: number of eval cases maintained, regression catch rate, quality improvement percentages

**In interviews:**
- When asked "how would you measure success for this AI feature?" -- do NOT just list metrics. Describe your process: "I'd start by manually reviewing 50 outputs, categorize failure modes, then design specific evals for the top 3 failure categories."
- Name the three types of evaluators (code-based, LLM-as-judge, human) and when each is appropriate
- Reference the eval-driven development cadence
- Show you understand the LLM-as-judge limitations (position bias, verbosity bias, need for human validation)

---

## Gaps and Uncertainties

### What I Could NOT Find or Verify

1. **Specific eval-related interview questions from Anthropic:** Their interview process is opaque. The assumption that they test eval skills is based on job posting language, not confirmed interview reports.

2. **Quantified salary premium for eval skills specifically:** The 30-40% AI PM premium is documented, but no source isolates eval expertise as a specific compensation driver. It may be bundled into general technical fluency.

3. **Longitudinal data on eval skill impact on career outcomes:** No study tracks "PMs who learned evals" vs. "PMs who didn't" and their career trajectories. The signal is strong but anecdotal.

4. **How non-AI-native companies (banks, healthcare, retail) weight eval skills:** Most research focuses on AI-native companies. The eval skill premium at traditional enterprises is unclear.

5. **Eval expertise among current AI PMs:** No survey quantifies what percentage of working AI PMs have hands-on eval experience vs. conceptual knowledge. The "most PMs are at Level 1" claim is expert opinion, not measured data.

6. **Jasper, Copy.ai, and Notion-specific job posting details:** These companies' PM postings were not accessible in detail during this research.

7. **Return on investment for specific eval courses:** No outcome data comparing Maven, Reforge, and Product School graduates' career outcomes.

### What Would Change These Conclusions

- If auto-eval tools achieve >95% correlation with human judgment across domains, the implementation skill becomes less valuable (but the analytical skill remains).
- If AI PM hiring shifts to prioritize domain expertise over technical skills, eval knowledge becomes a nice-to-have rather than a differentiator.
- If model capabilities advance enough that quality issues become rare, eval expertise becomes less critical.

None of these seem likely in the next 12 months based on current trajectories.

---

## Sources

### Primary Sources (Job Postings)
- [Product Manager, Claude Code - Anthropic](https://job-boards.greenhouse.io/anthropic/jobs/4985920008)
- [Product Manager, Consumer - Anthropic](https://job-boards.greenhouse.io/anthropic/jobs/5127559008)
- [Lead Product Manager, Research - Anthropic](https://job-boards.greenhouse.io/anthropic/jobs/4684257008)
- [Product Manager, Model Behavior - OpenAI](https://openai.com/careers/product-manager-model-behavior-san-francisco/)
- [Product Manager, Safety Systems - OpenAI](https://openai.com/careers/product-manager-safety-systems-san-francisco/)
- [Product Manager - AI Observability/Evaluation Platform - Spotify](https://www.lifeatspotify.com/jobs/product-manager-ml-ai-platform)
- [Product Manager II - LLM Evaluations - Datadog](https://www.builtinnyc.com/job/product-manager-ii-llm-evaluations/4440269)
- [AI Product Manager, Generative AI - Scale AI](https://scale.com/careers/4481052005)
- [Senior Product Manager, AI/ML - Google](https://careers.google.com/jobs/results/87541541114913478-senior-product-manager/)

### Practitioner Blogs and Articles (Primary Sources)
- [Your AI Product Needs Evals - Hamel Husain](https://hamel.dev/blog/posts/evals/) (2024)
- [LLM Evals: Everything You Need to Know - Hamel Husain & Shreya Shankar](https://hamel.dev/blog/posts/evals-faq/) (January 2026)
- [Demystifying Evals for AI Agents - Anthropic Engineering Blog](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (2025)
- [Common Pitfalls When Building Generative AI Applications - Chip Huyen](https://huyenchip.com/2025/01/16/ai-engineering-pitfalls.html) (January 2025)
- [An LLM-as-Judge Won't Save The Product - Eugene Yan](https://eugeneyan.com/writing/eval-process/) (2025)
- [Why AI Product Leaders MUST Own Evals - Polly Allen](https://www.linkedin.com/pulse/why-ai-product-leaders-must-own-evals-how-do-polly-m-allen-ejq6c) (2025)
- [Avoiding Common Pitfalls in LLM Evaluation - HoneyHive](https://www.honeyhive.ai/post/avoiding-common-pitfalls-in-llm-evaluation) (2025)
- [Evals Are the New PRD - Braintrust](https://www.braintrust.dev/blog/evals-are-the-new-prd) (2025)

### Career Guides and Frameworks (Secondary Sources)
- [The One Skill Every AI PM Needs - Aakash Gupta](https://www.news.aakashg.com/p/ai-evals) (2025)
- [The AI Evaluation Revolution - Aakash Gupta](https://aakashgupta.medium.com/the-ai-evaluation-revolution-why-every-product-manager-must-master-this-critical-skill-in-2025-0458c4ac6097) (2025)
- [The $300K AI PM Interview Playbook - Aakash Gupta](https://aakashgupta.medium.com/the-300k-ai-pm-interview-playbook-what-openai-google-actually-ask-6223cb99e9aa) (2025)
- [The New PM Hiring Bar: 5 AI Skills - Aakash Gupta](https://aakashgupta.medium.com/the-new-pm-hiring-bar-5-ai-skills-that-separate-candidates-who-get-offers-from-those-who-dont-fc35a75323b2) (October 2025)
- [The Complete AI PM Transition Guide - Aakash Gupta](https://www.aakashg.com/the-complete-ai-product-manager-transition-guide-2025-edition/) (2025)
- [Why AI Evaluation Is a Must-Have Skill for PMs - Product School](https://productschool.com/blog/artificial-intelligence/ai-evals-product-managers) (2025)
- [AI PMs Are the PMs That Matter in 2026 - Product School](https://productschool.com/blog/artificial-intelligence/guide-ai-product-manager) (2026)
- [Beyond Vibe Checks: A PM's Complete Guide to Evals - Lenny's Newsletter](https://www.lennysnewsletter.com/p/beyond-vibe-checks-a-pms-complete) (2025)
- [Mastering AI Evals: A Complete Guide for PMs - Product Compass](https://www.productcompass.pm/p/ai-evals) (2025)

### Courses and Certifications
- [AI Evals for Engineers & PMs - Maven (Hamel Husain & Shreya Shankar)](https://maven.com/parlance-labs/evals)
- [AI Evals Certification - Product School](https://productschool.com/certifications/ai-evals)
- [AI Evals Course - Reforge](https://www.reforge.com/courses/ai-evals)
- [AI Product Management Templates - Reforge](https://www.reforge.com/artifacts/c/ai/ai-product-management)

### Case Studies
- [Discord: Large-Scale AI Assistant Deployment - ZenML](https://www.zenml.io/llmops-database/large-scale-ai-assistant-deployment-with-safety-first-evaluation-approach) (2025)
- [LLM Evaluation & Prompt Engineering Case Study - Charles Feinn / AppSimple](https://appsimple.io/portfolio/llm-evaluation-prompting) (2025)
- [Evals and Observability for AI PMs: End-to-End Playbook - DEV Community](https://dev.to/kuldeep_paul/evals-and-observability-for-ai-product-managers-a-practical-end-to-end-playbook-4cch) (2025)
- [LLM Evaluation 101 - Langfuse](https://langfuse.com/blog/2025-03-04-llm-evaluation-101-best-practices-and-challenges) (March 2025)
- [ML/LLM Observability at Datadog PM Internship - Grace Gong](https://medium.com/the180/machine-learning-llm-observability-at-datadog-my-pm-internship-experience-45320d58de64) (2024)

### Industry Quotes
- Kevin Weil (OpenAI CPO): "Writing evals is going to become a core skill for product managers." - [Lenny's Podcast](https://www.lennysnewsletter.com/p/kevin-weil-open-ai) (2025)
- Garry Tan (YC CEO): "Evals are emerging as the real moat for AI startups." - [X/Twitter](https://x.com/garrytan/status/1892952656940880036) (2025)
- Hamel Husain: "Can't the AI just eval it? That's the most common misconception." - [Lenny's Podcast](https://www.lennysnewsletter.com/p/why-ai-evals-are-the-hottest-new-skill) (2025)

### Salary and Market Data
- [AI Product Manager Salary - Glassdoor](https://www.glassdoor.com/Salaries/ai-product-manager-salary-SRCH_KO0,18.htm) (2026)
- [AI PM Salary Guide - InstitutesPM](https://www.institutepm.com/knowledge-hub/ai-product-manager-salary-guide-2026) (2026)
- [AI PM Salary Trends - Simplilearn](https://www.simplilearn.com/ai-product-manager-salary-article) (2026)
- [Product Management Salaries - Product School](https://productschool.com/blog/career-development/product-management-salaries-todays-economy) (2026)
