# Product Requirements Document
## AI-Powered Creative Ad Generation Agent

**Version:** 1.0
**Date:** September 2024
**Status:** Draft
**Author:** Product Team

---

## 1. Executive Summary

### Product Vision
An intelligent creative agent system that automatically generates 10 high-quality, strategically-aligned ad creatives for Meta and Instagram platforms by analyzing brand websites, identifying customer pain points, and researching competitor strategies.

### Core Value Proposition
Transform a simple website URL into 10 diverse, ready-to-use ad creatives in under 5 minutes, eliminating the need for manual research, design briefs, and multiple iteration cycles.

### Key Differentiators
- **Deep Multi-Domain Research**: Parallel specialized analysis across brand, customer, and competitive dimensions
- **Strategic Diversity**: 10 unique creatives addressing different angles and pain points
- **Speed**: Complete generation in ~5 minutes vs hours of manual work
- **Platform Optimization**: Native optimization for Meta and Instagram specifications

---

## 2. Problem Statement

### Current Pain Points
1. **Time Intensive**: Creating 10 ad variants takes 4-8 hours of manual work
2. **Research Fragmentation**: Brand analysis, competitor research, and customer insights happen in silos
3. **Creative Fatigue**: Designers struggle to generate diverse angles quickly
4. **Inconsistent Quality**: Manual process leads to varying quality and brand alignment
5. **Platform Compliance**: Manually ensuring each creative meets platform specs is tedious

### Target User Problems
- Marketing teams need rapid creative testing for campaigns
- Agencies struggle to scale creative production for multiple clients
- Small businesses lack resources for comprehensive market research
- Performance marketers need diverse creatives for A/B testing

---

## 3. User Personas

### Primary Persona: Performance Marketer "Sarah"
- **Role**: Digital Marketing Manager at D2C brand
- **Goals**: Test multiple creative angles quickly, improve ROAS
- **Pain Points**: Creative bottlenecks, limited design resources
- **Success Metrics**: CTR improvement, reduced creative production time

### Secondary Persona: Agency Creative Director "Michael"
- **Role**: Creative Director at digital agency
- **Goals**: Scale creative output for multiple clients
- **Pain Points**: Maintaining quality while increasing volume
- **Success Metrics**: Client satisfaction, production efficiency

### Tertiary Persona: Small Business Owner "Jessica"
- **Role**: E-commerce entrepreneur
- **Goals**: Professional ads without agency costs
- **Pain Points**: No design team, limited marketing knowledge
- **Success Metrics**: Ad engagement, cost savings

---

## 4. Functional Requirements

### 4.1 Core Capabilities

#### Input Processing
- **Accept website URL** as primary input
- **Optional parameters**:
  - Target platform (Meta/Instagram/Both)
  - Campaign objective (Awareness/Conversion/Engagement)
  - Industry category
  - Target audience description
  - Brand guidelines (optional file upload)

#### Research & Analysis Engine

##### Subagent 1: Brand Intelligence Analyst
**Purpose**: Deep brand understanding and visual identity extraction

**Capabilities**:
- Extract brand colors, typography, visual style
- Identify brand voice and tone
- Map value propositions and USPs
- Analyze product/service offerings
- Understand target positioning

**Tools Used**:
- WebFetch for website scraping
- Read for brand guideline processing
- Built-in AI for synthesis

**Output Structure**:
```json
{
  "brandName": "string",
  "colors": {
    "primary": ["#hex"],
    "secondary": ["#hex"]
  },
  "voice": "professional|casual|playful|serious",
  "values": ["innovation", "sustainability"],
  "visualStyle": "minimal|bold|elegant|technical",
  "USPs": ["key differentiator 1", "key differentiator 2"],
  "products": [{
    "name": "string",
    "category": "string",
    "keyFeatures": ["feature1", "feature2"]
  }]
}
```

##### Subagent 2: Customer Psychology Specialist
**Purpose**: Understand customer pain points, desires, and emotional triggers

**Capabilities**:
- Identify explicit and implicit pain points
- Map customer journey stages
- Extract emotional triggers
- Understand objections and concerns
- Identify aspirational elements

**Tools Used**:
- WebFetch for testimonial/review extraction
- WebSearch for industry pain point research
- Built-in AI for psychology analysis

**Output Structure**:
```json
{
  "painPoints": {
    "explicit": ["time-consuming", "expensive"],
    "implicit": ["fear of missing out", "status anxiety"]
  },
  "desires": ["efficiency", "recognition", "success"],
  "emotions": {
    "negative": ["frustration", "overwhelm"],
    "positive": ["confidence", "excitement"]
  },
  "objections": ["price", "complexity", "trust"],
  "customerJourney": {
    "awareness": "problem recognition",
    "consideration": "solution research",
    "decision": "comparison factors"
  }
}
```

##### Subagent 3: Competitive Intelligence Specialist
**Purpose**: Analyze competitor strategies and identify market opportunities

**Capabilities**:
- Identify top 3-5 direct competitors
- Analyze competitor ad strategies
- Find market positioning gaps
- Extract winning creative patterns
- Identify differentiation opportunities

**Tools Used**:
- WebSearch for competitor discovery
- WebFetch for competitor website analysis
- Built-in AI for strategy synthesis

**Output Structure**:
```json
{
  "competitors": [
    {
      "name": "string",
      "positioning": "string",
      "adThemes": ["theme1", "theme2"],
      "weaknesses": ["weakness1"]
    }
  ],
  "marketGaps": ["underserved need 1", "underserved need 2"],
  "winningPatterns": ["social proof", "urgency"],
  "differentiationOpportunities": ["unique angle 1", "unique angle 2"]
}
```

##### Subagent 4: Copy Creator Agent
**Purpose**: Generate compelling ad copy using proven frameworks

**Capabilities**:
- Write headlines and body copy for each creative angle
- Apply appropriate copywriting frameworks per angle
- Maintain brand voice consistency
- Optimize for platform character limits
- Generate CTA variations

**Tools Used**:
- Read for accessing brand voice guidelines
- Write for structured copy output
- Built-in AI for copy generation

**Copywriting Frameworks**:
- **Problem-Solution**: PAS (Problem, Agitate, Solution)
- **Social Proof**: 4 Ps (Promise, Picture, Proof, Push)
- **Transformation**: Before-After-Bridge
- **Product Hero**: FAB (Features, Advantages, Benefits)
- **Emotional**: AIDA (Attention, Interest, Desire, Action)

**Output Structure**:
```json
{
  "angle": "problem-solution",
  "variant": "A",
  "copy": {
    "headline": "Stop Wasting Hours on Ads",
    "subheadline": "AI Creates 10 in 5 Minutes",
    "body": "Transform URLs into ready-to-use Meta creatives instantly.",
    "cta": "Start Free Trial"
  }
}
```

#### Main Agent: Creative Director Orchestrator

**Purpose**: Synthesize research, coordinate copy creation, and generate strategic ad creatives

**Capabilities**:
- Coordinate parallel subagent execution
- Synthesize multi-domain insights
- Generate 5 strategic angles with 2 variants each
- Delegate copy creation to Copy Creator Agent
- Execute image generation via nano_banana MCP tool
- Optimize for platform specifications

**Workflow**:
1. **Phase 1 - Research** (60 seconds):
   - Launch 3 research subagents in parallel
   - Collect structured JSON data from each
2. **Phase 2 - Creative Strategy & Copy** (90 seconds):
   - Synthesize research insights
   - Generate 5 strategic angles
   - Delegate to Copy Creator for 10 copy variations
3. **Phase 3 - Visual Generation** (120 seconds):
   - Create optimized visual prompts
   - Execute nano_banana MCP calls directly
   - Generate images for all 10 creatives
4. **Phase 4 - Assembly** (10 seconds):
   - Combine images with copy
   - Apply platform specifications
   - Package final deliverables

### 4.2 Creative Generation Strategy

#### 5 Core Angles × 2 Variants = 10 Creatives

1. **Problem-Solution Angle**
   - Variant A: Dramatize the pain point
   - Variant B: Showcase the relief/solution

2. **Social Proof Angle**
   - Variant A: Customer testimonial style
   - Variant B: Statistics and numbers

3. **Transformation Angle**
   - Variant A: Before state
   - Variant B: After state

4. **Product Hero Angle**
   - Variant A: Minimalist product focus
   - Variant B: Product in lifestyle context

5. **Emotional Connection Angle**
   - Variant A: Aspirational imagery
   - Variant B: Relatable everyday moment

### 4.3 Platform Optimization

#### Instagram Specifications
- Square (1:1): 1080×1080px
- Portrait (4:5): 1080×1350px
- Stories (9:16): 1080×1920px
- Safe zones for text overlay
- Mobile-first visual hierarchy

#### Meta Feed Specifications
- Square (1:1): 1080×1080px
- Landscape (16:9): 1200×628px
- Carousel support
- Headline and description areas
- CTA button placement

---

## 5. Technical Architecture

### 5.1 System Architecture

```
                        User Input (URL + Parameters)
                                    ↓
                 ┌──────────────────────────────────────┐
                 │   MAIN CREATIVE DIRECTOR AGENT      │
                 │   (Orchestrator & Image Generator)   │
                 └──────────────┬───────────────────────┘
                                ↓
                        [PHASE 1: RESEARCH]
                     Launch 3 Agents in Parallel
                                ↓
        ┌───────────────────────┼───────────────────────┐
        ↓                       ↓                       ↓
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ BRAND INTELLIGENCE│   │ CUSTOMER PSYCH   │   │ COMPETITIVE INTEL │
│     ANALYST       │   │   SPECIALIST     │   │    SPECIALIST     │
├───────────────────┤   ├──────────────────┤   ├──────────────────┤
│Tools:             │   │Tools:            │   │Tools:             │
│- WebFetch         │   │- WebFetch        │   │- WebSearch        │
│- Read             │   │- WebSearch       │   │- WebFetch         │
└────────┬──────────┘   └────────┬─────────┘   └────────┬──────────┘
         │                       │                       │
      [JSON]                  [JSON]                  [JSON]
         └───────────────────────┼───────────────────────┘
                                ↓
                    [MAIN AGENT: Synthesize Research]
                                ↓
                        [PHASE 2: CREATIVE]
                    Generate 5 Strategic Angles
                                ↓
                 ┌──────────────────────────────┐
                 │      COPY CREATOR AGENT      │
                 ├──────────────────────────────┤
                 │ Tools: Read, Write           │
                 ├──────────────────────────────┤
                 │ Generates 10 copy variations │
                 │ using proven frameworks      │
                 └──────────────┬───────────────┘
                                ↓
                      [PHASE 3: VISUAL GENERATION]
                    Main Agent Direct MCP Execution
                                ↓
                 ┌──────────────────────────────┐
                 │   MAIN AGENT IMAGE CREATION  │
                 ├──────────────────────────────┤
                 │ MCP Tool: nano_banana        │
                 │ Direct execution (no subagent)│
                 └──────────────┬───────────────┘
                                ↓
                        [PHASE 4: ASSEMBLY]
                                ↓
                 ┌──────────────────────────────┐
                 │     FINAL OUTPUT PACKAGE     │
                 ├──────────────────────────────┤
                 │ 10 Complete Ad Creatives     │
                 └──────────────────────────────┘
```

### 5.2 Technology Stack

**Core Framework**:
- Claude SDK (@anthropic-ai/claude-code)
- TypeScript/Node.js runtime
- Streaming input mode for MCP access

**Image Generation**:
- nano_banana integration (Gemini 2.5 Flash Image)
- MCP server wrapper
- Base64 image encoding

**Research Tools**:
- WebFetch for website analysis
- WebSearch for market research
- Parallel execution capability

### 5.3 Data Flow

1. **Input Reception**: URL + parameters
2. **Parallel Research**: 3 subagents launch simultaneously
3. **Data Aggregation**: Structured JSON returns
4. **Synthesis**: Main agent combines insights
5. **Angle Generation**: 5 strategic angles with 2 variants each
6. **Copy Creation**: Copy Creator agent generates 10 variations
7. **Image Creation**: Main agent executes nano_banana MCP calls directly
8. **Output Delivery**: 10 ad creatives + metadata

### 5.4 Critical Architecture Decisions

**MCP Tool Access Pattern**:
- **Top-level `allowedTools` configuration**: Makes MCP tools available session-wide
- **All agents (main + subagents)**: Can access MCP tools listed in `allowedTools`
- **Agent definitions**: Specify which tools they use via `tools:` frontmatter field
- **Solution**: visual-director subagent handles image generation directly

**Agent Hierarchy** (Corrected):
```
query() level with allowedTools configuration
    ├─ Main Agent → CAN use MCP tools ✅
    └─ Subagents → CAN use MCP tools ✅ (when listed in allowedTools)
```

**Execution Flow**:
- Research subagents run in parallel (Phase 1)
- Copy Creator runs sequentially after research (Phase 2)
- visual-director subagent generates images via MCP (Phase 3)
- Subagent has full MCP access via proper configuration

**Critical Implementation Detail** (see `MCP_STREAM_FIX.md`):
- Async generator must stay alive during MCP tool execution
- Use `AbortController` pattern to control generator lifetime
- Prevents "stream closed" errors with long-running MCP tools

---

## 6. Non-Functional Requirements

### Performance
- **Total execution time**: < 5 minutes
- **Parallel processing**: 3+ concurrent operations
- **Image generation**: < 30 seconds per image
- **System availability**: 99.9% uptime

### Scalability
- Support 100+ concurrent users
- Process 1000+ requests/day
- Cacheable research data
- Queue management for peak loads

### Quality
- Brand consistency score > 85%
- Platform compliance: 100%
- Unique creative angles: 10/10
- No duplicate concepts

### Security
- Secure API key management
- No storage of sensitive client data
- Sandboxed execution environment
- Rate limiting per user

---

## 7. Success Metrics

### Primary KPIs
- **Time to Generation**: < 5 minutes (vs 4-8 hours manual)
- **Creative Diversity Score**: 10 unique angles achieved
- **User Satisfaction**: > 4.5/5 rating
- **Platform Compliance**: 100% of creatives meet specs

### Secondary KPIs
- **Research Depth**: 3+ pain points identified
- **Competitive Insights**: 3+ competitors analyzed
- **Brand Alignment**: > 85% consistency score
- **Cost per Generation**: < $0.50 in API costs

### Usage Metrics
- Daily active users
- Creatives generated per user
- Repeat usage rate
- Time saved per campaign

---

## 8. MVP Scope

### Phase 1: Core Functionality (MVP)
- ✅ Single URL input processing
- ✅ 3 specialized subagents
- ✅ 10 creative generation
- ✅ Basic platform optimization
- ✅ In-memory processing

### Phase 2: Enhanced Features
- ⏸️ Brand guideline uploads
- ⏸️ Custom angle specification
- ⏸️ A/B testing recommendations
- ⏸️ Performance predictions
- ⏸️ Export to ad platforms

### Phase 3: Advanced Capabilities
- ⏸️ Multi-language support
- ⏸️ Video ad generation
- ⏸️ Campaign management
- ⏸️ Performance tracking
- ⏸️ Learning from results

---

## 9. Risks & Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| ~~MCP subagent access limitation~~ | ~~High~~ | ✅ Resolved: Subagents can access MCP via allowedTools |
| MCP generator lifetime management | Medium | ✅ Implemented: AbortController pattern keeps stream alive |
| API rate limits | Medium | Implement caching and queuing |
| Context window limits | Medium | Automatic compression, structured data |
| Image generation quality | High | Multiple variants, quality thresholds |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| User adoption | High | Free trial, case studies |
| Competitive response | Medium | Rapid iteration, unique features |
| Cost management | Medium | Usage limits, tiered pricing |
| Brand safety | High | Content filtering, guidelines |

---

## 10. Implementation Timeline

### Week 1-2: Foundation
- Set up Claude SDK environment
- Create subagent configurations
- Implement basic orchestration

### Week 3-4: Research Layer
- Build Brand Intelligence Analyst
- Build Customer Psychology Specialist
- Build Competitive Intelligence Specialist
- Test parallel execution

### Week 5-6: Generation Layer
- Integrate nano_banana MCP
- Implement prompt optimization
- Create angle generation logic
- Test image generation

### Week 7-8: Integration & Testing
- End-to-end testing
- Performance optimization
- Error handling
- Documentation

### Week 9-10: Launch Preparation
- Beta testing with users
- Refinement based on feedback
- Production deployment
- Monitoring setup

---

## 11. Open Questions

1. Should we cache research data for similar brands?
2. How do we handle multi-brand agencies?
3. Should we offer creative versioning/history?
4. Do we need human-in-the-loop quality control?
5. How do we measure actual ad performance post-generation?

---

## 12. Appendices

### A. Example Input/Output

**Input**:
```json
{
  "websiteUrl": "https://example-brand.com",
  "platform": "instagram",
  "objective": "conversion",
  "quantity": 10
}
```

**Output**:
```json
{
  "creatives": [
    {
      "id": "creative_001",
      "angle": "problem-solution",
      "variant": "pain-point",
      "imageUrl": "base64_data_or_url",
      "prompt": "generated_prompt_used",
      "platformOptimized": true,
      "dimensions": "1080x1080"
    }
    // ... 9 more creatives
  ],
  "metadata": {
    "generationTime": "4.7 minutes",
    "researchInsights": {...},
    "brandElements": {...}
  }
}
```

### B. Subagent Configuration Examples

**Brand Intelligence Analyst**:
```yaml
---
name: brand-intelligence-analyst
description: Deep brand analysis and visual identity extraction
tools: WebFetch, Read, Grep
---

You are an expert brand strategist with 20 years of experience...
```

**Copy Creator Agent**:
```yaml
---
name: copy-creator
description: Generate compelling ad copy using proven frameworks
tools: Read, Write
---

You are an expert direct response copywriter specializing in Meta ads.

For each creative angle, generate copy using these frameworks:
- Problem-Solution → PAS framework
- Social Proof → 4 Ps framework
- Transformation → Before-After-Bridge
- Product Hero → FAB framework
- Emotional → AIDA framework
```

### C. References
- Claude SDK Documentation
- Gemini 2.5 Flash Image API
- Meta Ads Creative Specifications
- Instagram Advertising Guidelines

---

**Document Status**: Ready for Review
**Next Steps**: Technical feasibility validation, stakeholder approval