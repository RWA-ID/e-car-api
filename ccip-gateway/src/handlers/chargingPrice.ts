import { decodeAbiParameters, encodeAbiParameters, parseAbiParameters } from 'viem'

export async function chargingPrice(sender: string, callData: string): Promise<string> {
  const [stationId] = decodeAbiParameters(parseAbiParameters('bytes32'), callData as `0x${string}`)

  // In production: query charging network APIs for live kWh price
  const pricePerKwh = BigInt(320) // $0.32 per kWh in cents * 100 (scaled)
  const updatedAt = BigInt(Math.floor(Date.now() / 1000))

  return encodeAbiParameters(
    parseAbiParameters('uint256,uint256'),
    [pricePerKwh, updatedAt]
  )
}
