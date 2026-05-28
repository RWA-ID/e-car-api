import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { makeApp } from './helpers/app'
import { mockChainState, setMockReader } from './helpers/mockChain'

const app = makeApp()

beforeEach(() => mockChainState.reset())

const sampleHistory = [
  {
    merkleRoot: '0x' + 'aa'.repeat(32),
    stateOfHealth: 95,
    cycleCount: 12,
    timestamp: 1_770_000_000n,
  },
  {
    merkleRoot: '0x' + 'bb'.repeat(32),
    stateOfHealth: 91,
    cycleCount: 287,
    timestamp: 1_774_575_252n,
  },
]

describe('GET /api/v1/battery/:vehicleId', () => {
  it('returns the latest passport entry', async () => {
    setMockReader('getHistory', () => sampleHistory)
    const res = await request(app).get('/api/v1/battery/1')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      vehicleId: '1',
      stateOfHealth: 91,
      cycleCount: 287,
      merkleRoot: '0x' + 'bb'.repeat(32),
      timestamp: '1774575252',
    })
  })

  it('returns 404 when there is no history', async () => {
    setMockReader('getHistory', () => [])
    const res = await request(app).get('/api/v1/battery/2')
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/battery/:vehicleId/history', () => {
  it('returns the full history serialized', async () => {
    setMockReader('getHistory', () => sampleHistory)
    const res = await request(app).get('/api/v1/battery/1/history')
    expect(res.status).toBe(200)
    expect(res.body.count).toBe(2)
    expect(res.body.history[0]).toMatchObject({
      stateOfHealth: 95,
      cycleCount: 12,
    })
  })
})

describe('POST /api/v1/battery/:vehicleId/verify', () => {
  it('rejects when proof or leaf is missing', async () => {
    const res = await request(app).post('/api/v1/battery/1/verify').send({})
    expect(res.status).toBe(400)
  })

  it('responds valid for a stub call', async () => {
    const res = await request(app)
      .post('/api/v1/battery/1/verify')
      .send({ proof: ['0x' + 'cc'.repeat(32)], leaf: '0x' + 'dd'.repeat(32) })
    expect(res.status).toBe(200)
    expect(res.body.valid).toBe(true)
  })
})
