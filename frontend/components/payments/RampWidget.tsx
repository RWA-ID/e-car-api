'use client'

import { useState } from 'react'

const PROVIDERS = ['moonpay', 'transak', 'ramp-network']
const CURRENCIES = ['ETH', 'USDC', 'DAI']

export default function RampWidget() {
  const [provider, setProvider] = useState('moonpay')
  const [currency, setCurrency] = useState('ETH')
  const [amount, setAmount] = useState(50)

  const handleBuy = async () => {
    const res = await fetch('/api/v1/ramp/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, currency, amount }),
    })
    const data = await res.json()
    window.open(data.url, '_blank')
  }

  const tabStyle = (active: boolean) => ({
    background: active ? 'rgba(0,212,255,0.15)' : 'transparent',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  })

  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-4">💳 Buy Crypto</h3>
      <div className="flex gap-2 mb-4 flex-wrap">
        {PROVIDERS.map((p) => (
          <button key={p} style={tabStyle(p === provider)} onClick={() => setProvider(p)}>{p}</button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        {CURRENCIES.map((c) => (
          <button key={c} style={tabStyle(c === currency)} onClick={() => setCurrency(c)}>{c}</button>
        ))}
      </div>
      <div className="flex gap-2 items-center mb-4">
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>USD</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>
      <button onClick={handleBuy} className="btn-primary text-sm w-full">
        Buy {currency} via {provider}
      </button>
    </div>
  )
}
