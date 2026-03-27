import { IntentClassifier } from './nlu/IntentClassifier'
import { ResponseBuilder } from './tts/ResponseBuilder'
import { PayForChargingIntent } from './intents/PayForCharging'
import { CheckBatteryIntent } from './intents/CheckBattery'
import { BuyCryptoIntent } from './intents/BuyCrypto'
import { SendPaymentIntent } from './intents/SendPayment'
import { CheckBalanceIntent } from './intents/CheckBalance'

export interface ECarVoicePluginConfig {
  apiKey: string
  vehicleId: string
  rpcUrl: string
  apiBaseUrl?: string
}

export class ECarVoicePlugin {
  private classifier: IntentClassifier
  private config: ECarVoicePluginConfig

  constructor(config: ECarVoicePluginConfig) {
    this.config = config
    this.classifier = new IntentClassifier()

    this.classifier.register(new PayForChargingIntent(config))
    this.classifier.register(new CheckBatteryIntent(config))
    this.classifier.register(new BuyCryptoIntent(config))
    this.classifier.register(new SendPaymentIntent(config))
    this.classifier.register(new CheckBalanceIntent(config))
  }

  async handleUtterance(text: string): Promise<string> {
    const match = this.classifier.classify(text)

    if (match.confidence < 0.5) {
      return ResponseBuilder.error(`I didn't understand: "${text}". Try "pay for charging" or "check battery".`)
    }

    try {
      const result = await match.intent.execute(match.params as never)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return ResponseBuilder.error(`Failed to execute ${match.intent.name}: ${message}`)
    }
  }

  async getAvailableIntents(): Promise<string[]> {
    return this.classifier.getIntentNames()
  }
}
