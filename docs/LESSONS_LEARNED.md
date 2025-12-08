# Claude Agent SDK - Lessons Learned

Quick reference for common mistakes when building agents with the Claude SDK.

---

## 1. SDK Version Issues

**Symptom:** Tool returns "No such tool available" or doesn't work as documented.

**Fix:** Check and update SDK version FIRST before debugging anything else.
```bash
npm show @anthropic-ai/claude-agent-sdk version  # Latest
npm install @anthropic-ai/claude-agent-sdk@latest
```
We wasted 45 minutes debugging when a simple version check would have solved it in 5 minutes.

---

## 2. MCP Tools "Stream Closed" Error

**Symptom:** MCP tool visible but fails with "Stream closed" after ~0.6 seconds.

**Root Cause:** Async generator completed before MCP tool finished.

**Fix:** Keep generator alive during tool execution:
```typescript
// BAD
async function* createPrompt() {
  yield userMessage;  // Generator ends - stream closes!
}

// GOOD
async function* createPrompt(signal: AbortSignal) {
  yield userMessage;
  await new Promise<void>(r => signal.addEventListener('abort', r));
}

// Use with AbortController
const ac = new AbortController();
const gen = createPrompt(ac.signal);
for await (const msg of query({ prompt: gen })) { /* ... */ }
ac.abort();  // Clean shutdown when done
```

---

## 3. Subagents CAN Access MCP Tools

**False Assumption:** "Subagents cannot access MCP tools (SDK limitation)"

**Truth:** Subagents inherit ALL tools by default. We blocked MCP access ourselves.

```yaml
# This BLOCKS MCP inheritance (explicit whitelist)
tools: [Read, Write]

# This INHERITS all tools including MCP (remove tools field)
# tools: (removed)
```

**Three Modes:**
- No `tools` field = inherits ALL tools including MCP
- `tools: [list]` = ONLY those tools, blocks everything else
- `tools: [Read, mcp__server__tool]` = specific built-in + specific MCP

---

## 4. Hooks vs Message Stream

**Symptom:** Permission hooks (`PreToolUse`, `PostToolUse`) never fire.

**Why:** Hooks are for **control/blocking**, not observability.

**Fix:** Use message stream for logging:
```typescript
for await (const msg of query({ prompt, options })) {
  if (msg.type === 'assistant') {
    msg.message.content.forEach(b => {
      if (b.type === 'tool_use') console.log('Tool:', b.name);
    });
  }
  if (msg.type === 'result') console.log('Cost:', msg.total_cost_usd);
}
```

---

## 5. Agent Loading

**Symptom:** Custom agents in `.claude/agents/` not loading.

**Fix:** Add `settingSources` to options:
```typescript
const options = { settingSources: ['project'] };
```

---

## 6. SDK Options Location

**Symptom:** JSON schema errors in settings.json.

**Fix:** SDK options (maxTurns, systemPrompt, model) go in code, not settings.json.

---

## 7. Architecture Simplicity

**Mistake:** Over-engineered 3-agent rigid workflow.

**Fix:** Simplified to 1 agent + 2 skills (composable, debuggable).

---

## Debugging Order

1. **CHECK VERSION** (5 min) - always first
2. **VERIFY BASICS** (10 min) - is config correct?
3. **CREATE MINIMAL TEST** (15 min) - simplest reproduction
4. **READ DOCS** (last) - only after basics verified

---

## Prompting Patterns When Stuck

| Situation | Ask |
|-----------|-----|
| AI sounds confident | "Are you sure? What's the evidence?" |
| AI blames external system | "Could it be our config instead?" |
| AI mentions something | "You mentioned X. Did you verify that?" |
| Complex explanation | "What's the simplest cause we haven't checked?" |

**Key:** AI often has the answer but doesn't follow through. Your job: catch loose threads.

---

## Quick Reference

| Problem | Fix |
|---------|-----|
| Tool not available | `npm install @anthropic-ai/claude-agent-sdk@latest` |
| MCP stream closed | Keep generator alive with AbortController |
| Subagent can't use MCP | Remove `tools` field from agent definition |
| Hooks not firing | Use message stream, not hooks |
| Agents not loading | Add `settingSources: ['project']` |

---

## MCP Checklist

Before assuming MCP is broken:
- [ ] SDK is latest version
- [ ] Using async generator (not string) for prompt
- [ ] Generator stays alive during execution
- [ ] Tool in `mcpServers` at query level
- [ ] Agent has no `tools` field OR explicitly includes MCP tool

---

## Source Documents

For detailed context, see:
- `agent-logs/SKILL_TOOL_DEBUGGING_RETROSPECTIVE.md`
- `SDK_MIGRATION_JOURNEY.md`
- `MCP_STREAM_FIX.md`
- `MCP_SUBAGENT_DISCOVERY.md`
- `MCP_TROUBLESHOOTING_HISTORY.md`

*Created: December 2025*
