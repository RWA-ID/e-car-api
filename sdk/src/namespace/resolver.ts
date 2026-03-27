import { type PublicClient } from 'viem'

const BRAND_RESOLVER_ABI = [
  {
    name: 'addr',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'text',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
    ],
    outputs: [{ name: '', type: 'string' }],
  },
] as const

export class ResolverModule {
  private publicClient: PublicClient

  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient
  }

  async resolve(resolverAddress: `0x${string}`, node: `0x${string}`): Promise<`0x${string}`> {
    return this.publicClient.readContract({
      address: resolverAddress,
      abi: BRAND_RESOLVER_ABI,
      functionName: 'addr',
      args: [node],
    })
  }

  async getText(resolverAddress: `0x${string}`, node: `0x${string}`, key: string): Promise<string> {
    return this.publicClient.readContract({
      address: resolverAddress,
      abi: BRAND_RESOLVER_ABI,
      functionName: 'text',
      args: [node, key],
    })
  }
}
