import { type PublicClient, type WalletClient, keccak256, toBytes } from 'viem'
import type { VehicleData, VehicleRegistration } from './types'
import { CONTRACTS } from '../utils/constants'

const VEHICLE_IDENTITY_ABI = [
  {
    name: 'registerVehicle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'vinHash', type: 'bytes32' },
      { name: 'manufacturer', type: 'string' },
      { name: 'model', type: 'string' },
      { name: 'year', type: 'uint16' },
      { name: 'batteryKwh', type: 'uint256' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    name: 'getVehicle',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'vinHash', type: 'bytes32' },
          { name: 'manufacturer', type: 'string' },
          { name: 'model', type: 'string' },
          { name: 'year', type: 'uint16' },
          { name: 'batteryCapacityKwh', type: 'uint256' },
          { name: 'registrationDate', type: 'uint256' },
          { name: 'transferApproved', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'locked',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export class VehicleModule {
  private publicClient: PublicClient
  private walletClient?: WalletClient
  private chainId: number

  constructor(publicClient: PublicClient, walletClient?: WalletClient, chainId = 11155111) {
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.chainId = chainId
  }

  private get contractAddress(): `0x${string}` {
    const contracts = CONTRACTS[this.chainId as keyof typeof CONTRACTS]
    if (!contracts) throw new Error(`Unsupported chain: ${this.chainId}`)
    return contracts.vehicleIdentity
  }

  async register(data: VehicleRegistration): Promise<{ tokenId: bigint; txHash: `0x${string}` }> {
    if (!this.walletClient) throw new Error('VehicleModule: walletClient required')

    const vinHash = keccak256(toBytes(data.vin))
    const [account] = await this.walletClient.getAddresses()

    const txHash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: VEHICLE_IDENTITY_ABI,
      functionName: 'registerVehicle',
      args: [vinHash, data.manufacturer, data.model, data.year, BigInt(data.batteryCapacityKwh)],
      account,
    })

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash })
    // Parse tokenId from logs — simplified; in production parse Transfer event
    const tokenId = receipt.logs[0] ? BigInt(receipt.logs[0].topics[1] ?? 1) : 1n

    return { tokenId, txHash }
  }

  async getVehicle(tokenId: bigint): Promise<VehicleData> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: VEHICLE_IDENTITY_ABI,
      functionName: 'getVehicle',
      args: [tokenId],
    })

    return result as VehicleData
  }

  async isLocked(tokenId: bigint): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.contractAddress,
      abi: VEHICLE_IDENTITY_ABI,
      functionName: 'locked',
      args: [tokenId],
    })
  }
}
