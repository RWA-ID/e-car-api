import type { ECarVoicePluginConfig } from '../ECarVoicePlugin'
import { ResponseBuilder } from '../tts/ResponseBuilder'

export class BuyCryptoIntent {
  name = 'BUY_CRYPTO'
  patterns = ['buy crypto', 'buy eth', 'buy usdc', 'add funds', 'top up wallet', 'purchase crypto', 'buy ethereum']

  constructor(private config: ECarVoicePluginConfig) {}

  async execute(params: { amount?: number; currency?: string; provider?: string }): Promise<string> {
    const amount = params.amount ?? 50
    const currency = params.currency ?? 'ETH'
    const provider = params.provider ?? 'moonpay'

    const res = await fetch(`${this.config.apiBaseUrl ?? 'http://localhost:3001'}/api/v1/ramp/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.config.apiKey },
      body: JSON.stringify({ amount, currency, provider }),
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json() as { url: string }
    return ResponseBuilder.success('purchase', `Opening ${provider} to buy ${amount} USD of ${currency}. URL: ${data.url}`)
  }
}
