import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { makeApp } from './helpers/app'
import { mockChainState, setMockReader } from './helpers/mockChain'

const app = makeApp()
const API_KEY = process.env.API_KEY!

beforeEach(() => mockChainState.reset())

describe('GET /api/v1/charging/stations', () => {
  it('returns active stations from registry', async () => {
    setMockReader('getStation', () => ({
      id: 'STATION-NYC-001',
      brand: 'tesla',
      operator: '0x' + 'a'.repeat(40),
      pricePerKwh: 250000000000000n,
      active: true,
    }))
    const res = await request(app).get('/api/v1/charging/stations')
    expect(res.status).toBe(200)
    expect(res.body.stations.length).toBeGreaterThanOrEqual(1)
    expect(res.body.stations[0]).toMatchObject({
      stationId: 'STATION-NYC-001',
      brand: 'tesla',
      ensName: 'station-nyc-001.tesla.e-car.eth',
    })
  })

  it('filters by brand query param', async () => {
    setMockReader('getStation', () => ({
      id: 'STATION-NYC-001',
      brand: 'tesla',
      operator: '0x' + 'a'.repeat(40),
      pricePerKwh: 250000000000000n,
      active: true,
    }))
    const res = await request(app).get('/api/v1/charging/stations?brand=ford')
    expect(res.status).toBe(200)
    expect(res.body.stations).toEqual([])
  })
})

describe('GET /api/v1/charging/stations/:nodeId', () => {
  it('returns station details', async () => {
    setMockReader('getStation', () => ({
      id: 'S1',
      brand: 'rivian',
      operator: '0x' + 'a'.repeat(40),
      pricePerKwh: 100n,
      active: true,
    }))
    const res = await request(app).get('/api/v1/charging/stations/0x' + 'a'.repeat(64))
    expect(res.status).toBe(200)
    expect(res.body.brand).toBe('rivian')
  })

  it('returns 404 when contract reverts', async () => {
    setMockReader('getStation', () => { throw new Error('station not found') })
    const res = await request(app).get('/api/v1/charging/stations/0x' + 'a'.repeat(64))
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/charging/stations', () => {
  it('rejects without auth', async () => {
    const res = await request(app).post('/api/v1/charging/stations').send({})
    expect(res.status).toBe(401)
  })

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/charging/stations')
      .set('x-api-key', API_KEY)
      .send({ stationId: 'X' })
    expect(res.status).toBe(400)
  })

  it('registers a station and returns nodeId + ENS name', async () => {
    const res = await request(app)
      .post('/api/v1/charging/stations')
      .set('x-api-key', API_KEY)
      .send({
        stationId: 'STATION-LA-001',
        brand: 'tesla',
        pricePerKwh: 250000000000000,
        operatorAddress: '0x' + 'b'.repeat(40),
      })
    expect(res.status).toBe(201)
    expect(res.body.nodeId).toMatch(/^0x[a-f0-9]{64}$/)
    expect(res.body.ensName).toBe('station-la-001.tesla.e-car.eth')
    expect(res.body.active).toBe(true)
  })
})

describe('POST /api/v1/charging/sessions', () => {
  it('rejects without auth', async () => {
    const res = await request(app).post('/api/v1/charging/sessions').send({})
    expect(res.status).toBe(401)
  })

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/charging/sessions')
      .set('x-api-key', API_KEY)
      .send({ vehicleId: '1' })
    expect(res.status).toBe(400)
  })

  it('initiates a session with estimated cost', async () => {
    const res = await request(app)
      .post('/api/v1/charging/sessions')
      .set('x-api-key', API_KEY)
      .send({ stationNodeId: '0x' + 'a'.repeat(64), vehicleId: '1', estimatedKwh: 30, token: 'USDC' })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('ACTIVE')
    expect(parseFloat(res.body.estimatedCost)).toBeCloseTo(9.6, 2)
  })
})

describe('POST /api/v1/charging/sessions/:id/finalize', () => {
  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/charging/sessions/sess_1/finalize')
      .set('x-api-key', API_KEY)
      .send({ actualKwh: 28 })
    expect(res.status).toBe(400)
  })

  it('finalizes the session and reports final cost', async () => {
    const res = await request(app)
      .post('/api/v1/charging/sessions/sess_1/finalize')
      .set('x-api-key', API_KEY)
      .send({ actualKwh: 28, escrowId: '1' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('COMPLETED')
    expect(parseFloat(res.body.finalCost)).toBeCloseTo(8.96, 2)
  })
})

describe('GET /api/v1/charging/price/:nodeId', () => {
  it('returns price estimate', async () => {
    const res = await request(app).get('/api/v1/charging/price/0xabc?kwh=10')
    expect(res.status).toBe(200)
    expect(res.body.currency).toBe('USDC')
    expect(parseFloat(res.body.estimatedTotal)).toBeCloseTo(3.2, 2)
  })
})
