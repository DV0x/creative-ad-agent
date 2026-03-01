FROM node:22-slim

# Add sandbox runtime from Cloudflare's image (must match @cloudflare/sandbox version)
COPY --from=docker.io/cloudflare/sandbox:0.7.8 /container-server/sandbox /sandbox

# Install s3fs-fuse + fuse for R2 bucket FUSE mount (required by sandbox.mountBucket())
RUN apt-get update && apt-get install -y s3fs fuse && rm -rf /var/lib/apt/lists/*

# Install Claude CLI globally
RUN npm install -g @anthropic-ai/claude-code@latest

# Install sandbox dependencies
WORKDIR /app
COPY package.json ./
RUN npm install --production

# Copy agent ecosystem (skills, agents, workflows)
COPY agent/ /app/agent/
COPY agent/.claude/ /app/agent/.claude/

# Copy sandbox entry point and supporting modules
COPY agent-runner.ts orchestrator-prompt.ts nano-banana-mcp.ts ./

RUN chmod -R a+rX /app

# Required for wrangler dev port access
EXPOSE 8080

# Sandbox entrypoint (required for Cloudflare Containers)
ENTRYPOINT ["/sandbox"]
