# Claude Agent SDK: Hosting & Sandbox Guide

A concise reference for deploying and sandboxing Claude Agent SDK applications.

---

## Hosting Overview

The Claude Agent SDK operates as a **long-running process** that:
- Executes commands in a persistent shell environment
- Manages file operations within a working directory
- Handles tool execution with context from previous interactions

---

## System Requirements

| Requirement | Specification |
|-------------|---------------|
| Runtime | Node.js 18+ (TypeScript SDK) |
| Claude Code CLI | `npm install -g @anthropic-ai/claude-code` |
| RAM | 1GiB recommended |
| Disk | 5GiB recommended |
| CPU | 1 core minimum |
| Network | Outbound HTTPS to `api.anthropic.com` |

---

## Sandbox Configuration

### Programmatic Setup

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = await query({
  prompt: "Build and deploy my application",
  options: {
    sandbox: {
      enabled: true,
      autoAllowBashIfSandboxed: true,
      excludedCommands: ["docker"],
      network: {
        allowLocalBinding: true,
        allowUnixSockets: ["/var/run/docker.sock"]
      }
    }
  }
});
```

### SandboxSettings Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable sandbox mode for command execution |
| `autoAllowBashIfSandboxed` | `boolean` | `false` | Auto-approve bash commands when sandbox is enabled |
| `excludedCommands` | `string[]` | `[]` | Commands that always bypass sandbox automatically (model has no control) |
| `allowUnsandboxedCommands` | `boolean` | `false` | Allow model to request unsandboxed execution via `dangerouslyDisableSandbox` |
| `network` | `NetworkSandboxSettings` | `undefined` | Network-specific sandbox configuration |
| `ignoreViolations` | `SandboxIgnoreViolations` | `undefined` | Configure which sandbox violations to ignore |
| `enableWeakerNestedSandbox` | `boolean` | `false` | Enable a weaker nested sandbox for compatibility |

### Network Settings

```typescript
type NetworkSandboxSettings = {
  allowLocalBinding?: boolean;      // Allow binding to local ports
  allowUnixSockets?: string[];      // Allowed Unix socket paths
  allowAllUnixSockets?: boolean;    // Allow all Unix sockets
  httpProxyPort?: number;           // HTTP proxy port
  socksProxyPort?: number;          // SOCKS proxy port
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `allowLocalBinding` | `boolean` | `false` | Allow processes to bind to local ports (e.g., dev servers) |
| `allowUnixSockets` | `string[]` | `[]` | Unix socket paths that processes can access |
| `allowAllUnixSockets` | `boolean` | `false` | Allow access to all Unix sockets |
| `httpProxyPort` | `number` | `undefined` | HTTP proxy port for network requests |
| `socksProxyPort` | `number` | `undefined` | SOCKS proxy port for network requests |

### Ignore Violations

```typescript
type SandboxIgnoreViolations = {
  file?: string[];    // File path patterns to ignore violations for
  network?: string[]; // Network patterns to ignore violations for
}
```

---

## Unsandboxed Commands

### excludedCommands vs allowUnsandboxedCommands

| Option | Behavior |
|--------|----------|
| `excludedCommands` | Static list that **always** bypasses sandbox automatically. Model has no control. |
| `allowUnsandboxedCommands` | Model decides at runtime by setting `dangerouslyDisableSandbox: true` in tool input. |

### Handling Unsandboxed Commands

When `allowUnsandboxedCommands: true`, use `canUseTool` for authorization:

```typescript
const result = await query({
  prompt: "Deploy my application",
  options: {
    sandbox: {
      enabled: true,
      allowUnsandboxedCommands: true
    },
    canUseTool: async (tool, input) => {
      if (tool === "Bash" && input.dangerouslyDisableSandbox) {
        console.log(`Unsandboxed: ${input.command}`);
        return isCommandAuthorized(input.command);
      }
      return { behavior: 'allow', updatedInput: input };
    }
  }
});
```

### Use Cases for Permission Fallback

- **Audit model requests**: Log when the model requests unsandboxed execution
- **Implement allowlists**: Only permit specific commands to run unsandboxed
- **Add approval workflows**: Require explicit authorization for privileged operations

> **Warning:** Commands running with `dangerouslyDisableSandbox: true` have full system access. Validate these requests carefully in your `canUseTool` handler.

---

## Sandbox Providers

| Provider | URL |
|----------|-----|
| Cloudflare Sandboxes | github.com/cloudflare/sandbox-sdk |
| Modal Sandboxes | modal.com/docs/guide/sandbox |
| Daytona | daytona.io |
| E2B | e2b.dev |
| Fly Machines | fly.io/docs/machines |
| Vercel Sandbox | vercel.com/docs/functions/sandbox |

---

## Deployment Patterns

### Pattern 1: Ephemeral Sessions

Create container per task, destroy when complete.

**Use cases:**
- Bug investigation & fix
- Invoice processing
- Translation tasks
- Image/video processing

### Pattern 2: Long-Running Sessions

Persistent containers for ongoing tasks.

**Use cases:**
- Email agents (monitoring, triaging)
- Site builders with live editing
- High-frequency chat bots

### Pattern 3: Hybrid Sessions

Ephemeral containers hydrated with history/state from database or session resumption.

**Use cases:**
- Personal project manager
- Deep research tasks
- Customer support agents

### Pattern 4: Single Containers

Multiple SDK processes in one global container.

**Use cases:**
- Agent simulations
- Collaborative agents

---

## Container Benefits

| Benefit | Description |
|---------|-------------|
| Process isolation | Separate execution per session |
| Resource limits | CPU, memory, storage constraints |
| Network control | Restrict outbound connections |
| Ephemeral filesystems | Clean state for each session |

---

## FAQ

**How do I communicate with sandboxes?**
Expose HTTP/WebSocket ports. Your app exposes endpoints for external clients while SDK runs internally.

**What's the cost?**
Dominant cost is tokens. Container cost is roughly 5 cents/hour minimum.

**When to shut down idle containers?**
Tune based on expected user response frequency. Providers offer configurable idle timeouts.

**How long can sessions run?**
No timeout, but set `maxTurns` to prevent infinite loops.

**How to monitor?**
Standard logging infrastructure works for containers.

---

## Key Distinction

| Configuration | Purpose |
|---------------|---------|
| `sandbox` option | Command execution sandboxing |
| Permission rules | Filesystem and network access restrictions |

- **Filesystem read**: Read deny rules
- **Filesystem write**: Edit allow/deny rules
- **Network**: WebFetch allow/deny rules
