export class RampModule {
  private moonpayApiKey: string
  private transakApiKey: string

  constructor(moonpayApiKey = '', transakApiKey = '') {
    this.moonpayApiKey = moonpayApiKey
    this.transakApiKey = transakApiKey
  }

  async buyWithMoonpay(amount: number, currency: string, walletAddress?: string): Promise<string> {
    const params = new URLSearchParams({
      apiKey: this.moonpayApiKey,
      defaultCurrencyCode: currency.toLowerCase(),
      baseCurrencyAmount: amount.toString(),
      ...(walletAddress ? { walletAddress } : {}),
    })
    return `https://buy.moonpay.com?${params.toString()}`
  }

  async buyWithTransak(amount: number, currency: string, walletAddress?: string): Promise<string> {
    const params = new URLSearchParams({
      apiKey: this.transakApiKey,
      defaultCryptoCurrency: currency.toUpperCase(),
      fiatAmount: amount.toString(),
      ...(walletAddress ? { walletAddress } : {}),
    })
    return `https://global.transak.com?${params.toString()}`
  }

  async buyWithRampNetwork(amount: number, currency: string, walletAddress?: string): Promise<string> {
    const params = new URLSearchParams({
      swapAsset: currency.toUpperCase(),
      fiatValue: amount.toString(),
      ...(walletAddress ? { userAddress: walletAddress } : {}),
    })
    return `https://app.ramp.network?${params.toString()}`
  }
}
