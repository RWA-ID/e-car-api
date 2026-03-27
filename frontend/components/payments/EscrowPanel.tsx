'use client'

interface Escrow {
  id: string
  payer: string
  payee: string
  amount: string
  token: string
  status: 'PENDING' | 'RELEASED' | 'REFUNDED'
}

const mockEscrows: Escrow[] = []

export default function EscrowPanel() {
  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-4">Active Escrows</h3>
      {mockEscrows.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active escrows.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--text-muted)' }}>
              <th className="text-left pb-2">ID</th>
              <th className="text-left pb-2">Amount</th>
              <th className="text-left pb-2">Status</th>
              <th className="text-left pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockEscrows.map((e) => (
              <tr key={e.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="py-2 font-mono text-xs">#{e.id}</td>
                <td className="py-2">{e.amount} {e.token}</td>
                <td className="py-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: e.status === 'PENDING' ? 'rgba(250,204,21,0.1)' : 'rgba(0,255,136,0.1)',
                             color: e.status === 'PENDING' ? '#facc15' : '#00ff88' }}>
                    {e.status}
                  </span>
                </td>
                <td className="py-2">
                  {e.status === 'PENDING' && (
                    <button className="text-xs btn-secondary py-1 px-2">Release</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
