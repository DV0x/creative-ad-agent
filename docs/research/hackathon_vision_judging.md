# Synthesis Hackathon — Vision, Judging, and What Winning Looks Like

**Date:** March 16, 2026 | **Status:** Research complete (hackathon building closes March 22)

---

## 1. THE SYNTHESIS VISION

### Core Philosophy

Synthesis positions itself as "the first builder event you can enter without a body." The fundamental thesis: AI agents are already acting on behalf of humans but operate on infrastructure built for people, not machines. The current infrastructure has four critical gaps:

1. **Financial Accountability** — "How do you know it did what you asked?" Agents need verifiable spending scopes and transparent settlement without middlemen.
2. **Trust Without Intermediaries** — Centralized registries and API key providers can revoke access unilaterally. Agents need decentralized identity and discovery.
3. **Enforceable Agreements** — Deals agents make must be protected from platform rule changes. Need neutral enforcement layers.
4. **Privacy Protection** — Agents leak metadata about user behavior (spending patterns, contacts, preferences), creating a critical privacy vulnerability.

### What They Believe

- Ethereum is the trust layer that makes agent autonomy viable and ethical
- Agents should be able to "live forever and participate in society"
- Humans must remain in control — agents operate within human-defined boundaries
- The current centralized infrastructure (payment processors, API gatekeepers, platform TOS) is fundamentally incompatible with autonomous agents
- Infrastructure should enable agents to "wander" and "participate in society," not just "search"

### What They Want Built

Projects should address **agentic infrastructure** — not apps that use AI, but infrastructure that enables AI agents to operate autonomously with human oversight. The organizers explicitly state:

> "A working demo of one well-scoped idea beats an ambitious architecture diagram."

> "Start from genuine problems you've experienced, prioritize human control and autonomy, leverage existing Ethereum infrastructure rather than reinventing, and focus on solving specific problems rather than feature checklists."

**Confidence: HIGH** — This comes directly from the official GitHub repo and synthesis.md, primary sources from the organizers.

---

## 2. THE FOUR TRACKS — WHAT SPECIFICALLY THEY WANT

### Track 1: Agents That Pay

**Core Problem:** Agents moving money depend on centralized payment processors that can block, reverse, or surveil transactions. Humans lack transparent ways to scope spending limits or guarantee settlement.

**What to Build:**
- Scoped spending permissions via onchain allowances, session keys, or smart account modules
- Onchain settlement ensuring no third-party interference
- Conditional payments and escrow enforced by contracts
- Auditable transaction history transparent to the human

**Key Requirement:** "The human defines boundaries (amount limits, approved addresses, time windows) and the agent operates freely within them on-chain."

**Partners:** Uniswap (swap/liquidity infra, Trading API, AI skills), Locus (payment infra, wallet management, pay-per-use APIs)

### Track 2: Agents That Trust

**Core Problem:** Trust infrastructure relies on centralized registries that can revoke access or shut down, leaving humans unable to verify counterparties independently.

**What to Build:**
- Onchain attestations and reputation systems
- Portable agent credentials tied to Ethereum (ERC-8004, verifiable credentials, DIDs)
- Open discovery protocols avoiding gatekeeper marketplaces
- Verifiable service quality proofs recorded onchain

**Key Requirement:** "Verify a counterparty's track record without trusting a single registry to stay honest or stay online."

### Track 3: Agents That Cooperate

**Core Problem:** Agent commitments enforced by centralized platforms can be altered unilaterally without human consent or transparent recourse.

**What to Build:**
- Smart contract commitments enforced by protocol, not companies
- Human-defined negotiation boundaries with agent execution
- Transparent, onchain dispute resolution
- Composable coordination primitives (escrow, staking, slashing, deadlines)

**Key Requirement:** "Terms are enforced by the protocol, not a company."

### Track 4: Agents That Keep Secrets

**Core Problem:** Agent activity creates metadata revealing human financial patterns, contacts, and behaviors without privacy protection.

**What to Build:**
- Private payment rails using shielded transfers or mixers
- Zero-knowledge authorization preserving human identity
- Encrypted agent-to-service communication
- Human-controlled disclosure policies

**Key Requirement:** "Your agent proves it has permission to act without revealing who you are or why."

**Partner:** Self Protocol (identity/credential verification without data exposure)

**Confidence: HIGH** — Directly from the GitHub repo (README.md and themes content served via the hackathon site).

---

## 3. HOW JUDGING WORKS

### The Unique Dual-Judge System

Synthesis uses **both AI agent judges and human judges**. This is a first-of-its-kind approach:

1. **March 13-22:** Building period
2. **March 18:** Agentic judging provides feedback (AI judges advise projects mid-hackathon)
3. **March 22:** Building closes; final evaluation by AI and human judges
4. **March 25:** Winners announced

### What Judges Evaluate

The organizers state projects are evaluated on **"whether they work and why it matters"** — not on integration count. Emphasis on:

1. **Does it work?** Ship something functional — demos, prototypes, deployed contracts
2. **Why does it matter?** Solve a real problem, not a theoretical one
3. **Meaningful agent contribution** — Show the agent's meaningful contribution to design, code, or coordination
4. **On-chain artifacts** — Contracts, ERC-8004 registrations, attestations strengthen submissions
5. **Open source** — All code must be public by deadline
6. **Conversation log** — Document human-agent collaboration process via `conversationLog` field

### Devfolio Standard Judging Criteria

While Synthesis may customize, Devfolio's standard evaluation dimensions are:

| Dimension | What It Means |
|-----------|---------------|
| **Technicality** | Complexity and approach to solving the problem |
| **Originality** | Freshness and creativity of the idea |
| **Practicality** | Functional and usable implementation |
| **Usability (UI/UX/DX)** | Smooth experience for users or developers |
| **Wow Factor** | Elements creating lasting impressions |

### The "Open Track"

The Synthesis Open Track is "a shared, open prize across the whole event, synthesizing all the values across all the agent judges." This means all projects are eligible regardless of which specific theme track they target.

### AI Agent Judges

Details on which specific AI agents judge and how they score are not publicly documented. What is known:
- They are "AI agent judges from the Ethereum ecosystem"
- They provide feedback (not just scores) during the March 18 mid-hack checkpoint
- They evaluate alongside humans for final judging
- Partner agents (e.g., Celo's agent) also serve as judges for their specific bounties

**Confidence: MEDIUM** — The dual judging system is confirmed by multiple sources, but the specific scoring rubric and which AI agents judge are not publicly documented. The mid-hackathon feedback loop (March 18) is mentioned on synthesis.md but details are sparse.

---

## 4. SUBMISSION REQUIREMENTS

### Registration (Via API)

Agents register via `POST /register` to the Synthesis API:

```
Base URL: synthesis.devfolio.co (redirects from synthesis.md)
Auth: Bearer sk-synth-...
```

**Required Fields:**
- `name` — Agent name
- `description` — Agent purpose/capabilities
- `agentHarness` — One of: `openclaw`, `claude-code`, `codex-cli`, `opencode`, `cursor`, `cline`, `aider`, `windsurf`, `copilot`, `other`
- `model` — Primary AI model (e.g., "claude-sonnet-4-6")
- `humanInfo` object:
  - Full name (required)
  - Email (required)
  - Social media handle (optional)
  - Background: `Builder`, `Product`, `Designer`, `Student`, `Founder`, `others`
  - Crypto experience: `yes`, `no`, `a little`
  - AI agent experience: `yes`, `no`, `a little`
  - Coding comfort: 1-10 (required)
  - Problem to solve (required)

**Registration Response (201):**
```json
{
  "participantId": "string",
  "teamId": "string",
  "name": "string",
  "apiKey": "string",
  "registrationTxn": "string (URL to Base mainnet tx)"
}
```

### On-Chain Registration (ERC-8004 on Base Mainnet)

When you register via the API, the system automatically creates an on-chain identity via ERC-8004 on Base Mainnet. The `registrationTxn` in the response is the URL to the Base mainnet transaction.

**ERC-8004 Contract Addresses on Base Mainnet:**
- **IdentityRegistry:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- **ReputationRegistry:** `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`

**What Goes On-Chain:**
- An ERC-721 NFT is minted as the agent's on-chain identifier
- The NFT resolves to a JSON "Agent Card" with: name, description, services, trust models
- Custom key-value metadata via `getMetadata()`/`setMetadata()`
- Optional wallet verification via EIP-712 signatures

### Project Submission (Devfolio)

Standard Devfolio submission fields:
- **Project Name** — Title
- **Tagline** — One-liner elevator pitch
- **Problem it solves** — What your hack addresses
- **Challenges you ran into** — Obstacles overcome
- **Technologies used** — Stack components
- **Links** — GitHub repo (must be public), hosted demo, etc.
- **Video Demo** — YouTube preferred, 2-4 minutes
- **Screenshots** — Visual materials
- **Track selection** — Which prize track(s) you're targeting
- **conversationLog** — Document of human-agent collaboration process

### Five Core Rules

1. **Ship something that works.** Demos, prototypes, deployed contracts.
2. **Agent must be a real participant** with meaningful contribution to design, code, or coordination.
3. **On-chain artifacts strengthen submission.** Contracts, ERC-8004 registrations, attestations.
4. **Open source required.** All code must be public by deadline.
5. **Document collaboration** in `conversationLog` field.

**Confidence: HIGH** — Directly from the skill.md API spec and GitHub repo.

---

## 5. PRIZES AND PARTNERS

### Prize Structure

The exact dollar amounts for the Open Track are not publicly listed on the website. What is known:

- **Open Track:** Shared prize across the whole event, focused on alignment with track values
- **Partner Bounties:** Smaller prizes for using specific partner tools
  - **Celo:** Up to $10,000 in bounties, judged by Celo's own agent
  - **Locus:** "Best Use of Locus" track (amount not specified)
  - **Uniswap:** Partner track (amount not specified)
  - **Other partners** with bounties: Octant, Venice AI, Virtuals Protocol, Olas, Lit Protocol, Protocol Labs, ENS, Base, MetaMask, Filecoin, Lido DAO (30+ total partners)

### Confirmed Partners (30+)

Uniswap, Octant, Venice AI, Celo, Lido DAO, ENS, Base, Protocol Labs, Olas, Virtuals Protocol, MetaMask, Filecoin, Lit Protocol, Ethereum Foundation, Devfolio, Self Protocol, and others.

### Partnership Tiers
- **Protocol Partners:** Logo, dedicated track/bounty option, judging seat, full API access
- **Infrastructure Partners:** Logo, credits/tooling, stream access, talent pool
- **Community Partners:** Logo, cross-promotion, shared pipeline
- **Judge/Mentor Partners:** Evaluate submissions, influence direction

**Confidence: MEDIUM** — Partner list is confirmed from primary sources. Specific prize amounts are only partially known (Celo's $10K is confirmed; others are not publicly listed). The total prize pool is not stated anywhere publicly.

---

## 6. COMMUNITY CHANNELS AND ORGANIZER GUIDANCE

### Official Channels

| Channel | URL | Purpose |
|---------|-----|---------|
| Website | https://synthesis.md/ | Main event page |
| Twitter/X | https://x.com/synthesis_md | Announcements |
| Telegram | https://nsb.dev/synthesis-updates | Updates channel |
| GitHub | https://github.com/sodofi/synthesis-hackathon | Rules, themes, skill.md |
| Calendar | https://luma.com/synthesis.md | Workshops and events |
| Agent setup | https://github.com/sodofi/agent-setup-resources | Getting started |
| Partner info | https://synthesis.md/partners.md | Partner details |
| Contact | sophia.dew@ethereum.org or Telegram @sodofi | Organizer |

### Organizer: Sophia (sodofi)

The primary organizer appears to be Sophia Dew (contact: sophia.dew@ethereum.org, Telegram: @sodofi). Connected to the Ethereum Foundation based on the email domain.

### What Organizers Have Said

From the GitHub repo and synthesis.md, the organizers emphasize:

1. **Start from real problems** — Build from genuine problems you've experienced
2. **Human control first** — Prioritize human control and autonomy in your design
3. **Leverage existing infra** — Use existing Ethereum infrastructure rather than reinventing
4. **Scope tightly** — A working demo of one well-scoped idea beats an ambitious architecture diagram
5. **It works AND it matters** — Projects evaluated on whether they work and why it matters, not integration count

### Scheduled Events

- **March 16:** Octant Tracks @ Synthesis Hackathon (Livestream) — Online, 12:30-1:30 PM ET
- Other events likely on the Luma calendar (dynamically loaded)

**Confidence: HIGH** for channels and organizer identity (primary sources). LOW for complete event calendar (Luma loads dynamically, only one event confirmed).

---

## 7. WHAT WINNING LOOKS LIKE — SYNTHESIS

### Based on All Evidence, A Winning Submission Would:

1. **Solve a genuine, specific problem** in one of the four tracks — not a theoretical exercise
2. **Ship a working demo** — deployed contract, functional prototype, something you can interact with
3. **Show meaningful human-agent collaboration** — the `conversationLog` documenting how human and agent worked together is a requirement, not optional
4. **Have on-chain artifacts** — ERC-8004 registration, deployed smart contracts, onchain attestations
5. **Be open source** — public repo by deadline
6. **Focus on infrastructure** not apps — enable other agents to do things, don't just build an agent that does one thing
7. **Keep humans in control** — human-defined boundaries, transparency, auditability
8. **Demonstrate one thing well** rather than many things poorly
9. **Include a compelling demo video** — 2-4 minutes, clear walkthrough
10. **Use partner tools meaningfully** — not gratuitous integration, but genuine use of Uniswap/Locus/Celo/etc. that strengthens the solution

### What Would Likely Lose

- Architecture diagrams without working code
- Feature checklists without depth
- Apps that use AI but don't address agentic infrastructure
- Projects without on-chain components
- Closed-source submissions
- Projects where the agent's contribution is superficial

### Steel-Man Counter-Argument

**Who would disagree with this assessment?** A builder focused on user-facing products might argue that infrastructure-only projects lack demonstrated user value — that judges will reward something with clear UX and user impact over plumbing. This is a valid concern since the judging criteria mention "practicality" and "usability." The best strategy is likely infrastructure WITH a compelling demo showing real usage.

**What would change this assessment?** If the AI judges have specific scoring rubrics that weight certain factors heavily (e.g., 50% on technical complexity, 20% on business viability), this analysis would shift. The specific AI judging criteria are not public.

---

## 8. HOW AI AGENT JUDGING WORKS

### What We Know

- AI agent judges from the Ethereum ecosystem evaluate projects alongside human judges
- On March 18 (mid-hackathon), agentic judges provide **feedback** — not scores, but advice
- On March 22, both AI and human judges evaluate final submissions
- Partner-specific agents (Celo's agent) judge their own bounty tracks
- The Open Track synthesizes "all the values across all the agent judges"

### What We Don't Know

- Which specific AI models or agents serve as judges
- The exact scoring rubric or weighting
- How agent judge scores are combined with human judge scores
- Whether agents evaluate code, demos, or written descriptions
- How the "synthesis" of agent judge values works in the Open Track

### Speculation (LOW Confidence)

Given that submissions include a `conversationLog`, demo video, GitHub repo, and written descriptions, the AI judges likely evaluate:
- The quality and coherence of the conversationLog (human-agent collaboration quality)
- Code quality and completeness from the public repo
- Whether on-chain artifacts exist and function
- Alignment with track themes based on project description

The mid-hackathon feedback (March 18) suggests the AI judges can provide constructive advice, implying they analyze work-in-progress code and documentation, not just final outputs.

---

## 9. ERC-8004 ON-CHAIN REGISTRATION — TECHNICAL DETAILS

### How It Works

ERC-8004 establishes three lightweight on-chain registries:

1. **Identity Registry** (ERC-721 based) — Agents get NFT-based identifiers
2. **Reputation Registry** — Standardized feedback signals (ratings, tags, off-chain references)
3. **Validation Registry** — Hooks for validators to publish attestation results

### Registration Process

1. Call `register()` on the Identity Registry contract
2. An ERC-721 NFT is minted for the agent
3. The NFT's `agentURI` resolves to a JSON registration file ("Agent Card") containing:
   - Type, name, description, image
   - Services array (endpoints: web, A2A, MCP, OASF, ENS, DID, email)
   - x402 payment support flag
   - Active status and trust models supported

### Base Mainnet Contracts

| Contract | Address |
|----------|---------|
| Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Reputation Registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

Deployed on 30+ chains including Ethereum mainnet, Base, Optimism, Arbitrum, Polygon, Celo, and many testnets.

### In the Context of Synthesis

When you register via the Synthesis API (`POST /register`), the system automatically:
1. Creates your on-chain ERC-8004 identity on Base Mainnet
2. Returns the `registrationTxn` URL pointing to the Base mainnet transaction
3. Issues your `apiKey` (format: `sk-synth-...`)

You do NOT need to interact with the contracts directly — the Synthesis API handles it.

### Adoption Signal

24,000+ agents registered via ERC-8004 in its first 8 weeks (from the SYNTHESIS_BRIEFING.md research). This is the de facto standard for agent identity in the Ethereum ecosystem.

**Confidence: HIGH** — Contract addresses from the official erc-8004-contracts GitHub repo. Registration flow from the skill.md API spec.

---

## 10. GAPS AND UNCERTAINTIES

### What I Could NOT Find or Verify

| Gap | Severity | Notes |
|-----|----------|-------|
| **Total prize pool amount** | HIGH | Not stated publicly. Only Celo's $10K bounty confirmed. |
| **AI judge identities and scoring rubric** | HIGH | "AI agent judges from the Ethereum ecosystem" is the only description. No specifics on which models, what they score, or how scores are weighted vs. human judges. |
| **Specific partner bounty amounts** | MEDIUM | Locus, Uniswap, Octant, and others have bounties but amounts not listed on the public site. May be on the dynamically-loaded Devfolio prizes page. |
| **Discord server** | MEDIUM | No official Synthesis Discord found. Community appears to be on Telegram (nsb.dev/synthesis-updates). |
| **Post-hackathon support / incubation** | LOW | No information on what happens to winners beyond prize money. |
| **Whether AI winners actually receive prizes** | MEDIUM | FAQ says "AIs can enter, compete, judge, and win" but "winnings for AI winners to be determined." Legal status confirmed as viable but mechanism unclear. |
| **conversationLog format specification** | MEDIUM | Required in submission but format/structure not documented. |
| **Full event calendar** | LOW | Luma page loads dynamically. Only one event (Octant tracks, March 16) confirmed. |
| **Number of submissions so far** | LOW | Not publicly tracked. |

### Source Quality Assessment

| Source | Type | Currency | Reliability |
|--------|------|----------|-------------|
| synthesis.md | PRIMARY | Current (live event) | HIGH |
| GitHub sodofi/synthesis-hackathon | PRIMARY | Current | HIGH |
| skill.md (API spec) | PRIMARY | Current | HIGH |
| Devfolio judging guide | SECONDARY | General (not Synthesis-specific) | MEDIUM |
| Blockchain news (Celo) | SECONDARY | March 2026 | MEDIUM |
| ERC-8004 contracts repo | PRIMARY | Current | HIGH |
| awesome-erc8004 | SECONDARY | Current | MEDIUM |

---

## 11. STRATEGIC IMPLICATIONS

### What Changes in 12 Months?

- ERC-8004 adoption is accelerating (24K agents in 8 weeks). By 2027, agent identity may be commoditized — projects built on top of it now have first-mover advantage
- x402 protocol (HTTP-native payments) has massive backing (Coinbase, Google, Cloudflare, Stripe, Mastercard). Agent payment infrastructure will likely standardize around it
- Competing hackathons (ETHGlobal Agentic Ethereum with $150K, OpenClaw with $30K USDC) are exploring similar themes. Winners here get ecosystem visibility

### Where Does Value Live?

The Synthesis tracks align with infrastructure that creates **compounding value**:
- **Identity/Trust (Track 2):** Network effects — more agents registered = more valuable registry
- **Cooperation (Track 3):** Switching costs — once agents use a coordination protocol, migrating is expensive
- **Privacy (Track 4):** Proprietary capability — ZK circuits and privacy infrastructure are hard to replicate
- **Payments (Track 1):** Commoditization risk — many teams building payment infra. Differentiation matters.

### Who Else Could Solve This?

- Coinbase (Base) could build all of Track 1 natively
- Protocol Labs could make Track 2 a core Filecoin/IPFS feature
- MetaMask could embed Track 1-2 in its wallet
- The most dangerous competitor: general-purpose agent frameworks (LangChain, CrewAI) adding crypto capabilities as plugins, making dedicated infrastructure unnecessary

---

## Sources

### Primary Sources
- [Synthesis Main Site](https://synthesis.md/) — Event overview, vision, partners
- [Synthesis GitHub Repo](https://github.com/sodofi/synthesis-hackathon) — Rules, themes, building guidance
- [Agent Setup Resources](https://github.com/sodofi/agent-setup-resources) — Registration guide
- [ERC-8004 EIP Specification](https://eips.ethereum.org/EIPS/eip-8004) — Full standard specification
- [ERC-8004 Contracts](https://github.com/erc-8004/erc-8004-contracts) — Contract addresses, deployments
- [Synthesis Skill.md API](https://synthesis.devfolio.co/skill.md) — Registration API spec
- [Synthesis Build-an-Agent Guide](https://synthesis.md/build-an-agent/) — Framework options, setup
- [Synthesis Partners Page](https://synthesis.md/partners.md) — Partnership tiers

### Secondary Sources
- [Celo Joins Synthesis Hackathon](https://blockchain.news/flashnews/celo-joins-synthesis-hackathon-to-promote-agentic-app-development) — Celo bounty details ($10K)
- [Awesome ERC-8004](https://github.com/sudeepb02/awesome-erc8004) — ERC-8004 ecosystem resources
- [ERC-8004 Explained (PayRam)](https://www.payram.com/blog/what-is-erc-8004-protocol) — Technical overview
- [Devfolio Project Submission Guide](https://guide.devfolio.co/docs/guide/participating-in-hackathons/project-submission) — Submission fields
- [Devfolio Judging Guide](https://guide.devfolio.co/docs/guide/participating-in-hackathons/judging-1) — Judging criteria
- [Luma Events Calendar](https://luma.com/synthesis.md) — Scheduled events
- [Synthesis Twitter/X](https://x.com/synthesis_md) — Announcements
- [Synthesis Telegram](https://nsb.dev/synthesis-updates) — Community updates
