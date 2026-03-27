'use client'

import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../lib/constants'

interface BatteryEntry {
  timestamp: number
  stateOfHealth: number
  cycleCount: number
  merkleRoot: string
}

export function useBatteryPassport(vehicleId: bigint | undefined) {
  const [latest, setLatest] = useState<BatteryEntry | null>(null)
  const [history, setHistory] = useState<BatteryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!vehicleId) return
    setIsLoading(true)
    Promise.all([
      fetch(`${API_BASE_URL}/api/v1/battery/${vehicleId}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/v1/battery/${vehicleId}/history`).then(r => r.json()),
    ])
      .then(([lat, hist]) => { setLatest(lat); setHistory(hist.history ?? []) })
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [vehicleId?.toString()])

  return { latest, history, isLoading, error }
}
