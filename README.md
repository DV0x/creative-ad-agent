# Creative Ad Agent

An AI-powered creative advertising agent that generates conversion-focused ads using a **hook-first methodology**. Built with the Claude Agent SDK, it analyzes brand websites, extracts factual data, and creates 6 diverse ad concepts with AI-generated images.

## Features

- **Hook-First Ad Generation** - Hooks are mined from research data using proven formulas (hooks = 80% of ad performance)
- **Research-Driven** - Extracts real data from brand websites: offers, value props, proof points, testimonials
- **6 Diverse Concepts** - Each concept uses a different emotional trigger (social proof, urgency, curiosity, etc.)
- **AI Image Generation** - Creates visuals via fal.ai Nano Banana Pro
- **Session Management** - Stateful conversations with forking for A/B testing
- **Dual Deployment** - Local development server + Cloudflare Workers production

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Main Agent)                 │
│                                                              │
│   ┌─────────────┐   ┌──────────────────┐   ┌─────────────┐  │
│   │  research   │ → │ hook-methodology │ → │  art-style  │  │
│   │   (Agent)   │   │     (Skill)      │   │   (Skill)   │  │
│   └─────────────┘   └──────────────────┘   └─────────────┘  │
│          ↓                   ↓                    ↓          │
│   research.md          hook-bank.md         prompts.json    │
│                                                   ↓          │
│                                          ┌─────────────┐    │
│                                          │ nano-banana │    │
│                                          │  (MCP/fal)  │    │
│                                          └─────────────┘    │
│                                                   ↓          │
│                                            6 PNG images      │
└─────────────────────────────────────────────────────────────┘
```

### Workflow

1. **Parse** - Extract URL and brand name from request
2. **Research** - Agent fetches homepage, extracts offers/value props/proof points
3. **Hooks** - Skill generates 10+ hooks, selects 6 with diversity matrix
4. **Art** - Skill creates visual prompts for each hook
5. **Images** - MCP generates images via fal.ai
6. **Complete** - Returns 6 ad concepts with images

## Quick Start

### Prerequisites

- Node.js v20+
- [Anthropic API Key](https://console.anthropic.com/)
- [fal.ai API Key](https://fal.ai/dashboard/keys)

### Installation

```bash
# Clone the repository
git clone https://github.com/DV0x/creative-ad-agent.git
cd creative-ad-agent

# Install server dependencies
cd server && npm install

# Create environment file
cp .env.example .env
# Edit .env with your API keys
```

### Running Locally

```bash
# Start the server
cd server
npm run dev

# Server runs at http://localhost:3001
```

### Generate Ads

```bash
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create ads for https://example.com"}'
```

## Project Structure

```
creative-ad-agent/
├── agent/                      # Agent ecosystem
│   └── .claude/
│       ├── agents/
│       │   └── research.md     # Data extraction agent
│       └── skills/
│           ├── hook-methodology/
│           │   ├── SKILL.md    # Hook generation skill
│           │   └── formulas.md # Hook formula reference
│           └── art-style/
│               ├── SKILL.md    # Visual prompt skill
│               └── workflows/  # Style-specific workflows
│
├── server/                     # Local Express server
│   ├── sdk-server.ts          # Main server
│   └── lib/
│       ├── ai-client.ts       # Claude SDK wrapper
│       ├── nano-banana-mcp.ts # fal.ai MCP integration
│       ├── session-manager.ts # Session handling
│       └── orchestrator-prompt.ts
│
├── client/                     # React frontend
│   └── src/
│       ├── App.tsx
│       ├── hooks/useGenerate.ts
│       └── components/
│
├── creative-agent-cf/          # Cloudflare Workers deployment
│   ├── src/                   # Worker code
│   └── sandbox/               # Container code
│
└── docs/                       # Documentation
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate` | POST | Generate ad campaign |
| `/health` | GET | Health check |
| `/sessions` | GET | List active sessions |
| `/sessions/:id` | GET | Get session info |
| `/sessions/:id/continue` | POST | Resume session |
| `/sessions/:id/fork` | POST | Fork for A/B testing |
| `/images/:session/:file` | GET | Serve generated image |

## Hook Methodology

The system uses a research-first approach where every hook is traceable to specific data:

| Hook Type | Emotional Trigger | Example |
|-----------|------------------|---------|
| Stat/Data | Social Proof | "847 homeowners saved $12,340 last year" |
| Story/Result | Empathy + Relief | "Sarah was paying $2,100/mo. Now she pays $1,650" |
| FOMO/Urgency | Loss Aversion | "Rates just dropped 0.5%. Lock yours before Friday" |
| Curiosity | Intrigue | "The 3-minute check that saved Mark $347/month" |
| Call-out | Recognition | "Toronto renters paying $2,500+: You could own for less" |
| Contrast/Enemy | Differentiation | "Banks want you confused. We want you approved" |

## Art Styles

The default style is **Soft Brutalism Clay** - neo-brutalist borders with warm clay textures. Additional workflows available:

- `soft-brutalism-clay.md` - Default
- `anderson-clay-diorama.md` - Wes Anderson-inspired theatrical scenes

## Cloudflare Deployment

```bash
cd creative-agent-cf

# Set secrets
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put FAL_KEY

# Deploy
npm run deploy
```

See [docs/cloudflare-deployment-plan.md](docs/cloudflare-deployment-plan.md) for detailed instructions.

## React Client

```bash
cd client
npm install
npm run dev

# Opens at http://localhost:5173
```

Features:
- Real-time SSE streaming
- Phase progress indicators
- Terminal-style log output
- Image gallery with lightbox

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `FAL_KEY` | Yes | fal.ai image generation key |
| `PORT` | No | Server port (default: 3001) |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | No | Token limit (default: 16384) |

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Complete system architecture
- [docs/cloudflare-deployment-plan.md](docs/cloudflare-deployment-plan.md) - Cloudflare deployment
- [docs/frontend-design-system.md](docs/frontend-design-system.md) - UI design specs
- [docs/LESSONS_LEARNED.md](docs/LESSONS_LEARNED.md) - Development insights

## Tech Stack

- **Runtime**: Node.js, TypeScript
- **AI**: Claude Agent SDK, Claude Opus 4.5
- **Images**: fal.ai Nano Banana Pro
- **Server**: Express.js
- **Client**: React, Zustand, Vite, Tailwind CSS
- **Production**: Cloudflare Workers + Sandbox

## Contributing

Contributions are welcome! Please read the existing code patterns and ensure your changes follow the hook-first methodology philosophy.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk)
- Image generation by [fal.ai](https://fal.ai/)
- Hook methodology inspired by conversion copywriting principles
