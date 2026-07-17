import { createApp } from './app.js'

const app = createApp()
const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
