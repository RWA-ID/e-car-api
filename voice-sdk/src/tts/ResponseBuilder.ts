export class ResponseBuilder {
  static success(action: string, details: string): string {
    return `Successfully completed: ${action}. ${details}`
  }

  static error(message: string): string {
    return `I'm sorry, I couldn't complete that request. ${message}`
  }

  static confirm(action: string, amount?: string): string {
    if (amount) {
      return `Please confirm: ${action} for ${amount}. Say "confirm" to proceed.`
    }
    return `Please confirm: ${action}. Say "confirm" to proceed.`
  }

  static info(message: string): string {
    return message
  }

  static charging(stationId: string, estimatedCost: string): string {
    return `Starting charging session at station ${stationId}. Estimated cost: ${estimatedCost} ETH. Confirming payment...`
  }

  static battery(soh: number, cycleCount: number): string {
    const status = soh > 80 ? 'excellent' : soh > 60 ? 'good' : 'degraded'
    return `Battery health is ${soh}% — ${status}. Total charge cycles: ${cycleCount}.`
  }

  static balance(ethBalance: string, tokenBalances: Record<string, string>): string {
    const tokenStr = Object.entries(tokenBalances)
      .map(([token, balance]) => `${balance} ${token}`)
      .join(', ')
    return `Your wallet balance: ${ethBalance} ETH${tokenStr ? `, ${tokenStr}` : ''}.`
  }

  static payment(to: string, amount: string, txHash: string): string {
    return `Payment of ${amount} sent to ${to}. Transaction: ${txHash.slice(0, 10)}...`
  }
}
