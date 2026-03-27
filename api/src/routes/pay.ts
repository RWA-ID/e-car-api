import { Router } from 'express'
import { writeLimiter } from '../middleware/rateLimit'

const router = Router()

// POST /api/v1/pay/escrow
router.post('/escrow', writeLimiter, async (req, res) => {
  const { payee, amount, token, paymentType } = req.body
  if (!payee || !amount) {
    res.status(400).json({ error: 'Missing payee or amount' })
    return
  }
  // TODO: call UniversalPaymentEscrow.createEscrow via viem
  res.status(201).json({ escrowId: '1', txHash: '0x' + '0'.repeat(64) })
})

// POST /api/v1/pay/escrow/:id/release
router.post('/escrow/:id/release', writeLimiter, async (req, res) => {
  const { id } = req.params
  // TODO: call UniversalPaymentEscrow.releaseEscrow via viem
  res.json({ escrowId: id, status: 'released', txHash: '0x' + '0'.repeat(64) })
})

// POST /api/v1/pay/charging/initiate
router.post('/charging/initiate', writeLimiter, async (req, res) => {
  const { stationId, estimatedKwh, vehicleId } = req.body
  if (!stationId || !estimatedKwh) {
    res.status(400).json({ error: 'Missing stationId or estimatedKwh' })
    return
  }
  // TODO: call ChargingPaymentRouter.initiateChargingSession via viem
  res.status(201).json({
    escrowId: '1',
    estimatedCost: (estimatedKwh * 0.32).toFixed(2),
    txHash: '0x' + '0'.repeat(64),
  })
})

// POST /api/v1/pay/charging/finalize
router.post('/charging/finalize', writeLimiter, async (req, res) => {
  const { escrowId, actualKwh } = req.body
  if (!escrowId || !actualKwh) {
    res.status(400).json({ error: 'Missing escrowId or actualKwh' })
    return
  }
  // TODO: call ChargingPaymentRouter.finalizeSession via viem
  res.json({ escrowId, actualKwh, finalCost: (actualKwh * 0.32).toFixed(2), txHash: '0x' + '0'.repeat(64) })
})

export default router
