import { handleMe } from '../../server/handlers.js'

export default function handler(req: any, res: any) {
  return handleMe(req, res)
}
