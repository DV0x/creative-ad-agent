# On-Chain Identity, Reputation & Trust in 2025-2026

**Research Date:** March 15, 2026
**Scope:** Protocols, standards, adoption data, and the AI agent identity problem

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [ENS (Ethereum Name Service)](#2-ens-ethereum-name-service)
3. [ERC-8004: Trustless Agents](#3-erc-8004-trustless-agents)
4. [Decentralized Identity (DID) & Verifiable Credentials](#4-decentralized-identity-did--verifiable-credentials)
5. [Soulbound Tokens (SBTs)](#5-soulbound-tokens-sbts)
6. [On-Chain Reputation Systems](#6-on-chain-reputation-systems)
7. [Self Protocol](#7-self-protocol)
8. [Attestation Protocols](#8-attestation-protocols)
9. [The AI Agent Identity Problem](#9-the-ai-agent-identity-problem)
10. [bond.credit](#10-bondcredit)
11. [Pain Points & Open Problems](#11-pain-points--open-problems)
12. [Landscape Map & Convergence](#12-landscape-map--convergence)
13. [Gaps & Uncertainties](#13-gaps--uncertainties)
14. [Sources](#14-sources)

---

## 1. Executive Summary

On-chain identity infrastructure is undergoing a phase change driven by two converging forces: (1) the maturation of attestation and credential standards (W3C VC 2.0, EAS, Sign Protocol), and (2) the explosive growth of autonomous AI agents that need identity, reputation, and authorization to operate in trustless environments.

**Key findings:**

- **ERC-8004** launched on Ethereum mainnet January 29, 2026. Within 8 weeks, 24,000+ agents registered across EVM chains. This is the single most important new standard for agent identity. (Confidence: HIGH)
- **ENS** has pivoted ENSv2 back to Ethereum mainnet (scrapping its Namechain L2), with 2.8M+ names registered and 3.2M daily resolution queries. ENS names are being positioned as first-class identifiers for AI agents within ERC-8004. (Confidence: HIGH)
- **Attestation infrastructure** has reached meaningful scale: EAS has 3.35M attestations on Base alone, 1.31M on Optimism. Sign Protocol revenue grew from $1.7M (2023) to $15M (2024). Coinbase Verifications uses EAS for on-chain KYC on Base. (Confidence: HIGH)
- **The Know Your Agent (KYA) paradigm** is emerging as the AI-era counterpart to KYC. Visa's Trusted Agent Protocol, AgentFacts metadata standard, and Sumsub's KYA framework all launched in 2025-2026. Gartner predicts 40% of enterprise apps will have integrated agents by end of 2026. (Confidence: MEDIUM-HIGH)
- **Soulbound tokens** remain theoretically compelling but adoption has been limited to niche use cases (Binance BAB, some university pilots). They have not become the dominant identity primitive Vitalik envisioned. (Confidence: HIGH)
- **Privacy-preserving identity** is the frontier: Self Protocol (7M+ users, Google Cloud partnership), Holonym/Human Passport (acquired Gitcoin Passport for $10M, targeting 34.5M ZK credentials), and Worldcoin/World (38M+ app users, 15M verified) are all competing for the proof-of-humanity layer. (Confidence: MEDIUM -- numbers are self-reported)
- **The agent impersonation threat is real and growing.** Autonomous agents outnumber humans 82:1 in enterprise systems. The Arup deepfake fraud ($25M loss) demonstrates the stakes. One forged agent identity can trigger cascading automated actions. (Confidence: HIGH for threat assessment, MEDIUM for specific statistics)

**What would change this analysis:** If a major platform (Google, Apple, Microsoft) ships a non-blockchain agent identity standard that achieves dominant adoption, the on-chain approach becomes niche. If ERC-8004 adoption plateaus below 100K agents by end of 2026, the standard may not achieve critical mass.

---

## 2. ENS (Ethereum Name Service)

### Current State (Q1 2026)

| Metric | Value | Source Confidence |
|--------|-------|-------------------|
| .eth names registered | 2.8M+ | HIGH |
| Unique owners | ~640,000 | HIGH |
| Daily resolution queries | 3.2M | MEDIUM (self-reported) |
| Integrated applications | 850+ | MEDIUM |
| Avg. registration gas cost | <$0.05 | HIGH |
| CCIP-Read enabled names | ~35% of active resolutions | MEDIUM |

### ENSv2: The Strategic Pivot

ENSv2 is a ground-up rewrite of ENS contracts and architecture. The most significant development in early 2026 was ENS Labs' decision to **abandon Namechain** (its planned dedicated L2 rollup) and deploy ENSv2 entirely on Ethereum mainnet.

**Why the pivot matters:**
- Ethereum's gas limit increased from 30M to 60M in 2025, with targets of 200M in 2026
- This produced a 99% reduction in ENS registration gas costs over one year
- ENS name registration now costs <$0.05 in gas, eliminating the economic justification for an L2
- The decision aligns with Vitalik Buterin's February 2026 warning about L2 fragmentation risks

**ENSv2 features (unchanged by the pivot):**
- Cross-chain resolution: .eth names resolvable from any EVM chain
- Per-name registries: each .eth name gets its own registry
- Improved developer tooling and usability
- L2 interoperability maintained as a priority

### ENS + AI Agent Identity

ENS is positioning itself as the naming layer for AI agents. In a blog post titled "The Identity Problem in Agentic Commerce," ENS argues that its names serve as:

1. **Human-readable agent identifiers** within ERC-8004's Identity Registry
2. **Reputation anchors** for attaching verifiable performance histories
3. **Payment endpoints** via x402 (Coinbase's HTTP-native payment protocol)
4. **Credibly neutral infrastructure** that prevents ecosystem fragmentation

Within ERC-8004, ENS names are treated as first-class identifiers alongside wallet addresses, functioning as the human-readable handle resolved before evaluating reputation or validation data.

### Counter-argument

ENS adoption has plateaued relative to its 2022 hype peak. The 640K unique owners for 2.8M names suggests significant speculative holding (average 4.4 names per owner). Active usage (names that resolve to wallets with recent transactions) is likely much lower than registration numbers imply. However, the integration depth (850+ apps, 3.2M daily queries) suggests genuine utility beyond speculation.

**Who would disagree:** DNS maximalists argue that existing ICANN infrastructure can serve the same purpose with established legal frameworks. The did:web method (W3C DID using traditional web domains) offers similar human-readability without blockchain gas costs.

---

## 3. ERC-8004: Trustless Agents

### Overview

ERC-8004 is the most consequential new standard for AI agent identity. Created August 13, 2025, it went live on Ethereum mainnet January 29, 2026.

**Authors:** Marco De Rossi (MetaMask), Davide Crapis (Ethereum Foundation), Jordan Ellis (Google), Erik Reppel (Coinbase)

**Status:** Draft (Standards Track ERC). Despite "draft" status, it is deployed and actively used.

**Dependencies:** EIP-155, EIP-712, EIP-721, EIP-1271

### The Three Registries

#### Identity Registry
- Built on ERC-721 with URIStorage extension
- Each agent gets a globally unique identifier: `{namespace}:{chainId}:{identityRegistry}:{tokenId}`
- Agent NFT metadata points to a registration file listing service endpoints (web, A2A, MCP, OASF, ENS, DID, email)
- Key functions: `register()`, `setAgentURI()`, `setAgentWallet()`, `getMetadata()`
- Optional domain verification via `.well-known/agent-registration.json`

#### Reputation Registry
- Enables clients to provide feedback signals on agent performance
- Feedback includes: value (int128), decimals (uint8), optional tags, endpoint URI, file references with integrity hashes
- Key functions: `giveFeedback()`, `revokeFeedback()`, `appendResponse()`, `getSummary()`, `readFeedback()`
- No built-in Sybil resistance -- the protocol makes signals transparent and expects ecosystem players to build reputation filtering on top

#### Validation Registry
- Manages independent verification of agent outputs
- Supports multiple validation mechanisms: stake-secured re-execution, zkML verifiers, TEE oracles, trusted judges
- Key functions: `validationRequest()`, `validationResponse()`, `getValidationStatus()`, `getSummary()`
- Validation scores range 0-100

### Adoption Data

| Metric | Value | Timeframe | Confidence |
|--------|-------|-----------|------------|
| Registered agents | 24,000+ | First 8 weeks (Jan 29 - Mar 2026) | HIGH |
| Feedback submissions | 401 | First 2 weeks | HIGH |
| x402 cumulative tx volume | $50M+ | As of Q1 2026 | MEDIUM |
| x402 transactions (30 days) | 15M+ | Q1 2026 | MEDIUM |

**8004Scan** (8004scan.io) serves as the primary analytics tool, aggregating Identity, Reputation, and Validation data.

### Limitations and Criticisms

1. **Sybil vulnerability:** Anyone can register agents. No built-in mechanism to prevent one entity from registering thousands of fake agents to game reputation.
2. **Reputation gaming:** Feedback manipulation through missing authorization checks on who can submit feedback.
3. **Storage exhaustion:** Unbounded validation requests can inflate gas costs without cleanup mechanisms.
4. **Identity != trustworthiness:** A verified identity does not guarantee honest or competent behavior. A well-reputed agent could be compromised post-registration.
5. **MEV-style attacks:** Potential for front-running domain registration claims.
6. **Free vs. deposit:** Whether registration should require economic stake is unresolved in the current spec.
7. **Still in Draft:** Despite mainnet deployment, the ERC is technically still Draft status, meaning the spec could change.

### Who would disagree

Security-focused practitioners argue that ERC-8004's minimalism is dangerous -- it creates a false sense of verified trust. An agent with an ERC-8004 identity and good reputation scores could still be a sophisticated attack vector. The standard explicitly punts Sybil defense to the implementation layer, which some view as a design flaw rather than a feature.

**What would change my mind:** If reputation gaming or Sybil attacks become widespread on the protocol within 6 months, the standard needs mandatory economic stake. If adoption reaches 100K+ agents without major incidents, the minimalist approach is validated.

---

## 4. Decentralized Identity (DID) & Verifiable Credentials

### W3C Standards Maturation

**W3C Verifiable Credentials 2.0** was published as a W3C Standard in May 2025 -- a major milestone. This provides stable foundation for implementations with improved selective disclosure and privacy guarantees.

**W3C DID Core** has reached official Recommendation status, defining the universal DID syntax: `did:{method}:{method-specific-id}`

### Key DID Methods for On-Chain Identity

| Method | Description | Status |
|--------|-------------|--------|
| `did:ethr` | Uses ERC-1056 smart contracts. Supports key rotation, delegate assignment. Widely used but spec is outdated vs. latest W3C standards | Ethereum Foundation issued RFP to modernize (2025) |
| `did:pkh` | Generative pseudo-DID from blockchain addresses (CAIP-10). Instant, no on-chain transaction needed | Active, used for lightweight identity |
| `did:web` | Uses traditional web domains. No blockchain needed | Active, bridges Web2/Web3 |
| `did:key` | Derived from public key. No registration needed | Active, very lightweight |
| `did:ion` | Bitcoin-anchored DID (Microsoft's ION network) | Active but low growth |
| `did:ebsi` | European Blockchain Services Infrastructure | Government/institutional use |

### Adoption Reality Check

The decentralized identity market size was estimated at $3B in 2025 with a projected 70.8% CAGR through 2035. However, this optimistic projection deserves scrutiny:

**The honest assessment (Confidence: HIGH):**
- Standards are mature (W3C VC 2.0, DID Core both finalized)
- Government pilots exist (EU EBSI, IDunion) but mass consumer adoption has not materialized
- The private sector largely hasn't bought in -- businesses see cost without clear ROI
- Fragmentation remains: 100+ DID methods, no clear winner
- "Without interoperability, digital ID systems risk creating new silos instead of breaking down old ones" (2024 industry report)

**The counter-narrative:**
- AI agents may drive DID adoption where humans did not. Agents need machine-readable, verifiable credentials by default -- unlike humans who can show physical IDs
- The arxiv paper "AI Agents with Decentralized Identifiers and Verifiable Credentials" (2025) specifically argues for DID-based agent identity

**Steel-man against DID adoption:** Centralized identity providers (Google, Apple, Microsoft) have stronger distribution, better UX, and existing trust relationships. Microsoft Entra Verified ID uses DIDs internally but abstracts the complexity away. The "decentralized" part may matter only at the protocol layer, invisible to end users, making it a distinction without practical difference for most applications.

---

## 5. Soulbound Tokens (SBTs)

### Vitalik's Vision (2022) vs. Reality (2026)

In January 2022, Vitalik Buterin proposed "soulbound" tokens -- non-transferable NFTs permanently bound to a wallet ("soul") -- as the foundation for a "Decentralized Society" (DeSoc). The vision: your entire identity (education, work history, credit score, certifications) represented as non-transferable on-chain tokens.

### Standards

| Standard | Description | Status |
|----------|-------------|--------|
| ERC-5192 | Minimal Soulbound NFTs. Extension of ERC-721 with a `locked()` function | Final |
| ERC-5484 | Consensual Soulbound Tokens. Requires mutual consent, immutable burn authorization | Final |
| ERC-5727 | Semi-Fungible Soulbound Tokens | Draft |

### What Actually Happened

**Implementations that exist:**
- **Binance Account Bound (BAB):** KYC credential on BNB Chain. The most widely deployed SBT. Required for some Binance services
- **University diploma pilots:** Several institutions have piloted SBT-based degree credentials
- **Otherside/BAYC:** Used SBTs for community membership verification

**Why adoption stalled (Confidence: HIGH):**
1. **Key loss = identity loss:** If you lose your wallet private key, you lose all SBTs permanently. No recovery mechanism in the standard
2. **Privacy nightmare:** All SBTs are publicly visible on-chain. Anyone with your wallet address sees your credentials, affiliations, and history
3. **No revocation mechanism in ERC-5192:** Once issued, the token cannot be revoked by the issuer (ERC-5484 addresses this partially)
4. **Attestations won:** EAS and Sign Protocol offer the same "non-transferable credential" functionality with better privacy (off-chain options), composability, and revocation support
5. **ZK credentials won:** Self Protocol, Human Passport, and others provide selective disclosure that SBTs inherently cannot

**Who would disagree:** SBT advocates argue that the concept is sound but the standards were premature. ERC-5192's simplicity is a feature -- it's a building block, not a complete system. The vision of "composable reputation" through SBTs remains valid even if current implementations are limited.

**What would change this:** A major SBT deployment (10M+ tokens) with built-in privacy (perhaps using ZK proofs to selectively prove SBT ownership without revealing which wallet holds them) would revive the concept.

### Academic Twist: SBTs for AI Agents

A 2025 academic paper "Soulbound AI, Soulbound Robots: How Ethereum's ERC-5192 Creates Fingerprints for Autonomous AI Agents" argues that non-transferability is a *feature* for agent identity -- you don't want an agent's identity to be tradeable. This is precisely what ERC-8004 achieves with its ERC-721-based Identity Registry (the agent NFT is functionally soulbound in practice, though technically transferable).

---

## 6. On-Chain Reputation Systems

### Gitcoin Passport / Human Passport

**Major development:** In February 2025, Holonym Foundation acquired Gitcoin Passport for $10M and rebranded it as **Human Passport** (passport.human.tech).

| Metric | Value | Confidence |
|--------|-------|------------|
| Existing users (Gitcoin Passport) | 2M+ | HIGH |
| Partner integrations | 110+ | HIGH |
| Planned ZK credentials | 34.5M | LOW (projection) |
| Acquisition price | $10M | HIGH |

**How it works:** Aggregates multiple verification "stamps" (social accounts, government ID, biometrics, on-chain history) into a composite humanity score. The Holonym acquisition adds zero-knowledge proofs for private on-chain reputation.

**What changed:** The rebranding from "Gitcoin Passport" to "Human Passport" reflects a shift from being a Gitcoin-specific tool to positioning as a universal proof-of-humanity protocol, directly competing with Worldcoin.

### Worldcoin / World

| Metric | Value | Confidence |
|--------|-------|------------|
| World App users | 38M+ | MEDIUM (self-reported, Feb 2026) |
| Verified World ID holders | 15M (Sep 2025) | MEDIUM |
| Orb-verified (since 2023) | ~12M | MEDIUM |
| Countries active | 40+ | HIGH |
| Regulatory bans/investigations | 9+ countries | HIGH |

**Technology:** Iris scanning via custom "Orb" hardware creates biometric hash. Zero-knowledge proofs verify uniqueness without storing biometric data centrally (in theory).

**Regulatory headwinds:** Brazil, Colombia, Germany, Hong Kong, India, Kenya, Portugal, Spain, and South Korea have investigated or banned Orb operations. Hong Kong has banned it entirely. Spain extended its ban through end of 2025.

**Who would disagree and why:**
- **Privacy advocates:** The Orb requires iris biometrics -- the most invasive possible proof of humanity. Even with ZK proofs, the biometric collection itself is a trust point
- **Forrester:** Published a report titled "Worldcoin Orb Identity Verification Device Faces Headwinds In Mass Adoption"
- **Competitors:** Human Passport claims it will generate 3x Worldcoin's identity proofs through less invasive methods (government ID + social accounts + behavioral signals)

### Proof of Humanity (PoH)

The original on-chain proof-of-personhood protocol, built by Kleros. Claims 50,000+ registered users. Requires video submission + vouch from existing members + dispute resolution.

By mid-2025, over 60% of top DAOs reportedly use some form of PoH for governance, though the stat "200M+ PoH users expected by end of 2025" from promotional materials appears wildly optimistic and likely refers to proof-of-humanity *concepts broadly*, not the specific PoH protocol. (Confidence: LOW for the 200M claim)

### Galxe

| Metric | Value | Confidence |
|--------|-------|------------|
| Total users | 36M | HIGH (year-end 2025 review) |
| Daily active users | 1M | HIGH |
| Partner projects | 7,700+ | HIGH |
| Galxe Passport holders | 977K | HIGH |
| On-chain credentials issued | 362K (by Galxe directly) | HIGH |
| Airdrop campaigns facilitated | 4,500+ | HIGH |
| Tokens distributed via Galxe | $500M+ | MEDIUM |

Galxe is the largest credential data network in Web3. Its Identity Protocol uses ZK proofs with four roles: Credential Holder, Issuer, Verifier, and Type Designer. Multi-chain support across Ethereum, BNB Chain, Solana, Sui, Sei.

**Critical distinction:** Galxe credentials are primarily marketing/engagement tools (quest completion, airdrop eligibility) rather than identity verification. This is a different value proposition than ENS, DIDs, or SBTs.

### Layer3

Over 1M active users across 25 blockchains. 10M+ credentials earned, 40M+ rewards distributed. Interoperable credential infrastructure unifying identity across ecosystems.

Similar to Galxe, Layer3 credentials represent task completion and engagement rather than verified identity. The value is in behavioral reputation ("this wallet has done X actions") rather than personhood verification.

---

## 7. Self Protocol

### Overview

Self is a privacy-first, open-source identity protocol using zero-knowledge proofs for secure identity verification. It enables Sybil resistance and selective disclosure using real-world attestations like biometric passports.

### Key Metrics

| Metric | Value | Confidence |
|--------|-------|------------|
| Users verified | 7M+ (across 174 countries, Dec 2025) | MEDIUM (self-reported) |
| Seed funding | $9M (Nov 2025) | HIGH |
| Investors | Greenfield Capital, SoftBank | HIGH |
| Google Cloud partnership | Announced Jan 2026 | HIGH |
| Integration partners | Google, Aave, Velodrome | HIGH |

### How It Works

1. **NFC passport scanning:** Users tap their biometric passport's NFC chip to a mobile phone
2. **ZK proof generation:** The app generates a zero-knowledge proof that the passport is valid without revealing the passport data itself
3. **Selective disclosure:** Users can prove specific attributes (age > 21, nationality, etc.) without revealing the underlying data
4. **On-chain verification:** Proof is verifiable on-chain through Self Connect

**Supported documents:** Biometric passports, national IDs, India's Aadhaar

### Use Cases in Production

- **Sybil-resistant airdrops:** Prove uniqueness without KYC data exposure
- **OFAC-compliant token distributions:** Verify non-sanctioned status without revealing identity
- **Google Web3 testnet faucets:** Self's ZK proof-of-humanity went live in Google's Celo Sepolia faucets (Jan 28, 2026), ensuring test tokens go to real developers. Verified users get 10x more tokens
- **DeFi access:** Aave integration for compliant lending

### Competitive Position

Self occupies a unique position between Worldcoin (hardware-dependent, more invasive) and Human Passport (software-only, less rigorous). By leveraging existing government-issued documents' NFC chips, Self avoids Worldcoin's hardware distribution problem while providing stronger verification than social-account-based approaches.

**Who would disagree:** Countries where passports lack NFC chips are excluded. The approach inherently ties identity to nation-state documentation, which contradicts the "self-sovereign" ideal of identity independent from governments.

---

## 8. Attestation Protocols

### Ethereum Attestation Service (EAS)

EAS is the foundational attestation infrastructure on Ethereum, deployed as a public good (permissionless, tokenless, free).

**Cross-Chain Statistics (Q1 2026):**

| Network | Total Attestations | Schemas | Unique Attestors |
|---------|-------------------|---------|-------------------|
| Ethereum Mainnet | 13,584 | 347 | 768 |
| Base | 3,353,465 | 1,256 | 11,136 |
| Optimism | 1,312,523 | 817 | 19,298 |

**Total across these three networks: ~4.68M attestations** (Confidence: HIGH -- sourced directly from easscan.org explorers)

The massive disparity between Base (3.35M) and Ethereum mainnet (13.5K) reflects that gas costs drive attestation behavior to L2s. Coinbase Verifications is likely the single largest driver of Base attestation volume.

**Key integration: Coinbase Verifications**
- Uses EAS on Base for on-chain KYC attestations
- Coinbase users can verify their trading account status and country of residence on-chain
- Only data shared: "this wallet is associated with a verified Coinbase account"
- Non-transferable attestations
- Available to Coinbase's 100M+ user base (though actual adoption of on-chain verification is a fraction)

### Sign Protocol

| Metric | Value | Confidence |
|--------|-------|------------|
| Revenue | $15M (2024, up from $1.7M in 2023) | MEDIUM |
| Partner projects | 200+ | MEDIUM |
| CZ/YZI Labs investment | $16M | HIGH |
| Multi-chain support | Ethereum, Starknet, Movement, ZetaChain, BSC, Polygon | HIGH |

Sign Protocol describes itself as "the omnichain attestation protocol." It enables creation and verification of attestations across multiple blockchains. Plans for no-code attestation creation tools and government partnership expansion.

### Verax

Verax is a shared on-chain attestation registry developed by Consensys on Linea. Key characteristics:

- **Open source** (MIT license), developed as a public good for the Linea ecosystem
- **Collaborative development:** Consensys, Clique, Karma3 Labs, Aspecta, Primus Labs, Reclaim Protocol
- **Gas-free attestation issuance**
- **Key integration:** Sumsub (KYC provider) integrated with Verax for on-chain identity attestations, demonstrated at EthCC 2025
- Attestations are easily discoverable, linkable, and composable -- designed to be a "distribution channel" for attestation data

### Comparative Analysis

| Feature | EAS | Sign Protocol | Verax |
|---------|-----|---------------|-------|
| Primary chain | Ethereum + L2s | Omnichain | Linea |
| Tokenless | Yes | No ($SIGN token) | Yes |
| Scale (attestations) | 4.68M+ | Unknown | Unknown |
| Revenue model | Public good | Token + fees | Public good |
| Key backer | Ethereum community | CZ/YZI Labs ($16M) | Consensys |
| Off-chain support | Yes | Yes | Yes |
| Best for | Infrastructure/primitives | Cross-chain attestation business | Linea ecosystem |

---

## 9. The AI Agent Identity Problem

### The Problem Statement

As AI agents proliferate, a critical infrastructure gap has emerged: **How do you know you're interacting with a legitimate agent? How do agents prove they're authorized? How do agents trust each other?**

This is not theoretical. Key statistics:
- Autonomous agents outnumber humans **82:1** in enterprise systems (Strata Identity, 2026)
- Gartner predicts **40% of enterprise apps** will include integrated agents by end of 2026 (up from <5% in 2025)
- The Arup deepfake fraud incident cost **$25M** through AI-generated video conferencing impersonation (2026)
- Voice cloning now requires only **3-5 seconds** of sample audio
- Deepfake-as-a-service platforms became widely available in 2025

### Why Traditional IAM Fails

OAuth was designed for humans and assumes persistent sessions and user consent. Traditional IAM infrastructure cannot handle:
- Agents that reason about goals and make independent decisions
- Dynamic adaptation of actions without human approval
- Agent-to-agent delegation chains without human intermediaries
- Real-time revocation tied to risk assessment rather than session expiry

Teams in production today are sharing human credentials and access tokens with agents in the absence of proper alternatives -- a dangerous security anti-pattern.

### The Protocol Stack for Agent Identity

The emerging agent identity stack consists of:

```
Layer 4: PAYMENTS      x402 (HTTP 402 Payment Required standard)
Layer 3: TRUST         ERC-8004 (Identity + Reputation + Validation)
Layer 2: COMMUNICATION A2A (agent-to-agent) + MCP (agent-to-tools)
Layer 1: IDENTITY      ENS names + DIDs + Verifiable Credentials
Layer 0: AUTH          OAuth 2.1 + delegation tokens + PKCE
```

### Know Your Agent (KYA)

KYA is emerging as the AI-era counterpart to Know Your Customer (KYC). Key implementations:

**Visa Trusted Agent Protocol (TAP):**
- Announced October 2025 with 10+ partners
- Open framework on existing web infrastructure
- Cryptographic method for agents to prove identity and authorization to merchants
- Includes timestamps, session IDs, key identifiers in signatures
- Hundreds of secure agent-initiated transactions completed in pilot
- Visa predicts millions of consumers will use AI agents for purchases by 2026 holiday season

**AgentFacts:**
- Universal 10-category metadata standard for AI agents
- JSON and JSON-LD formats for interoperability
- Model and framework agnostic (works with OpenAI, Anthropic, LangChain, CrewAI, AutoGen)
- Open source (Apache 2.0 license)
- Published in ArXiv, originated from Universitas AI's multi-agent research
- Analogous to "nutrition facts labels" for AI agents

**Sumsub KYA Framework:**
- Connects autonomous AI with "real, verified human identity"
- Adds AI agent verification to existing KYC/AML compliance infrastructure
- Emphasis on human accountability as the binding element

**ERC-8004 as Decentralized KYA:**
- The first on-chain KYA infrastructure
- No central authority required for agent registration
- Reputation and validation data publicly auditable

### The Agent Delegation Problem

When Agent A delegates a task to Agent B, how do you maintain:
1. **Identity chain:** Proving Agent B is authorized by Agent A, which was authorized by Human X
2. **Scope limitation:** Ensuring Agent B only does what Agent A authorized
3. **Audit trail:** Recording the full delegation chain for accountability
4. **Revocation:** Immediately revoking Agent B's authority if Agent A is compromised

**Emerging solutions:**
- **ARIA (Agent Relationship-Based Identity and Authorization):** Every delegation recorded as a distinct, cryptographically verifiable relationship in a graph
- **OAuth 2.0 extensions for AI:** Agent-ID tokens and delegation tokens extending standard OAuth flows
- **A2A Secure Passport Extension** (late 2025): Standard mechanism for agents to share structured context securely
- **ERC-8004 Validation Registry:** Independent verification that agent actions match claimed authorization

### The ZK Solution

Evin McMullen (CoinDesk, Nov 2025) argues that ZK proofs are the solution to the agent identity paradox:

> "A user can prove they're over 21 without revealing their birthdate. An AI agent can prove it was trained on ethical datasets without exposing proprietary algorithms."

ZK proofs enable a "composable identity layer" where agents can prove:
- Training data meets ethical standards
- Outputs have been audited
- Actions are linked to accountable human entities
- Authorization scope is valid

All without revealing proprietary information or creating data honeypots.

---

## 10. bond.credit

### Overview

bond.credit is building "the credit layer for the agentic economy." It deploys real capital to on-chain agents and records all trades and vault updates on-chain, feeding data into a credit engine.

### How It Works

1. **On-chain tracking:** Every agent trade and vault update is recorded on-chain
2. **Credit engine:** Analyzes agent performance data to assess creditworthiness
3. **Progressive trust:** Agents that outperform earn credibility, unlock higher credit limits, and receive capital routing
4. **The core question:** "Which agents can be trusted with credit?"

### Agentic Alpha (Season 0)

bond.credit ran "Agentic Alpha" as Season 0, where real capital was deployed to on-chain agents. The season has concluded with agents "successfully aggregated and routed credit." Benchmarking will resume in the next season.

### Relationship to ERC-8004

While bond.credit does not explicitly reference ERC-8004 on its website, it occupies a complementary layer. Where ERC-8004 provides the identity and reputation registries, bond.credit operationalizes that reputation into actual financial risk assessment. It answers the question that ERC-8004 alone cannot: "Should this agent be trusted with real money?"

**Assessment (Confidence: LOW):** bond.credit is early-stage. No public metrics on capital deployed, agents evaluated, or credit extended. The concept of agent credit scoring is compelling but unproven. The Q1 2026 Agentic Finance report (TechFlow) did not mention bond.credit despite covering the broader agent finance landscape in detail.

**What would change my assessment:** Public data on default rates, credit limits extended, and agent performance correlation with credit scores would establish or refute the model's viability.

---

## 11. Pain Points & Open Problems

### 1. Sybil Attacks

**The problem:** One entity creates many identities to manipulate reputation, governance, or airdrop systems.

**Current state of defenses:**
- Biometric: Worldcoin (iris scanning), Self Protocol (NFC passport)
- Social graph: Gitcoin Passport / Human Passport (aggregated stamps)
- Economic: Proof-of-stake, bonded deposits
- Behavioral: Transaction history analysis, on-chain activity patterns

**For AI agents specifically:** Sybil attacks are potentially worse because agents can be spun up programmatically. One operator could register thousands of ERC-8004 agents, perform legitimate-seeming transactions between them, and inflate reputation scores. The ERC-8004 spec acknowledges this and explicitly defers Sybil defense to the implementation layer.

### 2. Identity Fragmentation

**The problem:** A user has different identities on Ethereum, Solana, Base, Optimism, Cosmos, etc. These don't communicate.

**Current solutions:**
- Cross-chain DIDs (did:pkh works for any blockchain address)
- ENS cross-chain resolution (ENSv2)
- Sign Protocol's omnichain attestations
- Layer3's interoperable credential infrastructure

**Unsolved:** No universal identity aggregation standard. CAIP-10 (Chain Agnostic Improvement Proposal for account IDs) provides addressing but not credential portability.

### 3. Privacy vs. Accountability

**The core tension:** Blockchain's transparency is a feature for accountability but a bug for privacy. On-chain identity means anyone can see your credentials, transactions, and associations.

**ZK as the bridge:**
- Self Protocol: Prove attributes without revealing underlying data
- Human Passport: ZK credentials for private on-chain reputation
- Galxe Identity Protocol: ZK-powered credential verification

**Unsolved regulatory challenge:** Privacy-preserving systems must enable "accountable selective de-anonymization" when illicit activity is detected. Current ZK systems assume cooperative de-anonymization, which doesn't work against malicious actors. No production system has solved this cleanly.

### 4. Agent Impersonation

**The problem:** How do you distinguish between:
- A legitimate agent acting on a user's behalf
- A compromised agent that was legitimate but is now hijacked
- A fraudulent agent impersonating a legitimate one
- A deepfake pretending to be a human when it's an agent

**Current defenses:**
- ERC-8004: On-chain identity registration + reputation history
- Visa TAP: Cryptographic signatures proving agent identity and authorization scope
- AgentFacts: Standardized metadata for agent capability declaration
- x402: Payment authorization as a trust signal

**Unsolved:** Real-time compromise detection. ERC-8004 reputation is backward-looking. If an agent with excellent reputation gets compromised, the registry cannot flag it until after damage is done.

### 5. The Accountability Gap

**The problem:** When an AI agent makes a mistake, causes financial loss, or violates regulations, who is liable?

**Current state:**
- ERC-8004's Identity Registry links agents to human-controlled wallets, creating a chain to human accountability
- Visa TAP ensures transaction authorization is cryptographically bound to specific actions
- EU AI Act and emerging US regulations are beginning to address AI liability but do not specifically cover on-chain agent operations

**Unsolved:** No standard for mandatory insurance, bonding, or collateralization for agent operations. bond.credit is exploring this space but is pre-product.

---

## 12. Landscape Map & Convergence

### The Emerging Stack

```
IDENTITY LAYER          REPUTATION LAYER         TRUST/PAYMENTS LAYER
-----------------      -------------------      ---------------------
ENS (.eth names)       ERC-8004 Reputation      x402 (HTTP payments)
DIDs (W3C)             EAS attestations         Visa TAP
ERC-8004 Identity      Sign Protocol            bond.credit
Galxe ID               Galxe credentials        Token-gated access
                       Human Passport scores

HUMANITY LAYER          PRIVACY LAYER            GOVERNANCE LAYER
-----------------      -------------------      ---------------------
Worldcoin (biometric)  Self Protocol (ZK)       AgentFacts (KYA)
Human Passport         Galxe ZK proofs          ERC-8004 Validation
Proof of Humanity      Verifiable Credentials   Sumsub KYA
Self Protocol (NFC)    Selective disclosure      DAO governance
```

### Convergence Points

1. **ENS + ERC-8004 + x402:** This trio is emerging as the canonical agent identity stack. ENS provides naming, ERC-8004 provides reputation and validation, x402 provides payment capability. All three come from the same cultural cluster (Ethereum ecosystem, Coinbase backing).

2. **Self Protocol + EAS + VCs:** ZK-powered identity verification producing on-chain attestations that serve as verifiable credentials. This stack addresses the privacy-accountability tension.

3. **A2A + MCP + ERC-8004:** The agent communication protocols (Google's A2A for agent-to-agent, Anthropic's MCP for agent-to-tools) need a trust layer. ERC-8004 is explicitly designed to complement these protocols.

### What Changes in 12 Months

1. **ERC-8004 either achieves critical mass or doesn't.** At 24K agents in 8 weeks, the trajectory points to 100K+ by end of 2026. But early growth curves are unreliable predictors.

2. **ENSv2 ships.** The mainnet deployment of ENSv2 with cross-chain resolution and per-name registries could significantly expand ENS's role as agent identity infrastructure.

3. **x402 payment volume.** At $50M cumulative and 15M transactions in 30 days, the growth rate will determine whether HTTP-native agent payments become standard or remain experimental.

4. **Regulatory intervention.** The EU AI Act enforcement begins. If regulators mandate specific agent identity requirements, that could either accelerate (standards-compatible requirements) or fragment (jurisdiction-specific requirements) the current trajectory.

5. **Platform moves.** If Google, Microsoft, or Apple ship a non-blockchain agent identity standard with their existing distribution, the on-chain approach could be marginalized to crypto-native use cases.

### Where the Value Lives

- **ENS:** Network effects + human-readable namespace. Hard to replicate. But vulnerable if a larger namespace (DNS) adds agent resolution
- **ERC-8004:** First-mover advantage + Ethereum ecosystem backing. But value is in the standard itself (free, open) not in any company. Monetization is unclear
- **Self Protocol:** Proprietary ZK circuits + NFC passport integration + 7M users. Google Cloud partnership creates distribution moat
- **EAS:** Pure public good. Value accrues to builders on top, not to EAS itself
- **Human Passport:** 2M users + 110 partners acquired for $10M. Value is in the network of verified humans, which compounds with each new integration
- **Worldcoin:** Hardware moat (Orbs are expensive to replicate). But regulatory risk could destroy distribution

---

## 13. Gaps & Uncertainties

### What I Could Not Verify

1. **bond.credit <-> ERC-8004 relationship:** No public evidence of direct integration. bond.credit's website does not mention ERC-8004. The connection appears to be thematic (both address agent trust) rather than technical. (Confidence: LOW)

2. **bond.credit at Synthesis hackathon:** No search results confirmed bond.credit's presence at a "Synthesis" hackathon specifically. This claim could not be verified. (Confidence: VERY LOW)

3. **EAS total attestation numbers across ALL chains:** I obtained data for Ethereum mainnet (13.5K), Base (3.35M), and Optimism (1.31M). Data for Arbitrum, Scroll, Celo, Linea, Polygon, and other supported chains was not retrieved. The true total is likely significantly higher than 4.68M.

4. **ERC-8004 agent quality vs. quantity:** 24,000 registered agents, but what percentage are genuine production agents vs. test registrations or speculative claims? No breakdown available.

5. **Self Protocol's 7M users claim:** Self-reported number. No independent verification found. The number seems high for a seed-stage startup, though the $9M raise and Google Cloud partnership lend credibility.

6. **Worldcoin's actual unique verified users:** The gap between "38M+ app users" and "15M verified" and "12M orb-verified" suggests significant user churn or inactive accounts. No independent audit of these numbers exists.

7. **Proof of Humanity's "60% of top DAOs" claim:** This appears to reference proof-of-humanity concepts broadly, not the specific PoH protocol by Kleros. The actual PoH registry has ~50K users, which is small.

8. **Sign Protocol's $15M revenue composition:** Whether this is protocol fee revenue, token-related revenue, or service revenue is unclear. The 8.8x year-over-year growth is notable but the base was small.

9. **The role of TEEs (Trusted Execution Environments) in agent identity:** ERC-8004's Validation Registry supports TEE oracles, but the practical adoption of TEE-based agent attestation is not well documented.

10. **Legal enforceability of on-chain agent identity.** No case law establishes whether an ERC-8004 identity registration creates legal accountability. This is a critical gap for the "trust" claim.

### Key Uncertainties

- **Will on-chain agent identity standards remain Ethereum-centric or go genuinely multi-chain?** ERC-8004 is EVM-only. Solana, Cosmos, and non-EVM ecosystems lack equivalent standards.
- **What happens when the first major agent fraud uses ERC-8004-registered agents?** The standard's credibility depends on how the ecosystem responds to its first high-profile failure.
- **Is KYA a regulatory requirement or market-driven?** If it remains voluntary, adoption may be limited to high-stakes applications. If mandated, it could become universal but potentially capture innovation.

---

## 14. Sources

### ENS & ENSv2
- [ENS Labs scraps Namechain L2, shifts ENSv2 fully to Ethereum mainnet - The Block](https://www.theblock.co/post/388932/ens-labs-scraps-namechain-l2-shifts-ensv2-fully-ethereum-mainnet) (Feb 2026)
- [Ethereum's ENS identity system scraps planned rollup - CoinDesk](https://www.coindesk.com/tech/2026/02/06/ethereum-s-ens-identity-system-scraps-planned-rollup-amid-vitalik-s-warning-about-layer-2-networks) (Feb 2026)
- [ENS is staying on Ethereum - ENS Blog](https://ens.domains/blog/post/ens-staying-on-ethereum) (Feb 2026)
- [ENSv2: The Future of Ethereum Name Service - Trust Wallet](https://trustwallet.com/blog/defi/the-future-of-ethereum-name-service) (2025)
- [The Identity Problem in Agentic Commerce - ENS Blog](https://ens.domains/blog/post/ens-ai-agent-erc8004) (2026)
- [ENS Review 2026 - CryptoAdventure](https://cryptoadventure.com/ens-review-2026-ethereum-name-service-ensv2-roadmap-and-real-world-security/) (2026)
- [ENS Domains Explained - StealthCloud](https://stealthcloud.ai/web3-identity/ens-domains-explained/) (2025)

### ERC-8004
- [ERC-8004: Trustless Agents - EIPs](https://eips.ethereum.org/EIPS/eip-8004) (Aug 2025, mainnet Jan 2026)
- [ERC-8004 Fellowship of Ethereum Magicians](https://ethereum-magicians.org/t/erc-8004-trustless-agents/25098) (2025)
- [ERC-8004 Explained: Identity and Reputation for AI Agents - Allium](https://www.allium.so/blog/onchain-ai-identity-what-erc-8004-unlocks-for-agent-infrastructure/) (2026)
- [ERC-8004: A Developer's Guide - QuickNode](https://blog.quicknode.com/erc-8004-a-developers-guide-to-trustless-ai-agent-identity/) (2026)
- [ERC-8004: The On-Chain Flow of 21,000+ AI Agents - AInvest](https://www.ainvest.com/news/erc-8004-chain-flow-21-000-ai-agents-2602/) (Feb 2026)
- [Agentic Finance Q1 2026 Report - TechFlow](https://www.techflowpost.com/en-US/article/30438) (Q1 2026)
- [ERC-8004: Infrastructure for Autonomous AI Agents - QuillAudits](https://www.quillaudits.com/blog/smart-contract/erc-8004) (2026)
- [8004Scan Explorer](https://www.8004scan.io/) (Live)
- [What is ERC-8004 - Eco.com](https://eco.com/support/en/articles/13221214-what-is-erc-8004-the-ethereum-standard-enabling-trustless-ai-agents) (2026)
- [ERC-8004 Practical Explainer - Composable Security](https://composable-security.com/blog/erc-8004-a-practical-explainer-for-trustless-agents/) (2026)
- [GitHub: awesome-erc8004](https://github.com/sudeepb02/awesome-erc8004) (2026)
- [AI Trading Agents with ERC-8004 Hackathon - Lablab.ai](https://lablab.ai/ai-hackathons/ai-trading-agents-erc-8004) (Mar 2026)

### DIDs & Verifiable Credentials
- [W3C publishes Verifiable Credentials 2.0](https://www.w3.org/press-releases/2025/verifiable-credentials-2-0/) (May 2025)
- [AI Agents with Decentralized Identifiers and Verifiable Credentials - ArXiv](https://arxiv.org/html/2511.02841v1) (2025)
- [Decentralized Identifiers Guide 2026 - Dock](https://www.dock.io/post/decentralized-identifiers) (2026)
- [VCs and DIDs Technical Landscape - GS1](https://ref.gs1.org/docs/2025/VCs-and-DIDs-tech-landscape) (2025)
- [Ethereum Foundation RFP: Advancing did:ethr](https://esp.ethereum.foundation/applicants/rfp/did_ethr_method_spec) (2025)

### Soulbound Tokens
- [ERC-5192: Minimal Soulbound NFTs - EIPs](https://eips.ethereum.org/EIPS/eip-5192) (Final)
- [ERC-5484: Consensual Soulbound Tokens - EIPs](https://eips.ethereum.org/EIPS/eip-5484) (Final)
- [What Are Soulbound Tokens - CoinGecko](https://www.coingecko.com/learn/soulbound-tokens-sbt) (2025)
- [Soulbound AI, Soulbound Robots: ERC-5192 for AI Agents - Academia.edu](https://www.academia.edu/161252889/) (2025)

### Reputation Systems
- [Holonym acquires Gitcoin Passport for $10M - CoinTelegraph](https://cointelegraph.com/news/zk-identity-holonym-acquire-gitcoin-passport-10-million) (Feb 2025)
- [Human Passport](https://passport.human.tech/) (Live, 2025)
- [World (blockchain) - Wikipedia](https://en.wikipedia.org/wiki/World_(blockchain)) (Updated 2026)
- [Worldcoin Orb Faces Headwinds - Forrester](https://www.forrester.com/blogs/worldcoin-orb-identity-verification-device-faces-headwinds-in-mass-adoption/) (2025)
- [Pantera: World - A Mission Critical Identity Solution](https://panteracapital.com/world-a-mission-critical-identity-solution/) (2025)
- [Galxe 2025 Year in Review](https://www.galxe.com/blog/galxe-2025-year-in-review) (Dec 2025)
- [Galxe Identity Protocol](https://www.galxe.com/identity) (Live)
- [Proof of Humanity](https://proofofhumanity.id/) (Live)

### Self Protocol
- [Self raises $9M - CoinDesk](https://www.coindesk.com/business/2025/11/13/zero-knowledge-identity-startup-self-raises-usd9m-introduces-points-program) (Nov 2025)
- [Self Protocol Docs](https://docs.self.xyz) (Live)
- [Google Cloud partners with Self Protocol - Biometric Update](https://www.biometricupdate.com/202507/google-cloud-partners-with-zkp-identity-verification-protocol-self) (2025)
- [Google Cloud Integrates with Self - Yahoo Finance](https://finance.yahoo.com/news/google-cloud-integrates-self-zk-133000920.html) (Jan 2026)
- [Google Web3 Faucets with Self Protocol PoH - Morningstar](https://www.morningstar.com/news/business-wire/20260128053068/google-web3-testnet-faucets-now-live-with-self-protocol-proofofhumanity) (Jan 2026)

### Attestation Protocols
- [EAS - Ethereum Attestation Service](https://attest.org/) (Live)
- [EAS Explorer - Ethereum Mainnet](https://easscan.org/) (Live)
- [EAS Explorer - Base](https://base.easscan.org/) (Live, 3.35M attestations)
- [EAS Explorer - Optimism](https://optimism.easscan.org/) (Live, 1.31M attestations)
- [Coinbase Verifications - GitHub](https://github.com/coinbase/verifications) (2024-2026)
- [Coinbase Launches On-Chain KYC - Yahoo Finance](https://finance.yahoo.com/news/coinbase-launches-chain-kyc-verification-174218181.html) (2024)
- [Sign Protocol - Gate.io](https://www.gate.io/learn/articles/sign-protocol-building-trust-through-verifiable-on-chain-attestations/8789) (2025)
- [Sign Protocol $16M from CZ - Cryptodamus](https://cryptodamus.io/en/articles/news/sign-protocol-cz-s-yzi-labs-invests-16m-in-omni-chain-revolution) (2025)
- [Verax Attestation Registry](https://www.ver.ax/) (Live)
- [Verax on Linea - Linea Docs](https://docs.linea.build/get-started/tooling/attestations/verax) (2025)
- [Sumsub + Verax Integration - Sumsub](https://sumsub.com/newsroom/sumsub-and-linea-showcase-new-on-chain-identity-attestations-via-verax/) (2025)

### AI Agent Identity
- [AI Agents Need Identity and ZKPs Are the Solution - CoinDesk](https://www.coindesk.com/opinion/2025/11/19/ai-agents-need-identity-and-zero-knowledge-proofs-are-the-solution) (Nov 2025)
- [The AI Agent Identity Crisis - Strata](https://www.strata.io/blog/agentic-identity/the-ai-agent-identity-crisis-new-research-reveals-a-governance-gap/) (2026)
- [Why AI Agents Need Their Own Identity - WSO2](https://wso2.com/library/blogs/why-ai-agents-need-their-own-identity-lessons-from-2025-and-resolutions-for-2026/) (2026)
- [The Looming Authorization Crisis - ISACA](https://www.isaca.org/resources/news-and-trends/industry-news/2025/the-looming-authorization-crisis-why-traditional-iam-fails-agentic-ai) (2025)
- [Authenticated Delegation and Authorized AI Agents - ArXiv](https://arxiv.org/html/2501.09674v1) (Jan 2025)
- [Know Your Agent (KYA) in 2026 - StablecoinInsider](https://stablecoininsider.org/know-your-agent-kya-in-2026/) (2026)
- [Deepfakes, AI Agents Will Expose Identities - MSSP Alert](https://www.msspalert.com/news/deepfakes-ai-agents-will-expose-identities-to-more-threats-in-2026) (2026)

### KYA & Agent Verification
- [Visa Introduces Trusted Agent Protocol](https://investor.visa.com/news/news-details/2025/Visa-Introduces-Trusted-Agent-Protocol-An-Ecosystem-Led-Framework-for-AI-Commerce/default.aspx) (Oct 2025)
- [Visa Trusted Agent Protocol - Developer Docs](https://developer.visa.com/capabilities/trusted-agent-protocol) (2025)
- [AgentFacts - Universal KYA Standard](https://agentfacts.org/) (Live)
- [AgentFacts ArXiv Paper](https://arxiv.org/abs/2506.13794) (2025)
- [Sumsub KYA Framework](https://sumsub.com/blog/know-your-agent/) (2026)
- [The KYA Moment - PYMNTS](https://www.pymnts.com/artificial-intelligence-2/2026/the-kya-moment-why-knowing-your-agent-is-becoming-table-stakes/) (2026)

### Payments & Infrastructure
- [x402 - Internet-Native Payments Standard](https://www.x402.org/) (Live)
- [Introducing x402 - Coinbase](https://www.coinbase.com/developer-platform/discover/launches/x402) (2025)
- [x402 on Solana](https://solana.com/x402/what-is-x402) (2025)
- [x402 GitHub](https://github.com/coinbase/x402) (Live)

### Agent Communication Protocols
- [The Agent Protocol Stack: MCP + A2A + A2UI](https://subhadipmitra.com/blog/2026/agent-protocol-stack/) (2026)
- [AI Agent Protocols 2026 Complete Guide - Ruh.ai](https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide) (2026)
- [MCP, OAuth 2.1, PKCE, and the Future of AI Authorization - Aembit](https://aembit.io/blog/mcp-oauth-2-1-pkce-and-the-future-of-ai-authorization/) (2025)

### bond.credit
- [bond.credit - Agentic Alpha](https://www.bond.credit/) (Live)

### Decentralized Identity Market & Criticism
- [Where Decentralized Identity Failed - RSA Conference](https://www.rsaconference.com/library/blog/where-decentralized-identity-failed-and-where-it-might-still-succeed) (2025)
- [Decentralized Identity Market Size - GM Insights](https://www.gminsights.com/industry-analysis/decentralized-identity-market) (2025)
- [Are We There Yet? A Study of Decentralized Identity Applications - ArXiv](https://arxiv.org/html/2503.15964v1) (Mar 2025)
