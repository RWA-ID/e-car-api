import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { makeApp } from './helpers/app'

const app = makeApp()
const API_KEY = process.env.API_KEY!

describe('GET /api/v1/brands', () => {
  it('returns paginated empty list (placeholder)', async () => {
    const res = await request(app).get('/api/v1/brands?limit=5&offset=0')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ brands: [], total: 0, limit: 5, offset: 0 })
  })
})

describe('GET /api/v1/brands/:brand', () => {
  it('flags reserved brands', async () => {
    const res = await request(app).get('/api/v1/brands/tesla')
    expect(res.status).toBe(200)
    expect(res.body.reserved).toBe(true)
    expect(res.body.ensName).toBe('tesla.e-car.eth')
    expect(res.body.claimed).toBe(false)
  })

  it('non-reserved brand is flagged false', async () => {
    const res = await request(app).get('/api/v1/brands/randomstartup')
    expect(res.status).toBe(200)
    expect(res.body.reserved).toBe(false)
  })
})

describe('POST /api/v1/brands/:brand/claim', () => {
  it('rejects without auth', async () => {
    const res = await request(app).post('/api/v1/brands/tesla/claim').send({})
    expect(res.status).toBe(401)
  })

  it('rejects missing signerAddress', async () => {
    const res = await request(app)
      .post('/api/v1/brands/tesla/claim')
      .set('x-api-key', API_KEY)
      .send({})
    expect(res.status).toBe(400)
  })

  it('returns unsigned tx with 10 ETH fee', async () => {
    const res = await request(app)
      .post('/api/v1/brands/ford/claim')
      .set('x-api-key', API_KEY)
      .send({ signerAddress: '0x' + 'a'.repeat(40) })
    expect(res.status).toBe(202)
    expect(res.body.fee).toBe('10000000000000000000')
    expect(res.body.unsignedTx.value).toBe('10000000000000000000')
  })
})

describe('GET /api/v1/brands/:brand/vehicles + /stations', () => {
  it('returns empty placeholders', async () => {
    const r1 = await request(app).get('/api/v1/brands/tesla/vehicles')
    const r2 = await request(app).get('/api/v1/brands/tesla/stations')
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
    expect(r1.body.brand).toBe('tesla')
    expect(r2.body.brand).toBe('tesla')
  })
})
