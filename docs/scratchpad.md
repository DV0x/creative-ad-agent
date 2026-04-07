# Scratchpad

## 2026-04-07 — Architecture Review + Download Tracking

### Context
Full end-to-end architecture review of the project. Discussed:
- React Router not needed (only 2 states: landing vs workspace)
- No URL-based deep linking to campaigns (selection is Zustand state)
- Images are auth-gated, no shareable links — users download and use elsewhere
- Shareable links deferred — want to observe user behavior first before building collaboration features

### Decision: Track User Behavior Before Building Features
- Observe how people use the platform before adding features
- Existing data: usage_log (costs, tokens), campaigns (status), messages (conversation history)
- Missing data: **downloads** (strongest signal of output value)

### Building: Download Event Tracking
**Approach:**
- New `user_events` table in D1 (generic, extensible for future event types)
- New `POST /api/events` endpoint (thin, fire-and-forget from client)
- Client fires event on image download (ImageCard) and download-all (ResultsView)
- No new libraries, no analytics SDK — just a table and a fetch call

**Schema:**
```sql
CREATE TABLE user_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  campaign_id TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Future event types to consider:**
- image_download, download_all
- campaign_view, follow_up_sent, cancel_clicked
- session_start, session_end
