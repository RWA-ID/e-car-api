import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { makeApp } from './helpers/app'

const app = makeApp()
const API_KEY = process.env.API_KEY!

describe('Fleet routes', () => {
  it('GET / rejects without auth', async () => {
    const res = await request(app).get('/api/v1/fleet')
    expect(res.status).toBe(401)
  })

  it('GET / returns empty list with auth', async () => {
    const res = await request(app).get('/api/v1/fleet').set('x-api-key', API_KEY)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ fleets: [], total: 0 })
  })

  it('POST / requires name + operatorAddress', async () => {
    const res = await request(app).post('/api/v1/fleet').set('x-api-key', API_KEY).send({ name: 'X' })
    expect(res.status).toBe(400)
  })

  it('POST / creates a fleet and returns ENS name', async () => {
    const res = await request(app)
      .post('/api/v1/fleet')
      .set('x-api-key', API_KEY)
      .send({ name: 'Hertz One', operatorAddress: '0x' + 'a'.repeat(40), vehicles: ['1', '2'] })
    expect(res.status).toBe(201)
    expect(res.body.ensName).toBe('hertz-one.fleet.e-car.eth')
    expect(res.body.vehicles).toEqual(['1', '2'])
  })

  it('POST /:id/vehicles requires vehicleId', async () => {
    const res = await request(app)
      .post('/api/v1/fleet/abc/vehicles')
      .set('x-api-key', API_KEY)
      .send({})
    expect(res.status).toBe(400)
  })

  it('PUT /:id/geofence requires geofence field', async () => {
    const res = await request(app)
      .put('/api/v1/fleet/abc/geofence')
      .set('x-api-key', API_KEY)
      .send({})
    expect(res.status).toBe(400)
  })

  it('GET /:id/payments returns aggregated summary', async () => {
    const res = await request(app)
      .get('/api/v1/fleet/abc/payments')
      .set('x-api-key', API_KEY)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      fleetId: 'abc',
      currency: 'USDC',
      period: '30d',
    })
  })
})
