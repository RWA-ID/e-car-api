import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'
import { makeApp } from './helpers/app'

const app = makeApp()

async function fetchNonce(address: string) {
  const res = await request(app).get('/auth/nonce').query({ address })
  return res
}

async function mintKeyForWallet() {
  const pk = generatePrivateKey()
  const account = privateKeyToAccount(pk)
  const nonceRes = await fetchNonce(account.address)
  const { nonce, message } = nonceRes.body
  const signature = await account.signMessage({ message })
  const mintRes = await request(app)
    .post('/auth/keys/wallet')
    .send({ address: account.address, nonce, signature, message })
  return { account, mintRes, nonce, message, signature }
}

describe('GET /auth/nonce', () => {
  it('rejects requests with no address', async () => {
    const res = await request(app).get('/auth/nonce')
    expect(res.status).toBe(400)
  })

  it('rejects invalid addresses', async () => {
    const res = await request(app).get('/auth/nonce').query({ address: '0xnotreal' })
    expect(res.status).toBe(400)
  })

  it('returns a SIWE message bound to the address', async () => {
    const pk = generatePrivateKey()
    const account = privateKeyToAccount(pk)
    const res = await fetchNonce(account.address)
    expect(res.status).toBe(200)
    expect(res.body.nonce).toMatch(/^[0-9a-f]{32}$/)
    expect(res.body.message).toContain(account.address)
    expect(res.body.message).toContain(`Nonce: ${res.body.nonce}`)
    expect(res.body.expiresInSeconds).toBeGreaterThan(0)
  })
})

describe('POST /auth/keys/wallet', () => {
  it('rejects missing fields', async () => {
    const res = await request(app).post('/auth/keys/wallet').send({})
    expect(res.status).toBe(400)
  })

  it('rejects invalid address', async () => {
    const res = await request(app)
      .post('/auth/keys/wallet')
      .send({ address: '0xnope', nonce: 'x', signature: '0x', message: 'm' })
    expect(res.status).toBe(400)
  })

  it('rejects an unknown nonce', async () => {
    const pk = generatePrivateKey()
    const account = privateKeyToAccount(pk)
    const res = await request(app)
      .post('/auth/keys/wallet')
      .send({
        address: account.address,
        nonce: 'never-issued',
        signature: '0x' + '0'.repeat(130),
        message: 'Nonce: never-issued',
      })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/nonce/i)
  })

  it('rejects a nonce issued for a different address', async () => {
    const aliceKey = generatePrivateKey()
    const alice = privateKeyToAccount(aliceKey)
    const bobKey = generatePrivateKey()
    const bob = privateKeyToAccount(bobKey)

    const nonceRes = await fetchNonce(alice.address)
    const { nonce, message } = nonceRes.body
    // bob signs alice's message
    const sig = await bob.signMessage({ message })

    const res = await request(app)
      .post('/auth/keys/wallet')
      .send({ address: bob.address, nonce, signature: sig, message })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/different address/i)
  })

  it('rejects a forged signature', async () => {
    const pk = generatePrivateKey()
    const account = privateKeyToAccount(pk)
    const nonceRes = await fetchNonce(account.address)
    const { nonce, message } = nonceRes.body

    const res = await request(app)
      .post('/auth/keys/wallet')
      .send({
        address: account.address,
        nonce,
        signature: '0x' + '0'.repeat(130),
        message,
      })
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/signature/i)
  })

  it('rejects a message that does not include the issued nonce', async () => {
    const pk = generatePrivateKey()
    const account = privateKeyToAccount(pk)
    const nonceRes = await fetchNonce(account.address)
    const { nonce } = nonceRes.body
    const tamperedMessage = 'I am totally legit. No nonce here.'
    const sig = await account.signMessage({ message: tamperedMessage })

    const res = await request(app)
      .post('/auth/keys/wallet')
      .send({
        address: account.address,
        nonce,
        signature: sig,
        message: tamperedMessage,
      })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/nonce/i)
  })

  it('mints a free-tier key for a valid signature', async () => {
    const { account, mintRes } = await mintKeyForWallet()
    expect(mintRes.status).toBe(201)
    expect(mintRes.body.apiKey).toMatch(/^ecar_fre_[a-f0-9]+$/)
    expect(mintRes.body.tier).toBe('free')
    expect(mintRes.body.wallet).toBe(account.address)
    expect(mintRes.body.reused).toBe(false)
    expect(mintRes.body.network).toBe('sepolia')
  })

  it('is idempotent — second call returns the same key marked reused', async () => {
    const { account, mintRes } = await mintKeyForWallet()
    const firstKey = mintRes.body.apiKey

    // Mint a second nonce + sign + post
    const nonceRes = await fetchNonce(account.address)
    const { nonce, message } = nonceRes.body
    const sig = await account.signMessage({ message })
    const second = await request(app)
      .post('/auth/keys/wallet')
      .send({ address: account.address, nonce, signature: sig, message })
    expect(second.status).toBe(200)
    expect(second.body.apiKey).toBe(firstKey)
    expect(second.body.reused).toBe(true)
  })

  it('rejects reusing a burnt nonce', async () => {
    const { account, mintRes, nonce, message, signature } = await mintKeyForWallet()
    expect(mintRes.status).toBe(201)
    // Replay the same nonce + signature
    const replay = await request(app)
      .post('/auth/keys/wallet')
      .send({ address: account.address, nonce, signature, message })
    expect(replay.status).toBe(400)
    expect(replay.body.error).toMatch(/nonce/i)
  })

  it('issued key is usable for an authenticated endpoint', async () => {
    const { mintRes } = await mintKeyForWallet()
    const key = mintRes.body.apiKey

    const info = await request(app)
      .get('/auth/keys/info')
      .set('x-api-key', key)
    expect(info.status).toBe(200)
    expect(info.body.tier).toBe('free')
  })
})
