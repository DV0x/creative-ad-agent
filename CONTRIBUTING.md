# Contributing to Creative Ad Agent

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

1. **Fork the repository** - Click the "Fork" button on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/creative-ad-agent.git
   cd creative-ad-agent
   ```
3. **Set up the project**:
   ```bash
   cd server && npm install
   cp .env.example .env
   # Add your API keys to .env
   ```

## Development Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the existing code patterns

3. Test locally:
   ```bash
   cd server && npm run dev
   ```

4. Commit with clear messages:
   ```bash
   git commit -m "feat: Add new hook formula for testimonials"
   ```

5. Push and create a Pull Request

## Code Guidelines

### Hook Methodology
- Every hook must be traceable to research data
- Follow the diversity matrix (6 different emotional triggers)
- Use specific numbers and quotes, not vague claims

### Agent/Skill Development
- Agents use tools (WebFetch, Read, Write)
- Skills provide guidance/methodology, not tool access
- File-based communication between components

### Naming Conventions
- Files: `kebab-case.ts`
- Functions: `camelCase`
- Types/Interfaces: `PascalCase`

## Project Structure

```
agent/                  # Agent definitions (source of truth)
├── .claude/agents/     # Agent markdown files
└── .claude/skills/     # Skill markdown files

server/                 # Local Express server
└── lib/               # Core modules

client/                # React frontend

creative-agent-cf/     # Cloudflare deployment
```

## Adding a New Art Style

1. Create `agent/.claude/skills/art-style/workflows/your-style.md`
2. Add routing keywords in `agent/.claude/skills/art-style/SKILL.md`
3. Sync to Cloudflare: `cp -r agent/.claude/* creative-agent-cf/agent/.claude/`

## Adding a New Hook Formula

1. Edit `agent/.claude/skills/hook-methodology/formulas.md`
2. Add the formula with examples
3. Update the diversity matrix if needed

## Questions?

Open an issue with the `question` label and we'll help you out!
