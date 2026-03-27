export class RampNetworkProvider {
  readonly name = 'ramp-network'
  private readonly apiKey: string
  private readonly baseUrl = 'https://app.ramp.network'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  generateUrl(amount: number, currency: string, walletAddress?: string): string {
    const params = new URLSearchParams({
      swapAsset: currency.toUpperCase(),
      fiatValue: amount.toString(),
      hostAppName: 'e-car.eth',
    })
    if (walletAddress) params.set('userAddress', walletAddress)
    return `${this.baseUrl}?${params.toString()}`
  }

  async getQuote(amount: number, currency: string): Promise<{
    cryptoAmount: number
    feeAmount: number
    totalAmount: number
  }> {
    return {
      cryptoAmount: amount * 0.00031,
      feeAmount: amount * 0.039,
      totalAmount: amount,
    }
  }
}
