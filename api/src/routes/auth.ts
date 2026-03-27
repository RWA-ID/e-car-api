import { Router } from 'express'
import crypto from 'crypto'

const router = Router()

// In-memory store — replace with a database in production
const apiKeys = new Map<string, { tier: string; label: string; createdAt: string; requests: number }>()

const TIERS: Record<string, { monthlyLimit: number; rateLimit: number; price: string }> = {
  free:       { monthlyLimit: 10_000,    rateLimit: 60,   price: '$0/mo' },
  oem:        { monthlyLimit: Infinity,  rateLimit: 1000, price: '$5,000/mo' },
  enterprise: { monthlyLimit: Infinity,  rateLimit: 5000, price: '$25,000/mo' },
}

/**
 * POST /auth/keys
 * Generate a new API key (admin only)
 */
router.post('/keys', (req, res) => {
  const adminSecret = req.headers['x-admin-secret']
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized. Contact e-car@onchain-id.id to request an API key.' })
    return
  }
  const { label, tier = 'free' } = req.body
  if (!label) {
    res.status(400).json({ error: 'label required' })
    return
  }
  if (!TIERS[tier]) {
    res.status(400).json({ error: `Invalid tier. Choose: ${Object.keys(TIERS).join(', ')}` })
    return
  }

  const key = `ecar_${tier.slice(0, 3)}_${crypto.randomBytes(24).toString('hex')}`
  apiKeys.set(key, { tier, label, createdAt: new Date().toISOString(), requests: 0 })

  res.status(201).json({
    apiKey: key,
    tier,
    label,
    limits: TIERS[tier],
    createdAt: new Date().toISOString(),
    warning: tier === 'free' ? 'Free tier is for development only. Upgrade for production use.' : undefined,
  })
})

/**
 * GET /auth/keys/info
 * Get info about the current API key (pass key in x-api-key header)
 */
router.get('/keys/info', (req, res) => {
  const key = req.headers['x-api-key'] as string
  if (!key) {
    res.status(401).json({ error: 'x-api-key header required' })
    return
  }
  const info = apiKeys.get(key)
  if (!info) {
    res.status(404).json({ error: 'API key not found' })
    return
  }
  res.json({
    tier: info.tier,
    label: info.label,
    limits: TIERS[info.tier],
    requestsThisMonth: info.requests,
    createdAt: info.createdAt,
  })
})

/**
 * DELETE /auth/keys
 * Revoke the current API key
 */
router.delete('/keys', (req, res) => {
  const key = req.headers['x-api-key'] as string
  if (!key || !apiKeys.has(key)) {
    res.status(404).json({ error: 'API key not found' })
    return
  }
  apiKeys.delete(key)
  res.json({ revoked: true })
})

/**
 * GET /auth/tiers
 * List available API tiers and pricing
 */
router.get('/tiers', (_req, res) => {
  res.json({
    tiers: Object.entries(TIERS).map(([name, config]) => ({
      name,
      ...config,
      monthlyLimit: config.monthlyLimit === Infinity ? 'unlimited' : config.monthlyLimit,
    })),
  })
})

export { apiKeys }
export default router
