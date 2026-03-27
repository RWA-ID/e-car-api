import Header from '../../components/layout/Header'
import Sidebar from '../../components/layout/Sidebar'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

const cards = [
  { label: 'Registered Vehicles', value: '0', href: '/dashboard/vehicles', icon: '🚗' },
  { label: 'Escrow Balance', value: '0 ETH', href: '/dashboard/payments', icon: '💳' },
  { label: 'Battery Health (avg)', value: '--', href: '/dashboard/battery', icon: '🔋' },
  { label: 'Carbon Credits', value: '0', href: '/dashboard', icon: '🌱' },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cards.map((c) => (
              <Link key={c.label} href={c.href} className="card card-hover p-6 block">
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>{c.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{c.label}</div>
              </Link>
            ))}
          </div>
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Recent Activity</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Connect your wallet to see recent activity.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
