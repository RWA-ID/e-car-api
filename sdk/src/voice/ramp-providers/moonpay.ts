export class MoonpayProvider {
  readonly name = 'moonpay'
  private readonly apiKey: string
  private readonly baseUrl = 'https://buy.moonpay.com'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  generateUrl(amount: number, currency: string, walletAddress?: string): string {
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      defaultCurrencyCode: currency.toLowerCase(),
      baseCurrencyAmount: amount.toString(),
    })
    if (walletAddress) params.set('walletAddress', walletAddress)
    return `${this.baseUrl}?${params.toString()}`
  }

  async getQuote(amount: number, currency: string): Promise<{
    cryptoAmount: number
    feeAmount: number
    totalAmount: number
  }> {
    // In production, this would call the MoonPay API
    return {
      cryptoAmount: amount * 0.0003, // Simulated ETH price
      feeAmount: amount * 0.045,
      totalAmount: amount,
    }
  }
}
