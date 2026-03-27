import type { ECarVoicePluginConfig } from '../ECarVoicePlugin'
import { ResponseBuilder } from '../tts/ResponseBuilder'

export interface PayForChargingParams {
  stationId: string
  estimatedKwh: number
}

export class PayForChargingIntent {
  name = 'PAY_FOR_CHARGING'
  patterns = ['pay for charging', 'start charging', 'charge my car', 'initiate charging', 'begin charging session']

  constructor(private config: ECarVoicePluginConfig) {}

  async execute(params: PayForChargingParams): Promise<string> {
    const { stationId = 'nearest', estimatedKwh = 30 } = params
    const res = await fetch(`${this.config.apiBaseUrl ?? 'http://localhost:3001'}/api/v1/pay/charging/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.config.apiKey },
      body: JSON.stringify({ stationId, estimatedKwh, vehicleId: this.config.vehicleId }),
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json() as { escrowId: string; estimatedCost: string }
    return ResponseBuilder.success('charging session', `Escrow #${data.escrowId} created. Estimated cost: ${data.estimatedCost} USDC.`)
  }
}
