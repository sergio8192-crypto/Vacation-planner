import type { Request, Response, NextFunction } from 'express'
import { verifyToken, type AuthUser } from '../api/lib/auth.js'

export type { AuthUser } from '../api/lib/auth.js'
export { signToken, verifyToken } from '../api/lib/auth.js'

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    req.user = verifyToken(header.slice(7))
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
