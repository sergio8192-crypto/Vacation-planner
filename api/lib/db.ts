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

function getTursoUrl(): string | undefined {
  return (
    process.env.TURSO_DATABASE_URL?.trim() ||
    process.env.LIBSQL_URL?.trim() ||
    process.env.TURSO_CONNECTION_URL?.trim()
  )
}

function getTursoToken(): string | undefined {
  return (
    process.env.TURSO_AUTH_TOKEN?.trim() ||
    process.env.LIBSQL_AUTH_TOKEN?.trim()
  )
}

function createDbClient(): Client {
  const tursoUrl = getTursoUrl()
  if (tursoUrl) {
    const factory = process.env.VERCEL ? createWebClient : createNodeClient
    return factory({
      url: tursoUrl,
      authToken: getTursoToken(),
    })
  }

  const __dirname = dirname(fileURLToPath(import.meta.url))
  const dbPath = join(__dirname, '..', '..', 'server', 'data', 'app.db')
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
      await db.execute(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token_hash TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash
        ON password_reset_tokens(token_hash)
      `)
    })().catch((error) => {
      initPromise = null
      throw error
    })
  }
  await initPromise
}

export function isTursoConfigured(): boolean {
  return Boolean(getTursoUrl())
}

export function getDbConfigError(): string | null {
  if (process.env.VERCEL !== '1') return null

  const url = getTursoUrl()
  const token = getTursoToken()
  const urlKeyExists =
    'TURSO_DATABASE_URL' in process.env ||
    'LIBSQL_URL' in process.env ||
    'TURSO_CONNECTION_URL' in process.env
  const tokenKeyExists = 'TURSO_AUTH_TOKEN' in process.env || 'LIBSQL_AUTH_TOKEN' in process.env

  if (!url) {
    if (urlKeyExists) {
      return 'TURSO_DATABASE_URL exists in Vercel but is empty. Edit it, paste your libsql:// URL from Turso, then redeploy.'
    }
    return 'Database not configured. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel.'
  }

  if (!token) {
    if (tokenKeyExists) {
      return 'TURSO_AUTH_TOKEN exists in Vercel but is empty. Edit it, paste your token from Turso, then redeploy.'
    }
    return 'Database not configured. Add TURSO_AUTH_TOKEN in Vercel.'
  }

  return null
}
