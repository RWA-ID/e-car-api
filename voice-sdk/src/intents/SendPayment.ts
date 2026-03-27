import type { ECarVoicePluginConfig } from '../ECarVoicePlugin'
import { ResponseBuilder } from '../tts/ResponseBuilder'

export class SendPaymentIntent {
  name = 'SEND_PAYMENT'
  patterns = ['send payment', 'send eth', 'send usdc', 'pay', 'transfer funds', 'send money']

  constructor(private config: ECarVoicePluginConfig) {}

  async execute(params: { to: string; amount: number; token?: string }): Promise<string> {
    if (!params.to) throw new Error('Recipient address or ENS name required')
    if (!params.amount) throw new Error('Amount required')

    const token = params.token ?? 'ETH'
    return ResponseBuilder.confirm('send payment', `${params.amount} ${token} to ${params.to}`)
  }
}
