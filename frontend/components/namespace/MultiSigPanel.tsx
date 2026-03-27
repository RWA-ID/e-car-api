'use client'

interface MultiSigPanelProps {
  address: string
}

export default function MultiSigPanel({ address }: MultiSigPanelProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Multi-Sig Wallet</h3>
        <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{address.slice(0, 10)}…</span>
      </div>
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        <p className="mb-3">2-of-2 multi-sig: Brand Owner + e-car.eth protocol</p>
        <p>No pending transactions.</p>
      </div>
    </div>
  )
}
