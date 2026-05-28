import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { makeApp } from './helpers/app'

const app = makeApp()

describe('Voice + Ramp routes', () => {
  it('POST /voice/intent requires utterance', async () => {
    const res = await request(app).post('/api/v1/voice/intent').send({})
    expect(res.status).toBe(400)
  })

  it('POST /voice/intent returns classified intent', async () => {
    const res = await request(app)
      .post('/api/v1/voice/intent')
      .send({ utterance: 'whats my battery health', vehicleId: '1' })
    expect(res.status).toBe(200)
    expect(res.body.intent).toBe('CHECK_BATTERY')
  })

  it('GET /ramp/providers lists supported providers', async () => {
    const res = await request(app).get('/api/v1/ramp/providers')
    expect(res.status).toBe(200)
    const names = res.body.providers.map((p: { name: string }) => p.name)
    expect(names).toEqual(expect.arrayContaining(['moonpay', 'transak', 'ramp-network']))
  })

  it('POST /ramp/initiate requires amount/currency/provider', async () => {
    const res = await request(app).post('/api/v1/ramp/initiate').send({ amount: 50 })
    expect(res.status).toBe(400)
  })

  it('POST /ramp/initiate builds a provider url', async () => {
    const res = await request(app)
      .post('/api/v1/ramp/initiate')
      .send({ amount: 100, currency: 'USDC', provider: 'moonpay', walletAddress: '0xabc' })
    expect(res.status).toBe(200)
    expect(res.body.url).toContain('buy.moonpay.com')
    expect(res.body.url).toContain('walletAddress=0xabc')
  })
})
