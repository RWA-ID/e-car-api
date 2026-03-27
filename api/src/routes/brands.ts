import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimit'

const router = Router()

/**
 * GET /api/v1/brands
 * List all claimed and reserved brand namespaces
 */
router.get('/', async (req, res) => {
  const { status, limit = '20', offset = '0' } = req.query
  // TODO: query from subgraph or NamespaceGovernorFactory contract
  res.json({
    brands: [],
    total: 0,
    limit: Number(limit),
    offset: Number(offset),
  })
})

/**
 * GET /api/v1/brands/:brand
 * Get brand namespace info
 */
router.get('/:brand', async (req, res) => {
  const { brand } = req.params
  const RESERVED = [
    'tesla','ford','rivian','byd','lucid','bmw','mercedes','gm','hyundai',
    'nio','polestar','volkswagen','audi','porsche','volvo','kia','toyota',
    'honda','chevrolet','cadillac','genesis','fisker','vinfast','xpeng',
    'zeekr','lotus','maserati','jaguar','mini','smart','cupra','renault',
    'peugeot','citroen','opel',
  ]
  res.json({
    brand: brand.toLowerCase(),
    ensName: `${brand.toLowerCase()}.e-car.eth`,
    reserved: RESERVED.includes(brand.toLowerCase()),
    claimed: false,
    registry: null,
    resolver: null,
    multiSig: null,
    claimedAt: null,
    claimedBy: null,
  })
})

/**
 * POST /api/v1/brands/:brand/claim
 * Initiate brand namespace claim (returns unsigned tx for OEM to sign)
 */
router.post('/:brand/claim', requireAuth, writeLimiter, async (req, res) => {
  const { brand } = req.params
  const { signerAddress } = req.body
  if (!signerAddress) {
    res.status(400).json({ error: 'signerAddress required' })
    return
  }
  // TODO: build unsigned tx via viem, return for OEM to sign and broadcast
  res.status(202).json({
    brand: brand.toLowerCase(),
    fee: '10000000000000000000', // 10 ETH in wei
    unsignedTx: {
      to: '0x0000000000000000000000000000000000000000',
      data: '0x',
      value: '10000000000000000000',
    },
    message: 'Sign and broadcast this transaction to claim the namespace',
  })
})

/**
 * GET /api/v1/brands/:brand/vehicles
 * List all vehicles under a brand namespace
 */
router.get('/:brand/vehicles', async (req, res) => {
  const { brand } = req.params
  const { limit = '20', offset = '0' } = req.query
  // TODO: query from subgraph filtering by brand
  res.json({
    brand: brand.toLowerCase(),
    vehicles: [],
    total: 0,
    limit: Number(limit),
    offset: Number(offset),
  })
})

/**
 * GET /api/v1/brands/:brand/stations
 * List charging stations under a brand namespace
 */
router.get('/:brand/stations', async (req, res) => {
  const { brand } = req.params
  res.json({
    brand: brand.toLowerCase(),
    stations: [],
    total: 0,
  })
})

export default router
