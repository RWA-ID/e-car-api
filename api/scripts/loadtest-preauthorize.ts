/**
 * Load test for POST /api/v1/vehicles/batch/preauthorize.
 *
 * Boots the express app in-process (no network), submits N synthetic VINs, and
 * reports request latency, payload sizes, and proof-fetch performance. The route
 * keeps the full batch in memory, so this also surfaces memory ceilings.
 *
 * Usage:
 *   npm run loadtest                # default 100,000 VINs
 *   npm run loadtest -- 10000       # custom size
 *   npm run loadtest -- 100000 5    # size + sampled-proof count
 */
import 'dotenv/config'
import http from 'http'
import { performance } from 'perf_hooks'
import { createApp } from '../src/app'

async function main() {
  const N = Number(process.argv[2] ?? 100_000)
  const PROOF_SAMPLES = Number(process.argv[3] ?? 10)
  const API_KEY = process.env.API_KEY ?? 'loadtest-key'
  process.env.API_KEY = API_KEY

  const app = createApp({ enableRateLimit: false })
  const server = http.createServer(app)
  await new Promise<void>(resolve => server.listen(0, resolve))
  const port = (server.address() as { port: number }).port
  const base = `http://127.0.0.1:${port}`

  console.log(`\nLoad test — /api/v1/vehicles/batch/preauthorize`)
  console.log(`  N (VINs)       : ${N.toLocaleString()}`)
  console.log(`  proof samples  : ${PROOF_SAMPLES}`)
  console.log(`  port           : ${port}`)
  console.log()

  // ── Generate VINs ────────────────────────────────────────────────────────
  const genStart = performance.now()
  const vins: string[] = new Array(N)
  for (let i = 0; i < N; i++) {
    vins[i] = `LOADTEST${i.toString().padStart(9, '0')}`
  }
  const genMs = performance.now() - genStart
  console.log(`Generated ${N.toLocaleString()} VINs in ${genMs.toFixed(0)}ms`)

  const body = JSON.stringify({
    vins,
    manufacturer: 'LoadTest',
    model: 'Model L',
    year: 2026,
    batteryCapacityKwh: 80,
    soulbound: true,
  })
  const reqBytes = Buffer.byteLength(body, 'utf-8')
  console.log(`Request payload: ${(reqBytes / 1024 / 1024).toFixed(2)} MB`)

  // ── POST /preauthorize ──────────────────────────────────────────────────
  const preStart = performance.now()
  const res = await fetch(`${base}/api/v1/vehicles/batch/preauthorize`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': API_KEY },
    body,
  })
  const preMs = performance.now() - preStart
  const preBody = await res.json() as { batchId: string; merkleRoot: string }

  if (res.status !== 201) {
    console.error(`FAIL preauthorize ${res.status}`, preBody)
    process.exit(1)
  }

  console.log(`\nPOST /preauthorize → ${res.status}`)
  console.log(`  duration       : ${preMs.toFixed(0)}ms`)
  console.log(`  throughput     : ${(N / (preMs / 1000)).toFixed(0)} VINs/sec`)
  console.log(`  batchId        : ${preBody.batchId}`)
  console.log(`  merkleRoot     : ${preBody.merkleRoot}`)
  console.log(`  heap used      : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0)} MB`)

  // ── GET /:batchId summary ───────────────────────────────────────────────
  const sumStart = performance.now()
  const sumRes = await fetch(`${base}/api/v1/vehicles/batch/${preBody.batchId}`, {
    headers: { 'x-api-key': API_KEY },
  })
  const sumMs = performance.now() - sumStart
  console.log(`\nGET /:batchId → ${sumRes.status} in ${sumMs.toFixed(0)}ms`)

  // ── Sample proof fetches ────────────────────────────────────────────────
  const sampleIdx = Array.from({ length: PROOF_SAMPLES }, () =>
    Math.floor(Math.random() * N),
  )
  const proofTimes: number[] = []
  for (const i of sampleIdx) {
    const t = performance.now()
    const pr = await fetch(
      `${base}/api/v1/vehicles/batch/${preBody.batchId}/proof/${vins[i]}`,
    )
    await pr.json()
    proofTimes.push(performance.now() - t)
  }
  const avgProof = proofTimes.reduce((a, b) => a + b, 0) / proofTimes.length
  const maxProof = Math.max(...proofTimes)
  console.log(`\nGET /proof/:vin (sampled ${PROOF_SAMPLES}x)`)
  console.log(`  avg            : ${avgProof.toFixed(1)}ms`)
  console.log(`  max            : ${maxProof.toFixed(1)}ms`)

  // ── Paginated proofs fetch (first 1000) ─────────────────────────────────
  const pageStart = performance.now()
  const pageRes = await fetch(
    `${base}/api/v1/vehicles/batch/${preBody.batchId}/proofs?limit=1000`,
    { headers: { 'x-api-key': API_KEY } },
  )
  const pageBody = await pageRes.text()
  const pageMs = performance.now() - pageStart
  console.log(`\nGET /proofs?limit=1000 → ${pageRes.status}`)
  console.log(`  duration       : ${pageMs.toFixed(0)}ms`)
  console.log(`  response bytes : ${(pageBody.length / 1024 / 1024).toFixed(2)} MB`)

  console.log(`\nFinal heap used  : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0)} MB`)
  console.log(`Done.\n`)
  server.close()
  process.exit(0)
}

main().catch(err => {
  console.error('Load test failed:', err)
  process.exit(1)
})
