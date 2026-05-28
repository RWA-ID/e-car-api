import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { makeApp } from './helpers/app'

const app = makeApp()

describe('GET /health', () => {
  it('returns ok status with endpoint metadata', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.service).toBe('e-car.eth api')
    expect(res.body.endpoints).toMatchObject({
      rest: expect.stringContaining('/api/v1'),
      graphql: expect.stringContaining('/graphql'),
      websocket: expect.stringContaining('/ws'),
      docs: expect.stringContaining('/docs'),
    })
  })
})

describe('404 fallback', () => {
  it('returns 404 with docs link for unknown routes', async () => {
    const res = await request(app).get('/nope-not-a-route')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Not found')
  })
})
