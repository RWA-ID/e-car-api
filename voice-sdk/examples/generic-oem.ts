import { ECarVoicePlugin } from '../src/ECarVoicePlugin'

// Generic OEM integration — works with any voice assistant (Alexa Auto, Google Assistant, Siri CarPlay)
// Implement the onVoiceCommand hook in your OEM's voice middleware

const plugin = new ECarVoicePlugin({
  apiKey: process.env.ECAR_API_KEY ?? '',
  vehicleId: process.env.VEHICLE_ID ?? '',
  rpcUrl: process.env.RPC_URL ?? 'https://rpc.sepolia.org',
  apiBaseUrl: process.env.ECAR_API_URL ?? 'https://api.e-car.eth',
})

// Generic hook — call this from your OEM voice middleware
export async function onVoiceCommand(utterance: string): Promise<string> {
  return plugin.handleUtterance(utterance)
}

export async function listSupportedCommands(): Promise<string[]> {
  return plugin.getAvailableIntents()
}

// Standalone test
if (require.main === module) {
  ;(async () => {
    const intents = await listSupportedCommands()
    console.log('Supported intents:', intents)

    const response = await onVoiceCommand('pay for charging')
    console.log('Response:', response)
  })().catch(console.error)
}
