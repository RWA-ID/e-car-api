import type { ECarVoicePluginConfig } from '../ECarVoicePlugin'
import { ResponseBuilder } from '../tts/ResponseBuilder'

export class CheckBatteryIntent {
  name = 'CHECK_BATTERY'
  patterns = ['check battery', 'battery status', 'how charged am i', 'battery health', 'state of health', 'battery level']

  constructor(private config: ECarVoicePluginConfig) {}

  async execute(params: { vehicleId?: string }): Promise<string> {
    const vehicleId = params.vehicleId ?? this.config.vehicleId
    const res = await fetch(`${this.config.apiBaseUrl ?? 'http://localhost:3001'}/api/v1/battery/${vehicleId}`, {
      headers: { 'x-api-key': this.config.apiKey },
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json() as { stateOfHealth: number; cycleCount: number }
    const soh = data.stateOfHealth
    const label = soh >= 80 ? 'excellent' : soh >= 60 ? 'good' : 'degraded'
    return ResponseBuilder.success('battery check', `Battery health is ${soh}% — ${label}. Cycle count: ${data.cycleCount}.`)
  }
}
