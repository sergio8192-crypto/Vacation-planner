import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { initDb, getDb, getDbConfigError } from './db.js'
import { requireAuth, signToken } from './auth.js'
import { getDefaultStoreJson, parseStore } from '../api/lib/vacationStore.js'
import { handleForgotPassword, handleResetPassword } from '../api/lib/handlers.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      turso: Boolean(process.env.TURSO_DATABASE_URL?.trim()),
    })
  })

  app.use(async (req, res, next) => {
    const configError = getDbConfigError()
    if (configError) {
      res.status(503).json({ error: configError })
      return
    }

    try {
      await initDb()
      next()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Database unavailable'
      res.status(503).json({ error: message })
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

  app.post('/api/auth/forgot-password', async (req, res) => {
    await handleForgotPassword(req, res)
  })

  app.post('/api/auth/reset-password', async (req, res) => {
    await handleResetPassword(req, res)
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

  return app
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
