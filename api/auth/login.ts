import { handleLogin } from '../../server/handlers.js'

export default function handler(req: any, res: any) {
  return handleLogin(req, res)
}
