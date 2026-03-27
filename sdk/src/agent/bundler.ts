export interface UserOperation {
  sender: `0x${string}`
  nonce: bigint
  initCode: `0x${string}`
  callData: `0x${string}`
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymasterAndData: `0x${string}`
  signature: `0x${string}`
}

export class BundlerClient {
  private bundlerUrl: string

  constructor(bundlerUrl: string) {
    this.bundlerUrl = bundlerUrl
  }

  async sendUserOperation(userOp: UserOperation): Promise<`0x${string}`> {
    const response = await fetch(this.bundlerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendUserOperation',
        params: [userOp, '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'], // EntryPoint v0.6
      }),
    })

    const data = await response.json() as { result?: string; error?: { message: string } }
    if (data.error) throw new Error(`BundlerClient: ${data.error.message}`)
    return (data.result ?? '0x') as `0x${string}`
  }

  async getUserOperationReceipt(hash: `0x${string}`): Promise<unknown> {
    const response = await fetch(this.bundlerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getUserOperationReceipt',
        params: [hash],
      }),
    })

    const data = await response.json() as { result?: unknown; error?: { message: string } }
    if (data.error) throw new Error(`BundlerClient: ${data.error.message}`)
    return data.result
  }

  async estimateUserOperationGas(userOp: Partial<UserOperation>): Promise<{
    callGasLimit: bigint
    verificationGasLimit: bigint
    preVerificationGas: bigint
  }> {
    const response = await fetch(this.bundlerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_estimateUserOperationGas',
        params: [userOp, '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'],
      }),
    })

    const data = await response.json() as {
      result?: { callGasLimit: string; verificationGasLimit: string; preVerificationGas: string }
      error?: { message: string }
    }
    if (data.error) throw new Error(`BundlerClient: ${data.error.message}`)

    return {
      callGasLimit: BigInt(data.result?.callGasLimit ?? 0),
      verificationGasLimit: BigInt(data.result?.verificationGasLimit ?? 0),
      preVerificationGas: BigInt(data.result?.preVerificationGas ?? 0),
    }
  }
}
