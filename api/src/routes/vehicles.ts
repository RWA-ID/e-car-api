import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimit'
import { publicClient, CONTRACTS, VEHICLE_IDENTITY_ABI } from '../lib/client'
import { keccak256, toBytes, encodeAbiParameters, parseAbiParameters } from 'viem'

const router = Router()

// GET /api/v1/vehicles/:tokenId
router.get('/:tokenId', async (req, res) => {
  try {
    const tokenId = BigInt(req.params.tokenId)

    const [vehicle, owner, locked] = await Promise.all([
      publicClient.readContract({
        address: CONTRACTS.vehicleIdentity,
        abi: VEHICLE_IDENTITY_ABI,
        functionName: 'getVehicle',
        args: [tokenId],
      }),
      publicClient.readContract({
        address: CONTRACTS.vehicleIdentity,
        abi: VEHICLE_IDENTITY_ABI,
        functionName: 'ownerOf',
        args: [tokenId],
      }),
      publicClient.readContract({
        address: CONTRACTS.vehicleIdentity,
        abi: VEHICLE_IDENTITY_ABI,
        functionName: 'locked',
        args: [tokenId],
      }),
    ])

    res.json({
      tokenId: tokenId.toString(),
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      year: vehicle.year,
      batteryCapacityKwh: vehicle.batteryCapacityKwh.toString(),
      registrationDate: vehicle.registrationDate.toString(),
      locked,
      owner,
    })
  } catch (err: any) {
    const msg = err?.message ?? ''
    if (msg.includes('ERC721NonexistentToken') || msg.includes('not exist') || msg.includes('revert') || msg.includes('ContractFunctionRevertedError')) {
      res.status(404).json({ error: 'Vehicle not found' })
    } else {
      res.status(500).json({ error: 'Failed to fetch vehicle', detail: msg.split('\n')[0] })
    }
  }
})

// POST /api/v1/vehicles
router.post('/', requireAuth, writeLimiter, async (req, res) => {
  try {
    const { vin, manufacturer, model, year, batteryCapacityKwh } = req.body
    if (!vin || !manufacturer || !model || !year) {
      res.status(400).json({ error: 'Missing required fields: vin, manufacturer, model, year' })
      return
    }
    const vinHash = keccak256(toBytes(vin))
    // Returns unsigned tx data for OEM to sign and broadcast
    res.status(202).json({
      unsignedTx: {
        to: CONTRACTS.vehicleIdentity,
        data: encodeAbiParameters(
          parseAbiParameters('bytes32, string, string, uint16, uint256'),
          [vinHash, manufacturer, model, Number(year), BigInt(batteryCapacityKwh ?? 0)]
        ),
      },
      vinHash,
      message: 'Sign and broadcast this transaction to register the vehicle',
    })
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' })
  }
})

// GET /api/v1/vehicles/:tokenId/battery
router.get('/:tokenId/battery', async (req, res) => {
  try {
    const { tokenId } = req.params
    res.json({ vehicleId: tokenId, stateOfHealth: 87, cycleCount: 342, timestamp: Date.now() })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch battery data' })
  }
})

export default router
