import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { makeApp } from './helpers/app'

const app = makeApp()
const API_KEY = process.env.API_KEY!

describe('Carbon routes', () => {
  it('GET /:vehicleId returns placeholder balance', async () => {
    const res = await request(app).get('/api/v1/carbon/1')
    expect(res.status).toBe(200)
    expect(res.body.vehicleId).toBe('1')
  })

  it('POST /:vehicleId/mint requires auth', async () => {
    const res = await request(app).post('/api/v1/carbon/1/mint').send({ verifiedMileage: 500 })
    expect(res.status).toBe(401)
  })

  it('POST /:vehicleId/mint requires verifiedMileage', async () => {
    const res = await request(app).post('/api/v1/carbon/1/mint').set('x-api-key', API_KEY).send({})
    expect(res.status).toBe(400)
  })

  it('POST /:vehicleId/mint calculates credits = floor(miles/100)', async () => {
    const res = await request(app)
      .post('/api/v1/carbon/1/mint')
      .set('x-api-key', API_KEY)
      .send({ verifiedMileage: 1250 })
    expect(res.status).toBe(201)
    expect(res.body.creditsToMint).toBe(12)
  })

  it('POST /:vehicleId/retire requires amount + reason', async () => {
    const res = await request(app).post('/api/v1/carbon/1/retire').set('x-api-key', API_KEY).send({ amount: 5 })
    expect(res.status).toBe(400)
  })

  it('POST /:vehicleId/retire issues a certificate', async () => {
    const res = await request(app)
      .post('/api/v1/carbon/1/retire')
      .set('x-api-key', API_KEY)
      .send({ amount: 5, reason: 'ESG-Q1' })
    expect(res.status).toBe(200)
    expect(res.body.certificate).toMatch(/^ECAR-RET-\d+$/)
  })

  it('GET /market/overview returns market data', async () => {
    const res = await request(app).get('/api/v1/carbon/market/overview')
    expect(res.status).toBe(200)
    expect(res.body.currency).toBe('USD')
  })
})
