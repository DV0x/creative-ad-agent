FROM node:22-slim

# Add sandbox runtime from Cloudflare's image (must match @cloudflare/sandbox version)
COPY --from=docker.io/cloudflare/sandbox:0.12.3 /container-server/sandbox /sandbox

# Install s3fs-fuse + fuse for R2 bucket FUSE mount (required by sandbox.mountBucket())
# + procps: node:22-slim ships NO pkill/ps/pgrep, so every `pkill` the DO execs
# (killAgent, cleanFuse) was a silent no-op — orphaning the previous campaign's
# agent + claude processes on container reuse (S139 leak suspect #1).
RUN apt-get update && apt-get install -y s3fs fuse procps && rm -rf /var/lib/apt/lists/*

# Install Claude CLI globally
RUN npm install -g @anthropic-ai/claude-code@2.1.64

# Install sandbox dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy agent ecosystem (skills, agents, workflows)
COPY agent/ /app/agent/
COPY agent/.claude/ /app/agent/.claude/

# Copy sandbox entry point and supporting modules
COPY agent-runner.ts orchestrator-prompt.ts nano-banana-mcp.ts refs-mcp.ts block-builder.ts ./
COPY tsconfig.json ./

# Install TypeScript compiler + pre-compile to JavaScript
# (saves ~30s per run vs runtime tsx compilation)
RUN npm install -g typescript && \
    npm install --save-dev @types/node && \
    tsc -p tsconfig.json

RUN chmod -R a+rX /app

# Required for wrangler dev port access
EXPOSE 8080

# Entrypoint wrapper: starts the memory watchdog (S139) then execs /sandbox,
# so /sandbox keeps its PID and Cloudflare Containers semantics are unchanged.
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
