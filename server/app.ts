import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { initDb, getDb } from './db.js'
import { requireAuth, signToken } from './auth.js'
import { getDefaultStoreJson, parseStore } from './vacationStore.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  app.use(async (_req, res, next) => {
    try {
      await initDb()
      next()
    } catch {
      res.status(503).json({
        error: isProductionWithoutDb()
          ? 'Database not configured. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel.'
          : 'Database unavailable',
      })
    }
  })

  app.post('/api/auth/register', async (req, res) => {
    const email = normalizeEmail(String(req.body.email ?? ''))
    const password = String(req.body.password ?? '')

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
  })

  app.post('/api/auth/login', async (req, res) => {
    const email = normalizeEmail(String(req.body.email ?? ''))
    const password = String(req.body.password ?? '')

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
    res.json({ token: signToken(user), user })
  })

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: req.user })
  })

  app.get('/api/vacations', requireAuth, async (req, res) => {
    const result = await getDb().execute({
      sql: 'SELECT data FROM vacation_stores WHERE user_id = ?',
      args: [req.user!.id],
    })

    const row = result.rows[0]
    if (!row) {
      const now = new Date().toISOString()
      const data = getDefaultStoreJson()
      await getDb().execute({
        sql: 'INSERT INTO vacation_stores (user_id, data, updated_at) VALUES (?, ?, ?)',
        args: [req.user!.id, data, now],
      })
      res.json(JSON.parse(data))
      return
    }

    res.json(parseStore(String(row.data)))
  })

  app.put('/api/vacations', requireAuth, async (req, res) => {
    const store = req.body
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
      args: [req.user!.id, data, updatedAt],
    })

    res.json({ ok: true })
  })

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  return app
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isProductionWithoutDb(): boolean {
  return process.env.VERCEL === '1' && !process.env.TURSO_DATABASE_URL
}
