interface PassportViewerProps {
  merkleRoot: string
  vehicleId: bigint
}

export default function PassportViewer({ merkleRoot, vehicleId }: PassportViewerProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Battery Passport</h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>
          EU 2023/1542 Compliant
        </span>
      </div>
      <div className="font-mono text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        <span className="mr-2">Latest Root:</span>
        <span style={{ color: 'var(--accent)' }}>{merkleRoot.slice(0, 18)}…{merkleRoot.slice(-8)}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs">
        {[
          { label: 'Electrochemistry', value: 'Li-Ion NMC' },
          { label: 'Rated Capacity', value: '82 kWh' },
          { label: 'Cycle Life', value: '1500+ cycles' },
          { label: 'Carbon Footprint', value: 'Merkle-proved' },
          { label: 'Recycled Content', value: 'On-chain' },
          { label: 'Supply Chain', value: 'Auditable' },
        ].map(({ label, value }) => (
          <div key={label} className="card p-3">
            <div style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div className="font-semibold mt-0.5">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
