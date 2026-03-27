interface LoadingSpinnerProps {
  size?: number
  label?: string
}

export default function LoadingSpinner({ size = 24, label }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
        <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="2" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {label && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>}
    </div>
  )
}
