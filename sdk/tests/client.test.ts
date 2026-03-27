import { describe, it, expect, vi } from 'vitest'
import { ECarClient } from '../src/client'
import type { PublicClient, WalletClient } from 'viem'

const mockPublicClient = {
  readContract: vi.fn(),
  getBalance: vi.fn().mockResolvedValue(1000000000000000000n),
  waitForTransactionReceipt: vi.fn(),
} as unknown as PublicClient

const mockWalletClient = {
  getAddresses: vi.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890']),
  writeContract: vi.fn().mockResolvedValue('0xabc123'),
} as unknown as WalletClient

describe('ECarClient', () => {
  it('initializes with public client only', () => {
    const client = new ECarClient(mockPublicClient)
    expect(client).toBeDefined()
    expect(client.vehicle).toBeDefined()
    expect(client.battery).toBeDefined()
    expect(client.namespace).toBeDefined()
    expect(client.escrow).toBeDefined()
    expect(client.charging).toBeDefined()
    expect(client.ramp).toBeDefined()
    expect(client.voice).toBeDefined()
  })

  it('initializes with wallet client', () => {
    const client = new ECarClient(mockPublicClient, mockWalletClient)
    expect(client).toBeDefined()
  })

  it('defaults to sepolia chain ID', () => {
    const client = new ECarClient(mockPublicClient)
    expect(client.getChainId()).toBe(11155111)
  })

  it('accepts custom chain ID', () => {
    const client = new ECarClient(mockPublicClient, undefined, { chainId: 1 })
    expect(client.getChainId()).toBe(1)
  })

  it('returns agent wallet module', () => {
    const client = new ECarClient(mockPublicClient, mockWalletClient)
    const agentWallet = client.agentWallet('0x1234567890123456789012345678901234567890')
    expect(agentWallet).toBeDefined()
  })

  it('provides bundler client', () => {
    const client = new ECarClient(mockPublicClient, undefined, {
      bundlerUrl: 'https://custom-bundler.example.com',
    })
    expect(client.bundler).toBeDefined()
  })
})
