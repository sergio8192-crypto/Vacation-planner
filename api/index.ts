import serverless from 'serverless-http'
import { createApp } from '../server/app.js'

const app = createApp()

export default serverless(app)
