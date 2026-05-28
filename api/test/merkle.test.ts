import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { makeApp } from './helpers/app'

const app = makeApp()

describe('POST /api/v1/merkle/generate', () => {
  it('rejects empty leaves', async () => {
    const res = await request(app).post('/api/v1/merkle/generate').send({ leaves: [] })
    expect(res.status).toBe(400)
  })

  it('builds a root + per-leaf proofs', async () => {
    const res = await request(app)
      .post('/api/v1/merkle/generate')
      .send({ leaves: ['alpha', 'bravo', 'charlie', 'delta'] })
    expect(res.status).toBe(200)
    expect(res.body.root).toMatch(/^0x[a-f0-9]{64}$/)
    expect(res.body.proofs).toHaveLength(4)
    expect(res.body.proofs[0].length).toBeGreaterThan(0)
  })
})

describe('POST /api/v1/merkle/verify', () => {
  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/v1/merkle/verify').send({ root: '0x00' })
    expect(res.status).toBe(400)
  })

  it('verifies a proof generated from the same endpoint', async () => {
    const gen = await request(app)
      .post('/api/v1/merkle/generate')
      .send({ leaves: ['a', 'b', 'c', 'd'] })
    const { root, proofs } = gen.body

    // Compute leaf for index 0 the same way the route does (keccak256(encodePacked(['string'],['a'])))
    const { keccak256, encodePacked } = await import('viem')
    const leaf = keccak256(encodePacked(['string'], ['a']))

    const res = await request(app)
      .post('/api/v1/merkle/verify')
      .send({ root, proof: proofs[0], leaf })
    expect(res.status).toBe(200)
    expect(res.body.valid).toBe(true)
  })

  it('marks tampered proof invalid', async () => {
    const res = await request(app)
      .post('/api/v1/merkle/verify')
      .send({
        root: '0x' + '11'.repeat(32),
        proof: ['0x' + '22'.repeat(32)],
        leaf: '0x' + '33'.repeat(32),
      })
    expect(res.status).toBe(200)
    expect(res.body.valid).toBe(false)
  })
})
