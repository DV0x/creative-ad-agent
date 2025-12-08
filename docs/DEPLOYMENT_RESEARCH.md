# Deployment Research: Creative Ad Agent

**Date:** December 2025
**Status:** Research Complete - Ready for Implementation
**Recommendation:** Daytona + Supabase (or Railway for quick MVP)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Key Concepts Explained](#key-concepts-explained)
3. [SDK-Recommended Providers](#sdk-recommended-providers)
4. [Provider Deep Dives](#provider-deep-dives)
5. [Architecture Comparison](#architecture-comparison)
6. [Cost Analysis](#cost-analysis)
7. [Decision Matrix](#decision-matrix)
8. [Recommended Approach](#recommended-approach)
9. [Next Steps](#next-steps)

---

## Executive Summary

### The Challenge

Deploy the Creative Ad Agent (Claude SDK + MCP + Skills) to production with:
- Easy access to session database
- Artifact storage (research, hooks, images)
- Fast response times for users
- Support for agent evaluations

### The Recommendation

**Primary Choice: Daytona + Supabase**
- 90ms cold start (fastest available)
- Built for AI agents
- $200 free credits (~20,000 runs)
- Perfect for agent evals
- SDK-recommended provider

**Alternative: Railway** (for faster initial deployment)
- Zero code changes
- 30 minutes to production
- ~$5-20/month
- Good for MVP/validation

---

## Key Concepts Explained

### Cold Start vs Warm Instances

```
COLD START = Server is off, needs to boot up when request arrives

Example: User clicks "Generate Ads"
         → Wait 2 seconds to 3 minutes (depending on provider)
         → Then generation starts

WARM INSTANCE = Server is already running and ready

Example: User clicks "Generate Ads"
         → Generation starts immediately (0 wait)

THE TRADEOFF:
- Warm instances cost money even when idle
- Cold start saves money but users wait
```

| Term | Meaning | Example |
|------|---------|---------|
| Cold Start | Time to boot up a stopped server | 90ms (Daytona) to 3min (Cloudflare) |
| Warm Instance | Server kept running for instant response | ~$5/month on Fly.io |
| Ephemeral | Container that runs once and is deleted | Daytona's model |
| Persistent | Container that stays running | Railway/Fly.io model |

### What is Docker?

Docker packages your application with everything it needs to run:

```dockerfile
# Example Dockerfile for Creative Ad Agent
FROM node:20-slim          # Start with Node.js
WORKDIR /app               # Create work folder
COPY package*.json ./      # Copy dependencies list
RUN npm install            # Install dependencies
COPY . .                   # Copy your code
CMD ["npx", "tsx", "server/sdk-server.ts"]  # Start command
```

**Benefits:**
- Runs identically on any computer/server
- No "works on my machine" problems
- Easy to deploy anywhere

**Difficulty:** Easy (~10 lines for this project, 1-2 hours to learn)

---

## SDK-Recommended Providers

The Claude Agent SDK documentation recommends these providers:

| Provider | Type | Cold Start | Best For |
|----------|------|------------|----------|
| **Cloudflare Sandboxes** | Ephemeral | 2-3 min (first) | Cloudflare ecosystem |
| **Modal** | Ephemeral | <1s | High-volume, ML workloads |
| **Daytona** | Ephemeral | 90ms | AI agents, evals |
| **E2B** | Ephemeral | <1s | Open-source option |
| **Fly Machines** | Persistent/Ephemeral | 2-5s | Cost-effective, flexible |
| **Vercel Sandbox** | Ephemeral | Variable | Serverless apps |

### Deployment Patterns (from SDK docs)

1. **Pattern 1: Ephemeral Sessions** - New container per task, destroy when done
2. **Pattern 2: Long-Running Sessions** - Persistent containers
3. **Pattern 3: Hybrid Sessions** - Ephemeral + hydrated with state ← **Our use case**
4. **Pattern 4: Single Containers** - Multiple SDK processes in one container

---

## Provider Deep Dives

### Daytona

**What it is:** AI agent infrastructure with 90ms sandbox creation

**Pricing:**
- $0.10/hour (~$0.000028/CPU-second)
- $200 free credits included

**Key Features:**
- 90ms cold start (fastest in class)
- Built-in Git, LSP, file operations
- Live stdout/stderr streaming
- OCI/Docker compatible
- Parallel sandbox support (great for evals)

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│  API Gateway (Vercel/Railway)                                    │
│       │                                                          │
│       ▼                                                          │
│  Daytona SDK → Creates sandbox (90ms)                           │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  SANDBOX                                                 │    │
│  │  - Your agent code runs here                            │    │
│  │  - Claude SDK + MCP + Skills                            │    │
│  │  - Generates images                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│       │                                                          │
│       ▼                                                          │
│  Supabase (sessions + artifacts storage)                        │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**
- Fastest cold start
- Purpose-built for AI agents
- Excellent for evals (parallel sandboxes)
- $200 free = ~20,000 runs

**Cons:**
- Need to build API gateway (~100-200 lines)
- Need external storage (Supabase)
- 1-2 days setup time

---

### Fly.io

**What it is:** Container platform with global deployment

**Pricing:**
- $0.05/hour (half of Daytona)
- No free credits, but very cheap

**Key Features:**
- Warm instances option ($5/month for always-on)
- Persistent volumes (built-in storage)
- Global regions (30+)
- Full Docker control

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Fly Machine (your container)                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Your sdk-server.ts (unchanged)                          │    │
│  │  - Claude SDK + MCP + Skills                             │    │
│  │  - Session manager (file-based)                          │    │
│  │  - Image generation                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│       │                                                          │
│       ▼                                                          │
│  Fly Volume (persistent disk for sessions + images)             │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**
- Cheapest option ($0.05/hr)
- Warm instances = 0 cold start
- Run exact code unchanged
- Built-in storage

**Cons:**
- Need to learn Docker
- 2-5s cold start (without warm instance)
- Less suited for parallel evals

---

### Railway (Non-SDK-recommended but easiest)

**What it is:** Platform that auto-deploys from GitHub

**Pricing:**
- ~$5-20/month
- $5 free trial

**Key Features:**
- Zero code changes required
- Auto-detects Node.js projects
- Built-in PostgreSQL and volumes
- 30 minutes to production

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Railway Container                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Your EXACT code (unchanged)                             │    │
│  │  - sdk-server.ts                                         │    │
│  │  - Session manager → Railway Volume                      │    │
│  │  - Images → Railway Volume                               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**
- Truly zero changes
- 30 min to production
- Easy dashboard
- Good for MVP

**Cons:**
- Not SDK-recommended
- Not ideal for evals
- Always-on (pay even when idle)

---

### Cloudflare Sandboxes

**What it is:** Official Cloudflare + Claude SDK integration

**Key Features:**
- Native D1 (database) and R2 (storage) integration
- Official template available
- Edge deployment

**Our Analysis:**
- Template designed for different use case (GitHub repo modifications)
- Would require significant customization
- 2-3 min cold start on first deployment
- More complex than alternatives

**Verdict:** Not recommended for this project due to template mismatch and complexity.

---

## Architecture Comparison

### Current Local Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR LAPTOP                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  sdk-server.ts (Express on port 3001)                    │    │
│  │  ├── ai-client.ts (Claude SDK wrapper)                   │    │
│  │  ├── session-manager.ts (file-based sessions)            │    │
│  │  ├── nano-banana-mcp.ts (Gemini image generation)        │    │
│  │  └── orchestrator-prompt.ts (agent workflow)             │    │
│  │                                                           │    │
│  │  agent/                                                   │    │
│  │  ├── .claude/agents/research.md                          │    │
│  │  ├── .claude/skills/hook-methodology/                    │    │
│  │  └── .claude/skills/art-style/                           │    │
│  │                                                           │    │
│  │  Storage:                                                 │    │
│  │  ├── sessions/*.json                                     │    │
│  │  ├── files/research/*.md                                 │    │
│  │  ├── hook-bank/*.md                                      │    │
│  │  └── generated-images/{sessionId}/*.png                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Daytona Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAYTONA + SUPABASE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  API GATEWAY (Vercel/Railway - always on)                │    │
│  │  - Receives POST /generate requests                      │    │
│  │  - Creates Daytona sandbox                               │    │
│  │  - Manages session lifecycle                             │    │
│  │  - Saves results to Supabase                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  DAYTONA SANDBOX (ephemeral, 90ms startup)               │    │
│  │  - Your agent code runs unchanged                        │    │
│  │  - Claude SDK + orchestrator                             │    │
│  │  - Research agent + Skills                               │    │
│  │  - MCP nano-banana → Gemini API                         │    │
│  │  - Generates 6 images                                    │    │
│  │  - Runs for ~5 minutes                                   │    │
│  │  - Deleted when done                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  SUPABASE (free tier)                                    │    │
│  │  Database:                                               │    │
│  │  - sessions table                                        │    │
│  │  - campaigns table                                       │    │
│  │  Storage:                                                │    │
│  │  - /artifacts/{session_id}/research.md                  │    │
│  │  - /artifacts/{session_id}/hooks.md                     │    │
│  │  - /artifacts/{session_id}/images/*.png                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Railway Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       RAILWAY                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  RAILWAY CONTAINER (always on)                           │    │
│  │                                                           │    │
│  │  Your EXACT code unchanged:                              │    │
│  │  - sdk-server.ts                                         │    │
│  │  - ai-client.ts                                          │    │
│  │  - session-manager.ts → Railway Volume                   │    │
│  │  - nano-banana-mcp.ts                                    │    │
│  │  - All agents and skills                                 │    │
│  │                                                           │    │
│  │  Storage (Railway Volume):                               │    │
│  │  - sessions/*.json                                       │    │
│  │  - files/research/*.md                                   │    │
│  │  - hook-bank/*.md                                        │    │
│  │  - generated-images/*.png                                │    │
│  │                                                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Analysis

### Daytona Costs

**Per Campaign Run (5 minutes):**
```
Basic config (1 CPU):  $0.01 per run
Medium config (2 CPU): $0.02 per run
```

**Free Credits ($200):**
```
At $0.01/run: ~20,000 free campaigns
At $0.02/run: ~10,000 free campaigns
```

**Usage Examples:**
| Daily Volume | Free Credits Last |
|--------------|-------------------|
| 10/day | 5+ years |
| 50/day | 1+ year |
| 100/day | ~6 months |

### Total Cost Per Campaign (After Free Tier)

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT          │  COST                                     │
├─────────────────────────────────────────────────────────────────┤
│  Daytona            │  $0.01                                    │
│  Claude API         │  $0.15 - $0.30                            │
│  Gemini API         │  $0.05                                    │
├─────────────────────────────────────────────────────────────────┤
│  TOTAL              │  ~$0.26 per campaign                      │
└─────────────────────────────────────────────────────────────────┘

Note: Daytona is only ~4% of total cost. Claude API is the main expense.
```

### Provider Cost Comparison

| Provider | Hourly Rate | 5-min Run | 1000 Runs |
|----------|-------------|-----------|-----------|
| Daytona | $0.10 | $0.01 | $10 |
| Fly.io | $0.05 | $0.005 | $5 |
| Railway | ~$0.01* | ~$0.01* | $5-20/mo flat |

*Railway is flat monthly rate, not per-run

---

## Decision Matrix

| Factor | Railway | Fly.io | Daytona | Cloudflare |
|--------|---------|--------|---------|------------|
| **Setup Time** | 30 min | 1-2 hrs | 1-2 days | 2+ days |
| **Code Changes** | None | Dockerfile | API Gateway | Significant |
| **Cold Start** | 0 (always on) | 2-5s | 90ms | 2-3 min |
| **Cost Model** | Flat monthly | Per hour | Per use | Per use |
| **Agent Evals** | Hard | Medium | Easy | Hard |
| **SDK Recommended** | No | Yes | Yes | Yes |
| **Beginner Friendly** | Very | Medium | Medium | Low |
| **Storage** | Built-in | Volumes | External | D1/R2 |

### Best For Each Use Case

| Use Case | Recommended Provider |
|----------|---------------------|
| Get live in 30 minutes | Railway |
| Agent evaluations at scale | Daytona |
| Lowest production cost | Fly.io |
| Cloudflare ecosystem | Cloudflare Sandboxes |
| Learn containers/DevOps | Fly.io |

---

## Recommended Approach

### Option A: Two-Phase Approach (Recommended)

**Phase 1: MVP on Railway (This Week)**
- Deploy in 30 minutes
- Zero code changes
- Get real users and feedback
- Learn what matters in production

**Phase 2: Migrate to Daytona (When Needed)**
- When you need agent evals
- When you want pay-per-use pricing
- When you need parallel processing

### Option B: Direct to Daytona

If you're committed to the full setup:

**Day 1 Morning: Setup Services**
- [ ] Create Daytona account, get API key
- [ ] Create Supabase project
- [ ] Create database tables (sessions, campaigns)
- [ ] Create storage bucket (artifacts)

**Day 1 Afternoon: Build Gateway**
- [ ] Write API gateway
- [ ] Test sandbox creation
- [ ] Test agent execution
- [ ] Test Supabase integration

**Day 2: Deploy & Test**
- [ ] Deploy gateway to Vercel/Railway
- [ ] End-to-end testing
- [ ] Fix issues
- [ ] Production ready!

---

## Next Steps

### If Choosing Daytona:

1. **Create Accounts**
   - Daytona: https://app.daytona.io
   - Supabase: https://supabase.com

2. **Get API Keys**
   - Daytona API key
   - Supabase URL + service key

3. **Set Up Supabase**
   ```sql
   -- Sessions table
   CREATE TABLE sessions (
     id TEXT PRIMARY KEY,
     user_id TEXT,
     brand_name TEXT,
     brand_url TEXT,
     status TEXT DEFAULT 'active',
     current_version INTEGER DEFAULT 1,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Campaigns table
   CREATE TABLE campaigns (
     id TEXT PRIMARY KEY,
     session_id TEXT REFERENCES sessions(id),
     version INTEGER,
     research_url TEXT,
     hooks_url TEXT,
     prompts_json JSONB,
     image_urls JSONB,
     total_cost_usd DECIMAL,
     duration_ms INTEGER,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

4. **Build API Gateway** (see implementation guide)

5. **Test & Deploy**

### If Choosing Railway (Quick Start):

1. Push code to GitHub
2. Connect Railway to repo
3. Add environment variables:
   - ANTHROPIC_API_KEY
   - GEMINI_API_KEY
   - PORT=3001
4. Deploy!

---

## References

- [Claude Agent SDK Hosting Guide](./claude_sdk/sdk_hosting.md)
- [Claude Agent SDK TypeScript Reference](./claude_sdk/typescript_sdk.md)
- [Daytona Documentation](https://www.daytona.io/docs/)
- [Daytona GitHub](https://github.com/daytonaio/daytona)
- [Modal Blog: Top AI Code Sandbox Products](https://modal.com/blog/top-code-agent-sandbox-products)
- [Original Cloudflare Deployment Plan](./DEPLOYMENT_PLAN.md)

---

## Summary

| Decision | Choice |
|----------|--------|
| **Primary Provider** | Daytona |
| **Storage** | Supabase (free tier) |
| **API Gateway Host** | Vercel or Railway |
| **Cost per Campaign** | ~$0.01 (Daytona) + ~$0.25 (APIs) |
| **Free Runs** | ~20,000 |
| **Setup Time** | 1-2 days |
| **Alternative** | Railway (30 min, zero changes) |
