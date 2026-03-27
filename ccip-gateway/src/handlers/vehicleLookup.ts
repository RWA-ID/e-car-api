import { decodeAbiParameters, encodeAbiParameters, parseAbiParameters } from 'viem'

export async function vehicleLookup(sender: string, callData: string): Promise<string> {
  // Decode the callData — expects (uint256 tokenId)
  const [tokenId] = decodeAbiParameters(parseAbiParameters('uint256'), callData as `0x${string}`)

  // In production: query your database or call a read-only RPC node
  const mockVehicle = {
    vinHash: '0x' + '0'.repeat(64) as `0x${string}`,
    manufacturer: 'Tesla',
    model: 'Model 3',
    year: 2024,
    batteryCapacityKwh: BigInt(82000),
  }

  return encodeAbiParameters(
    parseAbiParameters('bytes32,string,string,uint16,uint256'),
    [
      mockVehicle.vinHash,
      mockVehicle.manufacturer,
      mockVehicle.model,
      mockVehicle.year,
      mockVehicle.batteryCapacityKwh,
    ]
  )
}
