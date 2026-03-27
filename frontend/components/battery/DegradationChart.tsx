'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface HistoryEntry {
  timestamp: number
  stateOfHealth: number
  cycleCount: number
}

interface DegradationChartProps {
  history: HistoryEntry[]
}

export default function DegradationChart({ history }: DegradationChartProps) {
  const data = history.map((h) => ({
    date: new Date(h.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    soh: h.stateOfHealth,
    cycles: h.cycleCount,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <YAxis domain={[60, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} unit="%" />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          formatter={(v: number) => [`${v}%`, 'State of Health']}
        />
        <Line type="monotone" dataKey="soh" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
