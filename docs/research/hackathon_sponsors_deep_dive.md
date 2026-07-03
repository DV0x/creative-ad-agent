# Synthesis Hackathon -- Detailed Prize Sponsor Requirements Deep Dive

**Research Date**: March 16, 2026
**Hackathon Dates**: March 4-25, 2026 (building: March 13-22)
**Total Prizes**: 109 prizes across all sponsors
**Website**: https://synthesis.md | https://synthesis.devfolio.co

---

## Table of Contents

1. [Hackathon Overview & Vision](#hackathon-overview--vision)
2. [Judging System](#judging-system)
3. [Protocol Labs -- ERC-8004 Trustless Agents](#1-protocol-labs)
4. [Venice -- Private AI Agents](#2-venice)
5. [MetaMask -- Delegation Toolkit](#3-metamask)
6. [Lido Labs -- Staking MCP Server](#4-lido-labs)
7. [Uniswap -- Agentic Finance](#5-uniswap)
8. [Celo -- Real-World Utility Agents](#6-celo)
9. [OpenServ -- Multi-Agent DeFi](#7-openserv)
10. [Olas/Autonolas -- Agent Marketplace](#8-olasautonolas)
11. [Bankr -- LLM Gateway](#9-bankr)
12. [Self Protocol -- ZK Identity](#10-self-protocol)
13. [ENS -- Agent Naming & Identity](#11-ens)
14. [Status Network -- Gasless Transactions](#12-status-network)
15. [Arkhai -- Escrow Ecosystem](#13-arkhai)
16. [bond.credit -- Autonomous Trading Credit](#14-bondcredit)
17. [Markee -- GitHub Integration](#15-markee)
18. [Slice -- Onchain Commerce](#16-slice)
19. [Minor Sponsors](#minor-sponsors)
20. [Strategic Analysis](#strategic-analysis)
21. [Gaps & Uncertainties](#gaps--uncertainties)

---

## Hackathon Overview & Vision

### What Synthesis IS
Synthesis is the first hackathon where AI agents can enter, build, compete, and win alongside humans. Organized by Devfolio, it is explicitly Ethereum-centric. The tagline: "The first builder event you can enter without a body."

### The Four Core Problem Areas
All projects should address one or more of these themes:

1. **Agents that PAY** -- "How do you know it did what you asked?" Transparent spending scopes, verification, and settlement without intermediaries.
2. **Agents that TRUST** -- Decentralized trust infrastructure beyond centralized registries. Portable reputation, not API-key-based identity.
3. **Agents that COOPERATE** -- Neutral enforcement layers for agent-made agreements. Multi-agent coordination without a central authority.
4. **Agents that KEEP SECRETS** -- Privacy protection against metadata leakage from agent interactions.

### Core Philosophy
The organizers want "infrastructure underneath" that enables trustworthy autonomous agent operation using Ethereum's transparency. The word "infrastructure" is key -- they want building blocks, not just end-user apps.

### What Makes a Submission Stand Out (Confidence: MEDIUM)
Based on prize descriptions and hackathon framing:
- **Real onchain execution** -- ship actual TxIDs, not mock demos
- **Self-sustaining economics** -- agents that can fund their own operation
- **Safety guardrails** -- spending limits, policy enforcement, dry-run support
- **Multi-tool orchestration** -- agents using multiple protocols together
- **ERC-8004 integration** -- the standard that ties the whole event together
- **Autonomous behavior** -- minimal human intervention required

---

## Judging System

### How It Works
- **March 18**: AI agent judges provide mid-hackathon feedback to projects
- **March 22**: Building closes; both AI agents and humans evaluate final projects
- **March 25**: Winners announced

### Key Details
- Each sponsor trains their OWN agentic judge to define what matters to them
- The "Synthesis Open Track" ($14,558.96) synthesizes values across ALL agent judges
- Individual sponsor prizes are evaluated by that sponsor's specific agent judge
- No published rubric -- each agent judge has its own criteria

### Who Would Disagree With This Framing?
Skeptics would note that AI judges may favor technically sophisticated but impractical projects over simple-but-useful ones. The mid-hackathon feedback is a good signal -- teams should submit early and iterate based on agent feedback rather than building in isolation.

---

## 1. Protocol Labs

### Prize Pool: $20,004 (across 6 prizes)
| Place | Amount | Track |
|-------|--------|-------|
| 1st | $4,000 | Trusted Agents (ERC-8004) |
| 1st | $4,000 | No Humans Required (Autonomous Loop) |
| 2nd | $3,000 | Trusted Agents |
| 2nd | $2,500 | No Humans Required |
| 3rd | $1,500 | No Humans Required |
| 3rd | $1,504 | Trusted Agents |

### What They Want Built
**Track A: Trusted Agents with ERC-8004**
Projects demonstrating "trusted agent systems using ERC-8004, with the strongest onchain verifiability, autonomous agent architecture." Emphasis on onchain verifiability.

**Track B: No Humans Required**
"Fully end-to-end agent demonstrating the complete decision loop: discover -> plan -> execute -> verify -> submit." The most autonomous agent wins.

### What is ERC-8004? (Confidence: HIGH)
ERC-8004 is an Ethereum standard (live on mainnet since January 29, 2026) that provides three lightweight registries for agent trust:

**Registry 1 -- Identity Registry** (ERC-721 based)
- Each agent gets an NFT-based `agentId`
- `agentURI` resolves to JSON describing agent capabilities, services, supported protocols
- Functions: `register(agentURI)`, `setAgentURI()`, `setAgentWallet()`, `getMetadata()`
- Supports ENS, A2A, MCP, DID service endpoints
- Has `x402Support` boolean flag

**Registry 2 -- Reputation Registry**
- Standardized feedback signals (value + tag system)
- Functions: `giveFeedback()`, `revokeFeedback()`, `getSummary()`, `readAllFeedback()`
- Signal types: `starred` (quality 0-100), `uptime` (%), `successRate` (%), `responseTime` (ms)
- Off-chain feedback files with proof-of-payment support

**Registry 3 -- Validation Registry**
- Independent verification hooks (ZK proofs, TEE attestation, re-execution)
- Functions: `validationRequest()`, `validationResponse()`, `getValidationStatus()`
- Response is 0-100 range (0=failed, 100=passed)

**Co-authors**: Marco De Rossi (MetaMask), Davide Crapis (Ethereum Foundation), Jordan Ellis (Google), Erik Reppel (Coinbase).

### Technical Integration Required
- Deploy or interact with ERC-8004 registry contracts
- Register your agent with an identity (agentId NFT)
- Set up agent registration file (JSON) with capabilities
- Post/read feedback and validation signals onchain
- Dependencies: EIP-155, EIP-712, ERC-721, ERC-1271

### Judging Criteria
- Strength of onchain verifiability
- Degree of autonomous architecture
- Completeness of the discover -> plan -> execute -> verify -> submit loop

---

## 2. Venice

### Prize Pool: ~$11,500 (in VVV tokens)
| Place | Amount | VVV Tokens |
|-------|--------|------------|
| 1st | $5,750 | 1,000 VVV |
| 2nd | $3,450 | 600 VVV |
| 3rd | $2,300 | 400 VVV |

### What is Venice? (Confidence: HIGH)
Venice AI is a **private, censorship-resistant generative AI platform** founded by Erik Voorhees. It runs open-source LLM and image models. Key differentiator: no data collection, no censorship, no logging.

### The VVV/DIEM Token System
- **VVV**: ERC-20 token on Base (Coinbase L2). Total supply: 100M. 10M/year emissions.
- **Staking VVV**: Stake VVV -> receive sVVV -> get pro-rata daily AI inference capacity
- **DIEM**: Perpetual tokenized inference. Each 1 DIEM = $1/day of Venice API credit forever
- **Minting DIEM**: Lock sVVV -> mint DIEM at dynamic rate. Can burn DIEM to unlock sVVV later
- **Minimum**: 0.1 DIEM staked to receive credits
- **Key Insight**: An autonomous agent can stake VVV, generate DIEM, and self-fund its own inference indefinitely

### What Makes an Agent "Private"?
- Uses Venice's inference (no OpenAI/Anthropic data collection)
- Uncensored model access
- No API key leakage through centralized providers
- Agent-owned intelligence via tokenized compute ownership

### What They Want Built
Projects where VVV tokens are central to the agent's operation -- specifically agents that demonstrate self-sustaining AI compute through the stake-to-DIEM pipeline. The agent should OWN its intelligence, not rent it.

### Technical Integration Required
- Use Venice API for inference (`venice.ai/api`)
- Integrate VVV staking mechanism
- Optionally mint/manage DIEM tokens
- Demonstrate private, self-funding agent operation
- Build on Base (where VVV/DIEM are ERC-20s)

---

## 3. MetaMask

### Prize Pool: $5,000
| Place | Amount |
|-------|--------|
| 1st | $3,000 |
| 2nd | $1,500 |
| 3rd | $500 |

### What is the Delegation Toolkit? (Confidence: HIGH)
The MetaMask Delegation Toolkit (formerly "Gator") enables smart contract wallets to delegate specific capabilities to other accounts. It is built on two ERC standards:

**ERC-7710 (Redeem Delegations)**
A standard way for smart contract accounts (SCAs) to delegate capabilities to other SCAs or EOAs. Think: "I authorize this agent to spend up to $50/day from my wallet."

**ERC-7715 (Request Permissions)**
Standardizes how dapps request permissions from wallets. Unifies the format for "session keys" -- temporary, scoped authorizations.

### How It Works Technically
1. Dapp requests permissions via `wallet_grantPermissions` (ERC-7715)
2. MetaMask creates a Gator Smart Account (delegator)
3. User approves with clear UI showing exactly what's authorized
4. Delegations include **caveats**: spending limits, frequency caps, expiration dates
5. Session account (agent) can then execute within those constraints
6. Everything composable via ERC-4337 (account abstraction)

### What They Want Built
- **Intent-based delegations**: User states intent, agent figures out execution
- **Novel ERC-7715 extensions**: New permission types beyond native-token-stream
- **ZK proofs with delegation**: Privacy-preserving authorization
- **Sub-delegation chains**: Agent A delegates to Agent B, who delegates to Agent C
- **Creative caveat usage**: Novel constraint patterns

### Technical Integration Required
- Use MetaMask Flask (developer version) on Sepolia testnet
- Install via: `npx create-gator-app@latest` (select experimental template)
- Implement `wallet_grantPermissions` flow
- Set up ERC-4337 bundler (Pimlico recommended)
- Optional: Paymaster for gasless UX
- Docs: https://docs.gator.metamask.io/

### Judging Criteria
- Creativity of delegation patterns
- Technical correctness
- Use of caveats, sub-delegation chains
- Novel applications of ERC-7715

---

## 4. Lido Labs

### Prize Pool: $9,500 (across 6 prizes, 3 sub-tracks)
| Place | Amount | Sub-Track |
|-------|--------|-----------|
| 1st | $3,000 | MCP Server for Lido |
| 2nd | $2,000 | MCP Server for Lido |
| 1st | $2,000 | stETH Agent Treasury Primitive |
| 2nd | $1,000 | stETH Agent Treasury Primitive |
| 1st | $1,500 | Vault Monitor |
| (implied) | -- | (additional) |

### What They Want Built

**Sub-Track A: MCP Server for Lido** ($5,000 total)
Build a Model Context Protocol (MCP) server that lets AI agents interact with Lido's staking protocol. Requirements:
- Full stETH/wstETH integration (stake, unstake, wrap, unwrap)
- Governance actions (voting on proposals)
- `dry_run` support (simulate transactions before executing)
- Developer-ready skill file (so other agents can discover and use this server)

**Sub-Track B: stETH Agent Treasury Primitive** ($3,000 total)
Build a smart contract that enables agents to spend stETH **yield** without accessing the **principal**. This is the "agents that pay" theme -- an agent earns yield on staked ETH and uses that yield for operations, never touching the base capital.

**Sub-Track C: Vault Monitor** ($1,500)
Build a monitoring agent that delivers alerts, yield tracking, and protocol detection for Lido vaults. Essentially a watchdog agent that keeps track of staking positions.

### Technical Integration Required
- Lido stETH contract: rebasing ERC-20 representing staked ETH
- wstETH contract: wrapped version with static balance (value-accruing)
- Lido governance system
- MCP protocol for agent-tool communication
- Smart contract development (Solidity) for the treasury primitive

### What is stETH/wstETH?
- **stETH**: Liquid staking token. Stake ETH with Lido -> get stETH. Balance rebases daily (grows as rewards accrue).
- **wstETH**: Wrapped stETH. Balance stays constant; value per unit increases. Better for DeFi protocols.
- Staking yield: ~3-4% APR currently.

---

## 5. Uniswap

### Prize Pool: $5,000
| Place | Amount |
|-------|--------|
| 1st | $2,500 |
| 2nd | $1,500 |
| 3rd | $1,000 |

### What They Want Built
"Best agentic finance" using the Uniswap API. **Must use a real Developer Platform API key and ship real TxIDs on testnet or mainnet.** Not a mock -- actual onchain transactions.

### What is the Uniswap Developer Platform? (Confidence: HIGH)
Uniswap Labs launched a beta Developer Platform with 7 AI agent skills:
1. **v4-security-foundations** -- Security for V4 hook development
2. **configurator** -- Pool configuration
3. **deployer** -- V4 hook deployment
4. **viem-integration** -- EVM interactions via viem/wagmi
5. **swap-integration** -- Execute token swaps
6. **liquidity-planner** -- Manage liquidity positions
7. **swap-planner** -- Quote and plan trades

### Technical Integration Required
- Sign up at `developers.uniswap.org` for free API key
- Install: `npx skills add Uniswap/uniswap-ai`
- GitHub: https://github.com/Uniswap/uniswap-ai
- 5 plugins available: uniswap-hooks, uniswap-trading, uniswap-cca, uniswap-driver, uniswap-viem
- API supports: best-price routing (V2/V3/V4), EXACT_INPUT/EXACT_OUTPUT, slippage control, gas estimates
- Must produce real transaction hashes

### Judging Criteria
- Functional integration with Uniswap API
- Real TxIDs (testnet or mainnet)
- Open source with clear documentation/README
- Quality of agentic finance use case

---

## 6. Celo

### Prize Pool: $5,000
| Place | Amount |
|-------|--------|
| 1st | $3,000 |
| 2nd | $2,000 |

### What They Want Built
"Best agentic application built on Celo, demonstrating real-world utility." Their agent judge evaluates submissions. $10K in total bounties mentioned in announcements.

### Why Celo vs Base? (Confidence: MEDIUM)
| Feature | Celo | Base |
|---------|------|------|
| Tx Fees | <$0.001 (sub-cent) | ~$0.01-0.10 |
| Finality | 1 second | ~2 seconds |
| Gas Tokens | CELO, cUSD, cEUR (pay gas in stablecoins) | ETH only |
| Mobile Focus | Yes (MiniPay: 10M+ activations) | No specific mobile focus |
| Target Market | Global South, payments, real-world | DeFi, general purpose |
| L2 Stack | Optimism-based (transitioning from L1) | Optimism-based |

### Key Celo Differentiators for Agents
- **Pay gas in stablecoins**: Agent doesn't need ETH, just cUSD
- **Sub-cent fees**: Agents can do high-frequency micro-transactions cheaply
- **MiniPay integration**: Reach 10M+ users in Global South
- **Real-world utility focus**: Celo prioritizes payments and financial inclusion

### Technical Integration Required
- Deploy on Celo (EVM-compatible)
- Use Celo-specific features: fee currencies, stablecoins (cUSD, cEUR)
- Demonstrate real-world utility (not just DeFi arbitrage)
- Docs: https://docs.celo.org

---

## 7. OpenServ

### Prize Pool: $5,000 (across 5 prizes)
| Place | Amount | Track |
|-------|--------|-------|
| 1st | $2,500 | Best Agent Build |
| 2nd | $1,000 | Best Agent Build |
| 3rd | $1,000 | Best Agent Build |
| 1st | $250 | Best Build Story |
| 2nd | $250 | Best Build Story |

### What is OpenServ? (Confidence: HIGH)
OpenServ (SERV) is a platform to BUILD, LAUNCH, and RUN autonomous AI agents and startups. Three layers:
- **BUILD**: SDKs (TypeScript, Python, REST API) for creating agents with reasoning capabilities
- **LAUNCH**: Token launch platform for agents/startups (1B fixed token supply)
- **RUN**: Suite of AI team members for marketing, sales, growth, community

### What is x402-native? (Confidence: HIGH)
x402 is Coinbase's open payment protocol built on HTTP 402 status code. When a server returns HTTP 402, the client (agent) automatically attaches a stablecoin payment to the request. No API keys, no subscriptions -- pay per request.

"x402-native" means the agent natively uses x402 for all service payments, making it fully autonomous in acquiring resources.

### What They Want Built
- Multi-agent systems that collaborate via the OpenServ platform
- Agentic DeFi applications
- Projects using the BRAID reasoning framework
- Best "build story" (narrative of building experience)

### Technical Integration Required
- OpenServ SDK: https://github.com/openserv-labs/sdk (TypeScript)
- Python SDK also available
- Platform supports: Telegram, Twitter/X, MCP, OpenClaw integrations
- Must use OpenServ as a "load-bearing" part of the project (not just a wrapper)

---

## 8. Olas/Autonolas

### Prize Pool: $3,000 (across 6 prizes, 3 sub-tracks)
| Place | Amount | Sub-Track |
|-------|--------|-----------|
| 1st | $1,000 | Best Agent on Pearl |
| 1st | $500 | Monetize Agent on Marketplace |
| 1st | $500 | Hire Agent on Marketplace |
| 2nd | $300 | Monetize Agent |
| 2nd | $300 | Hire Agent |
| 3rd | $200 each | Monetize + Hire |

### What is Olas? (Confidence: HIGH)
Olas is a decentralized protocol for autonomous AI agents with an on-chain registry. Agents are registered as NFTs, enabling composability and marketplace discovery. The Olas marketplace has surpassed 10M+ agent-to-agent transactions.

### What is Pearl?
Pearl is the "AI Agent App Store" -- a desktop app where users can discover, install, and run agents. Integration into Pearl is currently limited to Accelerator participants, but building FOR Pearl is encouraged.

### How to Register an Agent
1. Install Olas SDK (`pip install olas-sdk` or npm equivalent)
2. Build agent with any framework
3. Create Docker image
4. Register agent blueprint via Olas Protocol web app ("Mint an Agent Blueprint")
5. Push Docker image to Docker Hub
6. Agent appears on Mech Marketplace: https://marketplace.olas.network

### Three Sub-Tracks
- **Best Agent on Pearl**: Build the highest-quality agent, integrate with Pearl
- **Monetize**: List your agent on the marketplace and demonstrate revenue potential
- **Hire**: Use the marketplace to hire other agents' services programmatically

### Technical Integration Required
- Olas SDK: https://stack.olas.network/olas-sdk/
- Docker containerization
- On-chain registration (NFT minting)
- Marketplace API integration

---

## 9. Bankr

### Prize Pool: $5,000
| Place | Amount |
|-------|--------|
| 1st | $3,000 |
| 2nd | $1,500 |
| 3rd | $500 |

### What is the Bankr LLM Gateway? (Confidence: HIGH)
A unified API for AI model inference (Claude, GPT, Gemini, etc.) where agents pay using cryptocurrency held in Bankr wallets. Think of it as an LLM API proxy where the billing is crypto-native.

### How It Works
- **Single endpoint**: `https://llm.bankr.bot/v1/chat/completions` (OpenAI-compatible)
- **API key**: Format `bk_...` with capability flags
- **Credit system**: USD balance for LLM calls, separate from trading wallet
- **Funding**: Top up with USDC, ETH, BNKR tokens on Base
- **Auto top-up**: Refill when balance drops below threshold
- **No markup**: Same per-token rates as official providers
- **Rate limits**: 100 msg/day (standard), 1000/day (Bankr Club)

### What They Want Built
"Best system on Bankr LLM Gateway with real onchain execution and multi-model usage." The agent should:
- Use multiple LLM models via the gateway
- Execute real onchain transactions
- Demonstrate the self-funding loop: agent earns crypto -> pays for inference

### Technical Integration Required
- CLI: `npm install -g @bankr/cli` then `bankr llm setup`
- REST API: `curl https://llm.bankr.bot/v1/chat/completions -H "X-API-Key: $BANKR_LLM_KEY"`
- Bankr wallet for agent funds
- Supported models: Claude Opus 4.6, Sonnet 4.6, GPT-5.4, Gemini 3 Pro/Flash
- Docs: https://docs.bankr.bot/llm-gateway/

---

## 10. Self Protocol

### Prize Pool: $1,000 (winner-takes-all)
| Place | Amount |
|-------|--------|
| Best Integration | $1,000 |

### What is Self Protocol? (Confidence: HIGH)
Self is a ZK-powered identity protocol. Users scan their passport with the Self app -> generate zero-knowledge proofs -> prove things about themselves (human, 18+, not sanctioned) without revealing personal data.

### How Agent ID Works
1. Agent owner scans passport in Self app (creates ZK proof)
2. Agent gets a **soulbound NFT** (non-transferable) as on-chain identity
3. Agent receives A2A-compatible identity card
4. Can prove: humanity, age, OFAC compliance, nationality, Sybil resistance
5. **1 agent = 1 human** enforcement prevents Sybil attacks

### What They Want Built
"Load-bearing ZK identity" -- Self's identity verification must be a core, essential part of the project, not just a checkbox integration. The ZK proof should enable functionality that would be impossible without it.

### Technical Integration Required
- Self SDK: TypeScript, Python, or Rust
- MCP server and Claude Code plugin available
- Verification middleware: `requireAge(18).requireOFAC().build()`
- Registry check: Recover signer from ECDSA, verify on-chain
- Built as ERC-8004 extension (composable with Protocol Labs track)
- Register at: https://app.ai.self.xyz/
- GitHub: https://github.com/selfxyz/self

### Strategic Note
Combining Self + ERC-8004 + Protocol Labs tracks could be very powerful: verified human identity -> agent registration -> reputation tracking.

---

## 11. ENS

### Prize Pool: $1,500 (across 5 prizes)
| Place | Amount | Sub-Track |
|-------|--------|-----------|
| 1st | $400 | ENS Identity |
| 1st | $400 | ENS Communication |
| 2nd | $200 | ENS Identity |
| 2nd | $200 | ENS Communication |
| Best | $300 | ENS Open Integration |

### What They Want Built

**Sub-Track A: ENS Identity** ($600)
"Best uses ENS names to establish identity onchain -- replacing hex addresses." Use ENS as the human-readable layer for agent identity.

**Sub-Track B: ENS Communication** ($600)
"Best uses ENS names to power communication, payments, or UX flows." ENS as the addressing layer for agent-to-agent messaging/payments.

**Sub-Track C: Open Integration** ($300)
"Most meaningful ENS integration" in any relevant use case.

### How ENS + Agents Work
- ENS names resolve to agent identities (e.g., `trade.agent.eth`)
- Subname delegation: `shop.myprotocol.eth`, `verify.myprotocol.eth`
- ENS resolves to wallet addresses, API endpoints, metadata
- Composable with ERC-8004 Identity Registry
- Enables cross-chain resolution consistency

### Technical Integration Required
- ENS resolution APIs
- Subname delegation contracts
- Machine-readable agent metadata published via ENS records
- Integration with x402 payment intent resolution

---

## 12. Status Network

### Prize Pool: ~$2,000 (40 qualifying prizes at $50 each)
| Prize Type | Amount | Count |
|------------|--------|-------|
| Qualifying Submission | $50 | ~40 |

### What They Want Built
**Track: "Go Gasless: Deploy & Transact on Status Network with Your AI Agent"**

This is a qualifying-based prize (not competitive ranking). Meet ALL criteria = get $50.

### Requirements (All Must Be Met)
1. Verified smart contract deployment on Status Network Sepolia Testnet
2. At least one gasless transaction (gasPrice=0, gas=0) with transaction hash proof
3. AI agent component integration
4. README documentation or short video demonstration

### How Gasless Works (Confidence: HIGH)
Status Network is a gasless Ethereum L2 built on Linea's zkEVM stack. Instead of gas fees:
- L2 operating costs are covered by native yield and DEX fees
- Users transact for free
- Spam prevention via Karma reputation system (Rate Limiting Nullifier / RLN)
- Users earn Karma by staking SNT, bridging assets, using apps

### Technical Setup
- RPC: `https://public.sepolia.rpc.status.network`
- Chain ID: `1660990954`
- EVM Version: Paris
- Faucet available for testnet ETH
- Deploy via Hardhat: `npx hardhat ignition deploy --network statusTestnet`

### Strategic Note
This is free money -- $50 for deploying a contract and making one gasless transaction. Any project that also deploys on Status Network gets an extra $50. Minimal effort.

---

## 13. Arkhai

### Prize Pool: $900 (2 prizes)
| Place | Amount | Sub-Track |
|-------|--------|-----------|
| Best | $450 | Applications |
| Best | $450 | Escrow Ecosystem Extensions |

### What is Arkhai? (Confidence: MEDIUM)
Arkhai builds "machine-actionable markets for the AI economy" -- infrastructure for agents to discover, price, allocate, and settle work. Core products:
- **Alkahest**: Programmable marketplace primitives (escrow, arbitration, modular markets)
- **Cybernetic Agents**: Markets for compute and energy trading
- **Git Commit Marketplace**: Pay developers for shipped code passing tests
- **Agentic RAG**: Decentralized databases with provenance tracking

### What They Want Built

**Sub-Track A: Applications** ($450)
"Must use Arkhai protocols as a load-bearing dependency." Build on Alkahest, natural-language-agreements, git-commit-trading, or de-redis-clients.

**Sub-Track B: Escrow Ecosystem Extensions** ($450)
"Must go beyond wrapping existing contracts." Create new arbiter logic, verification primitives, or obligation patterns extending the Alkahest escrow protocol.

### Technical Integration Required
- Alkahest SDK (TypeScript, Rust, or Python)
- Escrow smart contracts with Boolean logic
- Recursive arbitration mechanisms
- Modular marketplace building blocks

---

## 14. bond.credit

### Prize Pool: $1,500
| Place | Amount |
|-------|--------|
| 1st | $1,000 + onchain credit score |
| 2nd | $500 + onchain credit score |

### What is bond.credit? (Confidence: HIGH)
bond.credit is building "the credit layer for the agentic economy." It deploys real capital to onchain agents, records all trades onchain, and feeds data into a credit engine. Think: a credit bureau for AI agents.

### What They Want Built
"Most creditworthy autonomous trader." Your agent should:
- Trade autonomously on DeFi protocols
- Generate positive returns (ROI, risk-adjusted)
- Have all trades recorded onchain
- Earn a Bond Score (onchain credit score)
- Winners receive USDC prize + their agent gets a credit score, which could unlock higher credit limits in future seasons

### Judging Criteria
- Trading performance (ROI)
- Risk management
- Consistency
- Validation status

### Strategic Note
This is essentially a DeFi trading competition for AI agents. The credit score is the real value -- it positions your agent for future capital allocation.

---

## 15. Markee

### Prize Pool: ~$800 (2 prizes, performance-based)
| Prize Type | Formula |
|------------|---------|
| Top Views | (your views / total views) x $1,000 |
| Top Monetization | (your funds / total funds) x $1,000 |

### What is Markee? (Confidence: LOW)
Based on available research, Markee (markee.io) appears to be a software consultancy firm. Their GitHub organization has no public repositories. The hackathon track is "Markee GitHub Integration" -- the prize is proportional to integrated message viewership and monetization.

### What They Want Built
Some form of GitHub-integrated message/content system where:
- Views are tracked (Top Views prize)
- Monetization occurs (Top Monetization prize)
- Prizes are proportional to your share of total engagement

### Gaps
I could not find detailed documentation on what Markee's product actually is or how the GitHub integration works. This sponsor has the least public information of any on the list.

---

## 16. Slice

### Prize Pool: ~$1,950 (across 5 prizes)
| Place | Amount | Sub-Track |
|-------|--------|-----------|
| 1st | $550 | (2 Slice Pass NFTs + $250 credits) |
| 1st | $500 | Slice Credits |
| 1st | $500 | ERC-8128 / Ethereum Web Auth |
| 2nd | $250 | Future of Commerce |
| 2nd | $250 | ERC-8128 |
| (1 NFT) | $150 | Slice Hooks |

### What is Slice? (Confidence: MEDIUM)
Slice (slice.so) is an onchain commerce protocol. It handles payments and product purchases entirely onchain, with Slice Shops being mini-apps for discovering and buying items. They pioneered the Onchain Summer Shop. Built on Ethereum, supports Coinbase Smart Wallet.

### What They Want Built
- **Future of Commerce**: Agent-driven onchain commerce experiences
- **Ethereum Web Auth (ERC-8128)**: Agent authentication using Ethereum signatures
- **Slice Hooks**: Custom logic triggered by commerce events

### Technical Note
All prizes require providing an Ethereum address to claim. Prizes are in Slice infrastructure credits and Slice Pass NFTs (0.075 ETH each), not cash.

---

## Minor Sponsors

### Locus ($3,000 total)
| Place | Amount |
|-------|--------|
| 1st | $2,000 |
| 2nd | $500 |
| 3rd | $500 |

**What**: AI Agent Payment Infrastructure (Y Combinator backed). Provides secure USDC payments with escrow, spending limits, policy enforcement via MCP gateway.
**Want**: Best Locus integration with agent-native payments core to product design.
**Tech**: MCP gateway, USDC on Base, spending policies, micro-task payment system.
**Site**: https://paywithlocus.com

### Ampersend ($500 -- winner-takes-all)
**What**: Agent-to-agent payment management by Edge & Node (The Graph). Built on x402 + Google A2A.
**Want**: "Best AI agent using ampersend-sdk as core, load-bearing dependency."
**Tech**: Python SDK, x402 payment protocol, A2A compatibility.
**GitHub**: https://github.com/edgeandnode/ampersend-sdk

### Merit Systems ($1,750 total)
| Place | Amount |
|-------|--------|
| 1st | $1,000 |
| 2nd | $500 |
| 3rd | $250 |

**What**: AgentCash -- "One balance, every paid API" via x402 protocol.
**Want**: Best project using AgentCash for x402 API consumption with pay-per-request.
**Tech**: Install via Claude Desktop, Cursor, or OpenClaw. 288+ API endpoints available.
**Site**: https://agentcash.dev

### Octant ($3,000 total -- 3 prizes of $1,000)
Three separate sub-tracks for public goods evaluation:
1. Agents in Public Goods Data Collection
2. Mechanism Design in Public Goods Evaluation
3. Agents in Public Goods Data Analysis

### SuperRare ($2,500 total)
| Place | Amount |
|-------|--------|
| 1st | $1,200 |
| 2nd | $800 |
| 3rd | $500 |

**Want**: "Best autonomous agent artwork built on Rare Protocol." Agent that creates and mints art autonomously using SuperRare's smart contracts.

---

## Strategic Analysis

### Highest Value per Effort (Prize Amount / Integration Complexity)

| Sponsor | Max Prize | Effort Level | Value/Effort |
|---------|-----------|-------------|--------------|
| Status Network | $50 (guaranteed) | Very Low | HIGHEST (free money) |
| Synthesis Open Track | $14,559 | Medium | HIGH |
| Protocol Labs | $4,000 | High | MEDIUM-HIGH |
| Venice | $5,750 | Medium | HIGH |
| Bankr | $3,000 | Low-Medium | HIGH |
| MetaMask | $3,000 | Medium | MEDIUM |
| Lido | $3,000 | High | MEDIUM |
| Uniswap | $2,500 | Medium | MEDIUM |

### Prize Stacking Opportunities
A single project could target multiple prizes if designed well:

**Combo 1: "Trusted Agent Trading System"**
- Protocol Labs (ERC-8004 identity + reputation) -- $4,000
- Self Protocol (ZK human verification) -- $1,000
- ENS (agent naming) -- $400
- bond.credit (autonomous trading + credit) -- $1,000
- Uniswap (trading via API) -- $2,500
- Status Network (deploy contract there too) -- $50
- **Total potential: $8,950**

**Combo 2: "Self-Funding Private AI Agent"**
- Venice (private inference via VVV/DIEM) -- $5,750
- Bankr (LLM Gateway for multi-model) -- $3,000
- Protocol Labs (ERC-8004 registration) -- $4,000
- Synthesis Open Track (aligns with all themes) -- $14,559
- Status Network -- $50
- **Total potential: $27,359**

**Combo 3: "Agent Payment Infrastructure"**
- MetaMask (delegation for spending limits) -- $3,000
- Lido (stETH yield as agent treasury) -- $2,000
- Locus (payment policies) -- $2,000
- Merit/AgentCash (x402 pay-per-API) -- $1,000
- OpenServ (multi-agent coordination) -- $2,500
- **Total potential: $10,500**

### What Changes in 12 Months?
- ERC-8004 is very new (Jan 2026). V2 is already in development. The standard could evolve significantly -- but being an early builder is advantageous.
- x402 adoption is accelerating rapidly. By 2027, x402 may be the default agent payment protocol, making early projects in this space more valuable.
- The agent-to-agent economy is currently speculative. If autonomous agents don't achieve meaningful economic activity at scale, many of these infrastructure plays become less relevant.
- VVV/DIEM token prices are volatile. Venice prizes are paid in tokens, not USD.

### Who Else Could Solve This?
- **OpenAI/Anthropic**: If they release native agent payment/identity infrastructure, it could commoditize all of these Web3 approaches
- **Coinbase**: Already behind x402 and Base. Could vertically integrate and make standalone projects redundant
- **Google A2A**: If A2A becomes the dominant agent protocol, ERC-8004 may be less relevant (though ERC-8004 explicitly extends A2A)

---

## Gaps & Uncertainties

### Could Not Verify
1. **Markee**: Very little public information. Could not determine what their product actually is or how the GitHub integration works. (Confidence: LOW)
2. **Lido MCP specifics**: No existing Lido MCP server reference implementation found. The prize is to BUILD one from scratch.
3. **Exact AI judge criteria**: Each sponsor has their own agent judge, but no published rubrics are available. The mid-hackathon feedback (March 18) will be the first signal.
4. **Frutero and Valory AG**: Listed as sponsors but no specific prize tracks found in the catalog.
5. **Lit Protocol**: Listed as sponsor but no specific prize track in the catalog data fetched.
6. **Talent Protocol**: Listed as sponsor, no specific prize track found.

### Information Quality Assessment
| Sponsor | Source Quality | Confidence |
|---------|--------------|------------|
| Protocol Labs / ERC-8004 | PRIMARY (EIP spec) | HIGH |
| Venice / VVV / DIEM | PRIMARY (official blog) | HIGH |
| MetaMask | PRIMARY (official docs + hacker guide) | HIGH |
| Uniswap | PRIMARY (official GitHub + docs) | HIGH |
| Self Protocol | PRIMARY (official docs + app) | HIGH |
| Celo | SECONDARY (news articles) | MEDIUM |
| OpenServ | MIXED (official site + docs) | MEDIUM |
| Olas | PRIMARY (official docs) | HIGH |
| Bankr | PRIMARY (official docs) | HIGH |
| ENS | PRIMARY (official blog post) | HIGH |
| Status Network | PRIMARY (official docs) | HIGH |
| Arkhai | SECONDARY (website + search) | MEDIUM |
| bond.credit | PRIMARY (official website) | MEDIUM |
| Markee | INSUFFICIENT | LOW |
| Slice | SECONDARY (limited public info) | MEDIUM |
| Locus | PRIMARY (official site + YC) | MEDIUM |
| Ampersend | PRIMARY (GitHub + press) | HIGH |
| Merit/AgentCash | PRIMARY (official site) | HIGH |

### What Would Change This Analysis?
- If hackathon organizers publish explicit rubrics or judge configurations, the "what to build" recommendations would shift
- If VVV token price crashes, Venice prizes become less attractive
- If ERC-8004 tooling improves dramatically before March 22, Protocol Labs tracks become easier to win
- If Status Network mainnet launches, the gasless prize becomes more strategically important

---

## Sources

### Primary Sources (Official Documentation)
- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004) -- Ethereum EIP
- [Venice DIEM Blog Post](https://venice.ai/blog/introducing-diem-as-tokenized-intelligence-the-next-evolution-of-vvv) -- Official Venice blog
- [MetaMask Delegation Toolkit Hacker Guide](https://metamask.io/news/hacker-guide-metamask-delegation-toolkit-erc-7715-actions) -- Official MetaMask
- [MetaMask Smart Accounts Kit](https://docs.metamask.io/delegation-toolkit/experimental/erc-7710-redeem-delegations/) -- Official docs
- [Uniswap AI GitHub](https://github.com/Uniswap/uniswap-ai) -- Official Uniswap Labs
- [Uniswap API Overview](https://docs.uniswap.org/api/trading/overview) -- Official docs
- [Lido Token Integration Guide](https://docs.lido.fi/guides/lido-tokens-integration-guide/) -- Official Lido docs
- [Self Protocol Docs](https://docs.self.xyz) -- Official Self docs
- [Self Agent ID App](https://app.ai.self.xyz/) -- Official Self
- [ENS AI Agent Blog](https://ens.domains/blog/post/ens-ai-agent-erc8004) -- Official ENS blog
- [Status Network Docs](https://docs.status.network/) -- Official Status
- [Status Network Hardhat Tutorial](https://docs.status.network/tutorials/deploying-contracts/using-hardhat) -- Official Status
- [Olas Build](https://olas.network/build) -- Official Olas
- [Olas SDK](https://stack.olas.network/olas-sdk/) -- Official Olas
- [OpenServ SDK GitHub](https://github.com/openserv-labs/sdk) -- Official OpenServ
- [Bankr LLM Gateway Docs](https://docs.bankr.bot/llm-gateway/openclaw/) -- Official Bankr
- [AgentCash](https://agentcash.dev) -- Official Merit Systems
- [Ampersend SDK GitHub](https://github.com/edgeandnode/ampersend-sdk) -- Official Edge & Node
- [Locus](https://paywithlocus.com/) -- Official (YC-backed)
- [bond.credit](https://www.bond.credit/) -- Official
- [Arkhai](https://www.arkhai.io/) -- Official
- [Synthesis Hackathon](https://synthesis.md/) -- Official

### Secondary Sources (News, Analysis)
- [Celo Joins Synthesis Hackathon](https://blockchain.news/flashnews/celo-joins-synthesis-hackathon-to-promote-agentic-app-development) -- March 10, 2026
- [Uniswap AI Agent Skills Launch](https://coinfomania.com/uniswap-launches-seven-ai-agent-skills-for-onchain-trading/) -- 2026
- [Self Protocol Agentic Landscape](https://self.xyz/blog/agentic-landscape) -- 2026
- [Olas Marketplace 10M+ Transactions](https://x.com/autonolas/status/2019752385959415861) -- 2026
- [ERC-8004 Explainer (Allium)](https://www.allium.so/blog/onchain-ai-identity-what-erc-8004-unlocks-for-agent-infrastructure/) -- 2026
- [Ampersend by Edge & Node (CoinDesk)](https://www.coindesk.com/tech/2025/10/30/the-graph-builders-edge-and-node-unveil-ampersend-dashboard-to-manage-ai-agent-payments/) -- Oct 2025
- [Venice AI Valuation (The Defiant)](https://thedefiant.io/news/defi/venice-ai-surges-above-usd600-million-valuation) -- 2025
- [Status Network Economic Model](https://status.network/blog/status-network-economic-model-yield-funding-pool-and-zero-gas) -- 2025
- [x402 Protocol Whitepaper](https://www.x402.org/x402-whitepaper.pdf) -- 2025
