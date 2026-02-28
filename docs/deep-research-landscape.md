# Deep Research Systems: Architecture & Landscape Analysis

> Research compiled 2026-02-24. Covers published architectures, academic papers, and open-source implementations of "deep research" agentic systems.

---

## Table of Contents

1. [What is "Deep Research"?](#1-what-is-deep-research)
2. [OpenAI Deep Research](#2-openai-deep-research)
3. [Google Gemini Deep Research](#3-google-gemini-deep-research)
4. [Perplexity Deep Research](#4-perplexity-deep-research)
5. [The ReAct Pattern](#5-the-react-pattern)
6. [Academic Foundations](#6-academic-foundations)
7. [Open-Source Implementations](#7-open-source-implementations)
8. [Cross-System Comparison](#8-cross-system-comparison)
9. [Architectural Patterns & Design Decisions](#9-architectural-patterns--design-decisions)
10. [Key Takeaways for Implementation](#10-key-takeaways-for-implementation)

---

## 1. What is "Deep Research"?

Deep research refers to agentic AI systems that decompose complex queries into constituent workflows, iteratively search for diverse information sources, and synthesize the resulting evidence into structured, cited reports. These systems integrate multi-step planning and reasoning with autonomous retrieval and evaluation of external information.

The core loop shared by all deep research systems:

```
Query --> Decompose --> Plan --> [Search --> Read --> Evaluate --> Re-plan] (loop) --> Synthesize --> Report
```

Key differentiators from simple RAG:
- **Multi-step**: Dozens to hundreds of tool calls per query
- **Autonomous planning**: The agent decides what to search next
- **Iterative refinement**: Findings from early searches inform later queries
- **Self-evaluation**: The agent assesses quality and completeness before synthesizing
- **Long-running**: Tasks take minutes (not seconds), operating more like a research analyst than a chatbot

---

## 2. OpenAI Deep Research

### 2.1 Overview

OpenAI's Deep Research launched February 2025 as a ChatGPT Pro feature. It is powered by a specialized version of the o3 reasoning model, optimized for web browsing and data analysis. It can browse, read, and analyze text, images, and PDFs across the web.

**Key stats:**
- 5-30 minutes per research task
- Trained via reinforcement learning (same methods as o1)
- Hundreds of reasoning steps per task
- Sources: OpenAI blog, system card (cdn.openai.com/deep-research-system-card.pdf)

### 2.2 Multi-Agent Architecture

OpenAI uses a **multi-agent pipeline** with distinct specialized agents that hand off to each other:

```
User Query
    |
    v
[Triage Agent] -- Routes based on query complexity
    |           \
    |            v
    |     [Clarification Agent] -- Asks 2-3 clarifying questions
    |            |
    v            v
[Instruction Agent] -- Enriches the prompt with structure/expectations
    |
    v
[Research Agent] -- o3-deep-research model with web search + MCP tools
    |
    v
Structured Report with Citations
```

**Agent roles:**

| Agent | Model | Purpose |
|-------|-------|---------|
| Triage Agent | GPT-4-series | Front door routing; decides if clarification needed |
| Clarification Agent | GPT-4-series | Gathers missing context via 2-3 targeted questions |
| Instruction Agent | GPT-4-series | Enriches prompt with structure, expectations, format |
| Research Agent | o3-deep-research | Executes multi-step research with tool use |

**Handoff mechanism:** In the OpenAI Agents SDK, a handoff is a typed tool/function call. When an agent calls a handoff function, execution immediately transfers to the new agent along with the full conversation state. The system loops: if the response has a handoff, it sets the active agent and restarts; if it has tool calls, it processes them and loops again. A `max_turns` parameter caps the loop.

### 2.3 The Research Agent's Inner Loop

The research agent (o3-based) operates its own internal agentic loop:

1. **Plan**: Formulate a research plan based on the enriched query
2. **Search**: Execute web searches via Bing-based web grounding
3. **Read**: Parse and interpret results (text, images, PDFs)
4. **Reason**: Extended chain-of-thought reasoning about findings
5. **Pivot**: If findings reveal new angles or gaps, modify the plan
6. **Repeat**: Continue until sufficient evidence gathered
7. **Synthesize**: Produce structured report with citations and reasoning trail

The o3 model's key capability is maintaining extended chains of thought -- sometimes hundreds of steps -- without diverging or hallucinating. This is trained via reinforcement learning on real-world tasks requiring browser and Python tool use.

### 2.4 Termination Criteria

OpenAI provides a `max_tool_calls` parameter to control the total number of tool calls (web search, MCP server queries) before the model returns a result. Beyond this hard limit, the model uses learned heuristics (from RL training) to determine when it has gathered sufficient evidence.

### 2.5 Quality Checking

- Full reasoning trail is auditable (internal prompts + reasoning trace exposed)
- Citations are linked to source material
- The model can be interrupted mid-research to refine focus
- Extended reasoning allows the model to self-check consistency

### 2.6 Evolution: Unified ChatGPT Agent (July 2025)

OpenAI later merged Deep Research with Operator into a single agent with access to a virtual computer (text browsing, visual browsing, terminal access, API integrations), all with shared state. This agent can perform tasks lasting up to an hour, fluidly shifting between reasoning and action.

---

## 3. Google Gemini Deep Research

### 3.1 Overview

Google's Gemini Deep Research is available in the Gemini consumer app and via the Interactions API. Currently powered by Gemini 3 Pro, it uses a fundamentally different architecture from OpenAI: a **single-agent system** optimized end-to-end with reinforcement learning.

### 3.2 Single-Agent Architecture

Google deliberately chose a single-agent architecture over multi-agent for a critical reason: **end-to-end RL optimization**.

```
User Query
    |
    v
[Gemini 3 Pro -- Single Unified Agent]
    |
    |--- google_search (tool)
    |--- url_context (tool)
    |--- (planned: tool_code_execution)
    |
    v
Research Plan --> Iterative Search Loop --> Synthesized Report
```

**Why single-agent wins for RL:**
- Direct end-to-end reinforcement learning optimization across the entire workflow
- No coordination overhead between agents
- Smoother integration of reasoning, planning, and tool invocation
- The unified model can be jointly optimized for research quality
- RL rewards good sequences of tool calls and research decisions holistically

In multi-agent architectures, each agent is trained or prompted separately, making it difficult to optimize the full pipeline end-to-end. Google's approach trains a single model where planning, searching, reading, and synthesis are all part of one reward signal.

### 3.3 The Research Loop

Gemini Deep Research follows this iterative cycle:

1. **Plan formulation**: Break the complex query into a detailed multi-step research plan
2. **User review** (consumer app): Present the plan for user refinement (not yet in API)
3. **Iterative execution**:
   - Formulate search queries
   - Read and parse results
   - Ground itself on all information gathered so far
   - Identify knowledge gaps and discrepancies
   - Search again with refined queries
4. **Dynamic re-planning**: If new concepts are discovered, the plan is modified in real-time with new branches
5. **Synthesis**: Compile findings into a structured report

### 3.4 Asynchronous Task Manager

Google developed a novel asynchronous task manager to handle failures in long-running research tasks:

- Maintains **shared state** between the planner and task execution
- Enables **graceful error recovery** without restarting the entire task
- Handles multiple simultaneous sub-tasks
- Critical for reliability in tasks that can run for many minutes

This is an infrastructure-level innovation -- most other systems restart from scratch on failure.

### 3.5 Key Technical Differentiators

| Feature | Detail |
|---------|--------|
| Architecture | Single-agent with end-to-end RL |
| Model | Gemini 3 Pro |
| Tools | google_search, url_context |
| Context window | Large-scale context windows with RAG ensembles |
| Planning | Interactive (consumer); autonomous (API) |
| Error recovery | Asynchronous task manager with shared state |
| Training | Multi-step RL for search autonomy |

### 3.6 Depth vs. Breadth

Gemini's RL training allows it to learn optimal depth-vs-breadth tradeoffs from data rather than hard-coding them. The model learns when to dive deeper into a topic vs. when to broaden the search -- this emerges from the reward signal during RL training rather than being programmed.

---

## 4. Perplexity Deep Research

### 4.1 Overview

Perplexity's Deep Research uses a customized version of DeepSeek R1 (open-source foundation) optimized for multi-step retrieval, synthesis, and reasoning. It features a 200,000 token context window and is integrated into the Sonar API as `sonar-deep-research`.

### 4.2 Architecture: Retrieval-Reasoning-Refinement Cycle

Perplexity operates a five-stage pipeline:

```
1. QUERY DECOMPOSITION
   Split the original question into sub-topics
       |
2. RETRIEVAL
   Each sub-topic triggers dedicated parallel searches
       |
3. SYNTHESIS
   Partial answers written into structured notes
       |
4. VERIFICATION
   Conflicting claims flagged and double-checked
       |
5. FINAL SYNTHESIS
   Single narrative with citations and reliability notes
```

### 4.3 Parallel Execution

A critical architectural choice: Perplexity parallelizes search, analysis, and synthesis phases using a TTC (Test-Time Compute) framework. This cuts average report times to 2-4 minutes -- significantly faster than competitors.

- Dozens of parallel web searches per query
- 3-5 sequential search rounds to refine queries as it learns what data is missing
- Cross-references findings for consistency before synthesis
- Retains findings between sub-queries to avoid revisiting irrelevant pages

### 4.4 Multi-Model Routing

Perplexity is not tied to a single model -- it operates as a multi-engine platform that dynamically routes queries to different engines depending on the task type (conversational, research, coding, enterprise). For deep research specifically, it combines:

- Best available reasoning models (currently DeepSeek R1 customized)
- Proprietary search tools and browser infrastructure
- Code execution capabilities
- Purpose-built agentic orchestration layer

### 4.5 Quality and Contradiction Handling

- **Cross-referencing**: Information from different sources is systematically compared to identify consistencies, contradictions, and gaps
- **Claim-level verification**: Each claim is scored based on source credibility (peer-reviewed vs. blog posts) and consistency with other data
- **Reliability annotations**: The final report includes reliability notes alongside citations
- **Re-search on contradiction**: If the system detects insufficient data or contradictory findings, it triggers additional searches or updated topic decomposition

### 4.6 DRACO Benchmark

Perplexity published DRACO (Deep Research Accuracy, Completeness, and Objectivity), a benchmark for evaluating deep research agents:

- **100 complex tasks** across 10 domains (Academic, Finance, Law, Medicine, Technology, etc.)
- **40 countries** represented in information sources
- **~40 evaluation criteria** per task in expert-crafted rubrics
- **26 domain experts** (MDs, JDs, financial analysts, engineers) validated rubrics
- **Evaluation dimensions**: Factual accuracy, breadth/depth of analysis, presentation quality, citation quality
- Tasks sampled from millions of production deep research requests
- Model-agnostic evaluation harness

---

## 5. The ReAct Pattern

### 5.1 Origin

ReAct (Reason + Act) was introduced by Yao et al. (2022) at ICLR 2023 in "ReAct: Synergizing Reasoning and Acting in Language Models" (arXiv:2210.03629). It is the foundational pattern underlying all modern deep research agents.

### 5.2 Core Loop

```
Thought  -->  Action  -->  Observation  -->  Thought  -->  Action  -->  ...
   |              |              |
   |              |              +-- Feedback from environment (search results, page content)
   |              +-- Interface with external tools (search, browse, compute)
   +-- Reasoning trace (plan, analyze, track progress, handle exceptions)
```

The model generates **interleaved** reasoning traces and actions:
- **Thoughts**: Decompose goals, inject commonsense knowledge, extract key information from observations, track progress, handle exceptions
- **Actions**: Interface with external APIs/tools (search, lookup, browse)
- **Observations**: Feedback from the environment after each action

### 5.3 Why ReAct Matters for Deep Research

ReAct provides the theoretical foundation that deep research agents build upon:

1. **Reasoning supports retrieval targeting**: The model reasons about *what* to search for next based on what it has learned so far
2. **Actions ground reasoning**: External information prevents hallucination and error propagation (vs. pure chain-of-thought)
3. **Iterative refinement**: The thought-action-observation loop naturally supports multi-step research
4. **Interpretability**: Reasoning traces create an auditable record of the agent's decision-making
5. **Error recovery**: The model can detect when an action failed and adjust its approach

### 5.4 Limitations of Vanilla ReAct for Deep Research

Modern deep research systems extend ReAct in several ways:

| Limitation | Extension |
|-----------|-----------|
| Linear sequence of steps | Tree-structured exploration with branching |
| Single tool per step | Parallel tool calls and batched search |
| No explicit planning phase | Dedicated plan-then-execute architecture |
| No quality evaluation | Self-reflective evaluation before synthesis |
| Context grows quadratically | Knowledge distillation (Tavily approach) |
| No error recovery | Asynchronous task managers (Gemini approach) |

---

## 6. Academic Foundations

### 6.1 Agentic RAG Survey (Singh et al., 2025)

**Paper**: "Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG" (arXiv:2501.09136)

Taxonomy of architectures:

| Architecture | Description |
|-------------|-------------|
| **Single-Agent Agentic RAG** | One agent orchestrates all data sources and tools, then synthesizes |
| **Multi-Agent Agentic RAG** | Coordinator delegates to specialized sub-agents (SQL, semantic search, web) |
| **Hierarchical Agentic RAG** | Layered tiers; upper agents allocate to domain-specialized junior agents |
| **Corrective Agentic RAG** | Agents evaluate and refine outputs through validation, error correction, re-retrieval |
| **Adaptive Agentic RAG** | Dynamically adjusts retrieval strategy based on query complexity |
| **Graph-based Agentic RAG** | Uses knowledge graphs for structured multi-hop reasoning |

Key design patterns from the survey:
- **Reflection**: Agents iteratively evaluate and refine outputs via self-feedback
- **Planning**: Decompose complex tasks into structured subtasks for multi-hop reasoning
- **Tool use**: Dynamic selection among search, computation, and specialized tools
- **Multi-agent collaboration**: Specialized agents coordinate via message passing

### 6.2 CRAG: Corrective Retrieval Augmented Generation (Yan et al., 2024)

**Paper**: arXiv:2401.15884

CRAG introduces a **retrieval evaluator** that classifies document relevance into three categories:

```
Retrieved Documents --> [Retrieval Evaluator] --> Confidence Score
                                                      |
                                    +-------+---------+---------+
                                    |       |                   |
                                 Correct  Ambiguous          Incorrect
                                    |       |                   |
                                    v       v                   v
                              Use docs   Refine +          Trigger web
                                         web search        search only
```

Key innovation: **decompose-then-recompose** algorithm for knowledge refinement:
1. Decompose retrieved documents into fine-grained knowledge strips
2. Filter irrelevant strips using the evaluator
3. Recompose remaining strips into refined context
4. If insufficient, augment with web search results

This pattern is directly applicable to the verification stage of deep research systems.

### 6.3 STORM: Stanford's Outline-Driven Research Agent

**Paper**: "Assisting in Writing Wikipedia-like Articles From Scratch" (arXiv:2402.14207)

STORM (Synthesis of Topic Outlines through Retrieval and Multi-perspective Question Asking) models the pre-writing research process:

1. **Perspective discovery**: Survey existing articles on similar topics to identify diverse viewpoints
2. **Simulated conversations**: Simulate dialogues between a "Wikipedia writer" (carrying a specific perspective) and a "topic expert" (grounded in internet sources)
3. **Follow-up questioning**: The writer updates understanding and asks follow-up questions
4. **Outline generation**: Curate collected information into a structured outline
5. **Article generation**: Write the full article following the outline

**Key insight**: By decomposing research into perspective-guided conversations, STORM produces articles that are 25% more organized and broader in coverage than outline-driven retrieval baselines.

### 6.4 Self-Refine (Madaan et al., 2023)

The Self-Refine pattern implements iterative self-improvement:

```
Generate --> Feedback --> Refine --> Feedback --> Refine --> ... --> Final Output
```

- No external training or supervision needed -- uses the same LLM
- FEEDBACK step critiques the current output
- REFINE step incorporates the critique
- 5% to 40% improvement over direct generation (even with GPT-4)

This pattern maps directly to the verification/refinement stages of deep research.

### 6.5 Deep Research Agents Survey (arXiv:2506.18096)

**Paper**: "Deep Research Agents: A Systematic Examination And Roadmap" (2025)

This comprehensive survey proposes a taxonomy along several dimensions:

**Workflow types:**
- **Static workflows**: Human-defined task pipelines (requirement processing -> retrieval -> parsing -> summary). Agents execute within predefined stages.
- **Dynamic workflows**: Agent autonomously decides the sequence of operations based on intermediate results. Planning, tool invocation, and execution are integrated into a unified reasoning loop.

**Architecture comparison:**

| Dimension | Single-Agent | Multi-Agent |
|-----------|-------------|-------------|
| Coordination | None needed | Message passing / handoffs |
| RL optimization | End-to-end | Per-agent only |
| Specialization | One model does everything | Dedicated models per role |
| Scalability | Limited by single model | Can add specialized agents |
| Coherence | Naturally coherent | Requires coordination protocols |
| Error handling | Simpler | Complex but more fault-tolerant |

**Information acquisition strategies:**
- API-based retrieval (search APIs, structured data)
- Browser-based exploration (visual browsing, interaction)
- Hybrid approaches

### 6.6 Reasoning Agentic RAG: System 1 vs System 2 (arXiv:2506.10408)

This survey draws on Kahneman's dual-process theory:

- **System 1 RAG**: Fast, automatic retrieval-generation (standard RAG)
- **System 2 RAG**: Slow, deliberate, multi-step reasoning with planning (deep research)

Deep research agents operate firmly in System 2 territory, using deliberate reasoning to:
- Plan retrieval strategies
- Evaluate source quality
- Resolve contradictions
- Synthesize across sources
- Self-check for completeness

---

## 7. Open-Source Implementations

### 7.1 Hugging Face Open Deep Research (smolagents)

- Replication of OpenAI's Deep Research using smolagents framework
- Achieves 55% pass@1 on GAIA benchmark (vs. 67% for OpenAI's)
- Uses CodeAgent (writes actions as Python code snippets)
- Simple text-based web browser (not full visual browser)
- Agent logic fits in ~1,000 lines of code
- Key insight: framework simplicity matters; lean into model autonomy

### 7.2 LangChain open_deep_research (LangGraph)

- Built on LangGraph for workflow orchestration
- Architecture: planner constructs section-by-section research plan
- Each section created by searching and writing in parallel
- Explicit plan --> parallel execution --> merge pattern

### 7.3 Tavily Deep Research

Tavily's approach includes a key architectural innovation around **context management**:

**Problem with standard ReAct for research**: In a traditional ReAct loop, all tool call inputs and outputs propagate through the conversation context. For deep research with dozens of searches, this creates **quadratic token growth** that exhausts context windows.

**Tavily's solution -- Knowledge Distillation**:
- After each tool call, distill the output into a compact "reflection" or summary
- Only the set of past reflections (not raw tool outputs) are used as context for future steps
- This transforms quadratic token propagation into linear growth
- Reflections are aggregated as a linear series, not a growing conversation history

```
Search 1 --> Distill to Reflection 1
Search 2 --> Distill to Reflection 2
...
Search N --> Distill to Reflection N

Context = [Reflection 1, Reflection 2, ..., Reflection N]  (linear)
Instead of: [Search 1 input, Search 1 output, Search 2 input, Search 2 output, ...]  (quadratic)
```

This is a critical insight for building production deep research systems that need to perform many search iterations without exhausting context.

---

## 8. Cross-System Comparison

### 8.1 Architecture Comparison

| Dimension | OpenAI | Gemini | Perplexity |
|-----------|--------|--------|------------|
| **Agent architecture** | Multi-agent (triage, clarify, instruct, research) | Single-agent with end-to-end RL | Multi-model routing with agentic orchestration |
| **Base model** | o3-deep-research (reasoning model) | Gemini 3 Pro | DeepSeek R1 (customized) |
| **Search backend** | Bing web grounding | Google Search + url_context | Proprietary search infrastructure |
| **Planning** | Implicit in o3 reasoning | Explicit plan shown to user (consumer) | Query decomposition into sub-topics |
| **Parallelism** | Sequential agent handoffs | Asynchronous task manager | Parallel search + TTC framework |
| **Execution time** | 5-30 minutes | Minutes | 2-4 minutes |
| **Context strategy** | Extended attention in o3 | Large context windows + RAG ensembles | 200K token context window |
| **Training method** | RL on browser + Python tasks | End-to-end multi-step RL | Model fine-tuning + proprietary search |
| **Quality control** | Auditable reasoning trail | RL-optimized decisions | Cross-referencing + claim-level verification |
| **Error recovery** | Agent handoff retry | Async task manager with shared state | Re-search on contradiction |

### 8.2 Question Decomposition Strategies

| System | Approach |
|--------|----------|
| **OpenAI** | Enrichment via multi-agent pipeline (triage -> clarify -> instruct), then o3 internally decomposes during reasoning |
| **Gemini** | Single model formulates a multi-step plan with sub-tasks, presented to user for review |
| **Perplexity** | Explicit query decomposition into sub-topics, each triggering dedicated search paths |
| **STORM** | Perspective discovery from similar articles, then simulated expert conversations per perspective |
| **LangChain** | Section-by-section plan with parallel execution per section |

### 8.3 Search vs. Synthesize Decision

| System | How it decides |
|--------|---------------|
| **OpenAI** | o3's extended reasoning evaluates evidence sufficiency; `max_tool_calls` as hard limit |
| **Gemini** | RL-trained policy learns when to stop; agent grounds itself on all gathered info and identifies remaining gaps |
| **Perplexity** | 3-5 sequential search rounds; stops when cross-referencing finds consistent coverage |
| **ReAct** | Each thought-action-observation cycle includes explicit reasoning about whether to continue or conclude |
| **CRAG** | Retrieval evaluator classifies confidence as Correct/Ambiguous/Incorrect; triggers re-search on Ambiguous/Incorrect |

### 8.4 Contradiction Handling

| System | Approach |
|--------|----------|
| **OpenAI** | Extended reasoning traces allow o3 to explicitly reason about conflicting information |
| **Gemini** | Identifies discrepancies during grounding step; modifies research plan to explore conflicts |
| **Perplexity** | Verification stage flags conflicting claims; triggers additional searches; includes reliability notes |
| **CRAG** | Retrieval evaluator detects ambiguity; triggers web search augmentation |
| **General pattern** | All systems follow: detect contradiction -> search for additional evidence -> reason about which sources are more credible -> note uncertainty in output |

---

## 9. Architectural Patterns & Design Decisions

### 9.1 Pattern: Plan-Search-Synthesize Loop

The most common pattern across all systems:

```
         +---> Search ----+
         |                |
Plan ----+---> Search ----+---> Evaluate ----+---> Synthesize
         |                |                  |
         +---> Search ----+            (if gaps found)
                                             |
                                        Re-plan + Loop
```

### 9.2 Pattern: Knowledge Distillation (Tavily)

For systems that need many iterations without context overflow:

```
Tool Output --> Distill to Reflection --> Add to Reflection Store
                                              |
                                    [Only reflections in context]
                                              |
                                    Next reasoning step uses reflections
```

### 9.3 Pattern: Multi-Agent Pipeline (OpenAI)

For systems that benefit from role specialization:

```
[Router] --> [Specialist A] --> [Specialist B] --> [Executor]
   ^              |                   |                |
   |              v                   v                v
   +-------- Handoff -----------  Handoff -------- Output
```

Tradeoffs:
- (+) Each agent can be optimized for its role
- (+) Modular, composable, easy to add new specialists
- (-) Handoff overhead and coordination costs
- (-) Cannot optimize end-to-end with RL across agents

### 9.4 Pattern: Single-Agent RL Loop (Gemini)

For systems that prioritize end-to-end optimization:

```
[Unified Model] --> tool_call --> observation --> reasoning --> tool_call --> ...
       ^                                                           |
       |                                                           |
       +------- RL reward signal based on final output quality ----+
```

Tradeoffs:
- (+) End-to-end RL optimization
- (+) No coordination overhead
- (+) Naturally coherent reasoning
- (-) Single model must handle all roles
- (-) Harder to scale to new capabilities
- (-) Requires massive RL training infrastructure

### 9.5 Pattern: Corrective Retrieval (CRAG)

For systems that need robust quality control:

```
Retrieved docs --> Evaluator --> Confidence score
                                     |
                    +--------+-------+--------+
                    |        |                |
                 Correct   Ambiguous       Incorrect
                    |        |                |
                 Use as-is  Refine +       Discard +
                            web search     web search only
```

### 9.6 Pattern: Perspective-Guided Research (STORM)

For systems that need comprehensive coverage:

```
Topic --> Discover perspectives from similar articles
                |
          [Perspective 1] --> Simulated conversation with expert --> Notes
          [Perspective 2] --> Simulated conversation with expert --> Notes
          [Perspective N] --> Simulated conversation with expert --> Notes
                |
          Curate into outline --> Generate article
```

### 9.7 Decision: Depth vs. Breadth

Systems handle the depth-vs-breadth tradeoff in three ways:

1. **Learned from RL** (Gemini): The RL reward signal teaches the model when to go deeper vs. broader. No explicit parameter.

2. **Explicit parameters** (Open-source agents, APIs): Expose `depth` (number of iterations) and `breadth` (number of search queries per round) as user-configurable knobs.

3. **Implicit in reasoning** (OpenAI o3): The extended reasoning capability allows the model to explicitly reason about whether to explore more topics or dive deeper into current ones.

### 9.8 Decision: When to Stop

Termination strategies:

| Strategy | Used by |
|----------|---------|
| Hard tool-call limit (`max_tool_calls`) | OpenAI API |
| Learned stopping (RL reward includes efficiency) | Gemini |
| Fixed number of search rounds (3-5) | Perplexity |
| Explicit reasoning about completeness | OpenAI o3, ReAct agents |
| Token/time budget | Various open-source |
| User interruption | OpenAI (consumer), Gemini (consumer) |

### 9.9 Decision: Context Management

As research progresses, context accumulates. Systems handle this differently:

| Strategy | Description | Used by |
|----------|-------------|---------|
| Extended context window | Use a model with massive context (200K+ tokens) | Perplexity (200K), OpenAI o3 |
| RAG ensembles | Store findings in retrieval-augmented memory | Gemini |
| Knowledge distillation | Compress tool outputs to reflections | Tavily |
| Section-by-section | Research each section independently | LangChain |
| Shared state | Maintain state across async sub-tasks | Gemini (async task manager) |

---

## 10. Key Takeaways for Implementation

### 10.1 Architecture Choice

**Choose single-agent if:**
- You can invest in RL training infrastructure
- You want end-to-end optimization
- Coherence across the research is critical
- You want simpler deployment

**Choose multi-agent if:**
- You need modularity and composability
- Different stages benefit from different models
- You want to iterate on agents independently
- You need role-specific specialization (triage, clarification, research)

### 10.2 Critical Design Decisions

1. **Context management is the hardest problem.** Without knowledge distillation or sectioned research, context windows will be exhausted after 10-20 search iterations. Tavily's reflection-based approach is the most elegant solution.

2. **Planning should be explicit and reviewable.** Both Gemini and LangChain show the plan to users. This improves quality (users catch misunderstandings early) and trust (users see the agent's strategy).

3. **Contradiction detection needs dedicated logic.** All systems that handle contradictions well have explicit mechanisms -- not just hoping the LLM notices. CRAG's evaluator pattern is the most rigorous.

4. **Parallelism is a major performance lever.** Perplexity's 2-4 minute completion time (vs. OpenAI's 5-30 minutes) comes largely from parallel search execution.

5. **The quality of search queries matters more than quantity.** STORM's perspective-guided question generation and OpenAI's clarification agent both improve research quality by ensuring the right questions are asked upfront.

6. **Self-refinement works.** The Self-Refine pattern (generate -> critique -> refine) produces 5-40% improvements. Every deep research system should include a verification/refinement stage.

7. **Retrieval evaluation is not optional.** CRAG demonstrates that evaluating retrieved documents before using them significantly improves output quality. Blindly stuffing all search results into context degrades performance.

### 10.3 Minimal Viable Deep Research Agent

Based on the patterns above, a minimal viable deep research agent requires:

```
1. Query Analysis     -- Decompose and clarify the research question
2. Plan Generation    -- Create a structured research plan with sub-questions
3. Iterative Search   -- Execute searches with ReAct-style reasoning
4. Knowledge Store    -- Accumulate findings (distilled, not raw)
5. Gap Detection      -- Identify what's missing after each search round
6. Contradiction Check -- Flag and resolve conflicting information
7. Synthesis          -- Generate structured report with citations
8. Self-Review        -- Critique and refine the report before delivery
```

### 10.4 Benchmark Evaluation

For evaluating a deep research system, the DRACO benchmark provides the most production-relevant framework:
- Real user queries (not synthetic)
- Expert-validated rubrics
- Multi-dimensional evaluation (accuracy, completeness, objectivity, citation quality)
- Cross-domain coverage
- Model-agnostic design

---

## References

### Commercial Systems
- OpenAI Deep Research: https://openai.com/index/introducing-deep-research/
- OpenAI Deep Research API cookbook: https://cookbook.openai.com/examples/deep_research_api/introduction_to_deep_research_api_agents
- OpenAI Deep Research System Card: https://cdn.openai.com/deep-research-system-card.pdf
- OpenAI ChatGPT Agent: https://openai.com/index/introducing-chatgpt-agent/
- Gemini Deep Research: https://gemini.google/overview/deep-research/
- Gemini Deep Research API: https://ai.google.dev/gemini-api/docs/deep-research
- Gemini Deep Research developer blog: https://blog.google/technology/developers/deep-research-agent-gemini-api/
- Perplexity Deep Research: https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research
- Perplexity Sonar Deep Research API: https://docs.perplexity.ai/getting-started/models/models/sonar-deep-research

### Academic Papers
- ReAct (Yao et al., 2022): https://arxiv.org/abs/2210.03629
- CRAG (Yan et al., 2024): https://arxiv.org/abs/2401.15884
- STORM (Stanford, 2024): https://arxiv.org/abs/2402.14207
- Agentic RAG Survey (Singh et al., 2025): https://arxiv.org/abs/2501.09136
- Deep Research Agents Survey (2025): https://arxiv.org/abs/2506.18096
- Reasoning Agentic RAG Survey (2025): https://arxiv.org/abs/2506.10408
- DRACO Benchmark (Perplexity, 2026): https://arxiv.org/abs/2602.11685
- Self-Refine (Madaan et al., 2023): https://selfrefine.info/

### Open-Source Implementations
- Hugging Face Open Deep Research (smolagents): https://huggingface.co/blog/open-deep-research
- LangChain open_deep_research: https://github.com/langchain-ai/open_deep_research
- Tavily Deep Research: https://huggingface.co/blog/Tavily/tavily-deep-research
- OpenAI Agents SDK: https://github.com/openai/openai-agents-python

### Additional Analysis
- ByteByteGo comparison: https://blog.bytebytego.com/p/how-openai-gemini-and-claude-use
- Hugging Face deep research survey: https://huggingface.co/blog/exploding-gradients/deepresearch-survey
- PromptLayer analysis: https://blog.promptlayer.com/how-deep-research-works/
