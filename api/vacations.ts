import { handleVacations } from '../server/handlers.js'

export default function handler(req: any, res: any) {
  return handleVacations(req, res)
}
