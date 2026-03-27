import { type PublicClient, type WalletClient } from 'viem'
import type { BrandInfo } from '../vehicle/types'
import { CONTRACTS } from '../utils/constants'

const NAMESPACE_FACTORY_ABI = [
  {
    name: 'claimBrand',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'brand', type: 'string' },
      { name: 'signers', type: 'address[]' },
    ],
    outputs: [],
  },
  {
    name: 'getBrandInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'brand', type: 'string' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'registry', type: 'address' },
          { name: 'resolver', type: 'address' },
          { name: 'multiSig', type: 'address' },
          { name: 'reserved', type: 'bool' },
          { name: 'claimed', type: 'bool' },
          { name: 'claimedBy', type: 'address' },
        ],
      },
    ],
  },
  {
    name: 'isReserved',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'brand', type: 'string' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export class NamespaceModule {
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
    return contracts.namespaceFactory
  }

  async claimBrand(brand: string, signers: `0x${string}`[]): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('NamespaceModule: walletClient required')
    const [account] = await this.walletClient.getAddresses()

    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi: NAMESPACE_FACTORY_ABI,
      functionName: 'claimBrand',
      args: [brand, signers],
      account,
      value: 10n * 10n ** 18n, // 10 ETH claim fee
    })
  }

  async getBrandInfo(brand: string): Promise<BrandInfo> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: NAMESPACE_FACTORY_ABI,
      functionName: 'getBrandInfo',
      args: [brand],
    })

    const r = result as { registry: string; resolver: string; multiSig: string; reserved: boolean; claimed: boolean; claimedBy: string }
    return {
      registry: r.registry,
      resolver: r.resolver,
      multiSig: r.multiSig,
      reserved: r.reserved,
      claimed: r.claimed,
      claimedBy: r.claimedBy,
    }
  }

  async isReserved(brand: string): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.contractAddress,
      abi: NAMESPACE_FACTORY_ABI,
      functionName: 'isReserved',
      args: [brand],
    })
  }
}
