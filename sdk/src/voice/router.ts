import { type PublicClient, type WalletClient } from 'viem'
import { CONTRACTS } from '../utils/constants'

const VOICE_ROUTER_ABI = [
  {
    name: 'processIntent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'intent', type: 'string' },
      { name: 'payload', type: 'bytes' },
    ],
    outputs: [{ name: 'result', type: 'bytes' }],
  },
  {
    name: 'registerRampProvider',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'provider', type: 'address' },
    ],
    outputs: [],
  },
] as const

export class VoiceRouter {
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
    return contracts.voiceRampRouter
  }

  async processIntent(intent: string, payload: unknown): Promise<unknown> {
    if (!this.walletClient) throw new Error('VoiceRouter: walletClient required')
    const [account] = await this.walletClient.getAddresses()

    const encodedPayload = new TextEncoder().encode(JSON.stringify(payload))
    const payloadHex = ('0x' + Buffer.from(encodedPayload).toString('hex')) as `0x${string}`

    const txHash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: VOICE_ROUTER_ABI,
      functionName: 'processIntent',
      args: [intent, payloadHex],
      account,
    })

    return { txHash, intent, payload }
  }

  async registerProvider(name: string, address: `0x${string}`): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('VoiceRouter: walletClient required')
    const [account] = await this.walletClient.getAddresses()

    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi: VOICE_ROUTER_ABI,
      functionName: 'registerRampProvider',
      args: [name, address],
      account,
    })
  }
}
