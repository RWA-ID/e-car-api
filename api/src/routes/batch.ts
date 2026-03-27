import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimit'
import { keccak256, encodePacked, toBytes } from 'viem'
import crypto from 'crypto'
import { CONTRACTS } from '../lib/client'

const router = Router()

// In-memory batch store (survives restarts poorly — acceptable for Sepolia testnet)
interface BatchEntry {
  batchId: string
  merkleRoot: `0x${string}`
  manufacturer: string
  model: string
  year: number
  batteryCapacityKwh: number
  defaultSoulbound: boolean
  total: number
  createdAt: string
  vehicles: {
    vin: string
    vinHash: `0x${string}`
    soulbound: boolean
    leaf: `0x${string}`
    proof: `0x${string}`[]
  }[]
}

const batches = new Map<string, BatchEntry>()

// Build Merkle tree — returns root and per-leaf proofs
function buildMerkleTree(leaves: `0x${string}`[]): {
  root: `0x${string}`
  proofs: `0x${string}`[][]
} {
  if (leaves.length === 0) throw new Error('No leaves provided')

  // Pad to even length
  const layer0 = leaves.length % 2 === 0
    ? [...leaves]
    : [...leaves, leaves[leaves.length - 1]]

  const allLayers: `0x${string}`[][] = [layer0]
  let layer = layer0

  while (layer.length > 1) {
    const next: `0x${string}`[] = []
    for (let i = 0; i < layer.length; i += 2) {
      const [a, b] = layer[i] < layer[i + 1]
        ? [layer[i], layer[i + 1]]
        : [layer[i + 1], layer[i]]
      next.push(keccak256(encodePacked(['bytes32', 'bytes32'], [a, b])))
    }
    layer = next
    allLayers.push(layer)
  }

  const root = layer[0]

  const proofs = leaves.map((_, idx) => {
    const proof: `0x${string}`[] = []
    let index = idx
    // Account for padding in layer0
    if (index >= leaves.length) return proof
    for (let l = 0; l < allLayers.length - 1; l++) {
      const sibling = index % 2 === 0
        ? allLayers[l][index + 1]
        : allLayers[l][index - 1]
      if (sibling !== undefined) proof.push(sibling)
      index = Math.floor(index / 2)
    }
    return proof
  })

  return { root, proofs }
}

/**
 * POST /api/v1/vehicles/batch/preauthorize
 * OEM submits a list of VINs — API generates Merkle tree and returns root + proofs.
 * OEM then calls MerkleOracle.submitRoot(batchId, root) on-chain to commit.
 *
 * Body:
 *   vins: string[]                        — array of VINs (max 100,000)
 *   manufacturer: string
 *   model: string
 *   year: number
 *   batteryCapacityKwh: number
 *   soulbound: boolean                    — default for all vehicles
 *   overrides?: { vin: string, soulbound: boolean }[]  — per-vehicle overrides
 */
router.post('/preauthorize', requireAuth, writeLimiter, async (req, res) => {
  const { vins, manufacturer, model, year, batteryCapacityKwh, soulbound = true, overrides = [] } = req.body

  if (!Array.isArray(vins) || vins.length === 0) {
    res.status(400).json({ error: 'vins must be a non-empty array' })
    return
  }
  if (vins.length > 100_000) {
    res.status(400).json({ error: 'Maximum 100,000 VINs per batch' })
    return
  }
  if (!manufacturer || !model || !year) {
    res.status(400).json({ error: 'manufacturer, model, and year required' })
    return
  }

  // Build override lookup
  const overrideMap = new Map<string, boolean>()
  for (const o of overrides) {
    if (o.vin && typeof o.soulbound === 'boolean') overrideMap.set(o.vin, o.soulbound)
  }

  // Compute leaf for each VIN:
  // leaf = keccak256(abi.encodePacked(vinHash, soulbound_flag))
  // where vinHash = keccak256(vin) and soulbound_flag is 0x01 or 0x00
  const vehicles = vins.map((vin: string) => {
    const isSoulbound = overrideMap.has(vin) ? overrideMap.get(vin)! : soulbound
    const vinHash = keccak256(toBytes(vin)) as `0x${string}`
    const leaf = keccak256(
      encodePacked(['bytes32', 'bool'], [vinHash, isSoulbound])
    ) as `0x${string}`
    return { vin, vinHash, soulbound: isSoulbound, leaf }
  })

  // Build Merkle tree from leaves
  const leafHashes = vehicles.map(v => v.leaf)
  const { root, proofs } = buildMerkleTree(leafHashes)

  const batchId = `batch_${crypto.randomBytes(8).toString('hex')}`

  const entry: BatchEntry = {
    batchId,
    merkleRoot: root,
    manufacturer,
    model,
    year: Number(year),
    batteryCapacityKwh: Number(batteryCapacityKwh ?? 0),
    defaultSoulbound: soulbound,
    total: vins.length,
    createdAt: new Date().toISOString(),
    vehicles: vehicles.map((v, i) => ({ ...v, proof: proofs[i] })),
  }

  batches.set(batchId, entry)

  res.status(201).json({
    batchId,
    merkleRoot: root,
    total: vins.length,
    defaultSoulbound: soulbound,
    overridesApplied: overrides.length,
    soulboundCount: entry.vehicles.filter(v => v.soulbound).length,
    transferableCount: entry.vehicles.filter(v => !v.soulbound).length,
    createdAt: entry.createdAt,
    nextStep: {
      description: 'Submit the Merkle root on-chain to authorize this batch',
      contract: CONTRACTS.merkleOracle,
      calldata: `MerkleOracle.submitRoot("${batchId}", "${root}")`,
    },
    docsHint: `Retrieve individual proofs at GET /api/v1/vehicles/batch/${batchId}/proof/:vin`,
  })
})

/**
 * GET /api/v1/vehicles/batch/:batchId
 * Get batch summary
 */
router.get('/:batchId', requireAuth, async (req, res) => {
  const batch = batches.get(req.params.batchId)
  if (!batch) {
    res.status(404).json({ error: 'Batch not found' })
    return
  }
  res.json({
    batchId: batch.batchId,
    merkleRoot: batch.merkleRoot,
    manufacturer: batch.manufacturer,
    model: batch.model,
    year: batch.year,
    batteryCapacityKwh: batch.batteryCapacityKwh,
    defaultSoulbound: batch.defaultSoulbound,
    total: batch.total,
    soulboundCount: batch.vehicles.filter(v => v.soulbound).length,
    transferableCount: batch.vehicles.filter(v => !v.soulbound).length,
    createdAt: batch.createdAt,
  })
})

/**
 * GET /api/v1/vehicles/batch/:batchId/proof/:vin
 * Get the Merkle proof for a single VIN — called at vehicle registration time
 */
router.get('/:batchId/proof/:vin', async (req, res) => {
  const batch = batches.get(req.params.batchId)
  if (!batch) {
    res.status(404).json({ error: 'Batch not found' })
    return
  }

  const vehicle = batch.vehicles.find(v => v.vin === req.params.vin)
  if (!vehicle) {
    res.status(404).json({ error: 'VIN not found in this batch' })
    return
  }

  res.json({
    batchId: batch.batchId,
    merkleRoot: batch.merkleRoot,
    vin: vehicle.vin,
    vinHash: vehicle.vinHash,
    soulbound: vehicle.soulbound,
    leaf: vehicle.leaf,
    proof: vehicle.proof,
    registrationHint: {
      description: vehicle.soulbound
        ? 'This vehicle will be minted as a soulbound (non-transferable) NFT'
        : 'This vehicle will be minted as a transferable NFT',
      contract: CONTRACTS.vehicleIdentity,
    },
  })
})

/**
 * GET /api/v1/vehicles/batch/:batchId/proofs
 * Get all proofs for a batch (paginated)
 */
router.get('/:batchId/proofs', requireAuth, async (req, res) => {
  const batch = batches.get(req.params.batchId)
  if (!batch) {
    res.status(404).json({ error: 'Batch not found' })
    return
  }

  const limit = Math.min(Number(req.query.limit ?? 500), 1000)
  const offset = Number(req.query.offset ?? 0)
  const slice = batch.vehicles.slice(offset, offset + limit)

  res.json({
    batchId: batch.batchId,
    merkleRoot: batch.merkleRoot,
    total: batch.total,
    limit,
    offset,
    vehicles: slice.map(v => ({
      vin: v.vin,
      vinHash: v.vinHash,
      soulbound: v.soulbound,
      leaf: v.leaf,
      proof: v.proof,
    })),
  })
})

export default router
