'use client'

import { useState } from 'react'

export default function ChargingPayment() {
  const [stationId, setStationId] = useState('')
  const [kwh, setKwh] = useState(30)
  const estimatedCost = (kwh * 0.32).toFixed(2)

  const handleStart = async () => {
    const res = await fetch('/api/v1/pay/charging/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stationId, estimatedKwh: kwh }),
    })
    const data = await res.json()
    alert(`Session started. Escrow #${data.escrowId}`)
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-4">⚡ Start Charging Session</h3>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Station ID</label>
          <input
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            placeholder="0xabc...123"
            className="w-full px-3 py-2 rounded-lg text-sm font-mono"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Estimated kWh: {kwh}</label>
          <input type="range" min={5} max={100} value={kwh} onChange={(e) => setKwh(Number(e.target.value))}
            className="w-full" style={{ accentColor: 'var(--accent)' }} />
        </div>
        <div className="card p-3 text-sm" style={{ background: 'rgba(0,212,255,0.05)' }}>
          Estimated cost: <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>${estimatedCost} USDC</span>
        </div>
        <button onClick={handleStart} disabled={!stationId} className="btn-primary text-sm disabled:opacity-50">
          Initiate Session
        </button>
      </div>
    </div>
  )
}
