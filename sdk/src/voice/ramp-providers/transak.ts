export class TransakProvider {
  readonly name = 'transak'
  private readonly apiKey: string
  private readonly baseUrl = 'https://global.transak.com'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  generateUrl(amount: number, currency: string, walletAddress?: string): string {
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      defaultCryptoCurrency: currency.toUpperCase(),
      fiatAmount: amount.toString(),
      fiatCurrency: 'USD',
    })
    if (walletAddress) params.set('walletAddress', walletAddress)
    return `${this.baseUrl}?${params.toString()}`
  }

  async getQuote(amount: number, currency: string): Promise<{
    cryptoAmount: number
    feeAmount: number
    totalAmount: number
  }> {
    return {
      cryptoAmount: amount * 0.00029,
      feeAmount: amount * 0.05,
      totalAmount: amount,
    }
  }
}
