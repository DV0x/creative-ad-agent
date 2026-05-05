import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/creative_agent.db');

export const db: DatabaseType = new Database(DB_PATH);

// Enable foreign keys and WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SCHEMA_SQL = `
-- ============================================
-- CAMPAIGNS
-- ============================================

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'complete', 'incomplete', 'error', 'cancelled')),
  session_id TEXT,
  sdk_session_id TEXT,
  brand TEXT,
  active_reference_file_ids TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_session_id ON campaigns(session_id);

-- ============================================
-- CAMPAIGN FILES (research, hooks, prompts)
-- ============================================

CREATE TABLE IF NOT EXISTS campaign_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('research', 'hooks', 'prompts')),
  content TEXT DEFAULT '',
  is_ready INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, file_type)
);

CREATE INDEX IF NOT EXISTS idx_campaign_files_campaign_id ON campaign_files(campaign_id);

-- ============================================
-- CAMPAIGN IMAGES
-- ============================================

CREATE TABLE IF NOT EXISTS campaign_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  image_index INTEGER NOT NULL,
  hook_type TEXT NOT NULL CHECK (hook_type IN ('stat', 'story', 'fomo', 'curiosity', 'callout', 'contrast')),
  prompt TEXT,
  file_path TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, image_index, version)
);

CREATE INDEX IF NOT EXISTS idx_campaign_images_campaign_id ON campaign_images(campaign_id);

-- ============================================
-- CHAT MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_refs TEXT,
  file_refs TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);

-- ============================================
-- ASSET FOLDERS
-- ============================================

CREATE TABLE IF NOT EXISTS asset_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_folders_user_id ON asset_folders(user_id);

-- ============================================
-- ASSET FILES
-- ============================================

CREATE TABLE IF NOT EXISTS asset_files (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL REFERENCES asset_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'document', 'other')),
  size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_files_folder_id ON asset_files(folder_id);

-- ============================================
-- USER CREDITS
-- ============================================

CREATE TABLE IF NOT EXISTS user_credits (
  user_id TEXT PRIMARY KEY,
  balance_usd REAL NOT NULL DEFAULT 0,
  total_spent_usd REAL NOT NULL DEFAULT 0,
  total_generations INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- USAGE LOG
-- ============================================

CREATE TABLE IF NOT EXISTS usage_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  request_id TEXT NOT NULL DEFAULT 'initial',
  event_type TEXT NOT NULL,
  claude_cost_usd REAL NOT NULL DEFAULT 0,
  image_count INTEGER NOT NULL DEFAULT 0,
  image_cost_usd REAL NOT NULL DEFAULT 0,
  charged_amount_usd REAL NOT NULL DEFAULT 0,
  credits_charged REAL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  num_turns INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(campaign_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_usage_log_user_id ON usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_campaign_id ON usage_log(campaign_id);

-- ============================================
-- USER EVENTS (analytics)
-- ============================================

CREATE TABLE IF NOT EXISTS user_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  campaign_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_campaign ON user_events(campaign_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE TRIGGER IF NOT EXISTS campaigns_updated_at
  AFTER UPDATE ON campaigns
  FOR EACH ROW
  BEGIN
    UPDATE campaigns SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
  END;

CREATE TRIGGER IF NOT EXISTS campaign_files_updated_at
  AFTER UPDATE ON campaign_files
  FOR EACH ROW
  BEGIN
    UPDATE campaign_files SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
  END;
`;

export function initDatabase(): void {
  console.log('📦 Initializing database...');

  // Run schema creation (IF NOT EXISTS makes this idempotent)
  db.exec(SCHEMA_SQL);

  // Migration: add sdk_session_id column for existing databases
  try {
    db.exec(`ALTER TABLE campaigns ADD COLUMN sdk_session_id TEXT`);
  } catch { /* column already exists */ }

  // Index must be created after migration (column may not exist when SCHEMA_SQL runs)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaigns_sdk_session_id ON campaigns(sdk_session_id)`);

  // Migration: add brand column for brand grouping
  try {
    db.exec(`ALTER TABLE campaigns ADD COLUMN brand TEXT`);
  } catch { /* column already exists */ }

  // Migration: add blocks column to messages for persisting thinking blocks
  try {
    db.exec(`ALTER TABLE messages ADD COLUMN blocks TEXT`);
  } catch { /* column already exists */ }

  // Migration: campaign-level active reference image set (multi-ref selective replace, 2026-05-05)
  try {
    db.exec(`ALTER TABLE campaigns ADD COLUMN active_reference_file_ids TEXT`);
  } catch { /* column already exists */ }

  console.log('✅ Database initialized at:', DB_PATH);
}

export function closeDatabase(): void {
  db.close();
  console.log('📦 Database connection closed');
}

// Utility function to generate IDs
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
}
