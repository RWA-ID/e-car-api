'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/vehicles', label: 'Vehicles', icon: '🚗' },
  { href: '/dashboard/battery', label: 'Battery', icon: '🔋' },
  { href: '/dashboard/payments', label: 'Payments', icon: '💳' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen p-4" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
      <nav className="flex flex-col gap-1 mt-4">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
