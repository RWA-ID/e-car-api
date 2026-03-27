'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ConnectWallet from '../shared/ConnectWallet'
import NetworkBadge from '../shared/NetworkBadge'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/claim', label: 'Claim' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/voice', label: 'Voice' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/fleet', label: 'Fleet' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-mono font-bold text-lg" style={{ color: 'var(--accent)', textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>
            e-car.eth
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors"
                style={{ color: pathname === link.href ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <NetworkBadge />
          <ConnectWallet />
        </div>
      </div>
    </header>
  )
}
