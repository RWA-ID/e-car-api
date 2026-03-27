import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { vehicleLookup } from './handlers/vehicleLookup'
import { batteryStatus } from './handlers/batteryStatus'
import { chargingPrice } from './handlers/chargingPrice'

const app = express()
const PORT = process.env.PORT ?? 3002

app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'e-car-eth ccip-gateway' })
})

// CCIP-Read endpoint: GET /:sender/:data.json
// Called by contracts via OffchainLookup error
app.get('/:sender/:data', async (req, res) => {
  const { sender, data } = req.params
  const callData = data.replace('.json', '')

  try {
    // Route based on function selector (first 4 bytes of callData)
    const selector = callData.slice(0, 10).toLowerCase()

    let result: string
    // 0x...: vehicleLookup selector
    // 0x...: batteryStatus selector
    // 0x...: chargingPrice selector
    // In production, compute actual selectors from ABI
    if (selector === '0x12345678') {
      result = await vehicleLookup(sender, '0x' + callData.slice(10))
    } else if (selector === '0x23456789') {
      result = await batteryStatus(sender, '0x' + callData.slice(10))
    } else if (selector === '0x3456789a') {
      result = await chargingPrice(sender, '0x' + callData.slice(10))
    } else {
      // Default: try vehicle lookup
      result = await vehicleLookup(sender, '0x' + callData.slice(10))
    }

    res.json({ data: result })
  } catch (err) {
    console.error('[ccip-gateway] Error:', err)
    res.status(500).json({ error: 'Gateway error' })
  }
})

app.listen(PORT, () => {
  console.log(`[ccip-gateway] Listening on port ${PORT}`)
})
