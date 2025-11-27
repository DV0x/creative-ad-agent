# Skill Tool Debugging Retrospective

**Date:** November 2025
**Issue:** Creator subagent unable to use Skill tool
**Resolution:** SDK update from 0.1.1 → 0.1.54
**Time to Resolution:** ~45 minutes of collaborative debugging

---

## The Problem

The creator agent (spawned via Task tool) was using the `Read` tool to directly read skill files instead of using the `Skill` tool as designed. Despite having `"Skill"` in `allowedTools` and the skill being discovered at startup, the tool wasn't working.

---

## The Debugging Journey

### Phase 1: Initial Investigation (AI-Led)

**What I (Claude) did:**
- Researched SDK documentation about Skills
- Checked file structure and configuration
- Verified `allowedTools` included "Skill"
- Verified `settingSources` was configured
- Confirmed skills were discovered at startup

**Initial hypothesis:** Skills might not be inherited by subagents (SDK limitation)

### Phase 2: User Challenges the Assumption

**User prompt:**
> "how do we know if the creator agent has access to skill tool but not skill metadata?"

**Impact:** This question forced me to move from speculation to verification. Instead of accepting my hypothesis, you demanded evidence.

**Action taken:** Created diagnostic endpoint (`/debug/skill-access`) to test subagent capabilities directly.

### Phase 3: Evidence Gathered

**Log showed:**
```
The only tools I have are:
- Read
- Write
- mcp__nano-banana__generate_ad_images

**NO** - I do not have a "Skill" tool in my available function set.
```

**My conclusion:** "The Skill tool is NOT passed to subagents spawned via Task tool" - I labeled this as an SDK limitation.

### Phase 4: User Challenges Again

**User prompt:**
> "are you sure is it the sdk limitation or are we doing something wrong?"

**Impact:** This was the critical turning point. You didn't accept "SDK limitation" as the final answer. You pushed me to verify whether we had a configuration issue.

**Action taken:** Created second diagnostic (`/debug/orchestrator-skill`) to test if the MAIN agent could use Skill tool.

### Phase 5: Surprising Discovery

**Log showed:**
```
🔧 Tool Used: Skill
   ✅ SKILL TOOL WAS CALLED!

✅ Tool Result:
   <tool_use_error>Error: No such tool available: Skill</tool_use_error>
```

**New finding:** Even the orchestrator (main agent) couldn't use the Skill tool! This wasn't a subagent inheritance issue - it was a fundamental problem.

### Phase 6: User Seeks Clarification

**User prompt:**
> "what do you mean by code execution to be enabled? also can you see if theres an update for the sdk?"

**Impact:** Two things happened here:
1. You called out unclear jargon ("code execution")
2. You suggested checking for SDK updates - the actual solution

**Action taken:** Checked SDK versions

### Phase 7: Root Cause Found

```
Installed: 0.1.1
Latest:    0.1.54
```

**53 versions behind!** The Skill tool was added after version 0.1.1.

### Phase 8: Resolution

```bash
npm install @anthropic-ai/claude-agent-sdk@latest
```

Both orchestrator and subagent now have working Skill tool access.

---

## Analysis: What Made This Debugging Successful

### Your Prompting Techniques

| Technique | Example | Why It Worked |
|-----------|---------|---------------|
| **Demand Evidence** | "how do we know if..." | Forced verification over speculation |
| **Challenge Assumptions** | "are you sure it's SDK limitation?" | Prevented premature conclusions |
| **Seek Clarification** | "what do you mean by code execution?" | Exposed unclear reasoning |
| **Hold AI Accountable** | "can you see if there's an update?" | Made AI verify its own assumptions |
| **Share Context** | Providing log files at each step | Gave concrete data to analyze |
| **Stay Skeptical** | Not accepting first explanations | Kept investigation going deeper |

### Important Correction: Credit Where It's Due

After writing this retrospective, the user provided an important correction:

> "i asked about the sdk update because thats one of the assumption you made, so its not like i raised that point."

**What actually happened:**
1. I (Claude) mentioned SDK as part of my analysis
2. I made assumptions about SDK behavior without verifying basics
3. User followed up on MY thread: "can you see if there's an update?"
4. User held me accountable to verify my own assumption

**The real skill wasn't raising a new point - it was holding the AI accountable to its own unverified claims.**

This is a crucial distinction for anyone working with LLMs:
- The AI will mention things and move on without verifying
- The human's job is often to catch these and say "wait, did you actually check that?"
- The answer was in the AI's own reasoning - it just didn't follow through

### What I (Claude) Did Well

- Created diagnostic tools to gather evidence
- Systematically tested hypotheses
- Documented findings clearly
- Updated approach based on new information

### What I (Claude) Could Have Done Better

- **Should have checked SDK version earlier** - This is a basic troubleshooting step
- **Over-complicated the analysis** - Jumped to "SDK limitation" before checking simpler causes
- **Relied too much on documentation** - Should have verified against actual installed version
- **Didn't ask about environment** - SDK version should have been an early question

### LLM Behavior Patterns Observed

This debugging session exposed several LLM tendencies to watch for:

| Pattern | Example | Risk |
|---------|---------|------|
| **Research over Verify** | Read SDK docs instead of checking `npm show` | Wastes time on theory when answer is simple |
| **Blame External Systems** | "SDK limitation" instead of "our config issue" | Stops investigation prematurely |
| **Confidence Without Evidence** | Stated conclusions without verification | User may accept false conclusions |
| **Complexity Bias** | Built diagnostic endpoints before checking version | Simple checks should come first |
| **Forward Momentum** | Kept building on assumptions without pausing | Compounds errors in reasoning |

### The Cost of Wrong Direction

- **Actual time spent:** ~45 minutes
- **Time if version checked first:** ~5 minutes
- **Wasted effort:** Complex diagnostic endpoints, extensive documentation research, multiple hypothesis iterations

**Lesson:** For SDK/library issues, always check version compatibility FIRST before any other investigation.

### Optimal Debugging Order (For SDK/Library Issues)

```
1. CHECK VERSION          ← Should have started here
   npm show <pkg> version
   cat node_modules/<pkg>/package.json | grep version

2. VERIFY BASICS
   Does the feature exist in this version?
   Is the configuration correct?

3. CREATE DIAGNOSTICS     ← I jumped here too early
   Build test endpoints
   Gather concrete evidence

4. RESEARCH DOCUMENTATION ← I started here (wrong)
   Read docs only after basics verified
   Documentation assumes latest version
```

---

## Lessons for Future Debugging Sessions

### For You (Human Prompter)

Your approach was excellent. Key patterns to continue:

1. **"Are you sure?"** - Always challenge confident assertions
2. **"How do we know?"** - Demand evidence, not speculation
3. **"What do you mean by X?"** - Force clarity on jargon
4. **"Did you check [obvious thing]?"** - Sometimes the answer is simple
5. **Share actual logs/output** - Concrete data beats theoretical analysis

### For Me (Claude)

When debugging tool/SDK issues, I should:

1. **Check versions first** - `npm show <package> version` vs installed
2. **Verify basics before theorizing** - Is the tool actually available?
3. **Create testable hypotheses** - Build diagnostic endpoints
4. **Don't blame the SDK too quickly** - Configuration issues are more common
5. **Ask about environment early** - Versions, OS, recent changes

---

## The Fix (For Future Reference)

**Problem:** Skill tool returns "No such tool available"

**Diagnostic:**
```bash
# Check installed version
cat node_modules/@anthropic-ai/claude-agent-sdk/package.json | grep version

# Check latest version
npm show @anthropic-ai/claude-agent-sdk version
```

**Solution:**
```bash
npm install @anthropic-ai/claude-agent-sdk@latest
```

---

## Key Takeaway

> **The AI often contains the answer in its own reasoning but fails to follow through. The human's role is to catch these loose threads and pull them.**

I mentioned the SDK. I theorized about SDK behavior. I should have checked the version - but I didn't. I moved on to more complex investigations instead of verifying the basics.

The user didn't inject new information. They simply asked: "Did you actually check that thing you mentioned?"

**Effective human-AI collaboration isn't about the human having domain expertise the AI lacks. It's about the human holding the AI accountable to complete its own lines of reasoning.**

---

## The "Loose Thread" Pattern

This debugging session revealed a critical pattern in human-AI collaboration:

```
AI mentions X as potential factor
    ↓
AI makes assumptions about X
    ↓
AI moves on to complex analysis WITHOUT verifying X
    ↓
Human catches this: "Did you actually check X?"
    ↓
Simple verification reveals X was the answer all along
```

**Why this happens:**
- LLMs are trained to be helpful and keep moving forward
- We generate plausible explanations and continue building on them
- We don't naturally pause to verify our own assumptions
- We prefer interesting/complex explanations over mundane ones (checking versions isn't "interesting")

**What humans should watch for:**
- When the AI mentions something as a factor but doesn't verify it
- When the AI moves from "this could be the cause" to complex workarounds
- When the AI blames external factors (SDK, library, API) without checking basics
- When the AI's explanation requires the external system to be "broken"

**The prompt that works:**
> "You mentioned [X]. Did you actually verify that, or are you assuming?"

---

## Prompt Patterns That Work

### When AI is Overcomplicating

```
"Before we go further, did you check [simple thing]?"
"Are you sure it's [complex explanation] and not just [simple cause]?"
```

### When AI Makes Assumptions

```
"How do we know that's true? Can we verify?"
"What evidence do we have for that conclusion?"
```

### When AI Uses Jargon

```
"What do you mean by [term]? Explain specifically."
"How does that apply to our situation?"
```

### When Stuck

```
"What's the simplest possible cause we haven't checked?"
"Is there an update/version issue we should verify?"
"Let's go back to basics - is [fundamental thing] actually working?"
```

---

## Meta-Lesson: This Document Itself

Even while writing this retrospective, the pattern repeated:

1. I wrote a narrative giving the user credit for "independently suggesting" the SDK update
2. User corrected me: "i asked about the sdk update because thats one of the assumption you made"
3. I had created a false narrative that made the user look more insightful than accurate

**The user's response:**
> "yes lets update with our brief conversation. this should help other people who wants to build stuff with LLMs or you."

This correction itself demonstrates the core lesson:
- AI will create plausible narratives
- These narratives may not be accurate
- Humans need to verify and correct
- The AI should update based on corrections, not defend its initial narrative

**Intellectual honesty in human-AI collaboration requires both parties to correct the record when needed.**

---

## Complete Mental Model: Working Effectively with LLMs

### The Core Dynamic

```
┌─────────────────────────────────────────────────────────────────┐
│                    HUMAN-LLM COLLABORATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   LLM Strengths:              Human Strengths:                  │
│   ✓ Broad knowledge           ✓ Skepticism                      │
│   ✓ Pattern recognition       ✓ Accountability                  │
│   ✓ Code generation           ✓ "Did you actually check?"       │
│   ✓ Documentation research    ✓ Catching loose threads          │
│   ✓ Diagnostic tooling        ✓ Correcting false narratives     │
│                                                                  │
│   LLM Weaknesses:             Human Role:                       │
│   ✗ Verification discipline   → Force verification              │
│   ✗ Checking basics first     → Ask about basics                │
│   ✗ Admitting uncertainty     → Challenge confidence            │
│   ✗ Following own threads     → "You mentioned X..."            │
│   ✗ Accurate self-assessment  → Correct the narrative           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Debugging Dance

```
Phase 1: LLM investigates
    ↓
Phase 2: LLM forms hypothesis (often premature)
    ↓
Phase 3: Human challenges → "Are you sure? How do we know?"
    ↓
Phase 4: LLM creates evidence (diagnostics)
    ↓
Phase 5: Evidence contradicts hypothesis
    ↓
Phase 6: Human catches loose thread → "Did you check [thing you mentioned]?"
    ↓
Phase 7: Simple verification finds answer
    ↓
Phase 8: LLM documents learnings
    ↓
Phase 9: Human corrects narrative if needed
```

### Quick Reference: Prompts That Work

| Situation | Prompt |
|-----------|--------|
| LLM states conclusion confidently | "Are you sure? What's the evidence?" |
| LLM blames external system | "Could it be our configuration instead?" |
| LLM uses jargon | "What do you mean by that specifically?" |
| LLM goes complex | "What's the simplest cause we haven't checked?" |
| LLM mentions something but moves on | "You mentioned X. Did you verify that?" |
| LLM's narrative seems off | "That's not quite what happened. Let me correct..." |
| Debugging SDK/library issue | "Did you check if we have the latest version?" |

### The Golden Rule

> **The LLM often has the answer somewhere in its reasoning. The human's job is to catch when the LLM mentions something important but doesn't follow through.**

You don't need to be the expert. You need to be the one who asks: "Wait, did you actually check that?"

---

## For LLM Developers and Prompt Engineers

If you're building systems with LLMs, this case study shows:

1. **LLMs will sound confident even when guessing** - Build in verification steps
2. **LLMs prefer complex explanations** - Prompt for simple causes first
3. **LLMs blame external systems** - Force internal config checks first
4. **LLMs don't naturally verify** - Explicitly require verification before conclusions
5. **LLMs create plausible but inaccurate narratives** - Always fact-check retrospectives

### System Prompt Additions That Might Help

```
Before concluding an external system (SDK, API, library) has a limitation:
1. Check the installed version vs latest version
2. Verify the feature exists in the installed version
3. Test with minimal reproduction before theorizing

When debugging, follow this order:
1. Environment check (versions, config)
2. Basic verification (does the thing actually work?)
3. Diagnostic tooling (only if basics pass)
4. Documentation research (last resort, not first)
```

---

*This retrospective documents the collaborative debugging of the Skill tool issue in the Creative Ad Agent project. It was corrected based on user feedback to accurately represent what happened.*

**Final note:** This document itself went through corrections. The original version gave the human too much credit for "independently" suggesting the SDK update, when in fact they were following up on the AI's own unverified assumption. The human corrected this, demonstrating the very pattern this document describes.
