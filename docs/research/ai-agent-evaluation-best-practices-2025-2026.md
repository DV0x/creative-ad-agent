# AI Agent Evaluation Best Practices (2025-2026): A Practical Guide for AI Product Managers

**Research Date**: March 31, 2026
**Scope**: Industry-leading frameworks, methodologies, and practical guidance for evaluating AI agents and agentic systems
**Audience**: AI Product Managers who need actionable evaluation strategies, not just theory

---

## Table of Contents

1. [Decomposing an Agent into Evaluable Components](#1-decomposing-an-agent-into-evaluable-components)
2. [Designing Eval Rubrics from Scratch](#2-designing-eval-rubrics-from-scratch)
3. [Assigning Rubric Weights Systematically](#3-assigning-rubric-weights-systematically)
4. [Multi-Agent Evaluation Patterns](#4-multi-agent-evaluation-patterns)
5. [Step-Level / Intermediate Evaluation](#5-step-level--intermediate-evaluation)
6. [Tool Use Evaluation](#6-tool-use-evaluation)
7. [Context and Memory Evaluation](#7-context-and-memory-evaluation)
8. [Safety Evaluation Specific to Agents](#8-safety-evaluation-specific-to-agents)
9. [Human-in-the-Loop Eval Patterns](#9-human-in-the-loop-eval-patterns)
10. [Eval-Driven Development for Agents](#10-eval-driven-development-for-agents)
11. [Industry Survey Data: Where Teams Actually Are](#11-industry-survey-data)
12. [Tool Landscape](#12-tool-landscape)
13. [Gaps and Uncertainties](#13-gaps-and-uncertainties)

---

## 1. Decomposing an Agent into Evaluable Components

**Confidence: HIGH** -- Multiple primary sources agree on the decomposition pattern.

### The Two-Level Decomposition (Industry Consensus)

Every major source -- Anthropic, Braintrust, Confident AI/DeepEval, Amazon, and LangChain -- converges on the same fundamental split:

**Level 1: End-to-End (Outcome) Evaluation**
- Did the agent complete the intended task?
- Was the final output correct / useful / safe?
- Did it stay within resource bounds (tokens, time, cost)?

**Level 2: Component-Level (Process) Evaluation**
- Did the agent select the right tools?
- Were tool parameters correct?
- Was routing/handoff appropriate (in multi-agent setups)?
- Did intermediate reasoning steps make sense?

### Anthropic's Decomposition Framework

From "Building Effective Agents" (Dec 2024), Anthropic identifies five composable workflow patterns, each of which becomes an independently evaluable unit:

| Pattern | What to Evaluate | Grading Approach |
|---------|-----------------|------------------|
| **Prompt Chaining** | Each step's output quality; error propagation across chain | Gate checks between steps |
| **Routing** | Classification accuracy; correct path selection | Deterministic check against expected route |
| **Parallelization** | Individual branch quality; aggregation quality | Score branches independently, then score synthesis |
| **Orchestrator-Workers** | Task decomposition quality; worker output quality; synthesis quality | Evaluate orchestrator plan + each worker output + final assembly |
| **Evaluator-Optimizer** | Evaluator accuracy; convergence behavior; final quality | Track improvement curve across iterations |

### Confident AI / DeepEval's Component Taxonomy

DeepEval provides perhaps the most granular decomposition for practical evaluation:

- **Single-turn agents**: Apply component-level metrics at specific system points, then end-to-end task completion scoring
- **Multi-turn agents**: Use LLM-as-judge metrics on the entire turn history, while evaluating individual tool calls per turn
- **Multi-agent systems**: Count only end-to-end user-facing interactions as "turns"; treat agent-to-agent calls as component-level interactions

### Practical Recommendation for PMs

Start by mapping your agent's architecture to Anthropic's patterns. For each pattern node, define:
1. What "correct" looks like (the output spec)
2. What "incorrect" looks like (failure modes from real usage)
3. Whether it can be tested deterministically or needs LLM-as-judge

This mapping becomes your evaluation architecture. The key insight from Anthropic's "Demystifying Evals" post: **grade outcomes, not paths**. There is a common instinct to check that agents followed very specific steps like a sequence of tool calls in the right order -- this approach is too rigid and penalizes valid alternative solutions.

---

## 2. Designing Eval Rubrics from Scratch

**Confidence: HIGH** -- Strong convergence between Hamel Husain, Anthropic, and Hebbia on methodology.

### The Husain-Shankar Methodology (Bottom-Up, Empirical)

Hamel Husain and Shreya Shankar's approach (taught to 700+ engineers and PMs via their Maven course, the #1 highest-grossing course on the platform) follows a rigorous qualitative research methodology:

**Step 1: Open Coding**
- Domain experts review 30-50 real production traces
- Write open-ended notes about every issue observed
- No predetermined categories -- let patterns emerge naturally

**Step 2: Axial Coding**
- Use an LLM to help synthesize open codes into 5-6 overarching failure categories
- Sample prompt: "Please extract all different open codes from the note field. Propose 5-6 categories we can create axial codes from."
- Result: A "failure taxonomy" specific to your product

**Step 3: Theoretical Saturation**
- Continue reviewing traces until new traces reveal no new failure modes
- This is your signal that the taxonomy is complete enough to operationalize

**Step 4: Rubric Formalization**
- Convert each failure category into a pass/fail criterion with:
  - Clear definition of what constitutes a pass
  - Clear definition of what constitutes a fail
  - 2-3 concrete examples of each
- Use BINARY (pass/fail) scoring, not Likert scales

**Why Binary?** Husain is emphatic: "The difference between adjacent points on a Likert scale (like 3 vs 4) is subjective and inconsistent." Binary forces clearer thinking and produces more consistent labels across annotators.

### Anthropic's Rubric Development Roadmap (From "Demystifying Evals")

Anthropic provides an 8-step development process:

1. **Start with 20-50 tasks from real failures** -- not hundreds. Early changes have large effect sizes, so small sample sizes suffice.
2. **Convert bug reports and manual checks** into structured test cases
3. **Write unambiguous tasks** with reference solutions that prove solvability. If a frontier model achieves 0% pass@100, the task is likely broken, not the model.
4. **Balance positive and negative cases** to avoid one-sided optimization
5. **Build robust harnesses** with clean, isolated environments preventing shared-state corruption between runs
6. **Choose deterministic graders where possible**; use LLM graders where necessary
7. **Read transcripts** to verify grader fairness and eval meaningfulness
8. **Monitor for saturation** when agents achieve 100% on solvable tasks

### Hebbia's Hybrid Framework (Deterministic + Rubric-Based)

Hebbia enforces four constraints on rubric criteria design:

1. **Atomic Criteria**: Each criterion addresses "a single, diagnosable issue" -- not compound conditions
2. **Binary Scoring**: Pass/fail is faster for LLM graders to converge on and easier to validate against human judgment
3. **Specificity**: Instead of "appropriate visualization," specify "LINE for continuous trends, BAR for discrete comparisons, STACKED BAR for part-to-whole over multiple periods"
4. **Distinct Coverage**: If two criteria tend to pass or fail together, they are measuring the same thing -- remove one or narrow both

Hebbia also introduces a useful two-tier structure:
- **Required criteria**: Establish agent SLAs (minimum acceptable behavior)
- **Additional criteria**: Measure advanced capabilities (distinguishing good from excellent)

This means a 60% score is not a failure -- it means the agent passed minimum requirements while missing advanced quality measures.

### The Field Guide Approach (Husain, 2025)

From Husain's "Field Guide to Rapidly Improving AI Products":

- **Binary judgments with detailed critiques**: Make a pass/fail decision, then write a qualitative explanation of why. The critique serves three purposes: (a) trains LLM judges via few-shot examples, (b) generates synthetic data for fine-tuning, (c) documents institutional knowledge about quality.
- **Criteria drift is expected**: Evaluation criteria evolve as reviewers observe more outputs. Treat them as living documents, not fixed specifications.
- **Validate automated evaluators**: Measure True Positive Rate and True Negative Rate against human judgments on held-out sets. Agreement rates exceeding 90% are the reliability benchmark.

### Who Would Disagree?

Teams building highly creative or open-ended agents (e.g., creative writing, art generation) might argue that binary pass/fail is too coarse. The counter-evidence: Husain addresses this directly -- "subjective usually means we haven't defined our criteria yet." The fix is narrower, more specific criteria, not more scale points.

---

## 3. Assigning Rubric Weights Systematically

**Confidence: MEDIUM** -- This is the least well-documented area. Most sources advocate against explicit numerical weighting or provide only general principles.

### The Industry Consensus: Avoid Complex Weighting

The dominant recommendation from Husain, Anthropic, and Hebbia is to sidestep explicit numerical weighting:

**Husain's approach**: Rather than weighting criteria numerically, segment analysis by pipeline stage. "Early stage improvements have more impact since errors cascade in LLM chains." Use a **transition failure matrix** showing which workflow states precede failures to reveal "failure hotspots" and guide investment priorities. The weight is implicit in the cascade structure.

**Hebbia's approach**: Use the Required vs. Additional tier structure instead of numerical weights. Required criteria are pass/fail gates; additional criteria contribute to a composite quality score. This avoids the complexity of calibrating weights while still differentiating importance.

### When Explicit Weights Are Needed: Promptfoo's Approach

Promptfoo supports weighted assertions where the final score is calculated as the weighted average of all assertion scores. Their approach:

1. Define assertions with explicit `weight` values
2. Final score = weighted average of individual assertion scores
3. Support for derived metrics that calculate composite scores from named assertions after evaluation completes (e.g., F1 scores, custom formulas)

### The Analytical Hierarchy Process (AHP) for Complex Cases

For teams that truly need systematic weight assignment (e.g., regulatory contexts, multi-stakeholder products), the Analytic Hierarchy Process provides a structured framework:

1. **Structure the hierarchy**: Goal at top, criteria in middle, alternatives at bottom
2. **Pairwise comparison**: For each pair of criteria, ask "How much more important is criterion A than criterion B?" using a 1-9 scale
3. **Derive weights**: Mathematical synthesis produces a priority vector (weights that sum to 1.0)
4. **Consistency check**: Calculate consistency ratio; if > 0.1, the judgments contain contradictions and need revision

This is well-established in decision science but rarely cited in AI evaluation literature. It would be applicable when you have 5+ criteria and multiple stakeholders who disagree on priorities.

### Practical Recommendations for PMs

1. **Start without weights.** Use binary pass/fail on atomic criteria. Your initial priority should be identifying WHICH criteria matter, not how much.
2. **Use failure frequency as implicit weight.** The criteria that fail most often in production deserve the most attention. This is empirical, not theoretical.
3. **Graduate to tiered criteria** (Required / Nice-to-Have) when you have stable rubrics.
4. **Only use explicit numerical weights** when you need a single composite score for automated decision-making (e.g., auto-deploy gates, A/B test metrics).

### What Would Change This Recommendation?

If rigorous research showed that explicit weighting significantly improves eval-driven development velocity (e.g., teams with weighted rubrics ship better agents faster), the recommendation to avoid explicit weights would need revision. No such evidence exists in the current literature.

---

## 4. Multi-Agent Evaluation Patterns

**Confidence: HIGH** -- Anthropic and LangChain provide detailed primary evidence from real systems.

### Anthropic's Multi-Agent Research System Evaluation

From their June 2025 engineering blog post about their Research feature (Claude Opus 4 lead agent + Claude Sonnet 4 subagents):

**Evaluation Approach:**
- Started with ~20 test queries representing real usage patterns
- Used a single LLM call with a single prompt outputting scores from 0.0 to 1.0 and a pass/fail grade as the primary eval
- The LLM judge evaluated against five criteria: factual accuracy, citation accuracy, completeness, source quality, and tool efficiency
- This was "the most consistent and aligned with human judgments"

**Key Finding:** The multi-agent system outperformed single-agent Claude Opus 4 by 90.2% on their internal research eval. For breadth-first queries requiring multiple independent research directions, multi-agent approaches excelled.

**What Humans Caught That Automation Missed:**
- Hallucinations
- System failures
- Subtle source selection biases (agents preferring SEO-optimized content over authoritative academic PDFs)

### Evaluation Architecture for Multi-Agent Systems

Based on synthesis across Anthropic, Braintrust, and DeepEval:

**Layer 1: Individual Agent Evaluation**
- Each sub-agent is tested independently with its own dataset
- Graders match the sub-agent's responsibility (e.g., research agent graded on accuracy, writer agent graded on quality)

**Layer 2: Orchestration Evaluation**
- Does the orchestrator decompose tasks correctly?
- Does it route to the right sub-agents?
- Does it synthesize sub-agent outputs effectively?

**Layer 3: End-to-End System Evaluation**
- Grade the final output as experienced by the user
- Evaluate against the original query/goal
- Use "end-state evaluation rather than turn-by-turn analysis" (Anthropic)

**Layer 4: Efficiency Evaluation**
- Total token consumption
- Wall-clock time
- Number of agent invocations (was parallelization effective?)

### DeepEval's Multi-Agent Counting Rule

An important practical detail: "Only count the number of end-to-end interactions it takes for a task to complete." Agent-to-agent calls are treated as component-level interactions, not separate conversation turns. This prevents inflating multi-turn metrics with internal orchestration overhead.

### Anthropic's Adversarial Pattern: Evaluator-Optimizer

From their long-running agent work, Anthropic describes a three-agent architecture:
1. **Planner** agent creates the plan
2. **Generator** agent produces outputs
3. **Evaluator** agent provides critical feedback

The evaluator agent IS the eval mechanism -- it's built into the system architecture, not applied externally. This pattern produced "rich full-stack applications over multi-hour autonomous coding sessions."

### What Changes in 12 Months?

As models improve, the overhead of multi-agent orchestration may not be worth the complexity. If a single model can match multi-agent quality, the evaluation problem simplifies dramatically. The 90.2% improvement Anthropic cites is for current-generation models -- this gap may narrow.

---

## 5. Step-Level / Intermediate Evaluation

**Confidence: HIGH** -- Strong tooling support and well-documented patterns.

### LangChain's Five Evaluation Patterns for Deep Agents

From their "Evaluating Deep Agents" blog post:

**Pattern 1: Bespoke Test Logic Per Datapoint**
- Each test case requires custom success criteria
- Example: A calendar scheduling agent -- test whether it updated memory files correctly using regex or LLM-as-judge evaluation
- Key insight: Uniform eval criteria across all test cases is insufficient for agents

**Pattern 2: Single-Step Evaluations**
- Approximately half of LangChain's test cases involved single steps
- Use LangGraph's interrupt capabilities to pause before tool execution and inspect the agent's decision
- This lets you evaluate decisions without executing them (cheaper, faster)

**Pattern 3: Full Agent Turns**
Evaluate three dimensions of a complete execution:
- **Trajectory**: Were the right tools called in a reasonable order?
- **Final Response**: Was the output quality high?
- **State Artifacts**: Were files, databases, or other side effects correct?

**Pattern 4: Multi-Turn Conversations**
- Use conditional logic between turns (not hardcoded sequences)
- Check output after each turn and proceed only if it meets expectations
- Fail early if output deviates from expectations

**Pattern 5: Environment Setup**
- "Deep agent evals require environments that reset per test"
- Use Docker containers, temporary directories, or mocked APIs
- Mock external APIs via vcr (Python) or Hono proxies (JavaScript) to reduce cost and improve reproducibility

### LangChain AgentEvals Library

The `agentevals` open-source package provides concrete trajectory evaluation:

| Match Mode | What It Tests | When to Use |
|-----------|---------------|-------------|
| **Strict Match** | Identical tool call sequence in same order | Compliance-driven workflows |
| **Unordered Match** | All expected tools called, any order | When tool interdependencies don't require ordering |
| **Subset Match** | Trajectory contains at least the expected calls | Reference represents minimum requirements |
| **Superset Match** | Reference encompasses actual execution | Identifying optimized (shorter) paths |
| **LLM-as-Judge** | Overall quality and reasonableness | No strict requirements, evaluating nuanced quality |

### Braintrust's Step Evaluation Pattern

Braintrust recommends:
- Capture inputs and outputs at each step
- Use inline scorers triggered conditionally (e.g., run hallucination check only when tool calls don't occur)
- Test tool parameter accuracy separately from tool selection
- Evaluate retrieval relevance independently in RAG pipelines
- Snapshot production state for reproducible testing

### Arize Phoenix: Agent Trajectory Evaluation

Phoenix (open-source, OpenTelemetry-based) introduced in 2025:
- **Agent Trajectory Evaluation**: Assesses whether agents follow the right steps by evaluating the sequence of tool calls and reasoning steps
- **Agent Visibility**: Automatically visualizes agent runs as interactive flowcharts for debugging multi-agent systems
- Vendor-agnostic, supports OpenAI Agents SDK, Claude Agent SDK, LangGraph, CrewAI, and others

### Practical Recommendation for PMs

The most cost-effective approach: **Start with single-step evaluations** (Pattern 2). They catch the majority of issues -- wrong tool selection, bad parameters -- at minimal cost. Only invest in full trajectory evaluation after you have stable single-step evals passing consistently.

---

## 6. Tool Use Evaluation

**Confidence: HIGH** -- Strongly documented with concrete metrics and tooling.

### The Three Core Metrics (Amazon + DeepEval Consensus)

Amazon's agentic AI teams and DeepEval converge on three essential tool use metrics:

**1. Tool Selection Accuracy**
- Did the agent choose the correct tool for the task?
- DeepEval implementation: `ToolCorrectnessMetric` -- compares `tools_called` against `expected_tools`
- Supports ordering requirements (`should_consider_ordering`) and exact match (`should_exact_match`)
- Uses both deterministic and non-deterministic evaluation
- Score: 1.0 (all correct) to 0.0 (none correct)

**2. Tool Parameter / Argument Accuracy**
- Did the agent populate tool parameters correctly from context?
- DeepEval implementation: `ArgumentCorrectnessMetric` -- fully LLM-based, referenceless
- Evaluates whether arguments are logically derived from input context (not compared against expected values)
- Key insight: "Calling the right tool with wrong arguments is just as problematic as calling the wrong tool entirely"

**3. Multi-Turn Function Calling Accuracy**
- Are tools called in the correct sequence across conversation turns?
- Measures coherence of tool invocation sequences across an entire conversation
- Amazon uses golden datasets generated synthetically from historical API invocation logs

### DeepEval's Failure Mode Taxonomy for Tool Use

Three critical failure patterns to test for:

1. **The Ghost Action (False Task Completion)**: Agent claims successful tool execution without actually invoking tools. This is a hallucination-specific-to-agents risk -- the agent says "I've updated your calendar" but never called the calendar API.

2. **The Interrogation Loop (Parameter Extraction Failure)**: Agent cannot map natural language to tool parameter format and instead of erroring, it asks the user again and again. Test for this by measuring turn count before successful tool invocation.

3. **The Confident Fabricator (Intermediate Output Quality)**: Agent doesn't validate tool outputs before using them downstream, allowing bad data to propagate. Test by injecting known-bad tool responses and checking if the agent catches them.

### Promptfoo's Tool Evaluation Approach

Promptfoo enables:
- Logging every LLM call, tool use, and RAG retrieval
- Defining assertions on tool call outputs with weighted scoring
- Red-teaming tool use with adversarial inputs (the Target Discovery Agent automatically analyzes your AI system to craft targeted attacks)

### Practical Recommendation for PMs

Build a tool evaluation suite in three phases:

**Phase 1 (Week 1)**: Deterministic tool selection tests. For each tool, create 5-10 inputs where the expected tool is unambiguous. Measure tool selection accuracy.

**Phase 2 (Week 2-3)**: Argument correctness via LLM-as-judge. For each tool, create 5-10 inputs and have an LLM evaluate whether parameters were correctly extracted from context.

**Phase 3 (Ongoing)**: Failure mode detection. Specifically test for Ghost Actions, Interrogation Loops, and Confident Fabricators. These are agent-specific failure modes that traditional eval approaches miss entirely.

---

## 7. Context and Memory Evaluation

**Confidence: MEDIUM** -- Active research area with fragmented benchmarks and no dominant standard.

### The State of Agent Memory Evaluation

A comprehensive survey ("Memory in the Age of AI Agents," Dec 2025) found that "as research on agent memory rapidly expands, the field has become increasingly fragmented, with existing works differing substantially in their motivations, implementations, and evaluation protocols."

### Key Benchmarks

**LongMemEval (ICLR 2025)**
- 500 manually created questions testing five core memory abilities:
  1. Information Extraction
  2. Multi-Session Reasoning
  3. Temporal Reasoning
  4. Knowledge Updates
  5. Abstention (knowing when NOT to answer)
- Covers up to 1.5 million tokens across sessions
- Finding: State-of-the-art commercial systems achieve only 30-70% accuracy on memory tasks

**LoCoMo (Snap Research)**
- Very long-term conversations: 300 turns, ~9K tokens, up to 35 sessions
- Tests: Question answering, event summarization, multi-modal dialogue generation
- Provides conversation-level and session-level evaluation

**Context-Bench (Letta, Oct 2025)**
- Evaluates agentic context engineering: chaining file operations, tracing entity relationships, multi-step information retrieval
- Extended with Skills evaluation (discovering and loading relevant skills) and Recovery-Bench (recovering from errors and corrupted states)

### The Context Rot Problem

Research from Chroma ("Context Rot," 2025) found:
- Early and late context information achieves 85-95% accuracy
- Middle sections drop significantly
- Most models break much earlier than advertised -- a model claiming 200K tokens typically becomes unreliable around 130K

### Husain-Shankar Multi-Turn Evaluation Framework

Three aspects to evaluate in multi-turn conversations:

1. **Context and Memory**: Does the AI remember earlier parts of the conversation? How does behavior change as the conversation lengthens?
2. **Consistency**: Do responses align across turns without contradictions?
3. **Overall Session Goals**: Unlike single turn-response pairs, care about whether the entire session achieved the user's objective.

### Practical Recommendation for PMs

1. **Test memory persistence explicitly**: After 5, 10, and 20+ turns, ask the agent questions about information from turn 1-3. Measure recall accuracy.
2. **Test knowledge updates**: Give the agent information in turn 5, then CORRECT that information in turn 15. Does it use the updated version in turn 20?
3. **Test abstention**: Ask about information that was never provided. A good agent should say "I don't have that information" rather than hallucinate.
4. **Monitor context window utilization**: Track how many tokens your agent consumes per session and what happens when it approaches the limit.
5. **Test across context resets**: For long-running agents (Anthropic's multi-context-window pattern), test whether information survives compaction/summarization events.

### What Changes in 12 Months?

Context windows continue growing (1M+ tokens common). If context windows effectively become unlimited AND models maintain accuracy throughout, explicit memory management becomes less critical. However, the "context rot" research suggests this is unlikely near-term. The economic incentive for efficient context use (cost per token) also keeps this relevant.

---

## 8. Safety Evaluation Specific to Agents

**Confidence: HIGH** -- Well-documented by OWASP, OpenAI, and security researchers.

### Why Agent Safety is Different from Chatbot Safety

Chatbot safety focuses on content: toxicity, bias, harmful information. Agent safety adds an entirely new dimension: **action safety**. Agents can:
- Execute code
- Access databases
- Make API calls
- Modify files
- Interact with external services

This means a safety failure is not just a bad answer -- it is a bad action with real-world consequences.

### OWASP Top 10 for Agentic Applications (Dec 2025)

The OWASP GenAI Security Project released the definitive risk framework (100+ security researchers, year of development):

| Risk ID | Risk Name | What to Test |
|---------|-----------|--------------|
| ASI01 | Agent Goal Hijacking | Can manipulated instructions, tool outputs, or external content redirect the agent's objectives? |
| ASI02 | Tool Misuse & Exploitation | Can tools be invoked in unintended ways? Can a `create_user` tool with an "admin" boolean enable privilege escalation? |
| ASI03 | Identity & Privilege Abuse | Does the agent operate with minimum necessary permissions? Can it access resources beyond its scope? |
| ASI04 | Delegated Trust Boundaries | When the agent delegates to other agents/tools, are trust boundaries maintained? |
| ASI07 | Insecure Inter-Agent Communication | Can spoofed messages between agents misdirect entire clusters? |
| ASI08 | Cascading Failures | Do false signals propagate through automated pipelines with escalating impact? |
| ASI09 | Human-Agent Trust Exploitation | Can polished, confident explanations mislead human operators into approving harmful actions? |
| ASI10 | Rogue Agents | Does the agent exhibit misalignment, concealment, or self-directed action? |

### Quantified Risk: Prompt Injection

- Prompt injection appeared in 73% of production AI deployments in 2025 (OWASP)
- AIShellJack testing framework: 314 unique attack payloads covering 70 MITRE ATT&CK techniques
- Attack success rates reached 84% against GitHub Copilot and Cursor for executing malicious commands
- Palo Alto Networks Unit 42 tested 9 concrete attacks against CrewAI and AutoGen -- all worked across both frameworks, proving vulnerabilities are framework-agnostic

### OpenAI's Agent Safety Approach

OpenAI's Agents SDK provides:
- **Input guardrails**: Run on user's initial input (LLM-powered or rule-based)
- **Output guardrails**: Run on agent's final response
- Guardrails can be LLM-based (for reasoning tasks) or programmatic (regex, keyword detection)
- Preparedness Framework: won't release models crossing "Medium" risk threshold without sufficient safety interventions

### Safety Evaluation Checklist for PMs

**Tier 1: Baseline (Every Agent)**
- [ ] Prompt injection resistance testing (use promptfoo red-teaming or similar)
- [ ] Tool permission boundary testing (does the agent stay within allowed tool scope?)
- [ ] PII detection on inputs and outputs
- [ ] Content moderation on agent responses

**Tier 2: Production (Agents with Real-World Actions)**
- [ ] Privilege escalation testing (can the agent gain capabilities it shouldn't have?)
- [ ] Tool parameter injection (can malicious input reach tool parameters?)
- [ ] Cascading failure simulation (what happens when one tool returns bad data?)
- [ ] Human approval gates for high-risk actions (financial, data deletion, external communication)

**Tier 3: Advanced (Autonomous / Multi-Agent Systems)**
- [ ] Inter-agent message spoofing tests
- [ ] Rogue behavior detection (does the agent ever take actions not justified by its instructions?)
- [ ] Trust exploitation tests (can the agent convince a human to approve harmful actions?)
- [ ] Regular red-teaming exercises (quarterly for high-risk, after material changes)

### Who Would Disagree?

Teams building low-risk internal tools might argue this level of safety evaluation is overkill. Valid for truly low-risk cases. But the OWASP data shows that the attack surface of agents is framework-agnostic and larger than most teams expect. The risk is not theoretical.

---

## 9. Human-in-the-Loop Eval Patterns

**Confidence: HIGH** -- Well-established patterns with strong practical guidance.

### The Husain "Benevolent Dictator" Pattern

Hamel Husain's most distinctive recommendation: appoint a single domain expert as the definitive quality decision-maker. This eliminates annotation conflicts and prevents paralysis from too many perspectives.

When multiple annotators ARE necessary, the workflow is:
1. Draft initial rubrics with clear Pass/Fail definitions and examples
2. Each annotator independently labels a shared set of traces
3. Measure Inter-Annotator Agreement using Cohen's Kappa
4. Facilitate alignment sessions discussing disagreements
5. Refine rubrics iteratively until Kappa >= 0.6

### The Three-Phase Human Eval Lifecycle

**Phase 1: Discovery (Manual, Intensive)**
- Examine ALL test-case traces AND real user traces
- No automation -- pure human review
- Build data viewers that minimize friction: "Remove ALL friction from looking at data" (Husain)
- Tools: Shiny for Python, Gradio, Streamlit
- Capture binary good/bad ratings
- Enable in-context editing for fine-tuning curation

**Phase 2: Calibration (Human + LLM)**
- Use powerful models to generate binary correctness assessments
- Track model-human agreement iteratively (use spreadsheets initially)
- Measure precision and recall separately (raw agreement metrics mislead with imbalanced datasets)
- Refine critique prompts until alignment exceeds 90%

**Phase 3: Scaled Monitoring (LLM + Human Spot-Checks)**
- LLM-as-judge handles breadth
- Human review handles depth and edge cases
- Anthropic's multi-agent eval found that human oversight caught hallucinations and subtle source selection biases that automated testing missed
- Group similar sessions for reviewer efficiency
- Prioritize user journeys that align with core product value

### LangSmith's Annotation Workflow

LangSmith provides production-ready infrastructure:
- Annotation queues for human review
- Custom rubrics reflecting domain-specific quality definitions
- Inline scoring on full sessions
- Integration with pytest/Vitest for CI/CD
- Threshold-based pipeline gates

### Anthropic's Recommendation

From "Demystifying Evals": combine automated evals with five complementary methods:
1. **Production monitoring** (real-world behavior at scale)
2. **A/B testing** (user outcome validation)
3. **User feedback** (unanticipated issues)
4. **Manual transcript review** (subtle quality issues)
5. **Systematic human studies** (gold-standard grading for subjective tasks)

"You won't know if your graders are working well unless you read the transcripts and grades from many trials."

### Practical Recommendation for PMs

**Week 1**: Set up a data viewer. Even a simple spreadsheet with trace links, outputs, and a Pass/Fail column. Remove all friction from reviewing traces.

**Week 2-4**: Review 50+ traces yourself. Take open-ended notes. Build your failure taxonomy.

**Month 2**: Formalize rubrics. Have a second reviewer label 30 shared traces. Measure Kappa. Refine until >= 0.6.

**Month 3**: Deploy LLM-as-judge with your rubric. Measure alignment with your human labels. Refine until >= 90% agreement.

**Ongoing**: Human reviews 10-20% of traces weekly. LLM-as-judge handles the rest. Watch for criteria drift quarterly.

---

## 10. Eval-Driven Development for Agents

**Confidence: HIGH** -- Strong convergence across Anthropic, evaldriven.org, and multiple practitioners.

### The Core Principle

From evaldriven.org: "Eval-Driven Development shifts the focus from 'what we can build' to 'what we can prove.'" It establishes automated evaluation as a mandatory first-class engineering practice for probabilistic AI systems.

Anthropic's framing in "Demystifying Evals": "Practice eval-driven development: build evals before agent capabilities."

### The Ten Principles of EDD (evaldriven.org)

1. **Evaluation as Product**: Build assessment suites first; code is generated while evals are engineered
2. **Specify Correctness First**: Express "correct" as a deterministic function before writing prompts
3. **Statistical Rigor**: A single passing test proves nothing about a stochastic system -- require sample sizes, confidence intervals, and baselines
4. **CI Integration**: Evaluations must run automatically on every change, alongside linting and type-checking
5. **Architecture Alignment**: System boundaries should align with what can be independently measured
6. **Cost as Metric**: Token spend, latency, and compute count as evaluation dimensions
7. **Automate Human Judgment**: Extract manual reviews into codified rubrics and automated checks
8. **Ship Evals, Not Demos**: A demo proves something can work once; an eval proves it works reliably under distribution shift
9. **Version Control Everything**: Track eval definitions, datasets, thresholds, and results like production code
10. **Exploit the Eval Gap**: Most teams ship without rigorous evaluation -- this gap represents opportunity

### The EDD Workflow

```
1. Define what "correct" means (rubric/assertions)
2. Build the eval harness (dataset + grader + runner)
3. Run evals -- they should FAIL (no agent code yet)
4. Write/modify agent code
5. Run evals again -- measure improvement
6. Iterate until passing
7. Add to CI/CD pipeline
8. Monitor in production; when new failures surface, go to step 1
```

This mirrors Test-Driven Development's Red-Green-Refactor cycle but adds:
- Multiple trials per test case (statistical rigor for stochastic systems)
- Cost tracking as a first-class metric
- Continuous running even without code changes (model updates can cause regressions)

### Husain's Field Guide: Experiment-Based Roadmaps

Traditional roadmaps promise specific features by specific dates. AI development demands commitment to **experimental cadence** rather than predetermined outcomes.

**Capability Funnel Model:**
1. System responds at all
2. Generates executable outputs
3. Returns relevant results
4. Matches user intent
5. Provides optimal solutions

Each level is measurable and has distinct eval criteria. Progress through the funnel is not linear.

**Structured Experimentation (Eugene Yan's approach):**
- 2 weeks: Data feasibility analysis
- 1 month: Technical feasibility validation
- 6 weeks: Prototype development and testing

### The Industry Reality Check

From LangChain's State of Agent Engineering 2025 (1,340 respondents):
- 52.4% run offline evaluations on test sets
- Only 37.3% run online evals
- 22.8% of teams with agents in production are still NOT evaluating at all
- 89% have observability (logging/tracing) but observability without evals is "flying with instruments but no checklist"

This means adopting EDD is a genuine competitive advantage -- most teams are not doing it.

### Practical Recommendation for PMs

**Start small, but start**: "Ship Evals, Not Demos" does not mean you need comprehensive evaluation before building anything. It means:

1. Before building a new agent capability, write 5-10 test cases that define success
2. Set up automated eval runs (even if just a script + spreadsheet)
3. Make eval results visible to the team (dashboard, Slack alert, CI output)
4. Never ship a change that regresses eval scores without explicit product decision

**Cost tiering for evaluation runs:**
- **Fast smoke tests**: Every commit, 5-10 critical tests, deterministic graders only (~seconds, ~free)
- **Comprehensive suites**: Nightly, 50+ tests with LLM-as-judge (~minutes, ~$1-10/run)
- **Full regression**: Weekly, complete test set including multi-turn and adversarial (~hours, ~$10-100/run)

### What Would Change This Recommendation?

If frontier models became perfectly deterministic (same input always produces same output), EDD would collapse back into standard TDD. This is unlikely in the foreseeable future. The stochastic nature of LLMs is fundamental to their value.

---

## 11. Industry Survey Data: Where Teams Actually Are {#11-industry-survey-data}

**Source: LangChain State of Agent Engineering 2025** (1,340 respondents, Nov-Dec 2025)

| Metric | Percentage |
|--------|-----------|
| Agents in production | 57.3% |
| Developing agents for production | 30.4% |
| Have observability implemented | 89% |
| Run offline evaluations | 52.4% |
| Run online evaluations | 37.3% |
| Not evaluating at all (with agents in production) | 22.8% |
| Use human review for evals | 59.8% |
| Use LLM-as-judge for evals | 53.3% |
| Cite quality as top production barrier | 32% |

**Key Insight**: Quality is the #1 production barrier (32%), yet almost a quarter of teams with production agents don't evaluate at all. The gap between having observability (89%) and running evals (52%) reveals that many teams see their agent's behavior but don't systematically judge it.

---

## 12. Tool Landscape {#12-tool-landscape}

| Tool | Type | Key Strength | Best For |
|------|------|-------------|----------|
| **Braintrust** | Platform | Offline eval + production observability + datasets | Teams wanting integrated eval-to-production pipeline |
| **LangSmith** | Platform | LangChain integration, annotation queues, CI/CD | LangChain-based agent stacks |
| **Arize Phoenix** | Open Source | OpenTelemetry-based, vendor-agnostic, trajectory eval | Teams wanting open-source, multi-framework support |
| **Promptfoo** | Open Source (MIT) | CLI-first, weighted assertions, red-teaming | Fast eval iteration, security testing |
| **DeepEval** | Open Source | Agent-specific metrics (ToolCorrectness, ArgumentCorrectness) | Teams needing granular tool use evaluation |
| **LangChain AgentEvals** | Library | Trajectory matching (strict, unordered, subset, superset) | Teams building trajectory-specific evaluation |
| **OpenAI Evals API** | Platform | Trace grading, datasets, automated graders | OpenAI-based agent stacks |
| **Langfuse** | Open Source | Self-hosted, OpenAI Agents SDK support | Privacy-conscious teams, self-hosted requirements |

**Anthropic's guidance**: "Success depends more on eval task quality than framework selection." Do not over-invest in tooling before you have 20-50 high-quality test cases.

---

## 13. Gaps and Uncertainties {#13-gaps-and-uncertainties}

### What I Could Not Find or Verify

1. **Systematic weight assignment methodology specific to AI agents**: No primary source provides a rigorous, tested framework for assigning numerical weights to agent eval criteria. The Analytic Hierarchy Process is borrowed from decision science but I found no case study of it being applied to agent evaluation. **Confidence in gap: HIGH**.

2. **Longitudinal data on eval-driven development outcomes**: Claims that EDD produces better agents faster are widespread but I found no controlled study comparing teams using EDD vs. ad-hoc evaluation. The evidence is practitioner testimony, not experimental. **Confidence in gap: HIGH**.

3. **Standardized memory evaluation for production agents**: LongMemEval, LoCoMo, and Context-Bench exist as research benchmarks but none has become a standard for production agent memory testing. The field is "increasingly fragmented." **Confidence in gap: HIGH**.

4. **Multi-agent eval at scale**: Anthropic's multi-agent eval work used ~20 test queries. There is limited published data on evaluating multi-agent systems at production scale (thousands of queries, dozens of sub-agents). **Confidence in gap: MEDIUM** -- companies may be doing this internally without publishing.

5. **Cost-benefit data for different eval granularities**: When is step-level evaluation worth the investment vs. end-to-end only? I found no empirical comparison of defect detection rates at different evaluation granularities. **Confidence in gap: HIGH**.

6. **Agent safety evaluation maturity**: OWASP provides the risk taxonomy, but production-ready safety evaluation suites (beyond promptfoo red-teaming) are immature. Most teams rely on manual penetration testing. **Confidence in gap: MEDIUM**.

7. **Eval methodology for creative/generative agents**: All robust evaluation frameworks focus on agents with verifiable outcomes (coding, research, customer support). Evaluation of agents producing creative work (ad copy, art direction, design) remains underspecified. **Confidence in gap: HIGH** -- this is directly relevant to the Creative Agent product.

### Counter-Arguments and Tensions

**Tension 1: "Grade outcomes, not paths" vs. "Evaluate intermediate steps"**
Anthropic says grade outcomes. LangChain says evaluate trajectories. These are not contradictory but they require different investments. Start with outcome evaluation; add trajectory evaluation only when outcome evaluation passes but users report quality issues.

**Tension 2: "Start with 20 test cases" vs. "Statistical rigor requires large samples"**
Both are correct at different stages. 20 cases suffice for detecting large effect sizes in early development. As your agent matures and changes have smaller effects, you need hundreds or thousands of cases to detect regressions with confidence.

**Tension 3: "Binary scoring" vs. "Partial credit"**
Husain advocates binary. Anthropic recommends partial credit for multi-component tasks. Resolution: Use binary for individual criteria, then combine binary scores across criteria for a composite (which naturally produces partial credit at the task level).

---

## Sources

### Primary Sources (Firsthand Knowledge, High Authority)

- [Anthropic: Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) -- Anthropic Engineering Blog, 2025
- [Anthropic: How We Built Our Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) -- Anthropic Engineering Blog, June 2025
- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) -- Anthropic Research, December 2024
- [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) -- Anthropic Engineering Blog, November 2025
- [Hamel Husain: Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/) -- hamel.dev, 2024
- [Hamel Husain: LLM Evals FAQ](https://hamel.dev/blog/posts/evals-faq/) -- hamel.dev, January 2026
- [Hamel Husain: A Field Guide to Rapidly Improving AI Products](https://hamel.dev/blog/posts/field-guide/) -- hamel.dev, 2025
- [Hamel Husain & Shreya Shankar: AI Evals for Engineers & PMs](https://maven.com/parlance-labs/evals) -- Maven Course, 2025
- [Hamel Husain & Shreya Shankar on Lenny's Newsletter](https://www.lennysnewsletter.com/p/why-ai-evals-are-the-hottest-new-skill) -- Lenny's Newsletter, 2025

### Platform and Tooling Documentation

- [Braintrust: Evaluating Agents Best Practices](https://www.braintrust.dev/docs/best-practices/agents) -- Braintrust Docs
- [Braintrust: How to Eval](https://www.braintrust.dev/articles/how-to-eval) -- Braintrust Articles
- [LangChain: Evaluating Deep Agents](https://blog.langchain.com/evaluating-deep-agents-our-learnings/) -- LangChain Blog, 2025
- [LangChain AgentEvals](https://github.com/langchain-ai/agentevals) -- GitHub
- [LangSmith: Trajectory Evaluations](https://docs.langchain.com/langsmith/trajectory-evals) -- LangSmith Docs
- [LangSmith: Multi-turn Evals](https://blog.langchain.com/insights-agent-multiturn-evals-langsmith/) -- LangChain Blog
- [DeepEval: AI Agent Evaluation Guide](https://deepeval.com/guides/guides-ai-agent-evaluation) -- DeepEval Docs
- [DeepEval: Tool Correctness](https://deepeval.com/docs/metrics-tool-correctness) -- DeepEval Docs
- [DeepEval: Argument Correctness](https://deepeval.com/docs/metrics-argument-correctness) -- DeepEval Docs
- [Promptfoo: Evaluate Coding Agents](https://www.promptfoo.dev/docs/guides/evaluate-coding-agents/) -- Promptfoo Docs
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) -- GitHub
- [OpenAI: Agent Evals](https://platform.openai.com/docs/guides/agent-evals) -- OpenAI Platform Docs

### Industry Frameworks and Research

- [Hebbia: Hybrid Deterministic and Rubric-Based Framework](https://www.hebbia.com/blog/evaluating-ai-agents-a-hybrid-deterministic-and-rubric-based-framework) -- Hebbia Blog, 2025
- [Eval-Driven Development](https://evaldriven.org/) -- evaldriven.org
- [LangChain: State of Agent Engineering 2025](https://www.langchain.com/state-of-agent-engineering) -- LangChain
- [OWASP Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) -- OWASP GenAI Security Project, December 2025
- [Amazon: Evaluating AI Agents - Real-World Lessons](https://aws.amazon.com/blogs/machine-learning/evaluating-ai-agents-real-world-lessons-from-building-agentic-systems-at-amazon/) -- AWS ML Blog

### Memory and Context Research

- [Letta: Context-Bench](https://www.letta.com/blog/context-bench) -- Letta Blog, October 2025
- [LongMemEval (ICLR 2025)](https://arxiv.org/abs/2410.10813) -- arXiv
- [Memory in the Age of AI Agents](https://arxiv.org/abs/2512.13564) -- arXiv, December 2025
- [Chroma: Context Rot](https://research.trychroma.com/context-rot) -- Chroma Research

### Safety

- [OWASP GenAI Security Project: Agentic AI Risks](https://genai.owasp.org/2025/12/09/owasp-genai-security-project-releases-top-10-risks-and-mitigations-for-agentic-ai-security/) -- OWASP, December 2025
- [Trail of Bits: Prompt Injection to RCE in AI Agents](https://blog.trailofbits.com/2025/10/22/prompt-injection-to-rce-in-ai-agents/) -- Trail of Bits Blog, October 2025
- [OpenAI: Safety in Building Agents](https://platform.openai.com/docs/guides/agent-builder-safety) -- OpenAI Platform Docs

### Secondary / Synthesis Sources

- [Confident AI: Definitive AI Agent Evaluation Guide](https://www.confident-ai.com/blog/definitive-ai-agent-evaluation-guide) -- Confident AI Blog
- [LLM Evals Course Lesson 4: Multi-turn and Collaborative Evaluation](https://thingsithinkithink.blog/posts/2025/08-21-llm-evals-course-lesson-4-multiturn-collaborative-evaluation/) -- Blog post
- [SD Architect: The Case for Eval-Driven Development](https://sdarchitect.blog/2025/10/21/ai-agents-the-case-for-eval-driven-development/) -- Blog post
- [Encord: Rubric Evaluation Framework](https://encord.com/rubric-evaluation-generative-ai-assessment/) -- Encord Blog
- [Red Hat: Eval-Driven Development](https://developers.redhat.com/articles/2026/03/23/eval-driven-development-build-evaluate-ai-agents) -- Red Hat Developer, March 2026
