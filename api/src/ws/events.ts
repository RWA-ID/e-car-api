import type { Server as HttpServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'

interface WsClient {
  ws: WebSocket
  subscriptions: Set<string>
}

const clients = new Map<string, WsClient>()

export function initWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    const clientId = crypto.randomUUID()
    clients.set(clientId, { ws, subscriptions: new Set() })
    console.log(`[ws] Client connected: ${clientId}`)

    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      message: 'Connected to e-car.eth event stream',
      availableChannels: [
        'vehicles',          // VehicleRegistered, VehicleTransferred
        'battery',           // PassportUpdated
        'charging',          // SessionInitiated, SessionFinalized
        'payments',          // EscrowCreated, EscrowReleased
        'brands',            // NamespaceCreated, BrandReserved
        'carbon',            // CreditsM inted, CreditsRetired
        'v2g',               // V2GSessionSettled
      ],
    }))

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type: string; channel?: string }
        const client = clients.get(clientId)
        if (!client) return

        if (msg.type === 'subscribe' && msg.channel) {
          client.subscriptions.add(msg.channel)
          ws.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }))
        }

        if (msg.type === 'unsubscribe' && msg.channel) {
          client.subscriptions.delete(msg.channel)
          ws.send(JSON.stringify({ type: 'unsubscribed', channel: msg.channel }))
        }

        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }))
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
      }
    })

    ws.on('close', () => {
      clients.delete(clientId)
      console.log(`[ws] Client disconnected: ${clientId}`)
    })
  })

  console.log('[ws] WebSocket server initialized at /ws')
  return wss
}

/** Broadcast an event to all clients subscribed to a channel */
export function broadcast(channel: string, event: Record<string, unknown>) {
  const payload = JSON.stringify({ type: 'event', channel, ...event, ts: Date.now() })
  for (const [, client] of clients) {
    if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload)
    }
  }
}

/** Emit a vehicle event */
export const emitVehicleRegistered = (tokenId: string, manufacturer: string, model: string) =>
  broadcast('vehicles', { event: 'VehicleRegistered', tokenId, manufacturer, model })

/** Emit a charging session event */
export const emitSessionStarted = (sessionId: string, stationId: string, vehicleId: string) =>
  broadcast('charging', { event: 'SessionStarted', sessionId, stationId, vehicleId })

export const emitSessionFinalized = (sessionId: string, actualKwh: number, finalCost: string) =>
  broadcast('charging', { event: 'SessionFinalized', sessionId, actualKwh, finalCost })

/** Emit a payment event */
export const emitEscrowCreated = (escrowId: string, amount: string, pType: string) =>
  broadcast('payments', { event: 'EscrowCreated', escrowId, amount, paymentType: pType })

export const emitEscrowReleased = (escrowId: string) =>
  broadcast('payments', { event: 'EscrowReleased', escrowId })
