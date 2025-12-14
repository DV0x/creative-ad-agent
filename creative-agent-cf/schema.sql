-- =============================================================================
-- Creative Agent - D1 Database Schema
-- =============================================================================
-- Run with: npx wrangler d1 execute creative-agent-sessions --file=schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Sessions Table
-- Stores agent execution sessions and their results
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'error', 'forked')),
  campaign_name TEXT,
  brand_url TEXT,
  prompt TEXT,
  data JSON,
  parent_session_id TEXT,
  duration_ms INTEGER,
  FOREIGN KEY (parent_session_id) REFERENCES sessions(id)
);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_parent ON sessions(parent_session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_brand_url ON sessions(brand_url);

-- -----------------------------------------------------------------------------
-- Campaigns Table
-- Aggregated campaign tracking and metrics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT,
  brand_url TEXT,
  hooks_generated INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Campaign indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_session ON campaigns(session_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON campaigns(brand_url);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns(created_at DESC);

-- -----------------------------------------------------------------------------
-- Images Table
-- Track individual generated images
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  prompt TEXT,
  style TEXT,
  aspect_ratio TEXT DEFAULT '1:1',
  resolution TEXT DEFAULT '2K',
  size_kb INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Image indexes
CREATE INDEX IF NOT EXISTS idx_images_session ON images(session_id);
CREATE INDEX IF NOT EXISTS idx_images_created ON images(created_at DESC);

-- -----------------------------------------------------------------------------
-- Usage Table
-- Track API usage for billing and analytics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('generate', 'continue', 'fork', 'image')),
  model TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Usage indexes
CREATE INDEX IF NOT EXISTS idx_usage_session ON usage(session_id);
CREATE INDEX IF NOT EXISTS idx_usage_type ON usage(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_created ON usage(created_at DESC);

-- -----------------------------------------------------------------------------
-- Research Cache Table
-- Cache research results to avoid re-fetching
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS research_cache (
  id TEXT PRIMARY KEY,
  brand_url TEXT NOT NULL UNIQUE,
  research_md TEXT,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  UNIQUE(brand_url)
);

-- Research cache indexes
CREATE INDEX IF NOT EXISTS idx_research_url ON research_cache(brand_url);
CREATE INDEX IF NOT EXISTS idx_research_expires ON research_cache(expires_at);

-- -----------------------------------------------------------------------------
-- Hooks Table
-- Store generated hooks for reuse
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hooks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  brand_name TEXT,
  hook_type TEXT,
  hook_text TEXT NOT NULL,
  formula_used TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Hooks indexes
CREATE INDEX IF NOT EXISTS idx_hooks_session ON hooks(session_id);
CREATE INDEX IF NOT EXISTS idx_hooks_brand ON hooks(brand_name);
CREATE INDEX IF NOT EXISTS idx_hooks_type ON hooks(hook_type);
