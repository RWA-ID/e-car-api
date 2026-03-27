import { BaseVoiceAdapter, type ParsedIntent } from './base'

/**
 * GoogleAssistantAdapter — handles Google Assistant voice commands in vehicles
 */
export class GoogleAssistantAdapter extends BaseVoiceAdapter {
  readonly name = 'google-assistant'

  async parseIntent(utterance: string): Promise<ParsedIntent> {
    const normalized = this.normalize(utterance)

    const patterns: [string, RegExp][] = [
      ['PAY_FOR_CHARGING', /charg|start session/i],
      ['CHECK_BATTERY', /battery|state of health|how charged/i],
      ['CHECK_BALANCE', /balance|wallet|how much eth/i],
      ['SEND_PAYMENT', /send payment|pay.*to|transfer funds/i],
      ['BUY_CRYPTO', /buy crypto|buy ethereum|buy usdc/i],
    ]

    for (const [intent, pattern] of patterns) {
      if (pattern.test(normalized)) {
        return { intent, payload: { utterance, adapter: 'google' }, confidence: 0.82 }
      }
    }

    return { intent: 'UNKNOWN', payload: { utterance }, confidence: 0 }
  }

  buildResponse(result: unknown): string {
    if (typeof result === 'object' && result !== null) {
      if ('txHash' in result) return `OK, transaction submitted successfully.`
      if ('soh' in result) return `Your battery is at ${(result as { soh: number }).soh}% health.`
      if ('balance' in result) return `Your balance is ${(result as { balance: string }).balance} ETH.`
    }
    return `Request completed. ${JSON.stringify(result)}`
  }
}
