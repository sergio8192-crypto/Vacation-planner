import { handleRegister } from '../server/handlers.js'

export default function handler(req: any, res: any) {
  return handleRegister(req, res)
}
