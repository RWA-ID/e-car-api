import { Router } from 'express'
import crypto from 'crypto'
import { verifyMessage, getAddress, isAddress } from 'viem'

const router = Router()

// In-memory store — replace with a database in production
const apiKeys = new Map<string, {
  tier: string; label: string; createdAt: string; requests: number; wallet?: string
}>()

// wallet address (checksummed) → api key — for "one key per wallet" lookups
const walletToKey = new Map<string, string>()

// nonce → { wallet, expiresAt } — short-lived sign-in challenges
const nonces = new Map<string, { wallet: string; expiresAt: number }>()
const NONCE_TTL_MS = 10 * 60 * 1000

function pruneNonces() {
  const now = Date.now()
  for (const [k, v] of nonces) if (v.expiresAt < now) nonces.delete(k)
}

function buildSiweMessage(wallet: string, nonce: string, issuedAt: string): string {
  return [
    'e-car.eth wants you to sign in with your Ethereum account:',
    wallet,
    '',
    'Click to issue a free Sepolia testnet API key. This signature does not authorize any transaction.',
    '',
    'URI: https://e-car.eth.limo',
    'Version: 1',
    'Chain ID: 11155111',
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n')
}

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

/**
 * GET /auth/nonce?address=0x…
 * Issue a single-use nonce + SIWE-formatted message for the caller to sign.
 * The nonce is bound to the address and expires after 10 minutes.
 */
router.get('/nonce', (req, res) => {
  pruneNonces()
  const addressRaw = (req.query.address as string | undefined) ?? ''
  if (!isAddress(addressRaw)) {
    res.status(400).json({ error: 'Valid ?address=0x… query param required' })
    return
  }
  const wallet = getAddress(addressRaw)
  const nonce = crypto.randomBytes(16).toString('hex')
  const issuedAt = new Date().toISOString()
  nonces.set(nonce, { wallet, expiresAt: Date.now() + NONCE_TTL_MS })
  res.json({
    nonce,
    message: buildSiweMessage(wallet, nonce, issuedAt),
    issuedAt,
    expiresInSeconds: NONCE_TTL_MS / 1000,
  })
})

/**
 * POST /auth/keys/wallet
 * Body: { address, nonce, signature, message }
 * Verifies the EIP-191 personal_sign signature and mints (or returns) a free-tier
 * API key for the wallet. Idempotent per wallet — repeat calls return the same key.
 */
router.post('/keys/wallet', async (req, res) => {
  pruneNonces()
  const { address, nonce, signature, message } = req.body ?? {}
  if (!address || !nonce || !signature || !message) {
    res.status(400).json({ error: 'address, nonce, signature, and message are required' })
    return
  }
  if (!isAddress(address)) {
    res.status(400).json({ error: 'Invalid address' })
    return
  }
  const wallet = getAddress(address)

  const entry = nonces.get(nonce)
  if (!entry) {
    res.status(400).json({ error: 'Unknown or expired nonce — request a new one from /auth/nonce' })
    return
  }
  if (entry.wallet !== wallet) {
    res.status(400).json({ error: 'Nonce was issued for a different address' })
    return
  }
  if (!message.includes(`Nonce: ${nonce}`)) {
    res.status(400).json({ error: 'Message does not contain the issued nonce' })
    return
  }

  let valid = false
  try {
    valid = await verifyMessage({ address: wallet, message, signature })
  } catch {
    valid = false
  }
  if (!valid) {
    res.status(401).json({ error: 'Signature verification failed' })
    return
  }

  // Burn the nonce — single use
  nonces.delete(nonce)

  // One key per wallet — re-issue the existing one rather than spawning duplicates
  const existing = walletToKey.get(wallet)
  if (existing && apiKeys.has(existing)) {
    const info = apiKeys.get(existing)!
    res.json({
      apiKey: existing,
      tier: info.tier,
      wallet,
      reused: true,
      limits: TIERS[info.tier],
      createdAt: info.createdAt,
    })
    return
  }

  const key = `ecar_fre_${crypto.randomBytes(24).toString('hex')}`
  const createdAt = new Date().toISOString()
  apiKeys.set(key, {
    tier: 'free',
    label: `wallet:${wallet}`,
    createdAt,
    requests: 0,
    wallet,
  })
  walletToKey.set(wallet, key)

  res.status(201).json({
    apiKey: key,
    tier: 'free',
    wallet,
    reused: false,
    limits: TIERS.free,
    createdAt,
    network: 'sepolia',
    docs: 'https://earnest-harmony-e-car.up.railway.app/docs',
  })
})

export { apiKeys, walletToKey, nonces, buildSiweMessage }
export default router
