import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { ApiRequest, ApiResponse } from './handlers'

type Handler = (req: ApiRequest, res: ApiResponse) => void | Promise<void>

export function withHandler(handler: Handler) {
  return async function vercelHandler(req: VercelRequest, res: VercelResponse) {
    try {
      await handler(req as ApiRequest, res as ApiResponse)
    } catch (error) {
      console.error('API error:', error)
      if (!res.writableEnded) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error',
        })
      }
    }
  }
}
