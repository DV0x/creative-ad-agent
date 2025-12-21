FROM docker.io/cloudflare/sandbox:0.6.3

# Install Node.js 22 (required by @fal-ai/client >= 1.8.0)
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set HOME for Claude Code config storage
ENV HOME=/root

# Non-interactive mode environment variables (CRITICAL for containerized execution)
ENV CI=true
ENV CLAUDE_CODE_SKIP_EULA=true
ENV CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=true
ENV TERM=dumb
ENV NO_COLOR=1

# Install Claude Code CLI globally (required by Agent SDK)
RUN npm install -g @anthropic-ai/claude-code

# Pre-configure Claude Code for non-interactive use
RUN mkdir -p /root/.claude && \
    echo '{"ackTosVersion": 2, "hasCompletedOnboarding": true, "theme": "dark"}' > /root/.claude/settings.json && \
    chmod 600 /root/.claude/settings.json

# Create directories
RUN mkdir -p /storage /workspace

# Set workspace
WORKDIR /workspace

# Copy package.json AND package-lock.json for deterministic builds
COPY sandbox/package.json sandbox/package-lock.json /workspace/
RUN npm ci

# Copy agent files (agents, skills, prompts)
COPY agent/ /workspace/agent/

# Copy the agent runner and MCP tools
COPY sandbox/agent-runner.ts /workspace/
COPY sandbox/nano-banana-mcp.ts /workspace/
COPY sandbox/orchestrator-prompt.ts /workspace/

# Container runs as root (default) - this is fine because:
# 1. We use permissionMode: 'default' + canUseTool (not bypassPermissions)
# 2. R2 bucket mounting requires root for FUSE
# 3. The Cloudflare Sandbox provides isolation at the container level
# Rebuild 1765611370
