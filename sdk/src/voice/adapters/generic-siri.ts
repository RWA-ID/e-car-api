import { BaseVoiceAdapter, type ParsedIntent } from './base'

/**
 * SiriCarPlayAdapter — handles Siri CarPlay voice commands for EVs
 */
export class SiriCarPlayAdapter extends BaseVoiceAdapter {
  readonly name = 'siri-carplay'

  async parseIntent(utterance: string): Promise<ParsedIntent> {
    const normalized = this.normalize(utterance)

    if (/pay for charging|start charging|charge my (car|vehicle)/i.test(normalized)) {
      return { intent: 'PAY_FOR_CHARGING', payload: { utterance }, confidence: 0.9 }
    }
    if (/battery|charge level|range|how far can i (drive|go)/i.test(normalized)) {
      return { intent: 'CHECK_BATTERY', payload: { utterance }, confidence: 0.88 }
    }
    if (/check.*balance|wallet balance|how much.*have/i.test(normalized)) {
      return { intent: 'CHECK_BALANCE', payload: { utterance }, confidence: 0.85 }
    }
    if (/send|pay|transfer/i.test(normalized)) {
      return { intent: 'SEND_PAYMENT', payload: { utterance }, confidence: 0.78 }
    }

    return { intent: 'UNKNOWN', payload: { utterance }, confidence: 0 }
  }

  buildResponse(result: unknown): string {
    if (typeof result === 'object' && result !== null) {
      if ('txHash' in result) return `Siri: Your payment has been sent.`
      if ('soh' in result) return `Your battery health is ${(result as { soh: number }).soh}%.`
    }
    return `Siri: Done. ${JSON.stringify(result)}`
  }
}
