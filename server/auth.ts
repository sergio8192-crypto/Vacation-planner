import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-vacation-planner-secret-change-in-production'

export interface AuthUser {
  id: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    const token = header.slice(7)
    req.user = jwt.verify(token, JWT_SECRET) as AuthUser
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export { JWT_SECRET }
