interface VehicleCardProps {
  tokenId: bigint
  manufacturer: string
  model: string
  year: number
  batteryKwh?: bigint
  locked?: boolean
  onClick?: () => void
}

export default function VehicleCard({ tokenId, manufacturer, model, year, locked = true, onClick }: VehicleCardProps) {
  return (
    <div className="card card-hover p-5 cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold">{manufacturer} {model}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{year}</div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-mono"
          style={{ background: locked ? 'rgba(250,204,21,0.1)' : 'rgba(0,255,136,0.1)', color: locked ? '#facc15' : '#00ff88' }}>
          {locked ? '🔒 Soulbound' : '🔓 Transferable'}
        </span>
      </div>
      <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
        Token #{tokenId.toString()}
      </div>
    </div>
  )
}
