/**
 * Sepolia end-to-end smoke test.
 *
 * Runs against a live e-car.eth API instance and validates that:
 *   - the server is reachable
 *   - chain reads are wired up (vehicle, battery, charging station)
 *   - auth gating works (anonymous vs api-key)
 *   - the OEM batch flow round-trips (preauth → proof → transfer calldata)
 *   - merkle utilities are sane
 *
 * Each check prints pass/fail with timing. Exit code = number of failed checks.
 *
 * Usage:
 *   API_BASE=https://earnest-harmony-e-car.up.railway.app \
 *   API_KEY=ecar_oem_... \
 *   npm run smoke
 *
 * Defaults:
 *   API_BASE → https://earnest-harmony-e-car.up.railway.app
 *   API_KEY  → process.env.API_KEY (required for auth-gated checks)
 */
import 'dotenv/config'
import { performance } from 'perf_hooks'
import { keccak256, encodePacked } from 'viem'

const BASE = process.env.API_BASE ?? 'https://earnest-harmony-e-car.up.railway.app'
const API_KEY = process.env.API_KEY ?? ''

type CheckResult = { name: string; ok: boolean; ms: number; detail?: string }
const results: CheckResult[] = []

const C = {
  bold:  '\x1b[1m',
  green: '\x1b[32m',
  red:   '\x1b[31m',
  cyan:  '\x1b[36m',
  dim:   '\x1b[2m',
  reset: '\x1b[0m',
}

async function check(name: string, fn: () => Promise<void | string>): Promise<void> {
  const start = performance.now()
  try {
    const detail = await fn()
    const ms = performance.now() - start
    results.push({ name, ok: true, ms, detail: detail || undefined })
    const tail = detail ? `${C.dim}— ${detail}${C.reset}` : ''
    console.log(`${C.green}✓${C.reset} ${name} ${C.dim}(${ms.toFixed(0)}ms)${C.reset} ${tail}`)
  } catch (err) {
    const ms = performance.now() - start
    const msg = err instanceof Error ? err.message : String(err)
    results.push({ name, ok: false, ms, detail: msg })
    console.log(`${C.red}✗${C.reset} ${name} ${C.dim}(${ms.toFixed(0)}ms)${C.reset}\n  ${C.red}${msg}${C.reset}`)
  }
}

async function get(path: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE}${path}`, { headers })
  return res
}
async function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

async function main() {
  console.log(`${C.bold}e-car.eth Sepolia smoke test${C.reset}`)
  console.log(`${C.dim}  API_BASE : ${BASE}${C.reset}`)
  console.log(`${C.dim}  API_KEY  : ${API_KEY ? API_KEY.slice(0, 12) + '…' : '(not set — auth checks will be skipped)'}${C.reset}\n`)

  // ── 1. Health ───────────────────────────────────────────────────────────
  await check('GET /health returns ok', async () => {
    const r = await get('/health')
    if (r.status !== 200) throw new Error(`status ${r.status}`)
    const body = await r.json() as { status: string; service: string }
    if (body.status !== 'ok') throw new Error(`status=${body.status}`)
    return `service=${body.service}`
  })

  // ── 2. Public tier listing ─────────────────────────────────────────────
  await check('GET /auth/tiers lists tiers', async () => {
    const r = await get('/auth/tiers')
    if (r.status !== 200) throw new Error(`status ${r.status}`)
    const body = await r.json() as { tiers: { name: string }[] }
    const names = body.tiers.map(t => t.name).sort()
    if (!names.includes('oem')) throw new Error(`missing oem tier — got ${names.join(',')}`)
    return `tiers=${names.join(',')}`
  })

  // ── 3. Anonymous read of vehicle #1 (chain read) ────────────────────────
  await check('GET /api/v1/vehicles/1 returns Tesla Model 3', async () => {
    const r = await get('/api/v1/vehicles/1')
    if (r.status !== 200) throw new Error(`status ${r.status}`)
    const body = await r.json() as { manufacturer: string; model: string; locked: boolean; owner: string }
    if (body.manufacturer !== 'Tesla') throw new Error(`manufacturer=${body.manufacturer}`)
    if (body.model !== 'Model 3') throw new Error(`model=${body.model}`)
    return `${body.manufacturer} ${body.model}, locked=${body.locked}, owner=${body.owner.slice(0, 10)}…`
  })

  // ── 4. Battery passport ─────────────────────────────────────────────────
  await check('GET /api/v1/battery/1 returns passport entry', async () => {
    const r = await get('/api/v1/battery/1')
    if (r.status !== 200) throw new Error(`status ${r.status}`)
    const body = await r.json() as { stateOfHealth: number; cycleCount: number; merkleRoot: string }
    if (typeof body.stateOfHealth !== 'number') throw new Error('no stateOfHealth')
    return `SoH=${body.stateOfHealth}%, cycles=${body.cycleCount}`
  })

  // ── 5. Charging stations live ───────────────────────────────────────────
  await check('GET /api/v1/charging/stations returns ≥1 active station', async () => {
    const r = await get('/api/v1/charging/stations')
    if (r.status !== 200) throw new Error(`status ${r.status}`)
    const body = await r.json() as { total: number; stations: { stationId: string; brand: string }[] }
    if (body.total < 1) throw new Error('no stations')
    return `${body.total} station(s), first=${body.stations[0].stationId}`
  })

  // ── 6. Auth gating: write endpoint without key → 401 ────────────────────
  await check('POST /api/v1/vehicles without auth → 401', async () => {
    const r = await post('/api/v1/vehicles', {
      vin: 'SMOKE-001', manufacturer: 'X', model: 'Y', year: 2026,
    })
    if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`)
  })

  // ── 7. Auth gating: write endpoint with key → 202 ────────────────────────
  if (API_KEY) {
    await check('POST /api/v1/vehicles with key → 202 + vinHash', async () => {
      const r = await post('/api/v1/vehicles', {
        vin: 'SMOKE-001', manufacturer: 'X', model: 'Y', year: 2026,
        batteryCapacityKwh: 50,
      }, { 'x-api-key': API_KEY })
      if (r.status !== 202) throw new Error(`status ${r.status}`)
      const body = await r.json() as { vinHash: string; unsignedTx: { to: string } }
      if (!body.vinHash?.startsWith('0x')) throw new Error('no vinHash')
      return `vinHash=${body.vinHash.slice(0, 14)}…`
    })

    // ── 8. Batch preauthorize round-trip ────────────────────────────────
    let batchId = ''
    let merkleRoot = ''
    await check('POST /vehicles/batch/preauthorize round-trips 4 VINs', async () => {
      const r = await post('/api/v1/vehicles/batch/preauthorize', {
        vins: ['SMOKE-A', 'SMOKE-B', 'SMOKE-C', 'SMOKE-D'],
        manufacturer: 'SmokeTest', model: 'Model S', year: 2026,
        batteryCapacityKwh: 80, soulbound: true,
      }, { 'x-api-key': API_KEY })
      if (r.status !== 201) throw new Error(`status ${r.status}: ${await r.text()}`)
      const body = await r.json() as { batchId: string; merkleRoot: string; total: number }
      if (body.total !== 4) throw new Error(`total=${body.total}`)
      batchId = body.batchId
      merkleRoot = body.merkleRoot
      return `batchId=${batchId}, root=${merkleRoot.slice(0, 14)}…`
    })

    // ── 9. Fetch proof + verify it reconstructs the root client-side ────
    if (batchId) {
      await check('GET /batch/:id/proof/:vin returns proof that reconstructs root', async () => {
        const r = await get(`/api/v1/vehicles/batch/${batchId}/proof/SMOKE-A`)
        if (r.status !== 200) throw new Error(`status ${r.status}`)
        const body = await r.json() as { leaf: `0x${string}`; proof: `0x${string}`[] }
        let computed: `0x${string}` = body.leaf
        for (const sib of body.proof) {
          const [a, b] = computed < sib ? [computed, sib] : [sib, computed]
          computed = keccak256(encodePacked(['bytes32', 'bytes32'], [a, b]))
        }
        if (computed !== merkleRoot) {
          throw new Error(`computed ${computed} !== root ${merkleRoot}`)
        }
        return 'proof verified locally'
      })

      // ── 10. Bulk transfer calldata generation ─────────────────────────
      await check('POST /batch/:id/transfer returns safeTransferFrom calldata', async () => {
        const r = await post(`/api/v1/vehicles/batch/${batchId}/transfer`, {
          from: '0x1111111111111111111111111111111111111111',
          transfers: [
            { tokenId: '1', to: '0x2222222222222222222222222222222222222222' },
            { tokenId: '2', to: '0x3333333333333333333333333333333333333333' },
          ],
        }, { 'x-api-key': API_KEY })
        if (r.status !== 200) throw new Error(`status ${r.status}`)
        const body = await r.json() as { unsignedTxs: { unsignedTx: { data: string } }[] }
        const sel = body.unsignedTxs[0].unsignedTx.data.slice(0, 10)
        if (sel !== '0x42842e0e') throw new Error(`expected safeTransferFrom selector, got ${sel}`)
        return `selector ${sel}, ${body.unsignedTxs.length} txs`
      })
    }
  } else {
    console.log(`${C.dim}  (skipping auth-gated checks — set API_KEY to enable)${C.reset}`)
  }

  // ── 11. Merkle utility sanity ──────────────────────────────────────────
  await check('POST /merkle/generate + verify round-trip', async () => {
    const gen = await post('/api/v1/merkle/generate', { leaves: ['a', 'b', 'c', 'd'] })
    if (gen.status !== 200) throw new Error(`generate ${gen.status}`)
    const { root, proofs } = await gen.json() as { root: `0x${string}`; proofs: `0x${string}`[][] }
    const leaf = keccak256(encodePacked(['string'], ['a']))
    const ver = await post('/api/v1/merkle/verify', { root, proof: proofs[0], leaf })
    const body = await ver.json() as { valid: boolean }
    if (!body.valid) throw new Error('proof[0] did not verify')
    return 'generate + verify ok'
  })

  // ── Summary ────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.ok).length
  const failed = results.length - passed
  console.log(`\n${C.bold}Summary${C.reset}  ${C.green}${passed} passed${C.reset}` +
    (failed ? `  ${C.red}${failed} failed${C.reset}` : '') +
    `  ${C.dim}(${results.length} checks)${C.reset}`)
  if (failed > 0) console.log(`${C.dim}Set API_BASE / API_KEY env vars to point at a different instance.${C.reset}`)
  process.exit(failed)
}

main().catch(err => {
  console.error('Smoke test crashed:', err)
  process.exit(99)
})
