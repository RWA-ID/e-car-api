import { type PublicClient, type WalletClient } from 'viem'

const AGENT_WALLET_ABI = [
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [{ name: 'result', type: 'bytes' }],
  },
  {
    name: 'setSpendingLimit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export class AgentWalletModule {
  private publicClient: PublicClient
  private walletClient?: WalletClient
  private walletAddress: `0x${string}`

  constructor(
    publicClient: PublicClient,
    walletAddress: `0x${string}`,
    walletClient?: WalletClient
  ) {
    this.publicClient = publicClient
    this.walletAddress = walletAddress
    this.walletClient = walletClient
  }

  async execute(target: `0x${string}`, value: bigint, data: `0x${string}`): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('AgentWalletModule: walletClient required')
    const [account] = await this.walletClient.getAddresses()

    return this.walletClient.writeContract({
      address: this.walletAddress,
      abi: AGENT_WALLET_ABI,
      functionName: 'execute',
      args: [target, value, data],
      account,
    })
  }

  async setSpendingLimit(spender: `0x${string}`, limit: bigint): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('AgentWalletModule: walletClient required')
    const [account] = await this.walletClient.getAddresses()

    return this.walletClient.writeContract({
      address: this.walletAddress,
      abi: AGENT_WALLET_ABI,
      functionName: 'setSpendingLimit',
      args: [spender, limit],
      account,
    })
  }

  async getBalance(token?: `0x${string}`): Promise<bigint> {
    if (!token || token === '0x0000000000000000000000000000000000000000') {
      return this.publicClient.getBalance({ address: this.walletAddress })
    }

    return this.publicClient.readContract({
      address: token,
      abi: ERC20_BALANCE_ABI,
      functionName: 'balanceOf',
      args: [this.walletAddress],
    })
  }
}
