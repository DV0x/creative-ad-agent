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
