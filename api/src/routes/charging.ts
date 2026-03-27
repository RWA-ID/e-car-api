import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimit'
import { publicClient, CONTRACTS, CHARGING_REGISTRY_ABI } from '../lib/client'
import { keccak256, toBytes } from 'viem'

const router = Router()

// nodeId = keccak256(abi.encodePacked(stationId, brand, operator))
// Maintained as stations register via API
const knownStationNodeIds: `0x${string}`[] = [
  '0x16ee195ce43464aa0159cc05a804b668373b135970534f28ae30daddc0c586c2',
]

/**
 * GET /api/v1/charging/stations
 * List all registered charging stations
 */
router.get('/stations', async (req, res) => {
  const { brand, limit = '20', offset = '0' } = req.query
  try {
    const results = await Promise.all(
      knownStationNodeIds.map(async nodeId => {
        const s = await publicClient.readContract({
          address: CONTRACTS.chargingRegistry,
          abi: CHARGING_REGISTRY_ABI,
          functionName: 'getStation',
          args: [nodeId],
        })
        return {
          nodeId,
          stationId: s.id,
          brand: s.brand,
          operator: s.operator,
          pricePerKwh: s.pricePerKwh.toString(),
          active: s.active,
          ensName: `${s.id.toLowerCase()}.${s.brand}.e-car.eth`,
        }
      })
    )
    let stations = results.filter(s => s.active)
    if (brand) stations = stations.filter(s => s.brand === brand)
    const total = stations.length
    const lim = Number(limit)
    const off = Number(offset)
    res.json({ stations: stations.slice(off, off + lim), total, limit: lim, offset: off })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch stations', detail: err?.message?.split('\n')[0] })
  }
})

/**
 * POST /api/v1/charging/stations
 * Register a new charging station
 */
router.post('/stations', requireAuth, writeLimiter, async (req, res) => {
  const { stationId, brand, pricePerKwh, operatorAddress } = req.body
  if (!stationId || !brand || pricePerKwh === undefined || !operatorAddress) {
    res.status(400).json({ error: 'stationId, brand, pricePerKwh, and operatorAddress required' })
    return
  }
  // nodeId = keccak256(abi.encodePacked(stationId, brand, operator))
  const nodeId = keccak256(
    new Uint8Array([
      ...toBytes(stationId),
      ...toBytes(brand),
      ...toBytes(operatorAddress as `0x${string}`),
    ])
  ) as `0x${string}`
  if (!knownStationNodeIds.includes(nodeId)) {
    knownStationNodeIds.push(nodeId)
  }
  res.status(201).json({
    nodeId,
    stationId,
    brand,
    ensName: `${stationId.toLowerCase()}.${brand}.e-car.eth`,
    pricePerKwh: pricePerKwh.toString(),
    active: true,
    message: 'Sign and broadcast registerStation() to complete registration',
  })
})

/**
 * GET /api/v1/charging/stations/:nodeId
 * Get charging station details
 */
router.get('/stations/:nodeId', async (req, res) => {
  try {
    const nodeId = req.params.nodeId as `0x${string}`
    const station = await publicClient.readContract({
      address: CONTRACTS.chargingRegistry,
      abi: CHARGING_REGISTRY_ABI,
      functionName: 'getStation',
      args: [nodeId],
    })
    res.json({
      nodeId,
      stationId: station.id,
      brand: station.brand,
      operator: station.operator,
      pricePerKwh: station.pricePerKwh.toString(),
      active: station.active,
      ensName: `${station.id.toLowerCase()}.${station.brand}.e-car.eth`,
    })
  } catch (err: any) {
    res.status(404).json({ error: 'Station not found' })
  }
})

/**
 * PATCH /api/v1/charging/stations/:nodeId/price
 * Update station kWh price
 */
router.patch('/stations/:nodeId/price', requireAuth, writeLimiter, async (req, res) => {
  const { nodeId } = req.params
  const { pricePerKwh } = req.body
  if (pricePerKwh === undefined) {
    res.status(400).json({ error: 'pricePerKwh required' })
    return
  }
  // TODO: call ChargingStationRegistry.updatePrice via viem
  res.json({ nodeId, pricePerKwh, txHash: '0x' + '0'.repeat(64) })
})

/**
 * DELETE /api/v1/charging/stations/:nodeId
 * Deactivate a charging station
 */
router.delete('/stations/:nodeId', requireAuth, writeLimiter, async (req, res) => {
  const { nodeId } = req.params
  // TODO: call ChargingStationRegistry.deactivateStation via viem
  res.json({ nodeId, active: false, txHash: '0x' + '0'.repeat(64) })
})

/**
 * GET /api/v1/charging/sessions
 * List charging sessions (filter by vehicle or station)
 */
router.get('/sessions', requireAuth, async (req, res) => {
  const { vehicleId, stationId, status, limit = '20' } = req.query
  res.json({ sessions: [], total: 0, limit: Number(limit) })
})

/**
 * POST /api/v1/charging/sessions
 * Initiate a charging session (creates escrow)
 */
router.post('/sessions', requireAuth, writeLimiter, async (req, res) => {
  const { stationNodeId, vehicleId, estimatedKwh, token = 'ETH' } = req.body
  if (!stationNodeId || !vehicleId || !estimatedKwh) {
    res.status(400).json({ error: 'stationNodeId, vehicleId, and estimatedKwh required' })
    return
  }
  // TODO: call ChargingPaymentRouter.initiateChargingSession via viem
  const estimatedCost = (Number(estimatedKwh) * 0.32).toFixed(6)
  res.status(201).json({
    sessionId: `sess_${Date.now()}`,
    escrowId: '1',
    stationNodeId,
    vehicleId,
    estimatedKwh,
    estimatedCost,
    token,
    status: 'ACTIVE',
    startedAt: new Date().toISOString(),
    txHash: '0x' + '0'.repeat(64),
  })
})

/**
 * POST /api/v1/charging/sessions/:sessionId/finalize
 * Finalize a charging session with actual kWh consumed
 */
router.post('/sessions/:sessionId/finalize', requireAuth, writeLimiter, async (req, res) => {
  const { sessionId } = req.params
  const { actualKwh, escrowId } = req.body
  if (!actualKwh || !escrowId) {
    res.status(400).json({ error: 'actualKwh and escrowId required' })
    return
  }
  const finalCost = (Number(actualKwh) * 0.32).toFixed(6)
  // TODO: call ChargingPaymentRouter.finalizeSession via viem
  res.json({
    sessionId,
    escrowId,
    actualKwh,
    finalCost,
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    txHash: '0x' + '0'.repeat(64),
  })
})

/**
 * GET /api/v1/charging/price/:stationNodeId
 * Get current kWh price for a station (via CCIP gateway)
 */
router.get('/price/:stationNodeId', async (req, res) => {
  const { stationNodeId } = req.params
  const { kwh = '30' } = req.query
  const pricePerKwh = 0.32
  res.json({
    stationNodeId,
    pricePerKwh,
    estimatedTotal: (pricePerKwh * Number(kwh)).toFixed(6),
    currency: 'USDC',
    updatedAt: new Date().toISOString(),
  })
})

export default router
