import { BaseVoiceAdapter, type ParsedIntent } from './base'

/**
 * TeslaGrokAdapter — handles Tesla Grok voice commands
 * Maps Tesla-specific voice utterances to e-car.eth protocol intents
 */
export class TeslaGrokAdapter extends BaseVoiceAdapter {
  readonly name = 'tesla-grok'

  private readonly intentPatterns: Record<string, RegExp[]> = {
    PAY_FOR_CHARGING: [
      /pay.*charg/i,
      /start.*charg/i,
      /charg.*my.*car/i,
      /plug.*in/i,
    ],
    CHECK_BATTERY: [
      /battery/i,
      /charg.*level/i,
      /how.*much.*power/i,
      /range/i,
    ],
    CHECK_BALANCE: [
      /balance/i,
      /how.*much.*eth/i,
      /wallet/i,
    ],
    SEND_PAYMENT: [
      /send.*eth/i,
      /pay.*to/i,
      /transfer/i,
    ],
  }

  async parseIntent(utterance: string): Promise<ParsedIntent> {
    const normalized = this.normalize(utterance)

    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(normalized)) {
          return {
            intent,
            payload: { utterance: normalized, source: 'tesla-grok' },
            confidence: 0.85,
          }
        }
      }
    }

    return {
      intent: 'UNKNOWN',
      payload: { utterance: normalized },
      confidence: 0,
    }
  }

  buildResponse(result: unknown): string {
    if (typeof result === 'object' && result !== null && 'txHash' in result) {
      return `Grok: Transaction submitted. Hash: ${(result as { txHash: string }).txHash}`
    }
    if (typeof result === 'object' && result !== null && 'soh' in result) {
      return `Grok: Battery state of health is ${(result as { soh: bigint }).soh}%`
    }
    return `Grok: Request processed. ${JSON.stringify(result)}`
  }
}
