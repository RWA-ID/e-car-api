'use client'

import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../lib/constants'

export function useAgentWallet(vehicleId: bigint | undefined) {
  const [balance, setBalance] = useState<{ eth: string; usdc: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!vehicleId) return
    setIsLoading(true)
    fetch(`${API_BASE_URL}/api/v1/vehicles/${vehicleId}`)
      .then(r => r.json())
      .then(data => setBalance({ eth: data.agentWalletBalance, usdc: data.usdcBalance }))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [vehicleId?.toString()])

  return { balance, isLoading }
}
