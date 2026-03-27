import { describe, it, expect, vi } from 'vitest'
import { TeslaGrokAdapter } from '../src/voice/adapters/tesla-grok'
import { AlexaAutoAdapter } from '../src/voice/adapters/generic-alexa'
import { GoogleAssistantAdapter } from '../src/voice/adapters/generic-google'
import { SiriCarPlayAdapter } from '../src/voice/adapters/generic-siri'
import { MoonpayProvider } from '../src/voice/ramp-providers/moonpay'
import { VoiceRouter } from '../src/voice/router'
import type { PublicClient, WalletClient } from 'viem'

describe('TeslaGrokAdapter', () => {
  const adapter = new TeslaGrokAdapter()

  it('identifies PAY_FOR_CHARGING intent', async () => {
    const result = await adapter.parseIntent('pay for charging')
    expect(result.intent).toBe('PAY_FOR_CHARGING')
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('identifies CHECK_BATTERY intent', async () => {
    const result = await adapter.parseIntent('check my battery level')
    expect(result.intent).toBe('CHECK_BATTERY')
  })

  it('returns UNKNOWN for unrecognized utterance', async () => {
    const result = await adapter.parseIntent('play some music')
    expect(result.intent).toBe('UNKNOWN')
    expect(result.confidence).toBe(0)
  })

  it('builds success response', () => {
    const response = adapter.buildResponse({ txHash: '0xabc' })
    expect(response).toContain('0xabc')
  })
})

describe('AlexaAutoAdapter', () => {
  const adapter = new AlexaAutoAdapter()

  it('identifies charging intent', async () => {
    const result = await adapter.parseIntent('start charging my car')
    expect(result.intent).toBe('PAY_FOR_CHARGING')
  })

  it('identifies balance intent', async () => {
    const result = await adapter.parseIntent('check my wallet balance')
    expect(result.intent).toBe('CHECK_BALANCE')
  })
})

describe('GoogleAssistantAdapter', () => {
  const adapter = new GoogleAssistantAdapter()

  it('parses battery check', async () => {
    const result = await adapter.parseIntent('what is my battery state of health')
    expect(result.intent).toBe('CHECK_BATTERY')
  })

  it('builds soh response', () => {
    const response = adapter.buildResponse({ soh: 95 })
    expect(response).toContain('95')
  })
})

describe('SiriCarPlayAdapter', () => {
  const adapter = new SiriCarPlayAdapter()

  it('parses charging intent', async () => {
    const result = await adapter.parseIntent('pay for charging')
    expect(result.intent).toBe('PAY_FOR_CHARGING')
    expect(result.confidence).toBeGreaterThan(0.8)
  })
})

describe('MoonpayProvider', () => {
  const provider = new MoonpayProvider('test-api-key')

  it('generates URL with correct params', () => {
    const url = provider.generateUrl(100, 'ETH', '0x1234')
    expect(url).toContain('moonpay.com')
    expect(url).toContain('eth')
    expect(url).toContain('100')
  })

  it('generates URL without wallet address', () => {
    const url = provider.generateUrl(50, 'USDC')
    expect(url).toContain('moonpay.com')
  })
})

describe('VoiceRouter', () => {
  const mockPublicClient = {
    readContract: vi.fn(),
  } as unknown as PublicClient

  const mockWalletClient = {
    getAddresses: vi.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890']),
    writeContract: vi.fn().mockResolvedValue('0xvoicetx'),
  } as unknown as WalletClient

  it('initializes correctly', () => {
    const router = new VoiceRouter(mockPublicClient, mockWalletClient)
    expect(router).toBeDefined()
  })
})
