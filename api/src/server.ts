import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { standardLimiter } from './middleware/rateLimit'
import vehiclesRouter from './routes/vehicles'
import batteryRouter from './routes/battery-passport'
import payRouter from './routes/pay'
import voiceRampRouter from './routes/voice-ramp'
import merkleRouter from './routes/merkle-proof'
import brandsRouter from './routes/brands'
import fleetRouter from './routes/fleet'
import carbonRouter from './routes/carbon'
import chargingRouter from './routes/charging'
import authRouter from './routes/auth'
import { openApiSpec } from './openapi/spec'
import { initWebSocket } from './ws/events'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

app.use(cors())
app.use(express.json())
app.use(standardLimiter)

// ── Docs ──────────────────────────────────────────────────────────────────────
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'e-car.eth API',
  customCss: '.swagger-ui .topbar { background: #050d1a; } .swagger-ui .topbar-wrapper img { content: none; }',
}))

app.get('/openapi.json', (_req, res) => res.json(openApiSpec))

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'e-car.eth api',
    version: '0.1.0',
    endpoints: {
      rest:      `http://localhost:${PORT}/api/v1`,
      graphql:   `http://localhost:${PORT}/graphql`,
      websocket: `ws://localhost:${PORT}/ws`,
      docs:      `http://localhost:${PORT}/docs`,
    },
  })
})

// ── Auth ──────────────────────────────────────────────────────────────────────
app.use('/auth', authRouter)

// ── REST routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/vehicles',  vehiclesRouter)
app.use('/api/v1/battery',   batteryRouter)
app.use('/api/v1/pay',       payRouter)
app.use('/api/v1/voice',     voiceRampRouter)
app.use('/api/v1/ramp',      voiceRampRouter)
app.use('/api/v1/merkle',    merkleRouter)
app.use('/api/v1/brands',    brandsRouter)
app.use('/api/v1/fleet',     fleetRouter)
app.use('/api/v1/carbon',    carbonRouter)
app.use('/api/v1/charging',  chargingRouter)

// ── GraphQL ───────────────────────────────────────────────────────────────────
app.use('/graphql', async (req, res, next) => {
  try {
    const { buildSchema } = await import('graphql')
    const { createHandler } = await import('graphql-http/lib/use/express')
    const { typeDefs } = await import('./graphql/schema')
    const { resolvers } = await import('./graphql/resolvers')
    const schema = buildSchema(typeDefs)
    const handler = createHandler({ schema, rootValue: resolvers.Query })
    handler(req, res, next)
  } catch (err) { next(err) }
})

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', docs: `http://localhost:${PORT}/docs` })
})

// ── Start ─────────────────────────────────────────────────────────────────────
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
