import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { makeApp } from './helpers/app'

const app = makeApp()

describe('GET /auth/tiers', () => {
  it('lists all tiers without auth', async () => {
    const res = await request(app).get('/auth/tiers')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.tiers)).toBe(true)
    const names = res.body.tiers.map((t: { name: string }) => t.name)
    expect(names).toEqual(expect.arrayContaining(['free', 'oem', 'enterprise']))
    const oem = res.body.tiers.find((t: { name: string }) => t.name === 'oem')
    expect(oem.monthlyLimit).toBe('unlimited')
  })
})

describe('POST /auth/keys', () => {
  it('rejects without admin secret', async () => {
    const res = await request(app)
      .post('/auth/keys')
      .send({ label: 'test', tier: 'free' })
    expect(res.status).toBe(401)
  })

  it('rejects with wrong admin secret', async () => {
    const res = await request(app)
      .post('/auth/keys')
      .set('x-admin-secret', 'nope')
      .send({ label: 'test', tier: 'free' })
    expect(res.status).toBe(401)
  })

  it('rejects missing label', async () => {
    const res = await request(app)
      .post('/auth/keys')
      .set('x-admin-secret', process.env.ADMIN_SECRET!)
      .send({ tier: 'free' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/label/i)
  })

  it('rejects invalid tier', async () => {
    const res = await request(app)
      .post('/auth/keys')
      .set('x-admin-secret', process.env.ADMIN_SECRET!)
      .send({ label: 'bad', tier: 'platinum' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/tier/i)
  })

  it('mints a key for valid admin + tier', async () => {
    const res = await request(app)
      .post('/auth/keys')
      .set('x-admin-secret', process.env.ADMIN_SECRET!)
      .send({ label: 'oem-tesla', tier: 'oem' })
    expect(res.status).toBe(201)
    expect(res.body.apiKey).toMatch(/^ecar_oem_[a-f0-9]+$/)
    expect(res.body.tier).toBe('oem')
    expect(res.body.label).toBe('oem-tesla')
    expect(res.body.limits.rateLimit).toBe(1000)
  })
})

describe('GET /auth/keys/info', () => {
  it('rejects without x-api-key', async () => {
    const res = await request(app).get('/auth/keys/info')
    expect(res.status).toBe(401)
  })

  it('returns 404 for unknown key', async () => {
    const res = await request(app)
      .get('/auth/keys/info')
      .set('x-api-key', 'ecar_unknown_deadbeef')
    expect(res.status).toBe(404)
  })

  it('returns info for a freshly minted key', async () => {
    const mint = await request(app)
      .post('/auth/keys')
      .set('x-admin-secret', process.env.ADMIN_SECRET!)
      .send({ label: 'info-test', tier: 'free' })

    const res = await request(app)
      .get('/auth/keys/info')
      .set('x-api-key', mint.body.apiKey)
    expect(res.status).toBe(200)
    expect(res.body.tier).toBe('free')
    expect(res.body.label).toBe('info-test')
  })
})

describe('DELETE /auth/keys', () => {
  it('revokes a key', async () => {
    const mint = await request(app)
      .post('/auth/keys')
      .set('x-admin-secret', process.env.ADMIN_SECRET!)
      .send({ label: 'revoke-test', tier: 'free' })
    const key = mint.body.apiKey

    const del = await request(app).delete('/auth/keys').set('x-api-key', key)
    expect(del.status).toBe(200)
    expect(del.body.revoked).toBe(true)

    // Second delete should 404
    const again = await request(app).delete('/auth/keys').set('x-api-key', key)
    expect(again.status).toBe(404)
  })
})
