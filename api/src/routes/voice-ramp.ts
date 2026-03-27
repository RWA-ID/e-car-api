import { Router } from 'express'
import { writeLimiter } from '../middleware/rateLimit'

const router = Router()

// POST /api/v1/voice/intent
router.post('/intent', writeLimiter, async (req, res) => {
  const { utterance, vehicleId } = req.body
  if (!utterance) {
    res.status(400).json({ error: 'Missing utterance' })
    return
  }
  // TODO: integrate with VoiceRampRouter contract / voice-sdk
  res.json({ intent: 'CHECK_BATTERY', confidence: 0.9, result: 'Battery health is 87% — good.' })
})

// GET /api/v1/ramp/providers
router.get('/providers', (_req, res) => {
  res.json({
    providers: [
      { name: 'moonpay', currencies: ['ETH', 'USDC'], minAmount: 20 },
      { name: 'transak', currencies: ['ETH', 'USDC', 'DAI'], minAmount: 10 },
      { name: 'ramp-network', currencies: ['ETH', 'USDC'], minAmount: 15 },
    ],
  })
})

// POST /api/v1/ramp/initiate
router.post('/initiate', writeLimiter, async (req, res) => {
  const { amount, currency, provider, walletAddress } = req.body
  if (!amount || !currency || !provider) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }
  // Generate ramp URL — in production use actual provider SDKs
  const baseUrls: Record<string, string> = {
    moonpay: 'https://buy.moonpay.com',
    transak: 'https://global.transak.com',
    'ramp-network': 'https://app.ramp.network',
  }
  const base = baseUrls[provider] ?? 'https://buy.moonpay.com'
  const url = `${base}?apiKey=YOUR_KEY&currencyCode=${currency}&baseCurrencyAmount=${amount}&walletAddress=${walletAddress ?? ''}`
  res.json({ url, provider, amount, currency })
})

export default router
