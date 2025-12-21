# Creative Ad Agent - System Architecture

**Version:** 6.1
**Last Updated:** December 2025
**Status:** Production (Hook-First Conversion Ad Generator with fal.ai Image Generation)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Deployment Architecture](#deployment-architecture)
3. [High-Level Architecture](#high-level-architecture)
4. [Complete Workflow Diagram](#complete-workflow-diagram)
5. [Component Details](#component-details)
6. [Agent & Skills System](#agent--skills-system)
7. [Data Flow](#data-flow)
8. [File Structure](#file-structure)
9. [API Endpoints](#api-endpoints)
10. [Session Management](#session-management)
11. [React Client](#react-client)
12. [Technology Stack](#technology-stack)
13. [Design Decisions](#design-decisions)

---

## System Overview

### Purpose

An AI-powered creative advertising agent that generates conversion-focused ads using a **hook-first methodology**. The system analyzes brand websites, extracts factual data, and creates 6 diverse ad concepts with AI-generated images.

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTRATOR (Main Agent)                         │
│                                                                             │
│    Coordinates:  1 Agent  +  2 Skills  +  1 MCP Tool                       │
│                                                                             │
│    ┌─────────────┐    ┌──────────────────┐    ┌───────────────┐            │
│    │  research   │ -> │ hook-methodology │ -> │   art-style   │            │
│    │   (Agent)   │    │     (Skill)      │    │    (Skill)    │            │
│    └─────────────┘    └──────────────────┘    └───────────────┘            │
│           │                    │                      │                     │
│           v                    v                      v                     │
│    ┌─────────────┐    ┌──────────────────┐    ┌───────────────┐            │
│    │  research/  │    │   hook-bank/     │    │  creatives/   │            │
│    │  {brand}.md │    │ {brand}-{date}.md│    │{brand}.json   │            │
│    └─────────────┘    └──────────────────┘    └───────┬───────┘            │
│                                                       │                     │
│                                        ┌──────────────┘                     │
│                                        v                                    │
│                              ┌──────────────────┐                          │
│                              │   nano-banana    │                          │
│                              │   (MCP Tool)     │                          │
│                              │  fal.ai API      │                          │
│                              └────────┬─────────┘                          │
│                                       v                                     │
│                              ┌──────────────────┐                          │
│                              │ generated-images/│                          │
│                              │  {sessionId}/    │                          │
│                              └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

- **Hook-First Ad Generation**: Hooks mined from research data using proven formulas
- **1-Agent + 2-Skills Workflow**: Research agent extracts data, skills handle creative
- **6 Diverse Concepts**: Each concept uses a different emotional trigger
- **MCP Image Generation**: Nano-banana MCP generates images via fal.ai Nano Banana Pro
- **Session Management**: Stateful conversations with forking for A/B testing
- **Dual Deployment**: Local development server + Cloudflare Workers production

---

## Deployment Architecture

The system supports two deployment targets with identical agent logic but different infrastructure:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐       │
│  │    LOCAL DEVELOPMENT        │     │    CLOUDFLARE PRODUCTION    │       │
│  │         server/             │     │      creative-agent-cf/     │       │
│  ├─────────────────────────────┤     ├─────────────────────────────┤       │
│  │                             │     │                             │       │
│  │  Runtime: Node.js + Express │     │  Runtime: Workers + Sandbox │       │
│  │  Port: 3001                 │     │  Edge: workers.dev          │       │
│  │                             │     │                             │       │
│  │  Storage:                   │     │  Storage:                   │       │
│  │  - Filesystem (JSON)        │     │  - D1 (SQLite)             │       │
│  │  - sessions/*.json          │     │  - R2 (Object Storage)      │       │
│  │                             │     │                             │       │
│  │  Features:                  │     │  Features:                  │       │
│  │  - Session forking          │     │  - SSE streaming            │       │
│  │  - Debug endpoints          │     │  - Trace events             │       │
│  │  - Cost instrumentation     │     │  - Heartbeat keepalive      │       │
│  │                             │     │  - Container orchestration  │       │
│  └─────────────────────────────┘     └─────────────────────────────┘       │
│                                                                             │
│                    Both use same:                                           │
│                    - Agent definitions (agent/.claude/)                     │
│                    - Workflow (research → hooks → art → images)            │
│                    - MCP tool (nano-banana for fal.ai)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Environment Comparison

| Aspect | Local (`server/`) | Cloudflare (`creative-agent-cf/`) |
|--------|-------------------|-----------------------------------|
| **Use Case** | Development, debugging | Production API |
| **Runtime** | Node.js + Express | Workers + Sandbox containers |
| **SDK Version** | 0.1.54 | 0.1.62 |
| **Storage** | Filesystem | D1 (metadata) + R2 (files) |
| **Sessions** | JSON files | D1 database |
| **Streaming** | JSON response | SSE with trace events |
| **Images** | `generated-images/` | R2 bucket |

### File Path Mapping

| File Type | Local Path | Cloudflare Path |
|-----------|------------|-----------------|
| Research | `agent/files/research/{brand}_research.md` | `/storage/research/{brand}_research.md` |
| Hooks | `agent/.claude/skills/hook-methodology/hook-bank/{brand}-{date}.md` | `/storage/hooks/{brand}-{date}.md` |
| Prompts | `agent/files/creatives/{brand}_prompts.json` | `/storage/creatives/{brand}_prompts.json` |
| Images | `generated-images/{sessionId}/` | `/storage/images/{sessionId}/` |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT REQUEST                                  │
│                         POST /generate { prompt }                           │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      v
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS SERVER (sdk-server.ts)                       │
│                               Port: 3001                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Endpoints:                                                             │ │
│  │  POST /generate           - Campaign generation                         │ │
│  │  GET  /sessions           - List sessions                               │ │
│  │  POST /sessions/:id/continue - Resume session                           │ │
│  │  POST /sessions/:id/fork     - Branch session (A/B testing)             │ │
│  │  GET  /images/:sessionId/:filename - Serve generated images             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      v
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AIClient (ai-client.ts)                            │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  - queryStream()           Async generator for SDK messages             │ │
│  │  - queryWithSession()      Session-aware streaming                      │ │
│  │  - queryWithSessionFork()  Branch from existing session                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│     ┌────────────────────────────────┼────────────────────────────────┐     │
│     │                                │                                │     │
│     v                                v                                v     │
│ ┌────────────────┐    ┌───────────────────────┐    ┌────────────────┐      │
│ │ SessionManager │    │    SDKInstrumentor    │    │   Claude SDK   │      │
│ │ (session-      │    │   (instrumentor.ts)   │    │    query()     │      │
│ │  manager.ts)   │    │   Cost/Token Tracking │    │                │      │
│ └────────────────┘    └───────────────────────┘    └────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      v
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLAUDE AGENT SDK ORCHESTRATION                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Model: claude-opus-4-5-20251101                                        │ │
│  │  Max Turns: 30                                                          │ │
│  │  CWD: agent/ (loads .claude/agents/ and .claude/skills/)               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│     ┌────────────────────────────────┼────────────────────────────────┐     │
│     │                                │                                │     │
│     v                                v                                v     │
│ ┌────────────────┐    ┌───────────────────────┐    ┌────────────────┐      │
│ │  ORCHESTRATOR  │    │        SKILLS         │    │  MCP SERVERS   │      │
│ │  (main agent)  │    │  ┌─────────────────┐  │    │ ┌────────────┐ │      │
│ │                │    │  │hook-methodology │  │    │ │nano-banana │ │      │
│ │ Uses:          │    │  └─────────────────┘  │    │ │(fal.ai     │ │      │
│ │ - Task         │    │  ┌─────────────────┐  │    │ │ API)       │ │      │
│ │ - Skill        │    │  │   art-style     │  │    │ └────────────┘ │      │
│ │ - TodoWrite    │    │  └─────────────────┘  │    └────────────────┘      │
│ └────────────────┘    └───────────────────────┘                             │
│         │                                                                    │
│         │ Task Tool                                                          │
│         v                                                                    │
│ ┌────────────────┐                                                          │
│ │ RESEARCH AGENT │                                                          │
│ │ (research.md)  │                                                          │
│ │                │                                                          │
│ │ Tools:         │                                                          │
│ │ - WebFetch     │                                                          │
│ │ - Read         │                                                          │
│ │ - Write        │                                                          │
│ └────────────────┘                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE WORKFLOW                                    │
│              "Create ads for https://theratefinder.ca"                       │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      v
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: ORCHESTRATOR PARSES REQUEST                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Extract:                                                               │ │
│  │  - URL: https://theratefinder.ca (required)                            │ │
│  │  - Brand: theratefinder                                                 │ │
│  │  - Style: none specified → default "Soft Brutalism Clay"               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      v
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: SPAWN RESEARCH AGENT                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │   Task(subagent_type: "research")                                       │ │
│  │        │                                                                │ │
│  │        v                                                                │ │
│  │   ┌─────────────────────────────────────────────────────────┐          │ │
│  │   │                    RESEARCH AGENT                        │          │ │
│  │   │                                                          │          │ │
│  │   │   1. WebFetch homepage                                   │          │ │
│  │   │   2. Extract: Offer, Value Props, Proof Points           │          │ │
│  │   │   3. Extract: Brand Colors, Voice, Messaging             │          │ │
│  │   │   4. Analyze: Target Audience / ICP                      │          │ │
│  │   │   5. Write: files/research/theratefinder_research.md     │          │ │
│  │   │                                                          │          │ │
│  │   └─────────────────────────────────────────────────────────┘          │ │
│  │                              │                                          │ │
│  │                              v                                          │ │
│  │   ┌─────────────────────────────────────────────────────────┐          │ │
│  │   │  OUTPUT: files/research/theratefinder_research.md        │          │ │
│  │   │                                                          │          │ │
│  │   │  # TheRateFinder - Research Brief                        │          │ │
│  │   │  ## The Offer                                            │          │ │
│  │   │  ## Key Value Props                                      │          │ │
│  │   │  ## Proof Points                                         │          │ │
│  │   │  ## Brand Colors                                         │          │ │
│  │   │  ## Target Audience / ICP                                │          │ │
│  │   └─────────────────────────────────────────────────────────┘          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      v
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: TRIGGER HOOK-METHODOLOGY SKILL                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │   Skill("hook-methodology")                                             │ │
│  │        │                                                                │ │
│  │        v                                                                │ │
│  │   ┌─────────────────────────────────────────────────────────┐          │ │
│  │   │              HOOK-METHODOLOGY SKILL                      │          │ │
│  │   │                                                          │          │ │
│  │   │   1. Read research file                                  │          │ │
│  │   │   2. Build Hook Bank (10+ potential hooks)               │          │ │
│  │   │   3. Select 6 Diverse Hooks (diversity matrix)           │          │ │
│  │   │   4. Quality Check each hook                             │          │ │
│  │   │   5. Write Body + CTA for each                           │          │ │
│  │   │   6. Write: hook-bank/theratefinder-2025-12-06.md        │          │ │
│  │   │                                                          │          │ │
│  │   │   DIVERSITY MATRIX:                                      │          │ │
│  │   │   ┌────────┬─────────────────┬──────────────────┐       │          │ │
│  │   │   │Concept │ Hook Type       │ Emotional Trigger│       │          │ │
│  │   │   ├────────┼─────────────────┼──────────────────┤       │          │ │
│  │   │   │   1    │ Stat/Data       │ Social Proof     │       │          │ │
│  │   │   │   2    │ Story/Result    │ Empathy + Relief │       │          │ │
│  │   │   │   3    │ FOMO/Urgency    │ Loss Aversion    │       │          │ │
│  │   │   │   4    │ Curiosity       │ Intrigue         │       │          │ │
│  │   │   │   5    │ Call-out        │ Recognition      │       │          │ │
│  │   │   │   6    │ Contrast/Enemy  │ Differentiation  │       │          │ │
│  │   │   └────────┴─────────────────┴──────────────────┘       │          │ │
│  │   │                                                          │          │ │
│  │   └─────────────────────────────────────────────────────────┘          │ │
│  │                              │                                          │ │
│  │                              v                                          │ │
│  │   ┌─────────────────────────────────────────────────────────┐          │ │
│  │   │  OUTPUT: hook-bank/theratefinder-2025-12-06.md           │          │ │
│  │   │                                                          │          │ │
│  │   │  # TheRateFinder - Hook Bank                             │          │ │
│  │   │  ## Brand Colors (from research)                         │          │ │
│  │   │  ## ICP Summary                                          │          │ │
│  │   │  ## Concept 1-6 (Hook + Body + CTA each)                │          │ │
│  │   └─────────────────────────────────────────────────────────┘          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      v
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: TRIGGER ART-STYLE SKILL                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │   Skill("art-style")                                                    │ │
│  │        │                                                                │ │
│  │        v                                                                │ │
│  │   ┌─────────────────────────────────────────────────────────┐          │ │
│  │   │                  ART-STYLE SKILL                         │          │ │
│  │   │                                                          │          │ │
│  │   │   1. Read hook-bank file                                 │          │ │
│  │   │   2. Route to style workflow:                            │          │ │
│  │   │      - "clay"/"brutalist" → Soft Brutalism Clay          │          │ │
│  │   │      - "surreal"/"dreamlike" → Surrealist Scale          │          │ │
│  │   │      - "minimal"/"clean" → Minimal Photography           │          │ │
│  │   │      - (none) → Default: Soft Brutalism Clay             │          │ │
│  │   │   3. Create visual prompts for each hook                 │          │ │
│  │   │   4. Write: files/creatives/theratefinder_prompts.json   │          │ │
│  │   │                                                          │          │ │
│  │   └─────────────────────────────────────────────────────────┘          │ │
│  │                              │                                          │ │
│  │                              v                                          │ │
│  │   ┌─────────────────────────────────────────────────────────┐          │ │
│  │   │  OUTPUT: files/creatives/theratefinder_prompts.json      │          │ │
│  │   │                                                          │          │ │
│  │   │  {                                                       │          │ │
│  │   │    "brand": "theratefinder",                             │          │ │
│  │   │    "style": "soft-brutalism-clay",                       │          │ │
│  │   │    "prompts": [                                          │          │ │
│  │   │      "Prompt 1 for image generation...",                 │          │ │
│  │   │      "Prompt 2 for image generation...",                 │          │ │
│  │   │      ...6 total prompts                                  │          │ │
│  │   │    ]                                                     │          │ │
│  │   │  }                                                       │          │ │
│  │   └─────────────────────────────────────────────────────────┘          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      v
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5: GENERATE IMAGES VIA MCP                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │   Orchestrator reads prompts.json                                       │ │
│  │        │                                                                │ │
│  │        v                                                                │ │
│  │   ┌─────────────────────────────────────────────────────────┐          │ │
│  │   │           NANO-BANANA MCP SERVER                         │          │ │
│  │   │              (fal.ai Nano Banana Pro)                    │          │ │
│  │   │                                                          │          │ │
│  │   │   BATCH 1:                                               │          │ │
│  │   │   mcp__nano-banana__generate_ad_images({                 │          │ │
│  │   │     prompts: [prompt1, prompt2, prompt3],                │          │ │
│  │   │     aspectRatio: "1:1",                                  │          │ │
│  │   │     imageSize: "2K",                                     │          │ │
│  │   │     sessionId: "campaign-xxx"                            │          │ │
│  │   │   })                                                     │          │ │
│  │   │   → 3 PNG files                                          │          │ │
│  │   │                                                          │          │ │
│  │   │   BATCH 2:                                               │          │ │
│  │   │   mcp__nano-banana__generate_ad_images({                 │          │ │
│  │   │     prompts: [prompt4, prompt5, prompt6],                │          │ │
│  │   │     ...                                                  │          │ │
│  │   │   })                                                     │          │ │
│  │   │   → 3 PNG files                                          │          │ │
│  │   │                                                          │          │ │
│  │   └─────────────────────────────────────────────────────────┘          │ │
│  │                              │                                          │ │
│  │                              v                                          │ │
│  │   ┌─────────────────────────────────────────────────────────┐          │ │
│  │   │  OUTPUT: generated-images/{sessionId}/                   │          │ │
│  │   │                                                          │          │ │
│  │   │  ├── 1733500000_1_first_prompt.png                       │          │ │
│  │   │  ├── 1733500001_2_second_prompt.png                      │          │ │
│  │   │  ├── 1733500002_3_third_prompt.png                       │          │ │
│  │   │  ├── 1733500010_4_fourth_prompt.png                      │          │ │
│  │   │  ├── 1733500011_5_fifth_prompt.png                       │          │ │
│  │   │  └── 1733500012_6_sixth_prompt.png                       │          │ │
│  │   └─────────────────────────────────────────────────────────┘          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      v
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6: REPORT COMPLETION                                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │   Orchestrator returns:                                                 │ │
│  │   - Summary of 6 ad concepts                                           │ │
│  │   - Image URLs: http://localhost:3001/images/{sessionId}/              │ │
│  │   - Instrumentation data (costs, tokens, timing)                       │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Server Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVER COMPONENTS                                  │
│                           server/                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  sdk-server.ts                                          (~920 lines) │  │
│  │  ────────────────────────────────────────────────────────────────────│  │
│  │  Express HTTP server - main entry point                              │  │
│  │                                                                      │  │
│  │  Responsibilities:                                                   │  │
│  │  - HTTP endpoint handling (/generate, /sessions, /images)           │  │
│  │  - Request validation and routing                                    │  │
│  │  - Response formatting with instrumentation                          │  │
│  │  - Image serving for generated ads                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  lib/ai-client.ts                                       (~490 lines) │  │
│  │  ────────────────────────────────────────────────────────────────────│  │
│  │  Claude SDK wrapper with session-aware queries                       │  │
│  │                                                                      │  │
│  │  Key Methods:                                                        │  │
│  │  - queryStream()           → Async generator for SDK messages        │  │
│  │  - queryWithSession()      → Session-aware streaming                 │  │
│  │  - queryWithSessionFork()  → Fork for A/B testing                    │  │
│  │                                                                      │  │
│  │  SDK Configuration:                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │  cwd: "agent/"                                                 │ │  │
│  │  │  model: "claude-opus-4-5-20251101"                             │ │  │
│  │  │  maxTurns: 30                                                  │ │  │
│  │  │  settingSources: ['user', 'project']                           │ │  │
│  │  │  allowedTools: [Task, Skill, TodoWrite, WebFetch, Read, ...]   │ │  │
│  │  │  mcpServers: { "nano-banana": nanoBananaMcpServer }            │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  lib/session-manager.ts                                 (~340 lines) │  │
│  │  ────────────────────────────────────────────────────────────────────│  │
│  │  Session lifecycle and persistence                                   │  │
│  │                                                                      │  │
│  │  Features:                                                           │  │
│  │  - Persistence: ./sessions/*.json files                              │  │
│  │  - Auto-save: Every 10 messages                                      │  │
│  │  - Cleanup: 24-hour max age                                          │  │
│  │  - Forking: Create session variants for A/B testing                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  lib/nano-banana-mcp.ts                                 (~450 lines) │  │
│  │  ────────────────────────────────────────────────────────────────────│  │
│  │  MCP server for AI image generation via fal.ai Nano Banana Pro       │  │
│  │                                                                      │  │
│  │  Tool: mcp__nano-banana__generate_ad_images                          │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │  Parameters:                                                   │ │  │
│  │  │  - prompts: string[]      (1-3 prompts per call)              │ │  │
│  │  │  - style: string          (visual style)                       │ │  │
│  │  │  - aspectRatio: enum      (1:1, 9:16, 16:9, etc.)             │ │  │
│  │  │  - imageSize: enum        (1K, 2K, 4K)                        │ │  │
│  │  │  - sessionId: string      (for file organization)             │ │  │
│  │  │                                                                │ │  │
│  │  │  Output: PNG files → generated-images/{sessionId}/             │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  lib/orchestrator-prompt.ts                              (~72 lines) │  │
│  │  ────────────────────────────────────────────────────────────────────│  │
│  │  System prompt for main agent - defines workflow                     │  │
│  │                                                                      │  │
│  │  Workflow:                                                           │  │
│  │  1. Parse request → Extract URL, brand, style                        │  │
│  │  2. Spawn research agent → Wait for research file                    │  │
│  │  3. Trigger hook-methodology skill → Wait for hook-bank              │  │
│  │  4. Trigger art-style skill → Wait for prompts.json                  │  │
│  │  5. Call MCP to generate images (2 batches of 3)                     │  │
│  │  6. Report completion with image URLs                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  lib/instrumentor.ts                                    (~150 lines) │  │
│  │  ────────────────────────────────────────────────────────────────────│  │
│  │  Real-time instrumentation and metrics tracking                      │  │
│  │                                                                      │  │
│  │  Tracks:                                                             │  │
│  │  - Events: All SDK message types                                     │  │
│  │  - Tool Calls: Every tool invocation                                 │  │
│  │  - Agent Calls: Subagent launches via Task                           │  │
│  │  - Costs: SDK-provided USD costs                                     │  │
│  │  - Usage: Token counts (input, output, cache)                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agent & Skills System

### Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AGENT & SKILLS HIERARCHY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │     ORCHESTRATOR            │                          │
│                    │     (Main Agent)            │                          │
│                    │                             │                          │
│                    │  Tools:                     │                          │
│                    │  - Task (spawn agents)      │                          │
│                    │  - Skill (consult skills)   │                          │
│                    │  - TodoWrite                │                          │
│                    │  - MCP (nano-banana)        │                          │
│                    └──────────────┬──────────────┘                          │
│                                   │                                          │
│          ┌────────────────────────┼────────────────────────┐                │
│          │                        │                        │                │
│          v                        v                        v                │
│  ┌───────────────┐    ┌───────────────────┐    ┌───────────────┐           │
│  │   RESEARCH    │    │ HOOK-METHODOLOGY  │    │   ART-STYLE   │           │
│  │   (Agent)     │    │     (Skill)       │    │    (Skill)    │           │
│  │               │    │                   │    │               │           │
│  │ Tools:        │    │ Guidance for:     │    │ Guidance for: │           │
│  │ - WebFetch    │    │ - Hook formulas   │    │ - Style routing│          │
│  │ - Read        │    │ - Diversity matrix│    │ - Prompt craft │          │
│  │ - Write       │    │ - Quality checks  │    │ - Visual themes│          │
│  └───────┬───────┘    └─────────┬─────────┘    └───────┬───────┘           │
│          │                      │                      │                    │
│          v                      v                      v                    │
│  ┌───────────────┐    ┌───────────────────┐    ┌───────────────┐           │
│  │ research/     │    │ hook-bank/        │    │ creatives/    │           │
│  │{brand}_       │ -> │{brand}-{date}.md  │ -> │{brand}_       │           │
│  │ research.md   │    │                   │    │ prompts.json  │           │
│  └───────────────┘    └───────────────────┘    └───────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Research Agent Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RESEARCH AGENT                                      │
│                    agent/.claude/agents/research.md                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PURPOSE: Extract factual data from homepages + analyze target audience     │
│                                                                             │
│  TOOLS: WebFetch, Read, Write                                               │
│                                                                             │
│  WORKFLOW:                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                                                                        ││
│  │   1. EXTRACT BRAND NAME                                                ││
│  │      URL → Brand name for file naming                                  ││
│  │      https://theratefinder.ca → theratefinder                          ││
│  │                                                                        ││
│  │   2. WEBFETCH HOMEPAGE                                                 ││
│  │      Fetch with structured extraction prompt                           ││
│  │                                                                        ││
│  │   3. EXTRACT STRUCTURED DATA                                           ││
│  │      ┌────────────────────────────────────────────┐                   ││
│  │      │ THE OFFER        │ Products, prices, scope │                   ││
│  │      │ VALUE PROPS      │ Differentiators         │                   ││
│  │      │ PROOF POINTS     │ Stats, reviews, creds   │                   ││
│  │      │ PAIN POINTS      │ Problems solved         │                   ││
│  │      │ TESTIMONIALS     │ Exact quotes            │                   ││
│  │      │ BRAND COLORS     │ Hex codes               │                   ││
│  │      │ BRAND VOICE      │ Tone, style             │                   ││
│  │      │ MESSAGING        │ Headlines, CTAs         │                   ││
│  │      └────────────────────────────────────────────┘                   ││
│  │                                                                        ││
│  │   4. ANALYZE ICP (Target Audience)                                     ││
│  │      ┌────────────────────────────────────────────┐                   ││
│  │      │ WHO          │ Demographics + situation    │                   ││
│  │      │ PAIN POINTS  │ Specific frustrations       │                   ││
│  │      │ MOTIVATIONS  │ Goals + deeper desires      │                   ││
│  │      │ LANGUAGE     │ Terms they use              │                   ││
│  │      └────────────────────────────────────────────┘                   ││
│  │                                                                        ││
│  │   5. WRITE TO FILE                                                     ││
│  │      → files/research/{brand}_research.md (~60-70 lines)              ││
│  │                                                                        ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  RULES:                                                                     │
│  - Be SPECIFIC: Numbers, names, exact quotes                               │
│  - Extract brand colors with hex codes                                      │
│  - ICP analysis is the ONE analysis allowed                                 │
│  - Don't make recommendations - facts only                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hook-Methodology Skill Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HOOK-METHODOLOGY SKILL                                 │
│              agent/.claude/skills/hook-methodology/SKILL.md                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PURPOSE: Generate conversion-focused ad copy using hook-first methodology  │
│                                                                             │
│  CORE PRINCIPLE:                                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                                                                        ││
│  │   Hook = 80% of ad performance                                         ││
│  │   Body + CTA = 20%                                                     ││
│  │                                                                        ││
│  │   If the hook doesn't stop the scroll, nothing else matters.           ││
│  │                                                                        ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  WORKFLOW:                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                                                                        ││
│  │   Step 1: READ RESEARCH                                                ││
│  │           Read files/research/{brand}_research.md                      ││
│  │           Extract numbers, pain points, testimonials, colors           ││
│  │                                                                        ││
│  │   Step 2: BUILD HOOK BANK                                              ││
│  │           Generate 10+ potential hooks using formulas                  ││
│  │           See formulas.md for hook formula reference                   ││
│  │                                                                        ││
│  │   Step 3: SELECT 6 DIVERSE HOOKS                                       ││
│  │           ┌────────┬─────────────────┬──────────────────┐             ││
│  │           │Concept │ Hook Type       │ Emotional Trigger│             ││
│  │           ├────────┼─────────────────┼──────────────────┤             ││
│  │           │   1    │ Stat/Data       │ Social Proof     │             ││
│  │           │   2    │ Story/Result    │ Empathy + Relief │             ││
│  │           │   3    │ FOMO/Urgency    │ Loss Aversion    │             ││
│  │           │   4    │ Curiosity       │ Intrigue         │             ││
│  │           │   5    │ Call-out        │ Recognition      │             ││
│  │           │   6    │ Contrast/Enemy  │ Differentiation  │             ││
│  │           └────────┴─────────────────┴──────────────────┘             ││
│  │                                                                        ││
│  │   Step 4: QUALITY CHECK                                                ││
│  │           Each hook must pass:                                         ││
│  │           [x] Specific? — Has numbers/names from research              ││
│  │           [x] Emotional? — Triggers a feeling                          ││
│  │           [x] 3-Second? — Message is instantly clear                   ││
│  │           [x] Competitor-proof? — Can't be easily copied               ││
│  │                                                                        ││
│  │   Step 5: WRITE SUPPORTING COPY                                        ││
│  │           For each hook: Body (1-2 sentences) + CTA                    ││
│  │                                                                        ││
│  │   Step 6: WRITE TO HOOK BANK                                           ││
│  │           → hook-bank/{brand}-{YYYY-MM-DD}.md                          ││
│  │                                                                        ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ANTI-PATTERNS (never use):                                                 │
│  - "Your trusted partner" (generic)                                         │
│  - "Quality you can count on" (meaningless)                                 │
│  - Round numbers like "save thousands" (use exact: "$347/mo")              │
│  - "Learn more" as CTA (weak)                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Art-Style Skill Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ART-STYLE SKILL                                     │
│                agent/.claude/skills/art-style/SKILL.md                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PURPOSE: Create visual prompts from hooks for image generation             │
│                                                                             │
│  PREREQUISITE: Hook-bank must exist before triggering this skill            │
│                                                                             │
│  INPUT/OUTPUT:                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                                                                        ││
│  │   INPUT:  hook-bank/{brand}-{date}.md                                  ││
│  │           Contains brand colors, ICP, 6 hook concepts                  ││
│  │                                                                        ││
│  │   OUTPUT: files/creatives/{brand}_prompts.json                         ││
│  │           Contains prompts array for MCP image generation              ││
│  │                                                                        ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  STYLE ROUTING:                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                                                                        ││
│  │   User Keywords              →  Workflow                               ││
│  │   ─────────────────────────────────────────────────────────            ││
│  │   "clay", "brutalist",       →  workflows/soft-brutalism-clay.md       ││
│  │   "handcrafted", "warm"          (DEFAULT)                             ││
│  │                                                                        ││
│  │   "surreal", "dreamlike",    →  workflows/surrealist-scale.md          ││
│  │   "scale", "giant"               (future)                              ││
│  │                                                                        ││
│  │   "minimal", "clean",        →  workflows/minimal-photography.md       ││
│  │   "photography", "simple"        (future)                              ││
│  │                                                                        ││
│  │   (none specified)           →  workflows/soft-brutalism-clay.md       ││
│  │                                  (DEFAULT)                             ││
│  │                                                                        ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  OUTPUT FORMAT:                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │   {                                                                    ││
│  │     "brand": "theratefinder",                                          ││
│  │     "style": "soft-brutalism-clay",                                    ││
│  │     "prompts": [                                                       ││
│  │       "Visual prompt for concept 1...",                                ││
│  │       "Visual prompt for concept 2...",                                ││
│  │       "Visual prompt for concept 3...",                                ││
│  │       "Visual prompt for concept 4...",                                ││
│  │       "Visual prompt for concept 5...",                                ││
│  │       "Visual prompt for concept 6..."                                 ││
│  │     ]                                                                  ││
│  │   }                                                                    ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tool Permissions Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TOOL ACCESS MATRIX                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│              │ Task │ Skill │ Todo │ Web  │ Read │ Write │ MCP             │
│              │      │       │ Write│ Fetch│      │       │ (nano-banana)   │
│  ────────────┼──────┼───────┼──────┼──────┼──────┼───────┼─────────────────│
│  Orchestrator│  X   │   X   │  X   │  -   │  X   │   -   │   X             │
│  ────────────┼──────┼───────┼──────┼──────┼──────┼───────┼─────────────────│
│  Research    │  -   │   -   │  -   │  X   │  X   │   X   │   -             │
│  (Agent)     │      │       │      │      │      │       │                 │
│  ────────────┴──────┴───────┴──────┴──────┴──────┴───────┴─────────────────│
│                                                                             │
│  Skills are NOT tools - they provide guidance/context to the orchestrator   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### File-Based Communication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FILE-BASED AGENT/SKILL COMMUNICATION                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │  RESEARCH AGENT │                                                        │
│  │                 │                                                        │
│  │  WebFetch URL   │                                                        │
│  │  Extract data   │                                                        │
│  │  Analyze ICP    │                                                        │
│  └────────┬────────┘                                                        │
│           │ writes                                                          │
│           v                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  files/research/{brand}_research.md                                  │   │
│  │  ─────────────────────────────────────────────────────────────────── │   │
│  │  # Brand - Research Brief                                            │   │
│  │  ## The Offer                                                        │   │
│  │  ## Key Value Props                                                  │   │
│  │  ## Proof Points                                                     │   │
│  │  ## Brand Colors (hex codes)                                         │   │
│  │  ## Target Audience / ICP                                            │   │
│  └─────────────────────────────────────┬───────────────────────────────┘   │
│                                        │ reads                              │
│                                        v                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  HOOK-METHODOLOGY SKILL                                              │   │
│  │  ─────────────────────────────────────────────────────────────────── │   │
│  │  1. Read research file                                               │   │
│  │  2. Build 10+ hooks from data                                        │   │
│  │  3. Select 6 with diversity matrix                                   │   │
│  │  4. Add Body + CTA for each                                          │   │
│  └────────┬────────────────────────────────────────────────────────────┘   │
│           │ writes                                                          │
│           v                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  hook-bank/{brand}-{date}.md                                         │   │
│  │  ─────────────────────────────────────────────────────────────────── │   │
│  │  # Brand - Hook Bank                                                 │   │
│  │  ## Brand Colors                                                     │   │
│  │  ## ICP Summary                                                      │   │
│  │  ## Concept 1-6 (Hook + Body + CTA)                                 │   │
│  └─────────────────────────────────────┬───────────────────────────────┘   │
│                                        │ reads                              │
│                                        v                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ART-STYLE SKILL                                                     │   │
│  │  ─────────────────────────────────────────────────────────────────── │   │
│  │  1. Read hook-bank file                                              │   │
│  │  2. Route to style workflow                                          │   │
│  │  3. Create visual prompt for each hook                               │   │
│  └────────┬────────────────────────────────────────────────────────────┘   │
│           │ writes                                                          │
│           v                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  files/creatives/{brand}_prompts.json                                │   │
│  │  ─────────────────────────────────────────────────────────────────── │   │
│  │  { "brand": "...", "style": "...", "prompts": [...] }               │   │
│  └─────────────────────────────────────┬───────────────────────────────┘   │
│                                        │ reads                              │
│                                        v                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ORCHESTRATOR + MCP                                                  │   │
│  │  ─────────────────────────────────────────────────────────────────── │   │
│  │  1. Read prompts.json                                                │   │
│  │  2. Call mcp__nano-banana__generate_ad_images (batch 1: 3 images)   │   │
│  │  3. Call mcp__nano-banana__generate_ad_images (batch 2: 3 images)   │   │
│  └────────┬────────────────────────────────────────────────────────────┘   │
│           │ generates                                                       │
│           v                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  generated-images/{sessionId}/                                       │   │
│  │  ─────────────────────────────────────────────────────────────────── │   │
│  │  ├── {timestamp}_1_{prompt}.png                                      │   │
│  │  ├── {timestamp}_2_{prompt}.png                                      │   │
│  │  ├── {timestamp}_3_{prompt}.png                                      │   │
│  │  ├── {timestamp}_4_{prompt}.png                                      │   │
│  │  ├── {timestamp}_5_{prompt}.png                                      │   │
│  │  └── {timestamp}_6_{prompt}.png                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
creative_agent/
│
├── agent/                                   # Agent ecosystem (SOURCE OF TRUTH)
│   ├── .claude/
│   │   ├── agents/                          # Agent definitions
│   │   │   └── research.md                  # Data extraction + ICP agent
│   │   │
│   │   └── skills/                          # Skill definitions
│   │       ├── hook-methodology/
│   │       │   ├── SKILL.md                 # Hook generation skill
│   │       │   ├── formulas.md              # Hook formula reference
│   │       │   └── hook-bank/               # Generated hook files (local)
│   │       │       └── {brand}-{date}.md
│   │       │
│   │       └── art-style/
│   │           ├── SKILL.md                 # Visual prompt skill
│   │           └── workflows/
│   │               └── soft-brutalism-clay.md
│   │
│   └── files/                               # Agent working directory (local)
│       ├── research/
│       │   └── {brand}_research.md          # Research output
│       └── creatives/
│           └── {brand}_prompts.json         # Visual prompts
│
├── server/                                  # LOCAL: Express development server
│   ├── sdk-server.ts                        # Main server (~920 lines)
│   ├── lib/
│   │   ├── ai-client.ts                     # SDK wrapper (~490 lines)
│   │   ├── orchestrator-prompt.ts           # System prompt (local paths)
│   │   ├── session-manager.ts               # Sessions (~340 lines)
│   │   ├── instrumentor.ts                  # Metrics (~150 lines)
│   │   └── nano-banana-mcp.ts               # Image MCP (~300 lines)
│   ├── sessions/                            # Session persistence (JSON files)
│   ├── package.json
│   └── tsconfig.json
│
├── creative-agent-cf/                       # PRODUCTION: Cloudflare Workers
│   ├── src/                                 # Worker code
│   │   ├── index.ts                         # Router, CORS, env interface
│   │   └── handlers/
│   │       ├── generate.ts                  # POST /generate (SSE streaming)
│   │       ├── sessions.ts                  # Session management
│   │       └── images.ts                    # Image serving from R2
│   │
│   ├── sandbox/                             # Runs inside container
│   │   ├── agent-runner.ts                  # SDK orchestration
│   │   ├── nano-banana-mcp.ts               # Image MCP (R2 paths)
│   │   ├── orchestrator-prompt.ts           # System prompt (/storage/ paths)
│   │   └── package.json                     # Container dependencies
│   │
│   ├── agent/                               # Copy of agent/ for container
│   │   └── .claude/                         # (sync from root agent/)
│   │
│   ├── wrangler.jsonc                       # Cloudflare config
│   ├── Dockerfile                           # Sandbox container image
│   ├── schema.sql                           # D1 database schema
│   └── package.json
│
├── client/                                  # React frontend
│   ├── src/
│   │   ├── App.tsx                          # Main app component
│   │   ├── components/                      # UI components
│   │   │   ├── PromptInput.tsx              # Input form
│   │   │   ├── ProgressDots.tsx             # Phase indicators
│   │   │   ├── Terminal.tsx                 # Log output
│   │   │   ├── ImageGrid.tsx                # Image gallery
│   │   │   ├── ImageCard.tsx                # Individual image
│   │   │   └── ImageLightbox.tsx            # Full-screen view
│   │   ├── hooks/
│   │   │   └── useGenerate.ts               # SSE hook
│   │   ├── store/
│   │   │   └── index.ts                     # Zustand state
│   │   └── api/
│   │       └── client.ts                    # API client
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                                    # Documentation
│   ├── CREATIVE-AGENT-CF-REFERENCE.md       # CF quick reference
│   ├── cloudflare-deployment-plan.md        # Deployment guide
│   ├── cloudflare-agent-blueprint.md        # Reusable patterns
│   ├── frontend-design-system.md            # UI design guide
│   └── frontend-implementation-guide.md     # Frontend build guide
│
├── generated-images/                        # Image output (local, git-ignored)
│   └── {sessionId}/
│       └── {timestamp}_{index}_{prompt}.png
│
├── .env                                     # Environment variables
└── ARCHITECTURE.md                          # This file
```

---

## API Endpoints

### Endpoint Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API ENDPOINTS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CORE ENDPOINTS                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  POST /generate              Main campaign generation                        │
│  GET  /health                Health check with config status                 │
│                                                                             │
│  SESSION ENDPOINTS                                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  GET  /sessions              List all active sessions                        │
│  GET  /sessions/:id          Get specific session stats                      │
│  POST /sessions/:id/continue Resume existing session                         │
│  POST /sessions/:id/fork     Create session variant (A/B testing)           │
│  GET  /sessions/:id/family   Get session family tree                         │
│                                                                             │
│  IMAGE ENDPOINTS                                                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│  GET  /images                List all generated images by session            │
│  GET  /images/:sessionId/:filename   Serve specific image                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### POST /generate - Main Endpoint

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /generate                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REQUEST:                                                                   │
│  {                                                                          │
│    "prompt": "Create ads for https://theratefinder.ca targeting renters",  │
│    "sessionId": "optional-resume-session"                                   │
│  }                                                                          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  RESPONSE:                                                                  │
│  {                                                                          │
│    "success": true,                                                         │
│    "sessionId": "campaign-1733500000000",                                   │
│    "prompt": "...",                                                         │
│    "generatedAt": "2025-12-06T...",                                         │
│    "response": {                                                            │
│      "summary": "Final assistant message",                                  │
│      "fullResponse": "All assistant messages",                              │
│      "structuredData": null                                                 │
│    },                                                                       │
│    "sessionStats": {                                                        │
│      "messageCount": 45,                                                    │
│      "turnCount": 8                                                         │
│    },                                                                       │
│    "instrumentation": {                                                     │
│      "campaignMetrics": { "totalCost_usd": 0.28, ... },                    │
│      "timeline": [ ... ]                                                    │
│    },                                                                       │
│    "images": {                                                              │
│      "storageLocation": "generated-images/campaign-xxx/",                   │
│      "viewUrl": "http://localhost:3001/images/campaign-xxx",                │
│      "listUrl": "http://localhost:3001/images"                              │
│    }                                                                        │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Session Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SESSION LIFECYCLE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. CREATION                                                               │
│      POST /generate (no sessionId)                                          │
│      → sessionManager.getOrCreateSession()                                  │
│      → new session: campaign-{timestamp}                                    │
│      → Status: 'active', messages: []                                       │
│                                                                             │
│   2. SDK INITIALIZATION                                                     │
│      → SDK returns: {type: 'system', subtype: 'init', session_id: '...'}   │
│      → sessionManager.updateSdkSessionId()                                  │
│                                                                             │
│   3. MESSAGE ACCUMULATION                                                   │
│      → Each SDK message → sessionManager.addMessage()                       │
│      → Auto-save every 10 messages to ./sessions/{id}.json                  │
│                                                                             │
│   4. RESUMPTION (optional)                                                  │
│      POST /sessions/{id}/continue                                           │
│      → SDK continues with full context                                      │
│                                                                             │
│   5. FORKING (optional)                                                     │
│      POST /sessions/{id}/fork                                               │
│      → Creates new branch for A/B testing                                   │
│      → metadata.forkedFrom = original session                               │
│                                                                             │
│   6. COMPLETION                                                             │
│      → sessionManager.completeSession()                                     │
│      → Status: 'completed', final save                                      │
│                                                                             │
│   7. CLEANUP (automatic)                                                    │
│      → Every 1 hour: delete sessions > 24 hours old                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## React Client

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            REACT CLIENT                                      │
│                              client/                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PURPOSE: Web UI for interacting with the Creative Agent API                │
│                                                                             │
│  STACK:                                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  React          ^18           UI framework                                  │
│  Vite           ^5            Build tool                                    │
│  Tailwind CSS   ^3            Styling                                       │
│  Zustand        ^4            State management                              │
│  TypeScript     ^5            Type safety                                   │
│                                                                             │
│  FEATURES:                                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  - Real-time SSE streaming with phase indicators                            │
│  - Terminal-style log output for trace events                               │
│  - Image gallery with lightbox viewer                                       │
│  - Progress tracking (Parse → Research → Hooks → Art → Images)             │
│                                                                             │
│  DESIGN SYSTEM:                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Theme: "The Machine Room" - industrial control panel aesthetic             │
│  Colors: Dark background, green/amber accents for status                    │
│  Typography: Monospace for terminal, sans-serif for UI                      │
│  See: docs/frontend-design-system.md                                        │
│                                                                             │
│  COMPONENT HIERARCHY:                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  App.tsx                                                               ││
│  │  ├── PromptInput      - URL input and generate button                  ││
│  │  ├── ProgressDots     - Phase indicators (5 phases)                    ││
│  │  ├── Terminal         - Scrolling log output                           ││
│  │  ├── ImageGrid        - Generated images gallery                       ││
│  │  │   └── ImageCard    - Individual image with hover state              ││
│  │  └── ImageLightbox    - Full-screen image viewer                       ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  SSE INTEGRATION (useGenerate hook):                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. POST /generate → Returns SSE stream                                     │
│  2. Parse trace events: phase, tool_start, tool_end, image, message        │
│  3. Update Zustand store with real-time state                               │
│  4. Display progress and results                                            │
│                                                                             │
│  RUNNING:                                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  cd client                                                                  │
│  npm run dev          # Development server (Vite)                           │
│  npm run build        # Production build                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TECHNOLOGY STACK                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RUNTIME                                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Node.js        v20+                                                        │
│  TypeScript     v5.3+                                                       │
│  tsx            v4.7+  (TypeScript execution)                               │
│                                                                             │
│  LOCAL SERVER DEPENDENCIES (server/)                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  @anthropic-ai/claude-agent-sdk    ^0.1.54    Claude SDK for orchestration  │
│  @fal-ai/client                    ^1.x       fal.ai Image Generation API   │
│  express                           ^4.18.2    HTTP server                    │
│  cors                              ^2.8.5     Cross-origin requests          │
│  dotenv                            ^16.3.1    Environment variables          │
│  zod                               ^3.22.4    Runtime type validation        │
│                                                                             │
│  CLOUDFLARE WORKER DEPENDENCIES (creative-agent-cf/)                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  @cloudflare/sandbox               ^0.6.3     Container orchestration        │
│  wrangler                          ^4.53.0    Cloudflare CLI                 │
│                                                                             │
│  CLOUDFLARE SANDBOX DEPENDENCIES (creative-agent-cf/sandbox/)               │
│  ─────────────────────────────────────────────────────────────────────────  │
│  @anthropic-ai/claude-agent-sdk    ^0.1.62    Claude SDK (newer version)    │
│  @fal-ai/client                    ^1.x       fal.ai Image Generation API   │
│  zod                               ^3.22.4    Runtime type validation        │
│  tsx                               ^4.7.0     TypeScript execution           │
│                                                                             │
│  REACT CLIENT DEPENDENCIES (client/)                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  react                             ^18        UI framework                   │
│  zustand                           ^4         State management               │
│  vite                              ^5         Build tool                     │
│  tailwindcss                       ^3         Styling                        │
│                                                                             │
│  ENVIRONMENT VARIABLES                                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ANTHROPIC_API_KEY                 Required   Claude API key                 │
│  FAL_KEY                           Required   fal.ai image generation        │
│  PORT                              Optional   Server port (default: 3001)    │
│  CLAUDE_CODE_MAX_OUTPUT_TOKENS     Optional   Token limit (default: 16384)   │
│                                                                             │
│  CLOUDFLARE SECRETS (set via wrangler)                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ANTHROPIC_API_KEY                 Required   Claude API key                 │
│  FAL_KEY                           Required   fal.ai image generation        │
│  AWS_ACCESS_KEY_ID                 Required   R2 S3-compatible access        │
│  AWS_SECRET_ACCESS_KEY             Required   R2 S3-compatible secret        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Design Decisions

### Why 1 Agent + 2 Skills (Not 2 Agents)?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DECISION: Single Research Agent + Hook/Art Skills                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RATIONALE:                                                                 │
│                                                                             │
│  1. CLEAR SEPARATION                                                        │
│     - Research Agent: EXTRACTS factual data (needs WebFetch tool)           │
│     - Skills: TRANSFORM data into creative outputs (guidance only)          │
│                                                                             │
│  2. SKILLS ARE GUIDANCE, NOT EXECUTION                                      │
│     - Skills provide frameworks/methodology                                 │
│     - Orchestrator executes with skill guidance                             │
│     - No tool permissions needed for creative transformation                │
│                                                                             │
│  3. SIMPLER ORCHESTRATION                                                   │
│     - Only one subagent to spawn (research)                                │
│     - Skills triggered in sequence by orchestrator                          │
│     - Cleaner error handling and debugging                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Hook-First Methodology?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DECISION: Build hooks BEFORE visuals                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RATIONALE:                                                                 │
│                                                                             │
│  Hook = 80% of ad performance                                               │
│                                                                             │
│  1. HOOKS STOP THE SCROLL                                                   │
│     - The hook IS the ad; visuals support it                               │
│     - Without a strong hook, great visuals don't matter                     │
│                                                                             │
│  2. DATA-DRIVEN                                                             │
│     - Hooks mined from research ensure specificity                          │
│     - Real numbers, real quotes, real pain points                           │
│                                                                             │
│  3. TESTABLE DIVERSITY                                                      │
│     - 6 different hook types = 6 emotional triggers                        │
│     - Learn which resonates with audience                                   │
│                                                                             │
│  4. COMPETITOR-PROOF                                                        │
│     - Specific hooks can't be copied                                       │
│     - Based on unique brand data                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why 6 Concepts with Diversity Matrix?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DECISION: 6 concepts, each with different hook type                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RATIONALE:                                                                 │
│                                                                             │
│  1. TEST DIFFERENT EMOTIONS                                                 │
│     ┌────────────────┬─────────────────────────────────────────┐           │
│     │ Stat/Data      │ Appeals to logical buyers (social proof)│           │
│     │ Story/Result   │ Appeals to empathy-driven buyers        │           │
│     │ FOMO/Urgency   │ Appeals to loss-averse buyers           │           │
│     │ Curiosity      │ Appeals to intrigue-motivated buyers    │           │
│     │ Call-out       │ Appeals to identity-driven buyers       │           │
│     │ Contrast       │ Appeals to comparison shoppers          │           │
│     └────────────────┴─────────────────────────────────────────┘           │
│                                                                             │
│  2. AVOID ECHO CHAMBER                                                      │
│     - Without matrix, all concepts might use same hook type                │
│     - Matrix forces creative diversity                                      │
│                                                                             │
│  3. OPTIMIZATION DATA                                                       │
│     - Learn which emotional trigger resonates                               │
│     - Inform future campaigns                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Performance Benchmarks

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PERFORMANCE BENCHMARKS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TIMING                                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Total Campaign Generation     2-5 minutes                                  │
│  Research Phase                1-2 minutes                                  │
│  Hook Generation               30-60 seconds                                │
│  Art Style + Prompts           20-40 seconds                                │
│  Image Generation              60-120 seconds (6 images)                    │
│                                                                             │
│  COSTS (Estimated)                                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Full Campaign (6 images)      $0.15-$0.30                                  │
│  Research Phase                $0.02-$0.05                                  │
│  Creative Phase                $0.05-$0.10                                  │
│  Image Generation              $0.05-$0.15                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LOCAL DEVELOPMENT (server/)                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  cd server                                                                  │
│  npm run dev                   # Hot reload with tsx watch                  │
│  npm run start                 # Production mode                            │
│                                                                             │
│  Health Check: curl http://localhost:3001/health                            │
│                                                                             │
│  REACT CLIENT (client/)                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  cd client                                                                  │
│  npm run dev                   # Vite dev server                            │
│  npm run build                 # Production build                           │
│                                                                             │
│  CLOUDFLARE PRODUCTION (creative-agent-cf/)                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  cd creative-agent-cf                                                       │
│                                                                             │
│  # First-time setup                                                         │
│  npm run db:create             # Create D1 database                         │
│  npm run db:init               # Run schema.sql                             │
│  npm run r2:create             # Create R2 bucket                           │
│                                                                             │
│  # Set secrets                                                              │
│  wrangler secret put ANTHROPIC_API_KEY                                      │
│  wrangler secret put FAL_KEY                                                │
│  wrangler secret put AWS_ACCESS_KEY_ID                                      │
│  wrangler secret put AWS_SECRET_ACCESS_KEY                                  │
│                                                                             │
│  # Deploy                                                                   │
│  npm run dev                   # Local dev with wrangler                    │
│  npm run deploy                # Deploy to production                       │
│  npm run tail                  # View production logs                       │
│                                                                             │
│  SYNCING AGENT DEFINITIONS                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  The agent/ directory at project root is the SOURCE OF TRUTH.               │
│  When updating agents/skills, sync to Cloudflare:                           │
│                                                                             │
│  cp -r agent/.claude/* creative-agent-cf/agent/.claude/                    │
│  cd creative-agent-cf && npm run deploy                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Local server | `cd server && npm run dev` |
| React client | `cd client && npm run dev` |
| Cloudflare dev | `cd creative-agent-cf && npm run dev` |
| Deploy to production | `cd creative-agent-cf && npm run deploy` |
| View CF logs | `cd creative-agent-cf && npm run tail` |
| Sync agents to CF | `cp -r agent/.claude/* creative-agent-cf/agent/.claude/` |

---

## Related Documentation

- **Cloudflare Quick Reference:** `docs/CREATIVE-AGENT-CF-REFERENCE.md`
- **Deployment Guide:** `docs/cloudflare-deployment-plan.md`
- **Frontend Design:** `docs/frontend-design-system.md`
- **Frontend Implementation:** `docs/frontend-implementation-guide.md`
- **Blueprint (Reusable):** `docs/cloudflare-agent-blueprint.md`

---

**Version:** 6.1
**Last Updated:** December 2025
**Architecture:** 1 Agent + 2 Skills + fal.ai MCP Image Generation
**Deployments:** Local (Express) + Production (Cloudflare Workers)
