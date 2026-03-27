import { type PublicClient, type WalletClient } from 'viem'
import { CONTRACTS } from '../utils/constants'

const CHARGING_ROUTER_ABI = [
  {
    name: 'initiateChargingSession',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'stationId', type: 'bytes32' },
      { name: 'estimatedKwh', type: 'uint256' },
      { name: 'token', type: 'address' },
    ],
    outputs: [{ name: 'escrowId', type: 'uint256' }],
  },
  {
    name: 'finalizeSession',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'uint256' },
      { name: 'actualKwh', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'getSessionCost',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'stationId', type: 'bytes32' },
      { name: 'kwh', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export class ChargingModule {
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
    return contracts.chargingRouter
  }

  async initiateSession(
    stationId: `0x${string}`,
    estimatedKwh: number,
    token?: `0x${string}`
  ): Promise<{ escrowId: bigint }> {
    if (!this.walletClient) throw new Error('ChargingModule: walletClient required')
    const [account] = await this.walletClient.getAddresses()
    const tokenAddr: `0x${string}` = token ?? '0x0000000000000000000000000000000000000000'

    const cost = await this.getSessionCost(stationId, estimatedKwh)

    const txHash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: CHARGING_ROUTER_ABI,
      functionName: 'initiateChargingSession',
      args: [stationId, BigInt(estimatedKwh), tokenAddr],
      account,
      value: tokenAddr === '0x0000000000000000000000000000000000000000' ? cost : 0n,
    })

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash })
    const escrowId = receipt.logs[0] ? BigInt(receipt.logs[0].topics[1] ?? 1) : 1n

    return { escrowId }
  }

  async finalizeSession(escrowId: bigint, actualKwh: number): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('ChargingModule: walletClient required')
    const [account] = await this.walletClient.getAddresses()

    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi: CHARGING_ROUTER_ABI,
      functionName: 'finalizeSession',
      args: [escrowId, BigInt(actualKwh)],
      account,
    })
  }

  async getSessionCost(stationId: `0x${string}`, kwh: number): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.contractAddress,
      abi: CHARGING_ROUTER_ABI,
      functionName: 'getSessionCost',
      args: [stationId, BigInt(kwh)],
    })
  }
}
