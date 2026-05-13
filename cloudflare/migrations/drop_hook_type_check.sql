-- Drop the hook_type CHECK constraint on campaign_images.
-- The skill (agent/.claude/skills/hook-methodology) defines 10 hook types,
-- and we want freedom for the agent to invent new ones per brand.
-- D1/SQLite has no DROP CONSTRAINT — recreate the table.
--
-- Apply per env: npx wrangler d1 execute creative-agent-db --remote --file=migrations/drop_hook_type_check.sql
-- And:          npx wrangler d1 execute creative-agent-db-prod --remote --file=migrations/drop_hook_type_check.sql
--
-- Note: no explicit BEGIN/COMMIT — Cloudflare D1 rejects raw transaction SQL.
-- Wrangler executes statement-by-statement with automatic rollback on error.

CREATE TABLE campaign_images_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  image_index INTEGER NOT NULL,
  hook_type TEXT NOT NULL,
  prompt TEXT,
  file_path TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, image_index, version)
);

INSERT INTO campaign_images_new (id, campaign_id, image_index, hook_type, prompt, file_path, version, created_at)
SELECT id, campaign_id, image_index, hook_type, prompt, file_path, version, created_at
FROM campaign_images;

DROP TABLE campaign_images;

ALTER TABLE campaign_images_new RENAME TO campaign_images;

CREATE INDEX IF NOT EXISTS idx_campaign_images_campaign_id ON campaign_images(campaign_id);
