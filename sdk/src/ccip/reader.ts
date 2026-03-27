/**
 * CCIPReader — implements EIP-3668 CCIP-Read for off-chain lookups
 */
export class CCIPReader {
  private gatewayUrls: string[]

  constructor(gatewayUrls: string[] = ['https://gateway.e-car.eth/{sender}/{data}.json']) {
    this.gatewayUrls = gatewayUrls
  }

  async resolve(name: string): Promise<`0x${string}`> {
    // Simplified: in production this would trigger OffchainLookup and retry the call
    const url = this.buildUrl(this.gatewayUrls[0] ?? '', name, '0x')
    const response = await fetch(url)
    if (!response.ok) throw new Error(`CCIPReader: gateway returned ${response.status}`)
    const data = await response.json() as { data?: string }
    return (data.data ?? '0x') as `0x${string}`
  }

  async fetch(url: string, callData: `0x${string}`): Promise<`0x${string}`> {
    const fullUrl = url
      .replace('{data}', callData)
      .replace('{sender}', '0x0000000000000000000000000000000000000000')

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error(`CCIPReader: request failed with status ${response.status}`)
    const body = await response.json() as { data?: string }
    return (body.data ?? '0x') as `0x${string}`
  }

  private buildUrl(template: string, sender: string, data: string): string {
    return template
      .replace('{sender}', sender)
      .replace('{data}', data)
  }
}
