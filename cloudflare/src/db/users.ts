/**
 * Users table — mirror of Clerk identity, kept in sync via /webhooks/clerk.
 * Clerk owns identity; this table lets us do email→user_id lookups in D1.
 */

export interface UserRow {
  user_id: string
  email: string
  created_at: string
  updated_at: string
}

/** INSERT or UPDATE — idempotent for user.created / user.updated events. */
export async function upsertUser(db: D1Database, userId: string, email: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (user_id, email)
       VALUES (?1, ?2)
       ON CONFLICT(user_id) DO UPDATE SET
         email = excluded.email,
         updated_at = datetime('now')`,
    )
    .bind(userId, email)
    .run()
}

/** Hard delete — fires on user.deleted webhook. */
export async function deleteUser(db: D1Database, userId: string): Promise<void> {
  await db.prepare(`DELETE FROM users WHERE user_id = ?1`).bind(userId).run()
}

/** Email lookup — primary use case is the admin grant flow. */
export async function getUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  const row = await db
    .prepare(`SELECT user_id, email, created_at, updated_at FROM users WHERE email = ?1 LIMIT 1`)
    .bind(email)
    .first<UserRow>()
  return row ?? null
}

export async function getUserById(db: D1Database, userId: string): Promise<UserRow | null> {
  const row = await db
    .prepare(`SELECT user_id, email, created_at, updated_at FROM users WHERE user_id = ?1`)
    .bind(userId)
    .first<UserRow>()
  return row ?? null
}
