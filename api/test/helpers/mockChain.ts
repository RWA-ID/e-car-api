// Programmable in-memory state for the viem publicClient mock.
// Tests update this map to control read responses for each (functionName) call.

type Handler = (args: readonly unknown[]) => unknown | Promise<unknown>

export const mockChainState: {
  handlers: Record<string, Handler>
  reset: () => void
} = {
  handlers: {},
  reset() { this.handlers = {} },
}

export function setMockReader(functionName: string, handler: Handler): void {
  mockChainState.handlers[functionName] = handler
}
