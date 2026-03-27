interface IdentityViewerProps {
  tokenId: bigint
  manufacturer: string
  model: string
  year: number
  vinHash: string
  brand?: string
  locked: boolean
}

export default function IdentityViewer({ tokenId, manufacturer, model, year, vinHash, brand = 'unknown', locked }: IdentityViewerProps) {
  const ensName = `${vinHash.slice(0, 8)}…${vinHash.slice(-4)}.${brand}.e-car.eth`

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Vehicle Identity</h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{
          background: locked ? 'rgba(250,204,21,0.1)' : 'rgba(0,255,136,0.1)',
          color: locked ? '#facc15' : '#00ff88',
        }}>
          {locked ? 'ERC-5192 Soulbound' : 'Transferable'}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {[
          ['Token ID', `#${tokenId.toString()}`],
          ['ENS Name', ensName],
          ['Manufacturer', manufacturer],
          ['Model', model],
          ['Year', year.toString()],
          ['VIN Hash', `${vinHash.slice(0, 14)}…`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{k}</dt>
            <dd className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
