import { decodeAbiParameters, encodeAbiParameters, parseAbiParameters } from 'viem'

export async function batteryStatus(sender: string, callData: string): Promise<string> {
  const [vehicleId] = decodeAbiParameters(parseAbiParameters('uint256'), callData as `0x${string}`)

  // In production: query oracle database for latest battery report
  const mockReport = {
    soh: BigInt(87),         // 87% state of health
    cycleCount: BigInt(342),
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
    dataHash: '0x' + 'ab'.repeat(32) as `0x${string}`,
  }

  return encodeAbiParameters(
    parseAbiParameters('uint256,uint256,uint256,bytes32'),
    [mockReport.soh, mockReport.cycleCount, mockReport.timestamp, mockReport.dataHash]
  )
}
