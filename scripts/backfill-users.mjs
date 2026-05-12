#!/usr/bin/env node
/**
 * One-off backfill: list all Clerk users → upsert into D1 `users` table.
 *
 * Usage:
 *   CLERK_SECRET_KEY=sk_xxx node scripts/backfill-users.mjs staging
 *   CLERK_SECRET_KEY=sk_xxx node scripts/backfill-users.mjs production
 *
 * What it does:
 *   1. Paginates through GET /v1/users on Clerk Backend API (max 500/page).
 *   2. Extracts user_id + primary email for each user.
 *   3. Generates INSERT OR REPLACE statements.
 *   4. Pipes them to `wrangler d1 execute creative-agent-db[-prod] --remote --file=-`.
 *
 * Safe to re-run — INSERT OR REPLACE is idempotent on user_id PK.
 */

import { spawn } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const env = process.argv[2]
if (!env || (env !== 'staging' && env !== 'production')) {
  console.error('Usage: node scripts/backfill-users.mjs <staging|production>')
  process.exit(1)
}

const CLERK_SECRET = process.env.CLERK_SECRET_KEY
if (!CLERK_SECRET) {
  console.error('CLERK_SECRET_KEY env var required')
  process.exit(1)
}

const DB_NAME = env === 'production' ? 'creative-agent-db-prod' : 'creative-agent-db'

async function listAllUsers() {
  const all = []
  const limit = 500
  let offset = 0
  while (true) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const resp = await fetch(`https://api.clerk.com/v1/users?${params}`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    })
    if (!resp.ok) {
      console.error(`Clerk API ${resp.status}: ${await resp.text()}`)
      process.exit(1)
    }
    const page = await resp.json()
    if (!Array.isArray(page) || page.length === 0) break
    all.push(...page)
    if (page.length < limit) break
    offset += limit
  }
  return all
}

function pickEmail(u) {
  if (!u.email_addresses || u.email_addresses.length === 0) return null
  if (u.primary_email_address_id) {
    const match = u.email_addresses.find((e) => e.id === u.primary_email_address_id)
    if (match) return match.email_address
  }
  return u.email_addresses[0].email_address
}

function sqlEscape(s) {
  return s.replace(/'/g, "''")
}

const users = await listAllUsers()
console.log(`Fetched ${users.length} users from Clerk`)

const rows = users
  .map((u) => ({ id: u.id, email: pickEmail(u) }))
  .filter((r) => r.id && r.email)

if (rows.length === 0) {
  console.log('No users with valid email — nothing to backfill.')
  process.exit(0)
}

const sql = rows
  .map(
    (r) =>
      `INSERT INTO users (user_id, email) VALUES ('${sqlEscape(r.id)}', '${sqlEscape(r.email)}') ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, updated_at = datetime('now');`,
  )
  .join('\n')

const tmpFile = join(tmpdir(), `backfill-users-${Date.now()}.sql`)
writeFileSync(tmpFile, sql, 'utf8')
console.log(`Wrote ${rows.length} INSERT statements to ${tmpFile}`)
console.log(`Running on D1: ${DB_NAME}`)

const wrangler = spawn(
  'npx',
  ['wrangler', 'd1', 'execute', DB_NAME, '--remote', `--file=${tmpFile}`],
  { stdio: 'inherit', cwd: new URL('../cloudflare', import.meta.url).pathname },
)

wrangler.on('exit', (code) => {
  try {
    unlinkSync(tmpFile)
  } catch {
    /* ignore */
  }
  if (code === 0) console.log(`✓ Backfilled ${rows.length} users into ${DB_NAME}`)
  else console.error(`✗ wrangler exited with code ${code}`)
  process.exit(code ?? 0)
})
