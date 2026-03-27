import { type PublicClient } from 'viem'
import type { PassportEntry } from './types'
import { CONTRACTS } from '../utils/constants'

const BATTERY_PASSPORT_ABI = [
  {
    name: 'getLatestRoot',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'vehicleId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'getHistory',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'vehicleId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'merkleRoot', type: 'bytes32' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'stateOfHealth', type: 'uint256' },
          { name: 'cycleCount', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'verifyEntry',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'vehicleId', type: 'uint256' },
      { name: 'proof', type: 'bytes32[]' },
      { name: 'leaf', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export class BatteryModule {
  private publicClient: PublicClient
  private chainId: number

  constructor(publicClient: PublicClient, chainId = 11155111) {
    this.publicClient = publicClient
    this.chainId = chainId
  }

  private get contractAddress(): `0x${string}` {
    const contracts = CONTRACTS[this.chainId as keyof typeof CONTRACTS]
    if (!contracts) throw new Error(`Unsupported chain: ${this.chainId}`)
    return contracts.batteryPassport
  }

  async getLatestPassport(vehicleId: bigint): Promise<{
    merkleRoot: `0x${string}`
    timestamp: bigint
    soh: bigint
  }> {
    const history = await this.getHistory(vehicleId)
    const latest = history[history.length - 1]
    if (!latest) throw new Error('BatteryModule: no passport entries')

    return {
      merkleRoot: latest.merkleRoot,
      timestamp: latest.timestamp,
      soh: latest.stateOfHealth,
    }
  }

  async getHistory(vehicleId: bigint): Promise<PassportEntry[]> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: BATTERY_PASSPORT_ABI,
      functionName: 'getHistory',
      args: [vehicleId],
    })

    return result as PassportEntry[]
  }

  async verify(vehicleId: bigint, proof: `0x${string}`[], leaf: `0x${string}`): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.contractAddress,
      abi: BATTERY_PASSPORT_ABI,
      functionName: 'verifyEntry',
      args: [vehicleId, proof, leaf],
    })
  }
}
