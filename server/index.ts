import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { db } from './db.js'
import { requireAuth, signToken } from './auth.js'
import { getDefaultStoreJson, parseStore } from './vacationStore.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json({ limit: '1mb' }))

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

app.post('/api/auth/register', (req, res) => {
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

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' })
    return
  }

  const id = crypto.randomUUID()
  const passwordHash = bcrypt.hashSync(password, 10)
  const createdAt = new Date().toISOString()

  db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    email,
    passwordHash,
    createdAt,
  )

  db.prepare('INSERT INTO vacation_stores (user_id, data, updated_at) VALUES (?, ?, ?)').run(
    id,
    getDefaultStoreJson(),
    createdAt,
  )

  const user = { id, email }
  res.status(201).json({ token: signToken(user), user })
})

app.post('/api/auth/login', (req, res) => {
  const email = normalizeEmail(String(req.body.email ?? ''))
  const password = String(req.body.password ?? '')

  const row = db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(email) as { id: string; email: string; password_hash: string } | undefined

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const user = { id: row.id, email: row.email }
  res.json({ token: signToken(user), user })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

app.get('/api/vacations', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT data FROM vacation_stores WHERE user_id = ?')
    .get(req.user!.id) as { data: string } | undefined

  if (!row) {
    const now = new Date().toISOString()
    const data = getDefaultStoreJson()
    db.prepare('INSERT INTO vacation_stores (user_id, data, updated_at) VALUES (?, ?, ?)').run(
      req.user!.id,
      data,
      now,
    )
    res.json(JSON.parse(data))
    return
  }

  res.json(parseStore(row.data))
})

app.put('/api/vacations', requireAuth, (req, res) => {
  const store = req.body
  if (!store || !Array.isArray(store.vacations) || store.vacations.length === 0) {
    res.status(400).json({ error: 'Invalid vacation data' })
    return
  }

  const data = JSON.stringify(store)
  const updatedAt = new Date().toISOString()

  db.prepare(
    `
    INSERT INTO vacation_stores (user_id, data, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `,
  ).run(req.user!.id, data, updatedAt)

  res.json({ ok: true })
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
