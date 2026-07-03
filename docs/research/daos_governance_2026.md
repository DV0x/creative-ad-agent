# DAOs, Governance & Coordination: 2025-2026 Landscape Report

**Date:** March 15, 2026
**Confidence Key:** HIGH = multiple primary sources agree | MEDIUM = limited or secondary sources | LOW = single source or speculation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The DAO Landscape: Post-Hype Reality](#2-the-dao-landscape-post-hype-reality)
3. [Governance Pain Points](#3-governance-pain-points)
4. [New Governance Models](#4-new-governance-models)
5. [Governor Contracts & Tooling Standards](#5-governor-contracts--tooling-standards)
6. [Real Examples: How Major DAOs Actually Govern](#6-real-examples-how-major-daos-actually-govern)
7. [Treasury Management](#7-treasury-management)
8. [AI Agents in Governance](#8-ai-agents-in-governance)
9. [Sub-DAOs and Working Groups](#9-sub-daos-and-working-groups)
10. [Legal Wrappers](#10-legal-wrappers)
11. [Multi-Agent Coordination On-Chain](#11-multi-agent-coordination-on-chain)
12. [MetaMask Delegation Toolkit](#12-metamask-delegation-toolkit)
13. [Where AI Agents Can Genuinely Improve Governance](#13-where-ai-agents-can-genuinely-improve-governance)
14. [Gaps & Uncertainties](#14-gaps--uncertainties)
15. [Sources](#15-sources)

---

## 1. Executive Summary

The DAO ecosystem in 2025-2026 has matured past its hype phase into a more sober, consolidated reality. The data tells a clear story: treasuries grew to $24.5 billion across all DAOs, but participation collapsed, power concentrated among professional delegates, and several high-profile DAOs (ApeCoin, Jupiter) shut down entirely, calling governance "theater." The surviving DAOs are evolving rapidly -- adopting hybrid centralized-decentralized structures, experimenting with prediction markets (futarchy), and beginning to integrate AI agents for proposal analysis and delegated voting.

**Five key findings:**

1. **Consolidation is real.** Expert predictions suggest 50-100 vibrant DAOs will survive. Proposals dropped 60-90% YoY across major protocols. The top 10% of token holders control 76.2% of voting power. (HIGH confidence)

2. **Governance is centralizing by design.** Arbitrum created OpCo, Uniswap created DUNI, Jupiter suspended governance entirely. This is not failure -- it is an intentional shift toward hybrid models where community retains veto power but execution moves to professional teams. (HIGH confidence)

3. **Futarchy is the most promising new governance model.** Prediction markets as governance mechanisms are moving from theory to production (Jito, Sanctum, Optimism experiments). However, Optimism's experiment revealed serious metric-design flaws. (MEDIUM confidence -- still early)

4. **AI agents in governance are real but primitive.** DAO-AI matched final governance outcomes in 92.5% of cases vs 76.6% for average human voters. Vitalik Buterin proposed "AI stewards" in February 2026. NEAR is building AI governance delegates. MakerDAO has GAITs. But no system is in production at scale. (MEDIUM confidence)

5. **The MetaMask Delegation Toolkit (ERC-7710/7715) creates the technical foundation for AI agents to operate on-chain with scoped permissions.** This is the most important infrastructure development for agent-based governance. (HIGH confidence on technical capability; LOW confidence on adoption timeline)

---

## 2. The DAO Landscape: Post-Hype Reality

### 2.1 By the Numbers

| Metric | Value | Source | Confidence |
|--------|-------|--------|------------|
| Total DAOs active | 13,000+ | Multiple aggregators | HIGH |
| Total treasury value | $24.5 billion | XDAO/DeepDAO, 2025 | HIGH |
| Average treasury per DAO | ~$1.2 million | XDAO, 2025 | MEDIUM |
| Top 5 DAOs % of total treasury | >50% | Multiple sources | HIGH |
| Average voter turnout | 15-25% of token holders | Multiple sources | HIGH |
| Decentraland voter participation | 0.79% avg, 0.16% median | Academic research | HIGH |
| Protocols distributing revenue to holders | 15% (up from 5% in 2024) | State of DeFi report | HIGH |
| DAO tokens worth under $1M | 63 | CoinDesk, July 2025 | MEDIUM |

### 2.2 The Consolidation Thesis

Joshua Tan of Metagov (the DAO standards body) predicts 50-100 vibrant DAOs will survive long-term, with weaker projects disappearing in a pattern comparable to post-ICO boom consolidation. This prediction appears defensible given:

- Proposals dropped 60-90% YoY across six major DAOs (Aave, Lido, Uniswap, Arbitrum, Balancer, Frax)
- Median voter participation declined at every protocol except Lido
- While total voters decreased, votes cast per voter increased -- delegation to professional representatives expanded significantly

**Counter-argument:** One could argue the drop in proposals represents maturity, not decline -- a DAO that has resolved most parameter debates simply needs fewer votes. The counter-evidence: Jupiter and ApeCoin explicitly cited governance dysfunction, not maturity, when shutting down.

### 2.3 Who Died, Who Survived

**Shut down or suspended governance:**
- **ApeCoin DAO** (June 2025): Dissolved with 99.66% approval. CEO Greg Solano called it "sluggish, noisy, and often unserious governance theater" funding "vanity proposals." Replaced by ApeCo, a centralized operating entity. Treasury: ~$168M transferred.
- **Jupiter DEX** (June 2025): Suspended DAO voting until 2026, citing "breakdown in trust." COO Kash Dhanda said the DAO structure "isn't working as intended."
- **Mango Markets**: $19M in worthless tokens after shutting down.
- **63 DAO tokens** worth under $1M: effectively dead projects.

**Thriving (by treasury and activity):**
- Optimism ($7.9B treasury), Arbitrum ($6.8B), Uniswap ($4.8B), Gnosis ($2.7B), Aave, Lido, ENS, MakerDAO/Sky

**Who would disagree with the "consolidation" thesis?** Small-DAO builders would argue the long tail matters -- that micro-DAOs serving niche communities (gaming guilds, local cooperatives, artist collectives) represent the real future, just at smaller scale. This is plausible but unproven. The evidence for large-protocol DAO consolidation is strong.

---

## 3. Governance Pain Points

### 3.1 Voter Apathy

The core problem is structural: governance is a public good with private costs. Reading a 50-page Aave risk parameter proposal takes hours. Most token holders are investors, not governance participants.

**Data:**
- Average DAO voting participation: 15-25% of token holders
- Decentraland: 0.79% average, 0.16% median per proposal
- Proposals dropped 60-90% YoY across major DAOs (but this may partly reflect maturation)

**Root cause analysis:** Kollan House (MetaDAO founder) articulates the paradox: "reaching quorum requires incentives, but incentivizing voting attracts mercenary participation -- everything works against itself from the start."

### 3.2 Plutocracy (Token-Weighted Voting)

Token-weighted voting (1 token = 1 vote) is the dominant governance model and also the most criticized.

**Data on power concentration:**
- Compound: top 10 voters control 57.86% of voting power
- Uniswap: top 10 voters control 44.72%
- Across DAOs broadly: top 10% of token holders control 76.2% of voting power

This has shifted governance "away from broad, retail-style token participation toward a model dominated by a relatively small group of professional delegates, large liquidity providers, protocol-aligned funds, and long-term strategic token holders" (State of DeFi report, 2025).

**What changes this assessment?** If quadratic voting or identity-based voting (1 person = 1 vote) achieves production adoption at scale, the plutocracy problem has a technical solution. Currently, Sybil resistance (proving unique humans) remains the blocker.

### 3.3 Governance Attacks

Governance attacks remain a live threat in 2025:

- **GreenField DAO (April 2025):** Attacker flash-borrowed 9M GOV tokens, passed a malicious proposal, and drained the treasury in a single block.
- **Aave (December 2025):** Founder Stani Kulechov purchased $10M in AAVE tokens shortly before a closely watched governance vote, accused of governance manipulation. Separately, Aave Labs unilaterally moved a brand-rights proposal to Snapshot vote, bypassing community process -- delegate Marc Zeller called it "a hostile takeover attempt."
- **UPCX (April 2025):** $70M exploit exploiting the gap between user-facing temporal controls and administrative functions.

**Prevention mechanisms evolving:**
- Snapshot-based voting (balances recorded at a prior block)
- Time-weighted token holding requirements (must hold 7+ days before voting)
- Timelocks on proposal execution (48+ hours with community watchdog alerts)
- Security Councils (Arbitrum model) for emergency response

### 3.4 Proposal Spam and Voter Fatigue

Voter fatigue is the flip side of low participation -- the delegates who DO participate face an overwhelming volume of proposals. This creates pressure toward fewer proposals (good for attention, bad for decentralization) or delegation to AI (see Section 8).

**ENS DAO** is actively developing a Delegation Incentives System to attract new delegations of tokens that have not yet been delegated, recognizing this as "a fundamental part of DAO security."

---

## 4. New Governance Models

### 4.1 Optimistic Governance

**How it works:** Proposals pass automatically after a timelock period unless vetoed. Token holders only need to act when they disagree, drastically reducing participation burden.

**Real implementation: Taiko DAO (2025)**
- Security Council proposes changes
- Token holders have a veto period to assess
- If veto threshold is not met, proposal executes after 7-day delay
- Voters only participate when a veto is needed

**Real implementation: Lido Dual Governance (June 2025)**
- LDO token holders vote on proposals
- stETH holders (stakers) can lock stETH in protest to delay or block proposals
- 1% of stETH supply locked = 5-45 day additional timelock
- 10% of stETH supply locked = "rage-quit" state, all proposals frozen
- Protects stakers from governance capture by LDO holders

**Assessment (MEDIUM-HIGH confidence):** Optimistic governance solves voter fatigue elegantly but concentrates proposal power in whoever gets to propose (typically a Security Council or core team). The veto mechanism is a safety valve, not true democratic participation. Best suited for mature protocols with established parameter ranges.

### 4.2 Conviction Voting

**How it works:** Voting power accumulates over time based on sustained commitment to a particular proposal. The longer you stake your conviction, the more weight your vote carries. This prevents flash voting and rewards genuine commitment.

**Used by:** Polkadot ecosystem (OpenGov), 1Hive (Gardens), some Aragon deployments.

**Assessment (MEDIUM confidence):** Clever mechanism design but limited real-world adoption. Complexity is a barrier -- most token holders find it confusing.

### 4.3 Quadratic Voting

**How it works:** The cost of each additional vote grows quadratically. First vote costs 1 credit, second costs 4, third costs 9, etc. This lets voters express preference intensity while limiting plutocratic concentration.

**Academic support:** Management Science (2024/2025) research shows quadratic voting optimally aggregates voter preferences, outperforming linear voting.

**Blocker:** Requires Sybil resistance (proof of unique identity). Without it, a whale splits tokens across wallets to avoid the quadratic cost. Gitcoin Passport and Worldcoin attempt to solve this, but neither has achieved universal adoption.

**Assessment (MEDIUM confidence):** Theoretically superior to 1-token-1-vote. Practically limited by the Sybil problem. Will likely be adopted in identity-gated contexts (Optimism Citizens' House model) before becoming general.

### 4.4 Futarchy (Prediction Market Governance)

**How it works:** Decisions are made by prediction markets. Instead of voting "yes or no," participants bet on which option leads to a better outcome on a defined metric. Markets aggregate dispersed information more efficiently than voting.

**Real implementations:**
- **Jito:** Used futarchy for a fee-switch decision. Market indicated increasing the fee would benefit the protocol. They implemented it. Outcome matched prediction.
- **Sanctum:** Makes ALL governance decisions via prediction markets -- not as an experiment but as their actual governance system.
- **Optimism (March 2025):** 21-day experiment with 500K OP tokens distributed.

**Optimism's experiment revealed critical flaws:**
- TVL metrics were influenced by ETH price volatility, not project performance
- Selected projects (Rocket Pool, SuperForm) underperformed in actual TVL growth
- Total TVL drop for futarchy-selected projects: $15.8M
- Grants Council selections outperformed (Extra Finance grew by $8M)
- Conclusion: success hinges on better-designed metrics and reduced participation barriers

**Common (the platform) is building futarchy as "a foundational governance primitive for 2026."**

**Assessment (MEDIUM confidence):** Futarchy is the most theoretically interesting governance model but the Optimism experiment shows the devil is in the metrics. Garbage-in, garbage-out: if the outcome metric is poorly designed (as USD-denominated TVL was), the market optimizes for the wrong thing. Metric design IS governance -- you just move the political question from "what should we do?" to "how do we measure success?"

**What would change this assessment:** If Sanctum or Jito demonstrate consistently better outcomes than comparable token-voting DAOs over 12+ months, futarchy's case becomes strong.

### 4.5 Delegation Frameworks

Delegation has become the dominant response to voter apathy. Token holders delegate their voting power to professional delegates who specialize in governance.

**Active delegate incentive programs (2025):**
- **Arbitrum:** ~$1.5M/year for delegates. Requires 75% participation rate and minimum voting power.
- **Velora DAO:** Monthly cycles with 15 participating delegates.
- **Summer DAO:** Dual-Pool system with $4,200 quarterly budget.
- **ENS, Aave, Lido, Maker, Optimism, Uniswap:** All have active DIPs.

**Problems with delegation:**
- Creates a professional governance class with its own incentives (sometimes misaligned with community)
- Compensation volatility when paid in project tokens
- Open question: do monetary rewards attract genuine expertise or rent-seeking?
- Delegates can vote on their own compensation programs (conflict of interest)

**Key insight from DAOstar research:** Compensation is typically budgeted in USD but paid in project tokens, creating volatility risk. 7 of 9 major DIPs fund from community treasury via governance processes -- meaning delegates vote on their own pay.

---

## 5. Governor Contracts & Tooling Standards

### 5.1 OpenZeppelin Governor

The industry standard for on-chain governance contracts. Developed in collaboration with Compound, fully compatible with GovernorAlpha and GovernorBravo while providing greater modularity.

**2025-2026 development:** A collaborative working group was formed involving Tally, OpenZeppelin, Agora, and ScopeLift to advance the Governor framework. Goals: shared roadmaps, in-demand features, aligned standards for extensions.

### 5.2 Tally

Institutional-grade on-chain governance dashboard. Powers decision-making for protocols managing over $10 billion in assets. Used by Arbitrum, Optimism, ENS, Uniswap, Aave, and hundreds of others.

Key differentiator: fully on-chain governance with automatic execution. When a proposal passes on Tally, it executes directly -- no multisig required.

**January 2025:** Acquired Boardroom competitor. Combined platform tracks over 2M delegates.

### 5.3 Agora

Open-source (MIT-licensed) governance platform. Features: gasless voting, multiple choice proposals, delegation systems, role-based governance, optimistic proposals, security councils, transaction simulation.

**2025:** Acquired Boardroom (older competitor). Multi-module architecture integrates with external voting modules -- blend traditional voting, approval-based selection, or optimistic fast-tracking.

### 5.4 Snapshot

De facto standard for off-chain DAO voting. Used by over 30,000 projects.

**Snapshot X:** On-chain computation via Starknet. Voting costs 10-50x cheaper than L1. Available on Ethereum, Optimism, Polygon, Arbitrum.

**November 2025:** Spaces 2.0 launched -- custom domains (vote.yourdao.eth).

**Regulatory pressure:** EU's MiCA framework reportedly requires DAOs with over EUR 5M in assets to "anchor" off-chain votes on-chain by Q2 2026. (MEDIUM confidence -- could not verify directly with MiCA text)

### 5.5 Cross-Chain Governance: MultiGov

Built by Wormhole, Tally, and ScopeLift. Industry-first multichain governance system. Proposals created on hub chain, voted on from spoke chains, results tallied cross-chain.

Prevents double-voting via checkpointed vote weights. Wormhole DAO is the first live deployment.

### 5.6 Standards

- **EIP-4824 (DAOstar):** Common interface for DAOs via daoURI. Enhances discoverability and interoperability. 4 DAOs on Optimism adopted. Snapshot integration ensures automatic compliance.
- **ERC-7710:** Smart contract delegation standard (MetaMask Delegation Toolkit)
- **ERC-7715:** Permission request standard for dapp-to-wallet delegation

### Assessment

The tooling layer is mature and consolidating. OpenZeppelin Governor + Tally/Agora for on-chain, Snapshot for off-chain, Safe for treasury. The working group alignment (Tally + OZ + Agora + ScopeLift) suggests the ecosystem is moving toward fewer, more standardized tools rather than fragmentation. (HIGH confidence)

---

## 6. Real Examples: How Major DAOs Actually Govern

### 6.1 Uniswap

**Structure:** Token-weighted voting (UNI). Proposal threshold: significant UNI delegation required. Uses Tally and Agora for governance interface.

**2025 milestones:**
- **DUNI framework:** Established governance as a Wyoming DUNA (Decentralized Unincorporated Nonprofit Association) for legal clarity and liability protection. Provides legal basis for fee collection and management.
- **Fee switch activated (December 2025):** Passed with 99.9% support (125M tokens for, 742 against). Rolled out starting with v2 pools and v3 pools covering 80-95% of LP fees on mainnet. Fees fund a UNI burn mechanism.
- **100M UNI token burn:** Executed after 2-day timelock. Represents estimate of what would have been burned if fee switch was active since launch.

**What works:** Clear institutional governance with professional delegates. Fee switch activation was years in the making and represents effective community consensus.

**What doesn't work:** Extreme concentration -- top 10 voters control 44.72% of voting power. Community participation declining despite high-profile votes.

### 6.2 Aave

**Structure:** Token-weighted voting (AAVE). Uses specialized governance for risk parameters (interest rates, collateral eligibility).

**2025 milestones:**
- **Aave Finance Committee (AFC):** Established March 2025 as part of AAVEnomics upgrades. Manages treasury and financial operations.
- **$50M annual buyback program:** Passed. AFC and TokenLogic buy $250K-$1.75M in AAVE weekly depending on market conditions.
- **Budget adjustment (March 2026):** Proposal to reduce buyback from ~$50M to $30M, showing adaptive governance.

**Governance controversy (December 2025):** Founder Stani Kulechov purchased $10M AAVE before a vote -- accused of governance manipulation. Separately, Aave Labs moved a brand-rights proposal to Snapshot vote unilaterally, called a "hostile takeover attempt" by delegate Marc Zeller.

**What works:** Technical governance for risk parameters is effective -- Aave has not suffered a major protocol-level exploit from governance failure.

**What doesn't work:** Power dynamics between Aave Labs (the company) and the DAO remain contentious. The brand-rights dispute shows the fundamental tension between a DAO and the company that created the protocol.

### 6.3 ENS

**Structure:** Token-weighted voting (ENS). Stewards elected for 1-year terms (elections December 10 annually). Proposal threshold: 100K ENS (0.1% of supply).

**2025 focus areas:** Security measures (calldata review of governance proposals), risk assessment, governor upgrade research, and developing a Delegation Incentives System.

**What works:** Relatively focused mandate (domain name governance). Steward elections provide continuity.

**What doesn't work:** Maintaining delegation participation and voting quorum is a constant struggle. Low delegation of undelegated tokens is considered a security risk.

### 6.4 Arbitrum

**Structure:** Token-weighted voting (ARB). Multi-layered governance with sub-DAOs for specific grants/projects. Security Council for emergency response.

**2025 milestone: OpCo (Operating Company)**
- 34M ARB budget over 30 months
- Legal entity handling day-to-day execution, staffing, service provider negotiations
- DAO-elected Oversight and Transparency Committee (OAT) for accountability
- First Staff-DAO Call held October 1, 2025

**What works:** Security Council model enables rapid response to critical issues without waiting for 7-day governance votes. Sub-DAO structure distributes specialized work.

**What doesn't work:** OpCo is explicitly a centralization move. Community participation declined despite being one of the most active DAOs. The hybrid model works operationally but raises philosophical questions about what "decentralized" means.

### 6.5 Optimism

**Structure:** Bicameral governance -- the most structurally novel among major DAOs.

- **Token House:** OP token holders govern protocol upgrades, treasury, technical parameters via standard token-weighted voting.
- **Citizens' House:** Soulbound NFT holders (non-tradable) govern Retroactive Public Goods Funding (RetroPGF) allocation. Has veto power over some Token House decisions.

**2025 milestones:**
- Futarchy experiment (March 2025) -- see Section 4.4
- Season 7 concluded June 2025
- Continued RetroPGF rounds

**What works:** Bicameral structure provides genuine checks and balances. Citizens' House (identity-based, non-transferable) is the most significant experiment in non-plutocratic DAO governance.

**What doesn't work:** Citizens' House member selection process is itself centralized (Foundation-curated). Futarchy experiment showed metric-design challenges.

### 6.6 Lido

**Structure:** LDO token voting with dual governance (activated July 2025).

**2025 milestone:** Dual Governance system gave stETH holders veto power. Dynamic timelock: 1% stETH locked = 5-45 day delay; 10% = "rage-quit" freezing all proposals.

**What works:** Addresses the fundamental principal-agent problem: stakers (who bear risk) now have recourse against LDO holders (who make decisions). Only protocol to formally separate stakeholder classes in governance.

**Assessment:** Lido's dual governance may be the single most important governance innovation of 2025 because it solves a real, specific problem (staker vs. governance token holder misalignment) with a clean mechanism design.

### 6.7 MakerDAO / Sky

**Structure:** The most ambitious governance restructuring via the Endgame Plan.

- **SubDAOs:** 6 specialized sub-DAOs with own governance tokens, designed to operate semi-independently
- **Governance AI Tools (GAITs):** Phase 3 of Endgame. AI summarizes, verifies proposals, and simulates outcomes. Designed for universality across SubDAOs.
- **NewChain:** Phase 5 plans a dedicated blockchain.

**Assessment (MEDIUM confidence):** The most forward-looking DAO governance architecture, but execution has been slow. The GAITs concept is the most concrete vision for AI-in-governance but details on production deployment remain scarce.

---

## 7. Treasury Management

### 7.1 Scale of the Problem

DAO treasuries collectively hold $24.5 billion. The top 5 DAOs (Optimism, Arbitrum, Uniswap, Gnosis + one other) represent over half the total.

| DAO | Treasury Value | Primary Assets |
|-----|---------------|----------------|
| Optimism | ~$7.9B | OP, ETH |
| Arbitrum | ~$6.8B | ARB, ETH |
| Uniswap | ~$4.8B | UNI |
| Gnosis | ~$2.7B | Various |
| Aave | $500M+ | AAVE, stablecoins |

### 7.2 The Diversification Problem

**85% of DAOs hold their treasuries in a single crypto asset** -- typically their own governance token. This creates a circular dependency: the treasury's value depends on the token's price, which depends on the protocol's success, which depends partly on treasury-funded development.

**What sophisticated DAOs do:**
- Convert portions to stablecoins (USDC, DAI) for operational runway
- Diversify into ETH, BTC, yield-bearing assets
- Aave's AFC actively manages buyback budgets based on market conditions
- Milestone-based grant disbursement to reduce misallocation risk

### 7.3 Treasury Infrastructure

**Safe{Wallet} (formerly Gnosis Safe):** Industry standard for multisig treasury management.
- Uniswap DAO manages $2B+ using a 4-of-7 Safe
- Customizable M-of-N signature requirements
- Transaction simulation before execution
- Daily spending limits and role-based access
- Social recovery systems through modules

**Emerging tools:**
- Request Finance, Coinshift for payment automation
- Hedgey for token vesting and lockups
- CoW Protocol for treasury diversification trades (MEV-protected)

### 7.4 Accountability Gaps

Despite on-chain transparency, accountability remains challenging:
- Grant recipients may not deliver
- Milestone verification is often subjective
- Treasury reports are produced by paid contributors (conflict of interest)
- Token-denominated budgets create unpredictable USD costs

**What would change this assessment:** AI-driven treasury monitoring that flags anomalous transactions, tracks grant recipient deliverables, and auto-generates performance reports could substantially improve accountability. This is a clear opportunity for AI agents (see Section 13).

---

## 8. AI Agents in Governance

### 8.1 Vitalik Buterin's AI Stewards Proposal (February 2026)

Buterin proposed deploying personal AI agents trained on individual users' values to vote on their behalf. Key elements:

- Each user operates their own LLM trained on personal values and past statements
- Agents handle routine governance decisions, flag critical issues for human review
- Privacy via MPC/TEEs -- agents operate in secure environments
- Zero-knowledge proofs for voter anonymity (prove eligibility without revealing wallet or vote)
- Prediction markets where agents bet on proposal acceptance (quality filter)

**Assessment:** This is the most authoritative articulation of the AI-governance vision. The technical requirements (personalized LLMs + ZKPs + TEEs + prediction markets) are individually feasible but combining them at scale is 12-24 months away at minimum.

### 8.2 NEAR Protocol's AI Governance Delegates

NEAR's House of Stake introduces AI roles in stages:
1. **Phase 1:** Assistants (chatbots summarizing proposals, answering questions)
2. **Phase 2:** Organizational delegates (representatives for groups with similar interests)
3. **Phase 3:** Personal AI agents (each member gets their own delegate)
4. **End state:** AI CEO concept

Verifiable model training: cryptographic proof of training cycles and inputs.

**Status:** Still in development/early implementation as of late 2025.

### 8.3 DAO-AI Research System

Academic system (October 2025) for evaluating DAO proposals via agentic AI:

- Architecture: Snapshot MCP (metadata) + Forum MCP (sentiment) + Voting Dynamics MCP (temporal patterns) + Market Response MCP (token price/TVL)
- Tested on 3,383 proposals from 8 major DAOs
- **Result: matched final outcomes in 92.5% of cases vs 76.6% for average human voters**
- Token-weighted alignment: 0.91 average
- Stable performance even on contested proposals

**Critical caveat:** Matching historical outcomes is different from making BETTER decisions. If the AI simply learns "vote with whales," it achieves high alignment without adding value. The authors acknowledge this is "a preliminary exploration."

### 8.4 MakerDAO's GAITs

Governance AI Tools planned as Phase 3 of the Endgame plan:
- Summarize and verify proposals
- Simulate outcomes
- Designed for universality across SubDAOs
- Goal: SubDAOs can operate with minimal active personnel

**Status (MEDIUM-LOW confidence):** Concept well-defined but production deployment details scarce. MakerDAO's Endgame has been slow to execute overall.

### 8.5 Fetch.ai / ASI Alliance

Agents autonomously interact with DeFi protocols and "participate in governance" -- execute trades, rebalance liquidity, or vote on proposals without human confirmation.

**Note:** Ocean withdrew from the ASI Alliance in October 2025, citing disputes over treasury control. This is itself a governance failure in the AI-governance space.

### 8.6 The Adversarial View

**Who would disagree with AI governance?** Governance purists who believe democratic legitimacy requires human deliberation. Legal scholars who question the liability chain when an AI agent votes for a proposal that causes financial harm. And security researchers who note AI agents introduce novel attack surfaces:

From the 2026 "Autonomous Agents on Blockchains" taxonomy, seven attack classes:
1. Prompt injection and cognitive hijacking
2. Tool and data source spoofing
3. Middleware compromise and intent manipulation
4. Key and credential exfiltration
5. Replay and nonce manipulation
6. MEV and economic manipulation
7. **Multi-agent collusion and governance attacks** (most relevant here)

**The summarization chokepoint:** Proposal summarization becomes a governance chokepoint -- whoever tunes the embeddings and sentiment models effectively controls how delegates perceive decisions. This is a real and underappreciated risk.

---

## 9. Sub-DAOs and Working Groups

### 9.1 Organizational Evolution

As DAOs scale, they face the same coordination problems as traditional organizations. The response has been to create internal structure:

- **Sub-DAOs:** Semi-autonomous units with their own missions, governance, sometimes their own tokens (MakerDAO's 6 SubDAOs)
- **Working Groups:** Specialized teams for grants, security, governance, marketing (Arbitrum, Optimism)
- **Pods:** Small, autonomous teams with specific responsibilities (composable subgroups)
- **Swarms:** Self-organized, task-focused groups for specific projects
- **OpCo:** Centralized operating company accountable to the DAO (Arbitrum model)

### 9.2 Trends

**Modular governance (2025 pattern):** Layered structures where sub-DAOs can operate semi-independently, allowing specialized governance at different levels. Each sub-DAO may have its own legal wrapper for risk isolation.

**Bottom-up vs. top-down:** Sub-DAOs can emerge either from founders (top-down mandate) or from engaged community members (bottom-up initiative). Most successful ones combine both: community initiative with formal ratification.

**The principal-agent problem intensifies:** Sub-DAOs create additional delegation layers. The main DAO delegates to sub-DAOs, which delegate to working groups, which hire contractors. Each layer introduces potential misalignment.

---

## 10. Legal Wrappers

### 10.1 Wyoming DAO LLC (2021)

- DAOs as Limited Liability Companies with legal personality
- Members get liability protection
- **Problem:** Creates US tax and regulatory nexus
- **Problem:** Must dissolve if no proposals approved for 1 year
- Minimum: 100 members for DUNA structure

### 10.2 Wyoming DUNA (July 2024)

- Decentralized Unincorporated Nonprofit Association
- Adapted from existing Unincorporated Nonprofit Association Act for blockchain
- Provides legal existence, contracts, court appearances, tax compliance
- Members not personally liable
- Minimum: 100 members
- **First major adopter: Uniswap (DUNI framework, 2025)**
- Praised by a16z as potentially the industry standard for US-based DAOs

### 10.3 Marshall Islands DAO LLC (MiDAO)

- Passed 2022 DAO Act recognizing DAOs as LLCs
- Token holders can be LLC members
- All documents and decisions can be placed on-chain
- Simple, fast, flexible
- Emerging as a preferred offshore jurisdiction for DeFi projects
- Described as potentially "the golden standard for DeFi startups for 2026"
- **Recommended by Harmony Framework for base-layer setup**

### 10.4 The Harmony Framework (February 2025)

A jurisdiction-neutral, modular, scalable legal architecture for DAOs:

- **Base Layer:** DAO-Specific Entity (DSE) -- nonprofit legal structure recognizing token holders as members
- **Operational Layer:** Modular wrappers for risk isolation, asset management, activity-specific operations
- **Options:** Marshall Islands DAO LLC (recommended) or Wyoming DUNA (for US nexus)
- Compatible with virtually any other structuring framework
- Designed by DAObox

### 10.5 Regulatory Pressure

EU's MiCA framework reportedly requires DAOs with over EUR 5M in assets to anchor off-chain votes on-chain by Q2 2026. (MEDIUM confidence -- sourced from secondary reports)

**Assessment:** Legal wrapper adoption is accelerating. The DUNA and Marshall Islands options represent meaningful progress. However, the fundamental tension remains: legal identity requires someone to be liable, which conflicts with true decentralization. Most legal wrappers work by designating a foundation or entity as the "face" of the DAO while attempting to shield individual members.

---

## 11. Multi-Agent Coordination On-Chain

### 11.1 Current State

Multi-agent coordination on blockchains is the most nascent area in this report. The infrastructure is developing but production deployments for agent-to-agent negotiation with on-chain enforcement are largely theoretical.

### 11.2 Coordination Protocols

- **Google A2A (Agent-to-Agent):** Peer-to-peer collaboration. Agents negotiate, share findings, coordinate without central oversight.
- **Anthropic MCP (Model Context Protocol):** Standardizes how agents access tools and external resources.
- **FIPA-ACL / KQML:** Standardized agent communication languages for information exchange, task negotiation, and conflict resolution.

### 11.3 Smart Contract Enforcement

A 2025 Nature (Scientific Reports) paper presents a framework integrating smart contracts with multi-agent reinforcement learning (MARL):

- Blockchain records agent behaviors on-chain
- Smart contracts encode rules and incentives
- Automated verification of agent actions
- Reward-and-penalty execution without third-party arbitrator
- Checks for deceptive bidding, unauthorized strategy changes, coordination failures
- Responds through preset sanctions or token redistributions

### 11.4 Proposed Standards (2026)

From the "Autonomous Agents on Blockchains" survey:

- **Transaction Intent Schema (TIS):** Portable specification for unambiguous goal declaration. Agents express objectives independent of execution environment.
- **Policy Decision Record (PDR):** Auditable, verifiable proof that transactions comply with authorization policies. Creates accountability trails for autonomous actions.

### 11.5 The Gap

**What does not exist yet:** A production system where multiple AI agents negotiate terms (e.g., service-level agreements, resource allocation, cross-protocol parameter coordination), reach consensus, and commit the agreement to a smart contract that enforces it -- all without human intervention.

The pieces exist individually:
- Agents can read on-chain state (analytics tools)
- Agents can formulate and sign transactions (Coinbase wallet toolkit, MetaMask Delegation)
- Smart contracts can encode and enforce agreements
- Communication protocols exist (A2A, MCP)

**What's missing is the glue:** A verified negotiation protocol where agents can make binding commitments that are enforceable on-chain, with clear liability assignment and recovery mechanisms when agents fail or misbehave.

**12-month outlook:** The most likely near-term use case is not agent-to-agent negotiation but rather agent-to-protocol interaction -- a single AI agent managing a user's DeFi positions across protocols according to delegated authority. Full multi-agent negotiation with on-chain enforcement is 2-3 years away for production systems.

---

## 12. MetaMask Delegation Toolkit

### 12.1 Overview

The MetaMask Delegation Toolkit is a set of comprehensively audited smart contracts that handle delegator account creation, delegation lifecycle management, and caveat enforcement. It is the most important infrastructure development for enabling AI agents to operate on-chain with scoped permissions.

### 12.2 Core Standards

**ERC-7710 (Smart Contract Delegation):** Standardizes how smart contract accounts delegate specific permissions to other Ethereum accounts. MetaMask Delegator Accounts implement ERC-7710.

**ERC-7715 (Permission Requests):** Unifies the format for requesting and granting permissions between wallets and dApps. Introduces `wallet_grantPermissions` -- dApps request clearly scoped, pre-approved access without repeated confirmations.

### 12.3 How Delegation Works

1. **Delegator** (user's smart account) grants permission to a **delegate** (another account, including potentially an AI agent)
2. Delegations are cryptographically signed and **stored off-chain** (reduces gas costs)
3. **Caveats** (restrictions) are enforced by on-chain "caveat enforcer contracts" -- spending limits, time windows, contract-specific access
4. **Transitive delegation:** Delegates can re-delegate to others, each link narrowing permissions via additional caveats
5. **Instant revocation:** Original delegator can revoke entire chain at any time

### 12.4 Why This Matters for AI Agents

The Delegation Toolkit enables the following pattern:

```
Human user -> Creates Smart Account -> Delegates to AI Agent with caveats:
  - "Can spend up to 10 USDC per day"
  - "Can only interact with Aave and Uniswap contracts"
  - "Cannot transfer more than $100 in any single transaction"
  - "Delegation expires after 7 days"
  - "Can vote on governance proposals with my tokens"
```

The agent operates within these constraints, enforced by smart contracts, without needing the user's private keys.

### 12.5 Available Chains

Any EVM chain supported by a User Operation Bundler: Arbitrum, Avalanche, Base, Linea, Optimism, Polygon.

### 12.6 Implications for Governance

Combined with ERC-4337 (Account Abstraction), the Delegation Toolkit creates a technically viable path for:

- AI agents voting on governance proposals on behalf of users (with revocable, scoped delegation)
- AI agents managing treasury positions within defined parameters
- AI agents executing governance-approved proposals across chains
- Users delegating their DAO voting power to an AI agent trained on their preferences

**What would change this assessment:** If MetaMask achieves significant Smart Account adoption (currently a small fraction of total wallets), the Delegation Toolkit becomes immediately relevant. If adoption stays low, ERC-7710/7715 may remain standards without meaningful deployment.

---

## 13. Where AI Agents Can Genuinely Improve Governance

Based on the comprehensive landscape analysis, here are the areas where AI agents can create defensible value -- and where they cannot.

### 13.1 High-Value, Near-Term Opportunities (12-18 months)

**1. Proposal Analysis and Summarization**
- Problem: Delegates face information overload. Reading every proposal across multiple DAOs is a full-time job.
- AI value: Summarize proposals, extract key parameters, compare against historical precedent, flag risks.
- Existing work: Aave forum AI assistant, NEAR governance chatbot, DAO-AI system, MakerDAO GAITs.
- **Risk:** Summarization is a governance chokepoint. Whoever controls the AI model controls the framing. Must be open-source and auditable.
- **Defensibility:** MEDIUM. Any general-purpose LLM can summarize proposals. Value comes from DAO-specific training data and integration with governance workflows, not from the AI capability itself.

**2. Governance Intelligence Dashboard**
- Problem: Tracking voting patterns, delegate behavior, treasury flows, and cross-DAO dynamics is fragmented.
- AI value: Real-time monitoring, anomaly detection, predictive analytics on proposal outcomes.
- **Defensibility:** HIGH if integrated deeply with on-chain data and governance platforms (Tally, Agora, Snapshot).

**3. Treasury Monitoring and Risk Alerts**
- Problem: 85% of DAOs hold treasuries in a single asset. Treasury management is often ad-hoc.
- AI value: Automated monitoring of treasury composition, concentration risk alerts, comparison against diversification targets, grant recipient performance tracking.
- **Defensibility:** MEDIUM. The data is public, but the analysis layer and alert infrastructure create switching costs.

### 13.2 Medium-Term Opportunities (18-36 months)

**4. Delegated Voting Agents**
- Problem: 75-85% of token holders don't vote. Even with delegation, participation is low.
- AI value: Personal AI agents trained on user preferences that vote according to those preferences, flagging unusual proposals for human review.
- Technical foundation: MetaMask Delegation Toolkit (ERC-7710/7715) provides the permission framework.
- Key requirement: Verifiable model training (NEAR's approach) so users can trust their agent.
- **Defensibility:** HIGH if the agent accumulates user preference data and builds an accurate model. Strong lock-in from personalization.
- **Risk:** If many users use the same AI model with default settings, it creates correlated voting -- potentially worse than current delegation to a small number of human delegates.

**5. Governance Attack Detection**
- Problem: Flash loan attacks, vote buying, and hostile takeovers continue (GreenField, Aave disputes).
- AI value: Real-time detection of unusual token accumulation patterns, flash loan governance attacks, vote-buying coordination.
- **Defensibility:** HIGH. Requires specialized models trained on attack patterns, integrated with on-chain monitoring.

**6. Cross-Protocol Governance Coordination**
- Problem: DAOs increasingly interact (composable DeFi). A parameter change in Aave affects Compound affects MakerDAO.
- AI value: Agents that understand cross-protocol dependencies and can model the second-order effects of governance decisions.
- **Defensibility:** HIGH. This requires deep protocol-specific knowledge that is hard to replicate.

### 13.3 Long-Term Opportunities (36+ months)

**7. Multi-Agent Negotiation Protocols**
- Problem: Protocols need to coordinate (e.g., joint liquidity incentives, cross-protocol risk parameters).
- AI value: Agent-to-agent negotiation with on-chain enforcement of agreed terms.
- Prerequisite: Transaction Intent Schema (TIS) and Policy Decision Record (PDR) standards.
- **Defensibility:** VERY HIGH if you control the coordination protocol.
- **Timeline risk:** 2-3 years away from production for complex multi-agent scenarios.

**8. Autonomous Treasury Management**
- Problem: DAOs manage billions but treasury decisions are slow and often suboptimal.
- AI value: Agents executing diversification strategies, yield optimization, and buyback programs within DAO-defined parameters.
- **Defensibility:** MEDIUM-HIGH. Depends on execution quality and risk management track record.
- **Risk:** A single AI treasury management error at the scale of a top-5 DAO would be catastrophic (billions at risk).

### 13.4 What AI Agents Should NOT Do (Near-Term)

1. **Unilateral proposal creation without human review:** The Aave governance dispute shows that even HUMAN unilateral action causes community backlash. AI-created proposals need strong legitimacy mechanisms.

2. **Autonomous voting without clear preference modeling:** If users cannot inspect and correct their AI agent's voting model, the agent undermines democratic legitimacy.

3. **Treasury execution without timelocks and veto rights:** The optimistic governance model (Section 4.1) is the right pattern -- agents execute but humans can veto.

### 13.5 The Meta-Question: Does AI Make Governance Better or Just Faster?

The most important insight from this research is that **DAO governance failures are rarely about speed or information processing -- they are about incentive alignment, power concentration, and legitimacy.** AI agents can process proposals faster and increase voter turnout, but they cannot solve the fundamental question: whose interests should the DAO serve?

If AI agents vote according to user preferences, they amplify existing preference distributions -- including plutocratic ones. If AI agents are "objective," who defines the objective function? Optimism's futarchy experiment showed that even defining a good metric is politically contentious.

**The genuine AI value proposition is not replacing human judgment but reducing the costs of democratic participation.** If AI agents can make it as easy to participate in governance as it is to ignore it, participation rates might increase enough to dilute plutocratic concentration. But this requires solving the personalization problem without creating correlated voting.

---

## 14. Gaps & Uncertainties

### What I Could Not Find or Verify

1. **Precise MiCA requirements for DAOs:** The claim that MiCA requires on-chain anchoring for DAOs with EUR 5M+ assets by Q2 2026 came from a single secondary source. Could not verify against the actual regulation text. (LOW confidence)

2. **NEAR AI governance delegate deployment status:** Multiple sources describe the vision and plans but no source confirmed a production deployment with measurable results. Status appears to be "in development." (MEDIUM-LOW confidence)

3. **MakerDAO GAITs production deployment:** The concept is well-documented but evidence of actual production usage is absent. Endgame phases have been delayed. (LOW confidence on current deployment)

4. **Sanctum's futarchy results:** Claimed to use prediction markets for "all governance decisions" but could not find detailed outcome data or performance comparison against alternatives. (LOW confidence on effectiveness claims)

5. **Total number of active vs. inactive DAOs:** The 13,000+ figure likely includes many inactive or abandoned projects. The actual number of DAOs with meaningful governance activity is probably 200-500. (MEDIUM confidence -- no rigorous source)

6. **AI agent voting in production:** No source confirmed a production system where AI agents are autonomously voting on real governance proposals with real tokens at meaningful scale. All examples are either pilots, testnet deployments, or planned features. (HIGH confidence that this does NOT exist yet)

7. **Quantified cost of governance attacks in 2025:** Found individual examples (GreenField, UPCX) but no comprehensive aggregated data on total losses from governance-specific attacks in 2025.

8. **MetaMask Smart Account adoption numbers:** Could not find data on how many users have migrated from EOAs to Smart Accounts. This is critical for assessing the Delegation Toolkit's near-term relevance.

9. **Delegate compensation effectiveness:** Whether delegate incentive programs actually improve governance quality (not just participation quantity) is unclear. Found budget data but not outcome quality metrics.

### Key Assumptions That Could Be Wrong

- **Assumption:** Token-weighted voting will remain dominant. **What would change this:** Identity-based voting systems achieving Sybil resistance at scale.
- **Assumption:** AI agents will augment rather than replace human governance. **What would change this:** A major DAO achieving provably better outcomes with autonomous AI governance.
- **Assumption:** Legal wrappers solve the liability problem. **What would change this:** A major lawsuit piercing DAO liability protections.

---

## 15. Sources

### Primary/Near-Primary Sources (Firsthand Knowledge or Direct Data)

- [DAOs grew quieter and more concentrated in 2025: State of DeFi report](https://www.dlnews.com/articles/defi/daos-grew-quieter-in-2025-per-state-of-defi-report/) - DL News, 2025
- [Is There a Future for DAOs?](https://www.coindesk.com/business/2025/07/09/is-there-a-future-for-daos) - CoinDesk, July 2025
- [Autonomous Agents on Blockchains: Standards, Execution Models, and Trust Boundaries](https://arxiv.org/html/2601.04583v1) - arXiv, January 2026
- [DAO-AI: Evaluating Collective Decision-Making through Agentic AI](https://arxiv.org/html/2510.21117v2) - arXiv, October 2025
- [Vitalik Buterin proposes AI stewards to reinvent DAO governance](https://www.coindesk.com/web3/2026/02/21/ethereum-s-vitalik-buterin-proposes-ai-stewards-to-help-reinvent-dao-governance) - CoinDesk, February 2026
- [Futarchy v1 Preliminary Findings - Optimism Collective](https://gov.optimism.io/t/futarchy-v1-preliminary-findings/10062) - Optimism Forum, 2025
- [Why Conditional Markets Will Replace Token Voting](https://blog.common.xyz/why-conditional-markets-will-replace-token-voting/) - Common, 2025
- [Balancing Security and Liquidity: Time-Weighted Snapshot Framework](https://arxiv.org/html/2505.00888v1) - arXiv, May 2025
- [Analyzing voting power in decentralized governance](https://www.sciencedirect.com/science/article/pii/S2096720924000216) - ScienceDirect, 2024
- [Balancing Power in Decentralized Governance: Quadratic Voting](https://pubsonline.informs.org/doi/10.1287/mnsc.2024.08469) - Management Science, 2024/2025

### DAO Governance Platforms and Documentation

- [OpenZeppelin Governor Documentation](https://docs.openzeppelin.com/contracts/4.x/governance)
- [Tally Documentation](https://docs.tally.xyz/education/governance-frameworks/openzeppelin-governor)
- [Snapshot Documentation](https://docs.snapshot.box/)
- [Agora Platform](https://www.agora.xyz/)
- [ENS DAO Governance Process](https://docs.ens.domains/dao/governance/process/)
- [MultiGov Overview - Wormhole](https://wormhole.com/docs/products/multigov/overview/)
- [DAOstar / EIP-4824](https://daostar.org/)

### MetaMask Delegation Toolkit

- [MetaMask Delegation Toolkit Overview](https://metamask.io/news/what-is-the-delegation-toolkit-and-what-can-you-build-with-it)
- [MetaMask Delegation Documentation](https://docs.metamask.io/delegation-toolkit/)
- [ERC-7710: Smart Contract Delegation](https://eips.ethereum.org/EIPS/eip-7710)
- [MetaMask Delegation Toolkit GitHub](https://github.com/MetaMask/delegation-toolkit)

### Legal Frameworks

- [DAO 3.0: The Harmony Framework](https://harmony.daobox.io/) - DAObox, February 2025
- [Marshall Islands DAO LLC as Legal Wrapper](https://www.legalnodes.com/article/marshall-islands-llc-as-a-dao-legal-wrapper) - Legal Nodes
- [Wyoming DUNA: An Oasis for DAOs](https://a16zcrypto.com/posts/article/duna-for-daos/) - a16z, 2024
- [Wyoming DUNA Act Text](https://www.wyoleg.gov/2024/Introduced/SF0050.pdf)

### DAO-Specific Governance

- [Uniswap UNIfication Proposal](https://blog.uniswap.org/unification) - Uniswap Blog, 2025
- [Uniswap Fee Switch Proposal Passed](https://www.coindesk.com/business/2025/12/26/uniswap-s-token-burn-protocol-fee-proposal-backed-overwhelmingly-by-voters) - CoinDesk, December 2025
- [Aave $50M Token Buyback Proposal](https://www.coindesk.com/markets/2025/10/22/aave-bounces-amid-usd50m-token-buyback-governance-proposal) - CoinDesk, October 2025
- [Aave Labs Governance Dispute](https://www.theblock.co/post/383464/aave-labs-vote-sparks-community-outcry) - The Block, 2025
- [Lido Dual Governance Approved](https://unchainedcrypto.com/lido-dao-enables-dual-governance-steth-holders-can-trigger-rage-quit-mode/) - Unchained, 2025
- [Arbitrum OpCo Proposal](https://forum.arbitrum.foundation/t/opco-a-dao-adjacent-entity-for-strategy-execution/27361) - Arbitrum Forum
- [Yuga Labs Proposes Dismantling ApeCoin DAO](https://www.theblock.co/post/357230/yuga-labs-proposes-dismantling-apecoin-dao-over-failed-governance-replacing-it-with-new-entity-apeco) - The Block, 2025
- [Jupiter Suspends DAO Voting](https://cointelegraph.com/news/jupiter-pauses-dao-governance-defi-growth) - Cointelegraph, 2025
- [Taiko Optimistic Governance](https://blog.aragon.org/introducing-taikos-optimistic-onchain-governance/) - Aragon, 2025

### AI and Agents

- [NEAR Foundation Plans AI Delegates](https://cointelegraph.com/news/near-foundation-ai-delegates-dao-voting) - Cointelegraph, 2025
- [MakerDAO Endgame AI Governance Tools](https://cryptoslate.com/makerdao-plots-ai-governance-endgame/) - CryptoSlate
- [Who Governs the Bots? AI Agents and Web3 Power in 2026](https://forklog.com/en/who-governs-the-bots-ai-agents-and-the-future-of-web3-power-in-2026/) - ForkLog, 2026
- [AI Agents Meet Blockchain: Secure and Scalable Collaboration](https://www.mdpi.com/1999-5903/17/2/57) - MDPI Future Internet, 2025
- [Blockchain-enhanced incentive-compatible mechanisms for multi-agent systems](https://www.nature.com/articles/s41598-025-20247-8) - Nature Scientific Reports, 2025

### Treasury and Tools

- [DAO Treasury Holdings Statistics 2025](https://coinlaw.io/dao-treasury-holdings-statistics/) - CoinLaw, 2025
- [10 Biggest DAOs in 2026](https://www.webopedia.com/crypto/learn/biggest-daos-2025-state-of-the-industry/) - Webopedia, 2026
- [Safe{Wallet} Platform](https://safe.global/)
- [Delegate Incentive Programs Research](https://daostar.org/research/delegate.pdf) - DAOstar
- [Arbitrum Delegate Rewards Program](https://thedefiant.io/news/blockchains/arbitrum-dao-votes-on-usd1-5-million-program-to-reward-active-delegates) - The Defiant, 2025

### Security

- [Aave Founder Accused of Governance Attack](https://finance.yahoo.com/news/aave-founder-accused-governance-attack-202529750.html) - Yahoo Finance, 2025
- [DAO Governance Attacks Prevention](https://www.guardrail.ai/common-attack-vectors/governance-takeover-attacks) - Guardrail
- [DAO Governance Attacks and How to Avoid Them](https://a16zcrypto.com/posts/article/dao-governance-attacks-and-how-to-avoid-them/) - a16z Crypto
