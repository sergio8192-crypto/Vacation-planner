import { createClient as createNodeClient, type Client } from '@libsql/client'
import { createClient as createWebClient } from '@libsql/client/web'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

let client: Client | null = null
let initPromise: Promise<void> | null = null

const DB_TIMEOUT_MS = 15_000

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), DB_TIMEOUT_MS)
    }),
  ])
}

function createDbClient(): Client {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim()
  if (tursoUrl) {
    const factory = process.env.VERCEL ? createWebClient : createNodeClient
    return factory({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }

  const __dirname = dirname(fileURLToPath(import.meta.url))
  const dbPath = join(__dirname, '..', 'server', 'data', 'app.db')
  mkdirSync(dirname(dbPath), { recursive: true })
  return createNodeClient({ url: `file:${dbPath}` })
}

export function getDb(): Client {
  if (!client) client = createDbClient()
  return client
}

export async function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = getDb()
      await withTimeout(
        db.execute(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        `),
        'Database connection timed out. Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.',
      )
      await db.execute(`
        CREATE TABLE IF NOT EXISTS vacation_stores (
          user_id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
    })().catch((error) => {
      initPromise = null
      throw error
    })
  }
  await initPromise
}

export function isTursoConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL?.trim())
}

export function getDbConfigError(): string | null {
  if (process.env.VERCEL === '1' && !isTursoConfigured()) {
    return 'Database not configured. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel.'
  }
  return null
}
