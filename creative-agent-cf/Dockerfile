FROM docker.io/cloudflare/sandbox:0.6.3

# Install Node.js 20
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create workspace
WORKDIR /workspace

# Copy package.json and install Agent SDK + dependencies
COPY sandbox/package.json /workspace/
RUN npm install

# Copy agent files (agents, skills, prompts)
COPY agent/ /workspace/agent/

# Copy the agent runner and MCP tools
COPY sandbox/agent-runner.ts /workspace/
COPY sandbox/nano-banana-mcp.ts /workspace/
COPY sandbox/orchestrator-prompt.ts /workspace/
