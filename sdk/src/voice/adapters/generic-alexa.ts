import { BaseVoiceAdapter, type ParsedIntent } from './base'

/**
 * AlexaAutoAdapter — handles Alexa Auto voice commands for vehicles
 */
export class AlexaAutoAdapter extends BaseVoiceAdapter {
  readonly name = 'alexa-auto'

  async parseIntent(utterance: string): Promise<ParsedIntent> {
    const normalized = this.normalize(utterance)

    if (/charg|plug in/i.test(normalized)) {
      return { intent: 'PAY_FOR_CHARGING', payload: { utterance }, confidence: 0.8 }
    }
    if (/battery|power level/i.test(normalized)) {
      return { intent: 'CHECK_BATTERY', payload: { utterance }, confidence: 0.8 }
    }
    if (/balance|wallet/i.test(normalized)) {
      return { intent: 'CHECK_BALANCE', payload: { utterance }, confidence: 0.8 }
    }
    if (/send|pay|transfer/i.test(normalized)) {
      return { intent: 'SEND_PAYMENT', payload: { utterance }, confidence: 0.75 }
    }
    if (/buy.*crypto|buy.*eth|buy.*usdc/i.test(normalized)) {
      return { intent: 'BUY_CRYPTO', payload: { utterance }, confidence: 0.8 }
    }

    return { intent: 'UNKNOWN', payload: { utterance }, confidence: 0 }
  }

  buildResponse(result: unknown): string {
    if (typeof result === 'object' && result !== null && 'txHash' in result) {
      return `Alexa: Done! Your transaction has been submitted.`
    }
    return `Alexa: I've processed your request. ${JSON.stringify(result)}`
  }
}
