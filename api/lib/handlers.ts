import bcrypt from 'bcryptjs'
import { signToken, verifyToken, type AuthUser } from './auth.js'
import { getDb, getDbConfigError, initDb } from './db.js'
import { getDefaultStoreJson, parseStore } from './vacationStore.js'

export type ApiRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

export type ApiResponse = {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  end?: () => void
  writableEnded?: boolean
}

function getHeader(req: ApiRequest, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()] ?? req.headers[name]
  if (Array.isArray(value)) return value[0]
  return value
}

function readJsonBody<T>(req: ApiRequest): T {
  if (typeof req.body === 'string') {
    return req.body ? (JSON.parse(req.body) as T) : ({} as T)
  }
  return (req.body ?? {}) as T
}

export async function ensureDbReady(res: ApiResponse): Promise<boolean> {
  const configError = getDbConfigError()
  if (configError) {
    res.status(503).json({ error: configError })
    return false
  }
  try {
    await initDb()
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database unavailable'
    res.status(503).json({ error: message })
    return false
  }
}

export function getAuthUser(req: ApiRequest): AuthUser | null {
  const header = getHeader(req, 'authorization')
  if (!header?.startsWith('Bearer ')) return null
  try {
    return verifyToken(header.slice(7))
  } catch {
    return null
  }
}

export function handleHealth(_req: ApiRequest, res: ApiResponse) {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL ||
    process.env.LIBSQL_URL ||
    process.env.TURSO_CONNECTION_URL ||
    ''
  const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || ''

  res.status(200).json({
    ok: true,
    turso: Boolean(tursoUrl.trim()),
    env: {
      tursoUrlConfigured: 'TURSO_DATABASE_URL' in process.env,
      tursoUrlEmpty: 'TURSO_DATABASE_URL' in process.env && !tursoUrl.trim(),
      tursoTokenConfigured: 'TURSO_AUTH_TOKEN' in process.env,
      tursoTokenEmpty: 'TURSO_AUTH_TOKEN' in process.env && !tursoToken.trim(),
    },
  })
}

export async function handleRegister(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!(await ensureDbReady(res))) return

  const body = readJsonBody<{ email?: string; password?: string }>(req)
  const email = normalizeEmail(String(body.email ?? ''))
  const password = String(body.password ?? '')

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Enter a valid email address' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const db = getDb()
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [email],
  })
  if (existing.rows.length > 0) {
    res.status(409).json({ error: 'An account with this email already exists' })
    return
  }

  const id = crypto.randomUUID()
  const passwordHash = bcrypt.hashSync(password, 10)
  const createdAt = new Date().toISOString()

  await db.batch([
    {
      sql: 'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
      args: [id, email, passwordHash, createdAt],
    },
    {
      sql: 'INSERT INTO vacation_stores (user_id, data, updated_at) VALUES (?, ?, ?)',
      args: [id, getDefaultStoreJson(), createdAt],
    },
  ])

  const user = { id, email }
  res.status(201).json({ token: signToken(user), user })
}

export async function handleLogin(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!(await ensureDbReady(res))) return

  const body = readJsonBody<{ email?: string; password?: string }>(req)
  const email = normalizeEmail(String(body.email ?? ''))
  const password = String(body.password ?? '')

  const result = await getDb().execute({
    sql: 'SELECT id, email, password_hash FROM users WHERE email = ?',
    args: [email],
  })

  const row = result.rows[0]
  if (!row || !bcrypt.compareSync(password, String(row.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const user = { id: String(row.id), email: String(row.email) }
  res.status(200).json({ token: signToken(user), user })
}

export async function handleMe(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const user = getAuthUser(req)
  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  res.status(200).json({ user })
}

export async function handleVacations(req: ApiRequest, res: ApiResponse) {
  const user = getAuthUser(req)
  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  if (!(await ensureDbReady(res))) return

  if (req.method === 'GET') {
    const result = await getDb().execute({
      sql: 'SELECT data FROM vacation_stores WHERE user_id = ?',
      args: [user.id],
    })

    const row = result.rows[0]
    if (!row) {
      const now = new Date().toISOString()
      const data = getDefaultStoreJson()
      await getDb().execute({
        sql: 'INSERT INTO vacation_stores (user_id, data, updated_at) VALUES (?, ?, ?)',
        args: [user.id, data, now],
      })
      res.status(200).json(JSON.parse(data))
      return
    }

    res.status(200).json(parseStore(String(row.data)))
    return
  }

  if (req.method === 'PUT') {
    const store = readJsonBody<{ vacations?: unknown[] }>(req)
    if (!store || !Array.isArray(store.vacations) || store.vacations.length === 0) {
      res.status(400).json({ error: 'Invalid vacation data' })
      return
    }

    const data = JSON.stringify(store)
    const updatedAt = new Date().toISOString()

    await getDb().execute({
      sql: `INSERT INTO vacation_stores (user_id, data, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
      args: [user.id, data, updatedAt],
    })

    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
