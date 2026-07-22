import { createHash, randomBytes } from 'node:crypto'

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

export function generateResetToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function getAppUrl(): string {
  const configured = process.env.APP_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, '')}`
  return 'http://localhost:5173'
}
