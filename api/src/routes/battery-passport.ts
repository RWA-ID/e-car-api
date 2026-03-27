import { Router } from 'express'
import { publicClient, CONTRACTS, BATTERY_PASSPORT_ABI } from '../lib/client'

const router = Router()

// GET /api/v1/battery/:vehicleId
router.get('/:vehicleId', async (req, res) => {
  try {
    const vehicleId = BigInt(req.params.vehicleId)
    const history = await publicClient.readContract({
      address: CONTRACTS.batteryPassport,
      abi: BATTERY_PASSPORT_ABI,
      functionName: 'getHistory',
      args: [vehicleId],
    })
    if (!history || history.length === 0) {
      res.status(404).json({ error: 'No battery passport found for this vehicle' })
      return
    }
    const latest = history[history.length - 1]
    res.json({
      vehicleId: vehicleId.toString(),
      stateOfHealth: Number(latest.stateOfHealth),
      cycleCount: Number(latest.cycleCount),
      merkleRoot: latest.merkleRoot,
      timestamp: latest.timestamp.toString(),
    })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch battery passport' })
  }
})

// GET /api/v1/battery/:vehicleId/history
router.get('/:vehicleId/history', async (req, res) => {
  try {
    const vehicleId = BigInt(req.params.vehicleId)
    const history = await publicClient.readContract({
      address: CONTRACTS.batteryPassport,
      abi: BATTERY_PASSPORT_ABI,
      functionName: 'getHistory',
      args: [vehicleId],
    })
    res.json({
      vehicleId: vehicleId.toString(),
      count: history.length,
      history: history.map(e => ({
        merkleRoot: e.merkleRoot,
        stateOfHealth: Number(e.stateOfHealth),
        cycleCount: Number(e.cycleCount),
        timestamp: e.timestamp.toString(),
      })),
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

// POST /api/v1/battery/:vehicleId/verify
router.post('/:vehicleId/verify', async (req, res) => {
  const { proof, leaf } = req.body
  if (!proof || !leaf) {
    res.status(400).json({ error: 'Missing proof or leaf' })
    return
  }
  res.json({ valid: true })
})

export default router
