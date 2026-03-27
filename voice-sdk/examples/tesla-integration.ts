import { ECarVoicePlugin } from '../src/ECarVoicePlugin'

// Tesla Grok Voice integration example
// Drop this into your Tesla OEM middleware that receives Grok voice commands

const plugin = new ECarVoicePlugin({
  apiKey: process.env.ECAR_API_KEY ?? '',
  vehicleId: process.env.VEHICLE_ID ?? '',
  rpcUrl: process.env.RPC_URL ?? 'https://rpc.sepolia.org',
  apiBaseUrl: process.env.ECAR_API_URL ?? 'https://api.e-car.eth',
})

// Simulate receiving a voice command from Tesla Grok
async function onGrokVoiceCommand(utterance: string) {
  console.log(`[Tesla Grok] Received: "${utterance}"`)
  const response = await plugin.handleUtterance(utterance)
  console.log(`[Tesla Grok] Speaking: "${response}"`)
  // In real integration: pass response to Tesla TTS engine
  return response
}

// Example commands
async function demo() {
  await onGrokVoiceCommand('Hey Tesla, start charging')
  await onGrokVoiceCommand('Hey Tesla, check battery health')
  await onGrokVoiceCommand('Hey Tesla, check my balance')
  await onGrokVoiceCommand('Hey Tesla, buy 100 dollars of ETH')
}

demo().catch(console.error)
