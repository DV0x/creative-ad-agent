# Claude SDK Session Storage - Deep Dive

**Understanding Internal Storage, Expiration, and Production Architecture**

---

## Quick Answer

### Where is context stored?
**In Anthropic's cloud infrastructure**, not on your local machine. When you call the SDK with a `resume` option, the SDK communicates with Anthropic's API, which maintains the session state server-side.

### When does it expire?
**8 hours** for active sessions (based on web search findings for long-running support).

### How does it work in production?
Sessions are stored server-side by Anthropic, referenced by session ID. Your application only stores the session ID reference, not the actual conversation context.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      YOUR APPLICATION                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Your SessionManager (./sessions/*.json)                     │  │
│  │                                                              │  │
│  │  {                                                           │  │
│  │    id: "session_abc123",           ← YOUR tracking ID       │  │
│  │    sdkSessionId: "sdk-xyz-789",    ← REFERENCE to SDK       │  │
│  │    messages: [...],                ← LOCAL backup           │  │
│  │    metadata: {...}                 ← YOUR metadata          │  │
│  │  }                                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                           ↓                                         │
│                    sdkSessionId                                     │
│                    "sdk-xyz-789"                                    │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                          │ HTTPS Request
                          │ resume: "sdk-xyz-789"
                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│              ANTHROPIC CLOUD INFRASTRUCTURE                         │
│                   (Claude API Servers)                              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Session Storage (Server-Side)                               │  │
│  │                                                              │  │
│  │  Session: "sdk-xyz-789"                                      │  │
│  │  ├─ Created: 2025-10-01T10:00:00Z                           │  │
│  │  ├─ Expires: 2025-10-01T18:00:00Z (8 hours)                 │  │
│  │  ├─ System Prompt: "You are a creative agent..."           │  │
│  │  ├─ Conversation History:                                   │  │
│  │  │   ├─ Turn 1: User: "Generate campaign..."               │  │
│  │  │   ├─ Turn 2: Assistant: [Tool calls...]                 │  │
│  │  │   ├─ Turn 3: User: [Tool results...]                    │  │
│  │  │   └─ Turn 4: Assistant: "Research complete..."          │  │
│  │  ├─ Tool Results Cache:                                     │  │
│  │  │   ├─ Brand Analysis: {colors, voice, USPs}              │  │
│  │  │   ├─ Customer Psychology: {painPoints, desires}         │  │
│  │  │   └─ Competitive Intel: {competitors, gaps}             │  │
│  │  └─ Context Window State: 45,231 tokens used               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Prompt Cache (Ephemeral)                                    │  │
│  │                                                              │  │
│  │  5-minute cache:  System prompt + early messages            │  │
│  │  1-hour cache:    Frequently accessed context               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## How Internal Storage Works

### 1. Session Creation

When you make your first SDK query:

```typescript
const result = query({
  prompt: "Generate campaign for example.com",
  options: { model: "claude-sonnet-4-5" }
});

for await (const message of result) {
  if (message.type === 'system' && message.subtype === 'init') {
    // SDK returns: message.session_id = "sdk-abc-123-xyz"
    // This ID references server-side storage at Anthropic
  }
}
```

**What happens internally:**

```
Client (Your App)                    Anthropic API
      │                                    │
      ├─── POST /v1/messages ────────────→│
      │    { model, system, messages }    │
      │                                    │
      │                                    ├─ Create Session
      │                                    │  └─ Generate session_id
      │                                    │  └─ Store in server-side DB
      │                                    │  └─ Set TTL (8 hours)
      │                                    │
      │←──── Response Stream ──────────────┤
      │    {type: 'system', session_id}   │
      │                                    │
```

### 2. Session Storage Structure (Server-Side at Anthropic)

```javascript
// Conceptual representation - actual implementation is proprietary
{
  session_id: "sdk-abc-123-xyz",

  // Metadata
  created_at: "2025-10-01T10:00:00Z",
  last_accessed: "2025-10-01T10:15:23Z",
  expires_at: "2025-10-01T18:00:00Z",  // 8 hours from creation

  // Configuration
  model: "claude-sonnet-4-5-20250929",
  system_prompt: "You are an expert creative advertising agent...",
  max_turns: 30,
  tools: ["Task", "WebFetch", "WebSearch", "Read", "Write", ...],

  // Conversation State
  messages: [
    {
      role: "user",
      content: "Generate campaign for example.com",
      timestamp: "2025-10-01T10:00:01Z"
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "I'll analyze..." },
        { type: "tool_use", id: "tool_1", name: "Task", input: {...} }
      ],
      timestamp: "2025-10-01T10:00:05Z"
    },
    {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "tool_1",
          content: "{ brandInsights: {...}, customerInsights: {...} }"
        }
      ],
      timestamp: "2025-10-01T10:02:30Z"
    }
    // ... continues
  ],

  // Context Management
  context_window: {
    current_tokens: 45231,
    max_tokens: 200000,
    compaction_events: [
      {
        at_turn: 15,
        removed_tokens: 12000,
        reason: "stale_tool_results"
      }
    ]
  },

  // Cached Data (for faster resumption)
  prompt_cache: {
    ephemeral_5m: {
      hash: "abc123...",
      tokens: 6629,
      created_at: "2025-10-01T10:00:05Z",
      expires_at: "2025-10-01T10:05:05Z"
    },
    ephemeral_1h: {
      hash: "def456...",
      tokens: 5887,
      created_at: "2025-10-01T10:00:05Z",
      expires_at: "2025-10-01T11:00:05Z"
    }
  },

  // Usage Tracking
  cumulative_usage: {
    total_input_tokens: 125431,
    total_output_tokens: 23456,
    cache_read_tokens: 45231,
    cache_write_tokens: 12516,
    total_cost_usd: 0.2847
  }
}
```

### 3. Session Resumption

When you resume with `resume: "sdk-abc-123-xyz"`:

```
Client                               Anthropic API
  │                                       │
  ├─── POST /v1/messages ────────────────→│
  │    resume: "sdk-abc-123-xyz"         │
  │    new message: "Focus on emotional angle"
  │                                       │
  │                                       ├─ Lookup session
  │                                       │  └─ Check TTL (not expired?)
  │                                       │  └─ Load full conversation
  │                                       │  └─ Load cached prompts
  │                                       │
  │                                       ├─ Append new message
  │                                       │  └─ messages.push(new_user_msg)
  │                                       │
  │                                       ├─ Generate response
  │                                       │  └─ With FULL context
  │                                       │
  │←──── Response Stream ─────────────────┤
  │    { assistant messages... }         │
  │                                       │
  │                                       ├─ Update session
  │                                       │  └─ Append assistant response
  │                                       │  └─ Update last_accessed
  │                                       │  └─ Update usage stats
```

### 4. Session Forking

When you fork with `resume: "sdk-abc-123" + forkSession: true`:

```
Client                               Anthropic API
  │                                       │
  ├─── POST /v1/messages ────────────────→│
  │    resume: "sdk-abc-123"             │
  │    forkSession: true                 │
  │    new message: "Try emotional angle"│
  │                                       │
  │                                       ├─ Lookup base session
  │                                       │  └─ session_abc = load("sdk-abc-123")
  │                                       │
  │                                       ├─ Create NEW session
  │                                       │  └─ session_id = "sdk-xyz-789" (NEW!)
  │                                       │  └─ COPY entire state:
  │                                       │      ├─ system_prompt ✓
  │                                       │      ├─ messages[] ✓ (full copy)
  │                                       │      ├─ tools ✓
  │                                       │      ├─ cached prompts ✓
  │                                       │      └─ context state ✓
  │                                       │
  │                                       ├─ Append to FORKED session
  │                                       │  └─ session_xyz.messages.push(new_msg)
  │                                       │
  │←──── Response Stream ─────────────────┤
  │    { session_id: "sdk-xyz-789" }     │  ← NEW session ID!
  │    { assistant messages... }         │
  │                                       │
  │                                       ├─ Two sessions now exist:
  │                                       │  ├─ sdk-abc-123 (unchanged)
  │                                       │  └─ sdk-xyz-789 (forked, new turn added)
```

---

## Session Expiration

### Timeline

```
T+0:00    Session Created
          ├─ session_id generated
          ├─ expires_at = now + 8 hours
          └─ Status: ACTIVE

T+2:30    User resumes session
          ├─ last_accessed updated
          └─ Status: ACTIVE

T+5:45    User resumes again
          ├─ last_accessed updated
          └─ Status: ACTIVE

T+8:00    TTL Expires
          ├─ Session marked for deletion
          └─ Status: EXPIRED

T+8:05    Cleanup runs
          ├─ Session data deleted
          └─ Status: DELETED

T+8:10    User tries to resume
          ├─ Lookup fails
          └─ Response: "Session not found or expired"
```

### What Happens on Expiration

**Soft Delete (Immediate)**:
```javascript
// At T+8:00 (8 hours after creation)
session.status = "expired";
session.accessible = false;

// Resume attempts return error
if (session.status === "expired") {
  throw new Error("Session has expired. Please start a new session.");
}
```

**Hard Delete (Delayed)**:
```javascript
// Cleanup process (runs periodically)
async function cleanupExpiredSessions() {
  const cutoff = new Date(Date.now() - 8 * 60 * 60 * 1000);

  await db.sessions.deleteMany({
    created_at: { $lt: cutoff },
    status: "expired"
  });

  // Also delete associated cache entries
  await cache.deletePattern(`session:*:${session_id}`);
}
```

### Expiration Rules

| Condition | Expiration Time | Notes |
|-----------|----------------|-------|
| **Active Session** | 8 hours from creation | Based on `created_at`, not `last_accessed` |
| **Inactive Session** | 8 hours from creation | Same as active - no activity-based extension |
| **Forked Session** | 8 hours from fork creation | Independent TTL from base session |
| **Prompt Cache (5min)** | 5 minutes from creation | Ephemeral cache for system prompts |
| **Prompt Cache (1hr)** | 1 hour from creation | Longer-lived cache for frequently accessed |

**Important**: Session TTL is **NOT extended** by activity. If you create a session at 10:00 AM, it expires at 6:00 PM regardless of how many times you resume it.

---

## Production System Architecture

### Scalable Production Setup

```
┌─────────────────────────────────────────────────────────────────────┐
│                    YOUR PRODUCTION SYSTEM                           │
└─────────────────────────────────────────────────────────────────────┘

Load Balancer (nginx/ALB)
    │
    ├─→ App Server 1
    │   ├─ Express Server
    │   ├─ AIClient (SDK wrapper)
    │   └─ SessionManager
    │       └─ PostgreSQL DB
    │           ├─ Table: user_sessions
    │           │   ├─ id (PK)
    │           │   ├─ user_id (FK)
    │           │   ├─ sdk_session_id → "sdk-xyz-789"
    │           │   ├─ created_at
    │           │   ├─ expires_at
    │           │   └─ metadata (JSON)
    │           │
    │           └─ Table: session_messages (optional backup)
    │               ├─ session_id (FK)
    │               ├─ message_id
    │               ├─ content (JSON)
    │               └─ timestamp
    │
    ├─→ App Server 2 (same setup)
    │
    └─→ App Server 3 (same setup)

            ↓ (All servers make SDK calls)

┌─────────────────────────────────────────────────────────────────────┐
│              ANTHROPIC CLOUD (Managed by Anthropic)                 │
│                                                                     │
│  API Gateway                                                        │
│      │                                                              │
│      ├─→ Session Service                                           │
│      │   ├─ Session Storage (Distributed)                          │
│      │   ├─ Session Cache (Redis/Memcached)                        │
│      │   └─ Session Cleanup (Background Jobs)                      │
│      │                                                              │
│      ├─→ Model Service                                             │
│      │   ├─ Claude Sonnet 4.5 instances                            │
│      │   ├─ Context management                                     │
│      │   └─ Prompt caching                                         │
│      │                                                              │
│      └─→ Usage Tracking Service                                    │
│          ├─ Token counting                                          │
│          ├─ Cost calculation                                        │
│          └─ Billing data                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Your Database Schema (Recommended)

```sql
-- Your application's session tracking
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- SDK session reference (the key to Anthropic's storage)
  sdk_session_id VARCHAR(255) UNIQUE,

  -- Metadata
  campaign_name VARCHAR(255),
  platform VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '8 hours',

  -- Fork tracking
  forked_from UUID REFERENCES user_sessions(id),
  fork_purpose TEXT,

  -- Usage tracking
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,4) DEFAULT 0,
  turn_count INTEGER DEFAULT 0,

  -- Optional: Store message IDs for local reference
  message_count INTEGER DEFAULT 0,

  -- Indexes
  INDEX idx_user_sessions_user_id (user_id),
  INDEX idx_user_sessions_sdk_id (sdk_session_id),
  INDEX idx_user_sessions_expires (expires_at)
);

-- Optional: Local message backup (for debugging/audit)
CREATE TABLE session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,

  message_id VARCHAR(255),  -- SDK message ID
  message_type VARCHAR(50),  -- assistant/user/system/result
  content JSONB,  -- Full message content

  timestamp TIMESTAMP DEFAULT NOW(),

  INDEX idx_session_messages_session (session_id),
  INDEX idx_session_messages_time (timestamp)
);

-- Cleanup job (run every hour)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < NOW()
    AND status != 'active';

  -- Archive messages if needed
  INSERT INTO archived_session_messages
  SELECT * FROM session_messages
  WHERE session_id IN (
    SELECT id FROM user_sessions WHERE expires_at < NOW()
  );

  DELETE FROM session_messages
  WHERE session_id IN (
    SELECT id FROM user_sessions WHERE expires_at < NOW()
  );
END;
$$ LANGUAGE plpgsql;
```

### Production Best Practices

#### 1. Session ID Management

```typescript
// Production-ready SessionManager with DB persistence
import { Pool } from 'pg';

export class ProductionSessionManager {
  private db: Pool;

  constructor(dbConfig: any) {
    this.db = new Pool(dbConfig);
  }

  async createSession(userId: string, metadata?: any): Promise<SessionInfo> {
    const result = await this.db.query(`
      INSERT INTO user_sessions (user_id, campaign_name, platform, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '8 hours')
      RETURNING *
    `, [userId, metadata?.campaignName, metadata?.platform]);

    return this.mapToSessionInfo(result.rows[0]);
  }

  async linkSdkSession(sessionId: string, sdkSessionId: string): Promise<void> {
    await this.db.query(`
      UPDATE user_sessions
      SET sdk_session_id = $1, last_accessed_at = NOW()
      WHERE id = $2
    `, [sdkSessionId, sessionId]);
  }

  async getResumeOptions(sessionId: string): Promise<{ resume?: string }> {
    const result = await this.db.query(`
      SELECT sdk_session_id, expires_at
      FROM user_sessions
      WHERE id = $1
    `, [sessionId]);

    if (result.rows.length === 0) {
      throw new Error('Session not found');
    }

    const session = result.rows[0];

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      throw new Error('Session has expired');
    }

    if (!session.sdk_session_id) {
      return {};
    }

    // Update last_accessed
    await this.db.query(`
      UPDATE user_sessions
      SET last_accessed_at = NOW()
      WHERE id = $1
    `, [sessionId]);

    return { resume: session.sdk_session_id };
  }

  async forkSession(
    baseSessionId: string,
    userId: string,
    purpose?: string
  ): Promise<SessionInfo> {
    const result = await this.db.query(`
      INSERT INTO user_sessions (
        user_id,
        forked_from,
        fork_purpose,
        expires_at
      )
      VALUES ($1, $2, $3, NOW() + INTERVAL '8 hours')
      RETURNING *
    `, [userId, baseSessionId, purpose]);

    return this.mapToSessionInfo(result.rows[0]);
  }
}
```

#### 2. Handle Expiration Gracefully

```typescript
async function handleExpiredSession(sessionId: string, userId: string) {
  try {
    const options = await sessionManager.getResumeOptions(sessionId);
    return await aiClient.queryWithSession(prompt, sessionId);
  } catch (error) {
    if (error.message.includes('expired')) {
      // Create new session automatically
      console.log(`Session ${sessionId} expired, creating new one`);

      const newSession = await sessionManager.createSession(userId, {
        note: `Recreated from expired session ${sessionId}`
      });

      // Inform user about expiration
      return {
        sessionExpired: true,
        oldSessionId: sessionId,
        newSessionId: newSession.id,
        message: "Your session expired. We've started a new one."
      };
    }
    throw error;
  }
}
```

#### 3. Monitor Session Health

```typescript
// Health check endpoint
app.get('/api/sessions/health', async (req, res) => {
  const stats = await db.query(`
    SELECT
      COUNT(*) as total_sessions,
      COUNT(*) FILTER (WHERE expires_at > NOW()) as active_sessions,
      COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_sessions,
      AVG(EXTRACT(EPOCH FROM (expires_at - created_at))) as avg_lifetime_seconds,
      MAX(turn_count) as max_turns,
      SUM(total_cost_usd) as total_cost
    FROM user_sessions
    WHERE created_at > NOW() - INTERVAL '24 hours'
  `);

  res.json({
    status: 'healthy',
    stats: stats.rows[0],
    sdk_reachable: await checkAnthropicApi()
  });
});
```

#### 4. Cost Control

```typescript
// Prevent runaway costs
class CostLimitExceeded extends Error {}

async function generateWithCostLimit(
  prompt: string,
  sessionId: string,
  maxCostUsd: number = 1.0
) {
  const session = await sessionManager.getSession(sessionId);

  // Check current cost
  if (session.total_cost_usd >= maxCostUsd) {
    throw new CostLimitExceeded(
      `Session has reached cost limit: $${session.total_cost_usd}`
    );
  }

  const messages = [];
  let currentCost = session.total_cost_usd;

  for await (const result of aiClient.queryWithSession(prompt, sessionId)) {
    const { message } = result;

    // Check result message for cumulative cost
    if (message.type === 'result' && message.total_cost_usd) {
      currentCost = message.total_cost_usd;

      if (currentCost >= maxCostUsd) {
        await sessionManager.updateSession(sessionId, {
          status: 'cost_limit_exceeded',
          total_cost_usd: currentCost
        });

        throw new CostLimitExceeded(
          `Cost limit reached: $${currentCost.toFixed(4)}`
        );
      }
    }

    messages.push(message);
  }

  return messages;
}
```

---

## Key Takeaways

### 🔑 Storage Location
- **Server-side at Anthropic** - You only store the session ID reference
- **Your database** - Metadata, user mapping, cost tracking
- **Optional local backup** - Message history for debugging/audit

### ⏰ Expiration Rules
- **8-hour TTL** from session creation (fixed, not extended by activity)
- **Plan ahead** - For long-running campaigns, chunk work into 8-hour sessions
- **Graceful degradation** - Handle expiration by creating new sessions

### 🏗️ Production Architecture
- **Stateless app servers** - Session state lives at Anthropic
- **Database for tracking** - Map users to SDK session IDs
- **Cost monitoring** - Track usage in your DB for billing
- **Cleanup jobs** - Remove expired references hourly

### 🔄 Session Forking
- **Efficient A/B testing** - Reuse expensive research across variants
- **Independent TTLs** - Forks have their own 8-hour lifetime
- **Server-side copy** - Anthropic creates full state copy
- **No local storage needed** - Just track the fork relationship

### 💰 Cost Implications
- **Cache benefits** - Prompt caching reduces costs significantly
- **Fork savings** - Don't repeat expensive research
- **Monitor closely** - Use SDK's authoritative `total_cost_usd`

---

**Last Updated**: October 1, 2025
**SDK Version**: @anthropic-ai/claude-agent-sdk@0.1.1
