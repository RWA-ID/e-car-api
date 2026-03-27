interface HealthGaugeProps {
  soh: number // 0–100
}

export default function HealthGauge({ soh }: HealthGaugeProps) {
  const color = soh >= 80 ? '#00ff88' : soh >= 60 ? '#facc15' : '#ef4444'
  const r = 60
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - soh / 100)

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Background ring */}
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
        {/* Progress ring */}
        <circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s' }}
        />
        <text x="80" y="75" textAnchor="middle" fill="var(--text-primary)" fontSize="28" fontWeight="bold" fontFamily="Space Mono">
          {soh}%
        </text>
        <text x="80" y="95" textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontFamily="Inter">
          State of Health
        </text>
      </svg>
      <span className="text-xs mt-1 font-semibold" style={{ color }}>
        {soh >= 80 ? 'Excellent' : soh >= 60 ? 'Good' : 'Degraded'}
      </span>
    </div>
  )
}
