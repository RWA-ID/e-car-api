interface TranscriptEntry {
  text: string
  type: 'recognized' | 'error' | 'unknown'
  response?: string
}

const TYPE_COLORS = {
  recognized: 'var(--accent)',
  error: '#ef4444',
  unknown: 'var(--text-muted)',
}

export default function TranscriptView({ entries }: { entries: TranscriptEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="w-full text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Transcript will appear here…
      </div>
    )
  }

  return (
    <div className="w-full max-h-48 overflow-y-auto flex flex-col gap-3">
      {entries.map((entry, i) => (
        <div key={i} className="text-sm">
          <div className="flex items-start gap-2">
            <span style={{ color: TYPE_COLORS[entry.type] }}>▶</span>
            <span>{entry.text}</span>
          </div>
          {entry.response && (
            <div className="ml-5 mt-1 text-xs font-mono" style={{ color: '#00ff88' }}>
              ↳ {entry.response}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
