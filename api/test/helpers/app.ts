import { vi } from 'vitest'
import { mockChainState } from './mockChain'

// Mock viem publicClient so route handlers never hit a real RPC.
// Each test installs handlers via setMockReader().
vi.mock('../../src/lib/client', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/client')>(
    '../../src/lib/client',
  )
  return {
    ...actual,
    publicClient: {
      readContract: vi.fn(async (req: { functionName: string; args?: readonly unknown[] }) => {
        const handler = mockChainState.handlers[req.functionName]
        if (!handler) {
          throw new Error(
            `[mock] No handler for readContract.${req.functionName}. Call setMockReader('${req.functionName}', fn) in your test.`,
          )
        }
        return handler(req.args ?? [])
      }),
    },
  }
})

// Disable the global standardLimiter so rapid test traffic doesn't trip 429s.
// (Per-route writeLimiter remains active — tests that care should reset it
// or stay under the threshold.)
import { createApp } from '../../src/app'

export function makeApp() {
  return createApp({ enableRateLimit: false })
}
