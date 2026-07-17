import { handleHealth } from '../server/handlers.js'

export default function handler(req: any, res: any) {
  handleHealth(req, res)
}
