import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { makeApp } from './helpers/app'
import { mockChainState, setMockReader } from './helpers/mockChain'

const app = makeApp()
const API_KEY = process.env.API_KEY!

beforeEach(() => mockChainState.reset())

describe('GET /api/v1/vehicles/:tokenId', () => {
  it('returns vehicle data composed from three contract reads', async () => {
    setMockReader('getVehicle', () => ({
      vinHash: '0xabc' + '0'.repeat(61),
      manufacturer: 'Tesla',
      model: 'Model 3',
      year: 2024,
      batteryCapacityKwh: 82000n,
      registrationDate: 1774500000n,
      transferApproved: false,
    }))
    setMockReader('ownerOf',  () => '0x5f11a48230f7CdaB91A2361576239091E4b1165b')
    setMockReader('locked',   () => true)

    const res = await request(app).get('/api/v1/vehicles/1')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      tokenId: '1',
      manufacturer: 'Tesla',
      model: 'Model 3',
      year: 2024,
      batteryCapacityKwh: '82000',
      locked: true,
      owner: '0x5f11a48230f7CdaB91A2361576239091E4b1165b',
    })
  })

  it('returns 404 when token does not exist', async () => {
    setMockReader('getVehicle', () => {
      throw new Error('ERC721NonexistentToken(uint256)')
    })
    setMockReader('ownerOf', () => { throw new Error('ERC721NonexistentToken') })
    setMockReader('locked',  () => { throw new Error('revert') })

    const res = await request(app).get('/api/v1/vehicles/9999')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/vehicles', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/api/v1/vehicles').send({})
    expect(res.status).toBe(401)
  })

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('x-api-key', API_KEY)
      .send({ vin: '5YJSA1H21FFP12345' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/required fields/i)
  })

  it('returns unsigned tx + vinHash for valid payload', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('x-api-key', API_KEY)
      .send({
        vin: '5YJSA1H21FFP12345',
        manufacturer: 'Tesla',
        model: 'Model 3',
        year: 2024,
        batteryCapacityKwh: 82,
      })
    expect(res.status).toBe(202)
    expect(res.body.vinHash).toMatch(/^0x[a-f0-9]{64}$/)
    expect(res.body.unsignedTx.to).toBe(process.env.VEHICLE_IDENTITY_ADDRESS)
    expect(res.body.unsignedTx.data).toMatch(/^0x[a-f0-9]+$/)
  })
})

describe('GET /api/v1/vehicles/:tokenId/battery (stub)', () => {
  it('returns placeholder battery data', async () => {
    const res = await request(app).get('/api/v1/vehicles/1/battery')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      vehicleId: '1',
      stateOfHealth: expect.any(Number),
      cycleCount: expect.any(Number),
    })
  })
})
