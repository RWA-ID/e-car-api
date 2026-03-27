interface BrandCardProps {
  name: string
  registry?: string
  resolver?: string
  multiSig?: string
  claimed: boolean
  reserved: boolean
}

export default function BrandCard({ name, registry, resolver, multiSig, claimed, reserved }: BrandCardProps) {
  const badge = claimed ? { label: 'Claimed', color: '#00ff88' } :
                reserved ? { label: 'Reserved', color: '#facc15' } :
                { label: 'Available', color: 'var(--accent)' }

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{name}.e-car.eth</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${badge.color}20`, color: badge.color }}>
          {badge.label}
        </span>
      </div>
      {claimed && (
        <div className="text-xs space-y-1 font-mono" style={{ color: 'var(--text-muted)' }}>
          <div>Registry: {registry?.slice(0, 10)}…</div>
          <div>Resolver: {resolver?.slice(0, 10)}…</div>
          <div>MultiSig: {multiSig?.slice(0, 10)}…</div>
        </div>
      )}
    </div>
  )
}
