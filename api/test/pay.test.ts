import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { makeApp } from './helpers/app'

const app = makeApp()

describe('Pay routes', () => {
  it('POST /escrow requires payee + amount', async () => {
    const res = await request(app).post('/api/v1/pay/escrow').send({ payee: '0xabc' })
    expect(res.status).toBe(400)
  })

  it('POST /escrow returns escrowId stub', async () => {
    const res = await request(app)
      .post('/api/v1/pay/escrow')
      .send({ payee: '0xabc', amount: '100', token: 'USDC', paymentType: 'charging' })
    expect(res.status).toBe(201)
    expect(res.body.escrowId).toBeTruthy()
  })

  it('POST /escrow/:id/release returns released status', async () => {
    const res = await request(app).post('/api/v1/pay/escrow/42/release').send({})
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ escrowId: '42', status: 'released' })
  })

  it('POST /charging/initiate requires station + kwh', async () => {
    const res = await request(app).post('/api/v1/pay/charging/initiate').send({ stationId: 'S1' })
    expect(res.status).toBe(400)
  })

  it('POST /charging/initiate returns estimated cost', async () => {
    const res = await request(app)
      .post('/api/v1/pay/charging/initiate')
      .send({ stationId: 'S1', estimatedKwh: 25, vehicleId: '1' })
    expect(res.status).toBe(201)
    expect(parseFloat(res.body.estimatedCost)).toBeCloseTo(8.0, 2)
  })

  it('POST /charging/finalize requires escrowId + actualKwh', async () => {
    const res = await request(app).post('/api/v1/pay/charging/finalize').send({ escrowId: '1' })
    expect(res.status).toBe(400)
  })

  it('POST /charging/finalize returns final cost', async () => {
    const res = await request(app)
      .post('/api/v1/pay/charging/finalize')
      .send({ escrowId: '1', actualKwh: 25 })
    expect(res.status).toBe(200)
    expect(parseFloat(res.body.finalCost)).toBeCloseTo(8.0, 2)
  })
})
