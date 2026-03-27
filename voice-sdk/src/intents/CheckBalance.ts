import type { ECarVoicePluginConfig } from '../ECarVoicePlugin'
import { ResponseBuilder } from '../tts/ResponseBuilder'

export class CheckBalanceIntent {
  name = 'CHECK_BALANCE'
  patterns = ['check balance', 'my balance', 'how much eth', 'wallet balance', 'check funds', 'how much do i have']

  constructor(private config: ECarVoicePluginConfig) {}

  async execute(_params: Record<string, unknown>): Promise<string> {
    const res = await fetch(`${this.config.apiBaseUrl ?? 'http://localhost:3001'}/api/v1/vehicles/${this.config.vehicleId}`, {
      headers: { 'x-api-key': this.config.apiKey },
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json() as { agentWalletBalance: string; usdcBalance: string }
    return ResponseBuilder.success('balance check', `Agent wallet: ${data.agentWalletBalance} ETH, ${data.usdcBalance} USDC.`)
  }
}
