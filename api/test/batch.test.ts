import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { keccak256, encodePacked } from 'viem'
import { makeApp } from './helpers/app'

const app = makeApp()
const API_KEY = process.env.API_KEY!

const baseBody = {
  manufacturer: 'Tesla',
  model: 'Model 3',
  year: 2024,
  batteryCapacityKwh: 82,
  soulbound: true,
}

describe('POST /api/v1/vehicles/batch/preauthorize', () => {
  it('rejects without auth', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles/batch/preauthorize')
      .send({ vins: ['A'], ...baseBody })
    expect(res.status).toBe(401)
  })

  it('rejects empty vins array', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles/batch/preauthorize')
      .set('x-api-key', API_KEY)
      .send({ vins: [], ...baseBody })
    expect(res.status).toBe(400)
  })

  it('rejects missing manufacturer/model/year', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles/batch/preauthorize')
      .set('x-api-key', API_KEY)
      .send({ vins: ['A', 'B'] })
    expect(res.status).toBe(400)
  })

  it('creates a batch and returns a deterministic merkle root', async () => {
    const vins = ['5YJSA1H21FFP00001', '5YJSA1H21FFP00002', '5YJSA1H21FFP00003']
    const res = await request(app)
      .post('/api/v1/vehicles/batch/preauthorize')
      .set('x-api-key', API_KEY)
      .send({ vins, ...baseBody })
    expect(res.status).toBe(201)
    expect(res.body.batchId).toMatch(/^batch_/)
    expect(res.body.merkleRoot).toMatch(/^0x[a-f0-9]{64}$/)
    expect(res.body.total).toBe(3)
    expect(res.body.soulboundCount).toBe(3)
    expect(res.body.transferableCount).toBe(0)
  })

  it('applies per-vin soulbound overrides', async () => {
    const vins = ['A', 'B', 'C']
    const res = await request(app)
      .post('/api/v1/vehicles/batch/preauthorize')
      .set('x-api-key', API_KEY)
      .send({
        vins,
        ...baseBody,
        overrides: [{ vin: 'B', soulbound: false }],
      })
    expect(res.status).toBe(201)
    expect(res.body.soulboundCount).toBe(2)
    expect(res.body.transferableCount).toBe(1)
    expect(res.body.overridesApplied).toBe(1)
  })
})

describe('GET /api/v1/vehicles/batch/:batchId/proof/:vin', () => {
  it('returns a valid merkle proof for each VIN that reconstructs the root', async () => {
    // NOTE: buildMerkleTree in src/routes/batch.ts only pads layer 0 — odd counts
    // beyond layer 0 will crash. Use a power-of-2 leaf count until that's fixed.
    const vins = ['VIN-A', 'VIN-B', 'VIN-C', 'VIN-D']
    const create = await request(app)
      .post('/api/v1/vehicles/batch/preauthorize')
      .set('x-api-key', API_KEY)
      .send({ vins, ...baseBody })
    expect(create.status).toBe(201)
    const batchId: string = create.body.batchId
    const root: `0x${string}` = create.body.merkleRoot

    for (const vin of vins) {
      const proofRes = await request(app).get(
        `/api/v1/vehicles/batch/${batchId}/proof/${vin}`,
      )
      expect(proofRes.status).toBe(200)
      expect(proofRes.body.vin).toBe(vin)
      const leaf: `0x${string}` = proofRes.body.leaf
      const proof: `0x${string}`[] = proofRes.body.proof

      let computed = leaf
      for (const sib of proof) {
        const [a, b] = computed < sib ? [computed, sib] : [sib, computed]
        computed = keccak256(encodePacked(['bytes32', 'bytes32'], [a, b]))
      }
      expect(computed).toBe(root)
    }
  })

  it('returns 404 for unknown batch', async () => {
    const res = await request(app).get('/api/v1/vehicles/batch/batch_nope/proof/VIN-A')
    expect(res.status).toBe(404)
  })

  it('returns 404 for VIN not in batch', async () => {
    const create = await request(app)
      .post('/api/v1/vehicles/batch/preauthorize')
      .set('x-api-key', API_KEY)
      .send({ vins: ['A'], ...baseBody })
    const res = await request(app).get(`/api/v1/vehicles/batch/${create.body.batchId}/proof/ZZZ`)
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/vehicles/batch/:batchId (summary)', () => {
  it('rejects without auth', async () => {
    const res = await request(app).get('/api/v1/vehicles/batch/batch_x')
    expect(res.status).toBe(401)
  })

  it('returns summary fields', async () => {
    const create = await request(app)
      .post('/api/v1/vehicles/batch/preauthorize')
      .set('x-api-key', API_KEY)
      .send({ vins: ['A', 'B'], ...baseBody })
    const res = await request(app)
      .get(`/api/v1/vehicles/batch/${create.body.batchId}`)
      .set('x-api-key', API_KEY)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      batchId: create.body.batchId,
      manufacturer: 'Tesla',
      total: 2,
    })
  })
})

describe('GET /api/v1/vehicles/batch/:batchId/proofs (paginated)', () => {
  it('paginates correctly via limit/offset', async () => {
    const vins = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8']
    const create = await request(app)
      .post('/api/v1/vehicles/batch/preauthorize')
      .set('x-api-key', API_KEY)
      .send({ vins, ...baseBody })

    const res = await request(app)
      .get(`/api/v1/vehicles/batch/${create.body.batchId}/proofs?limit=2&offset=1`)
      .set('x-api-key', API_KEY)
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(8)
    expect(res.body.vehicles).toHaveLength(2)
    expect(res.body.vehicles[0].vin).toBe('v2')
  })
})

describe('buildMerkleTree padding — odd leaf counts at every layer', () => {
  // Regression: previously only layer 0 was padded, so leaf counts like 5, 6, 7,
  // 9–11, 13–15 crashed at a higher layer. Now every layer is padded.
  for (const n of [1, 2, 3, 5, 6, 7, 9, 11, 13, 17]) {
    it(`preauthorize with ${n} VINs succeeds and proofs reconstruct the root`, async () => {
      const vins = Array.from({ length: n }, (_, i) => `VIN-${i}`)
      const create = await request(app)
        .post('/api/v1/vehicles/batch/preauthorize')
        .set('x-api-key', API_KEY)
        .send({ vins, ...baseBody })
      expect(create.status).toBe(201)
      const batchId: string = create.body.batchId
      const root: `0x${string}` = create.body.merkleRoot

      // Verify every leaf's proof reconstructs the root
      for (const vin of vins) {
        const proofRes = await request(app).get(
          `/api/v1/vehicles/batch/${batchId}/proof/${vin}`,
        )
        expect(proofRes.status).toBe(200)
        let computed: `0x${string}` = proofRes.body.leaf
        for (const sib of proofRes.body.proof as `0x${string}`[]) {
          const [a, b] = computed < sib ? [computed, sib] : [sib, computed]
          computed = keccak256(encodePacked(['bytes32', 'bytes32'], [a, b]))
        }
        expect(computed).toBe(root)
      }
    })
  }
})

describe('POST /api/v1/vehicles/batch/:batchId/transfer', () => {
  it('rejects unknown batch', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles/batch/batch_nope/transfer')
      .set('x-api-key', API_KEY)
      .send({ from: '0x' + '1'.repeat(40), transfers: [{ tokenId: '1', to: '0x' + '2'.repeat(40) }] })
    expect(res.status).toBe(404)
  })

  it('rejects missing from', async () => {
    const create = await request(app)
      .post('/api/v1/vehicles/batch/preauthorize')
      .set('x-api-key', API_KEY)
      .send({ vins: ['A'], ...baseBody })
    const res = await request(app)
      .post(`/api/v1/vehicles/batch/${create.body.batchId}/transfer`)
      .set('x-api-key', API_KEY)
      .send({ transfers: [{ tokenId: '1', to: '0x' + '2'.repeat(40) }] })
    expect(res.status).toBe(400)
  })

  it('returns unsigned safeTransferFrom calldata for each transfer', async () => {
    const create = await request(app)
      .post('/api/v1/vehicles/batch/preauthorize')
      .set('x-api-key', API_KEY)
      .send({ vins: ['A', 'B'], ...baseBody })

    const res = await request(app)
      .post(`/api/v1/vehicles/batch/${create.body.batchId}/transfer`)
      .set('x-api-key', API_KEY)
      .send({
        from: '0x' + '1'.repeat(40),
        transfers: [
          { tokenId: '1', to: '0x' + '2'.repeat(40) },
          { tokenId: '2', to: '0x' + '3'.repeat(40) },
        ],
      })
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(2)
    expect(res.body.unsignedTxs[0].unsignedTx.data).toMatch(/^0x42842e0e/) // safeTransferFrom selector
    expect(res.body.unsignedTxs[0].unsignedTx.to).toBe(process.env.VEHICLE_IDENTITY_ADDRESS)
  })
})
