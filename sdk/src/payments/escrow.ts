import { type PublicClient, type WalletClient } from 'viem'
import type { CreateEscrowParams } from '../vehicle/types'
import { CONTRACTS } from '../utils/constants'

const ESCROW_ABI = [
  {
    name: 'createEscrow',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'payee', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'pType', type: 'uint8' },
    ],
    outputs: [{ name: 'escrowId', type: 'uint256' }],
  },
  {
    name: 'releaseEscrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'refundEscrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },
] as const

export class EscrowModule {
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
    return contracts.paymentEscrow
  }

  async createEscrow(params: CreateEscrowParams): Promise<{ escrowId: bigint; txHash: `0x${string}` }> {
    if (!this.walletClient) throw new Error('EscrowModule: walletClient required')
    const [account] = await this.walletClient.getAddresses()

    const isETH = params.token === '0x0000000000000000000000000000000000000000'

    const txHash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: ESCROW_ABI,
      functionName: 'createEscrow',
      args: [params.payee, params.amount, params.token, params.paymentType],
      account,
      value: isETH ? params.amount : 0n,
    })

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash })
    const escrowId = receipt.logs[0] ? BigInt(receipt.logs[0].topics[1] ?? 1) : 1n

    return { escrowId, txHash }
  }

  async releaseEscrow(escrowId: bigint): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('EscrowModule: walletClient required')
    const [account] = await this.walletClient.getAddresses()

    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi: ESCROW_ABI,
      functionName: 'releaseEscrow',
      args: [escrowId],
      account,
    })
  }

  async refundEscrow(escrowId: bigint): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('EscrowModule: walletClient required')
    const [account] = await this.walletClient.getAddresses()

    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi: ESCROW_ABI,
      functionName: 'refundEscrow',
      args: [escrowId],
      account,
    })
  }
}
