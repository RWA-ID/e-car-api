import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimit'

const router = Router()

/**
 * GET /api/v1/fleet
 * List all fleets (filtered by operator if authenticated)
 */
router.get('/', requireAuth, async (req, res) => {
  res.json({ fleets: [], total: 0 })
})

/**
 * POST /api/v1/fleet
 * Register a new fleet under fleet.e-car.eth
 */
router.post('/', requireAuth, writeLimiter, async (req, res) => {
  const { name, vehicles, operatorAddress } = req.body
  if (!name || !operatorAddress) {
    res.status(400).json({ error: 'name and operatorAddress required' })
    return
  }
  // TODO: call FleetRegistry.registerFleet via viem
  const fleetId = '0x' + Buffer.from(name).toString('hex').padStart(64, '0')
  res.status(201).json({
    fleetId,
    name,
    ensName: `${name.toLowerCase().replace(/\s+/g, '-')}.fleet.e-car.eth`,
    vehicles: vehicles ?? [],
    operatorAddress,
    txHash: '0x' + '0'.repeat(64),
  })
})

/**
 * GET /api/v1/fleet/:fleetId
 * Get fleet details
 */
router.get('/:fleetId', requireAuth, async (req, res) => {
  const { fleetId } = req.params
  res.json({
    fleetId,
    name: 'unknown',
    vehicles: [],
    geofence: null,
    createdAt: null,
  })
})

/**
 * POST /api/v1/fleet/:fleetId/vehicles
 * Add vehicle to fleet
 */
router.post('/:fleetId/vehicles', requireAuth, writeLimiter, async (req, res) => {
  const { fleetId } = req.params
  const { vehicleId } = req.body
  if (!vehicleId) {
    res.status(400).json({ error: 'vehicleId required' })
    return
  }
  // TODO: call FleetRegistry.addVehicle via viem
  res.status(201).json({ fleetId, vehicleId, txHash: '0x' + '0'.repeat(64) })
})

/**
 * DELETE /api/v1/fleet/:fleetId/vehicles/:vehicleId
 * Remove vehicle from fleet
 */
router.delete('/:fleetId/vehicles/:vehicleId', requireAuth, writeLimiter, async (req, res) => {
  const { fleetId, vehicleId } = req.params
  // TODO: call FleetRegistry.removeVehicle via viem
  res.json({ fleetId, vehicleId, removed: true, txHash: '0x' + '0'.repeat(64) })
})

/**
 * PUT /api/v1/fleet/:fleetId/geofence
 * Set geofence rules for a fleet (stored on-chain)
 */
router.put('/:fleetId/geofence', requireAuth, writeLimiter, async (req, res) => {
  const { fleetId } = req.params
  const { geofence } = req.body
  if (!geofence) {
    res.status(400).json({ error: 'geofence data required' })
    return
  }
  // geofence: { type: 'polygon', coordinates: [[lat,lng],...], ruleType: 'boundary' | 'zone' }
  res.json({ fleetId, geofence, txHash: '0x' + '0'.repeat(64) })
})

/**
 * GET /api/v1/fleet/:fleetId/payments
 * Get aggregated payment summary for fleet
 */
router.get('/:fleetId/payments', requireAuth, async (req, res) => {
  const { fleetId } = req.params
  res.json({
    fleetId,
    totalChargingSpend: '0',
    totalTollSpend: '0',
    totalParkingSpend: '0',
    totalV2GEarnings: '0',
    currency: 'USDC',
    period: '30d',
  })
})

export default router
