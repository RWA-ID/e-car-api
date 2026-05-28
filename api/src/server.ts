import 'dotenv/config'
import http from 'http'
import { createApp } from './app'
import { initWebSocket } from './ws/events'

const PORT = Number(process.env.PORT ?? 3001)
const app = createApp()
const server = http.createServer(app)
initWebSocket(server)

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║        e-car.eth Protocol API          ║
╠════════════════════════════════════════╣
║  REST     → http://localhost:${PORT}/api/v1  ║
║  GraphQL  → http://localhost:${PORT}/graphql ║
║  WebSocket→ ws://localhost:${PORT}/ws        ║
║  Docs     → http://localhost:${PORT}/docs    ║
╚════════════════════════════════════════╝
  `)
})
