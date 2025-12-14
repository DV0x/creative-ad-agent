# Cloudflare Sandbox Troubleshooting

## Status: ✅ RESOLVED (2025-12-10)

The Claude Agent SDK is now successfully running in Cloudflare Sandbox with R2 bucket storage.

---

## Final Working Configuration

### Dockerfile
```dockerfile
FROM docker.io/cloudflare/sandbox:0.6.3

# Install Node.js 20
RUN apt-get update && apt-get install -y curl git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Run as root (required for R2 FUSE mount)
ENV HOME=/root

# Non-interactive mode (CRITICAL)
ENV CI=true
ENV CLAUDE_CODE_SKIP_EULA=true
ENV CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=true
ENV TERM=dumb
ENV NO_COLOR=1

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Pre-configure Claude Code (skip ToS/onboarding prompts)
RUN mkdir -p /root/.claude && \
    echo '{"ackTosVersion": 2, "hasCompletedOnboarding": true, "theme": "dark"}' > /root/.claude/settings.json

# Create mount point for R2
RUN mkdir -p /storage /workspace

WORKDIR /workspace
# ... copy files
```

### SDK Configuration (agent-runner.ts)
```typescript
for await (const message of query({
  prompt: promptGenerator,
  options: {
    cwd: '/workspace/agent',
    systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
    settingSources: ['project'],
    mcpServers: { 'nano-banana': nanoBananaMcp },
    model: 'claude-sonnet-4-20250514',
    maxTurns: 30,

    // CRITICAL: Use 'default' mode with canUseTool callback
    // DO NOT use 'bypassPermissions' - it fails in containers
    permissionMode: 'default',
    canUseTool: async () => true,

    allowedTools: [/* your tools */]
  }
}))
```

### Worker (generate.ts)
```typescript
// Create mount point before mounting
await sandbox.exec(`mkdir -p /storage`);

// Mount R2 bucket
await sandbox.mountBucket("creative-agent-storage", "/storage", {
  endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  provider: "r2",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});
```

---

## Resolved Issues

### Issue #1: Claude Code Exit Code 1

**Symptom:**
```
[agent-runner] Error: Claude Code process exited with code 1
    at ProcessTransport.getProcessExitError (sdk.mjs:6711:14)
```

**Root Cause:** `permissionMode: 'bypassPermissions'` makes the SDK internally use `--dangerously-skip-permissions`, which Claude Code blocks in certain environments.

**Solution:**
```typescript
// ❌ WRONG - causes exit code 1
permissionMode: 'bypassPermissions',

// ✅ CORRECT - works in containers
permissionMode: 'default',
canUseTool: async () => true,  // Auto-approve all tools
```

**Why this works:** Using `permissionMode: 'default'` with `canUseTool` achieves the same effect (auto-approving tools) without the problematic `--dangerously-skip-permissions` flag.

---

### Issue #2: S3FSMountError - Mount Point Not Found

**Symptom:**
```
S3FSMountError: S3FS mount failed: s3fs: unable to access MOUNTPOINT /storage: No such file or directory
```

**Root Cause:** Container image was cached and didn't include the `/storage` directory.

**Solution:**
1. Add `mkdir -p /storage` to Dockerfile
2. Force clean rebuild:
```bash
rm -rf node_modules .wrangler
npm install
npx wrangler deploy
```

---

### Issue #3: 502 Bad Gateway / Worker Timeout

**Symptom:** Request times out with 502 error.

**Root Cause:** Using `sandbox.exec()` which blocks until command completes, exceeding Worker's 30-second timeout.

**Solution:** Use `sandbox.execStream()` for long-running commands:
```typescript
// ❌ WRONG - blocks and times out
const result = await sandbox.exec("npx tsx agent-runner.ts");

// ✅ CORRECT - streams immediately
const execStream = await sandbox.execStream("npx tsx agent-runner.ts");
```

---

### Issue #4: Claude Code Hanging on Startup

**Symptom:** Container starts but Claude Code never responds.

**Root Cause:** Interactive prompts (ToS acceptance, onboarding) blocking in non-TTY environment.

**Solution:** Pre-configure settings in Dockerfile:
```dockerfile
ENV CI=true
ENV CLAUDE_CODE_SKIP_EULA=true

RUN mkdir -p /root/.claude && \
    echo '{"ackTosVersion": 2, "hasCompletedOnboarding": true}' > /root/.claude/settings.json
```

---

### Issue #5: Container Image Caching

**Symptom:** Changes to Dockerfile don't take effect after deploy.

**Root Cause:** Cloudflare and/or Docker cache container images.

**Solution:** Force clean rebuild:
```bash
# Clean local caches
rm -rf node_modules .wrangler
docker builder prune -f

# Reinstall and deploy
npm install
npx wrangler deploy

# Test with unique session ID
curl -X POST .../generate -d '{"sessionId": "fresh-'$(date +%s)'"}'
```

---

## Key Learnings

1. **Don't use `bypassPermissions`** - Use `permissionMode: 'default'` + `canUseTool: async () => true` instead
2. **Run as root** - Required for R2 FUSE mounting (safe since we're not using `--dangerously-skip-permissions`)
3. **Use `execStream()`** - For long-running commands to avoid Worker timeout
4. **Pre-configure Claude Code** - Set `CI=true` and create settings.json to skip interactive prompts
5. **Force clean rebuilds** - When Dockerfile changes don't take effect

---

## Files Involved

- `creative-agent-cf/sandbox/agent-runner.ts` - Main agent script with SDK config
- `creative-agent-cf/src/handlers/generate.ts` - Worker endpoint with R2 mounting
- `creative-agent-cf/Dockerfile` - Container image definition
- `creative-agent-cf/wrangler.jsonc` - Cloudflare configuration

## Related Documentation

- [Claude Agent SDK - Hosting](../claude_sdk/sdk_hosting.md)
- [Cloudflare Sandbox SDK](./cloudflare-sandbox-sdk.txt)
- [Deployment Plan](./cloudflare-deployment-plan.md)
