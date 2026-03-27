import Link from 'next/link'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

const features = [
  { icon: '🚗', title: 'Vehicle Identity', desc: 'Soulbound NFT passport per VIN. Manufacturer-grade provenance on Ethereum.' },
  { icon: '🔋', title: 'Battery Passport', desc: 'EU Battery Regulation compliant. Merkle-proven degradation history.' },
  { icon: '⚡', title: 'Universal Payments', desc: 'Pay for charging, tolls, and parking from your vehicle agent wallet.' },
  { icon: '🤖', title: 'AI Agent Wallets', desc: 'ERC-4337 smart accounts per vehicle. Autonomous micropayments.' },
  { icon: '🎙️', title: 'Voice Integration', desc: 'Plug-and-play SDK for Tesla Grok, Alexa Auto, Google, and Siri.' },
  { icon: '🌱', title: 'Carbon Credits', desc: 'ERC-1155 credits minted per verified EV mile. Tradeable on any DEX.' },
]

const stats = [
  { label: 'Smart Contracts', value: '15+' },
  { label: 'Reserved Brands', value: '35' },
  { label: 'Target Network', value: 'Sepolia' },
  { label: 'Protocol Fee', value: '0.3%' },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 py-24 text-center max-w-5xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-mono mb-6"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: 'var(--accent)' }}>
            Ethereum Sepolia Testnet
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient">e-car.eth</span>
          </h1>
          <p className="text-xl md:text-2xl mb-4" style={{ color: 'var(--text-muted)' }}>
            The neutral ENS protocol layer for every electric vehicle worldwide
          </p>
          <p className="text-base mb-10 max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Decentralized vehicle identity · Battery passports · Universal payments ·
            AI agent wallets · Voice-ramp integrations
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/claim" className="btn-primary text-sm">
              Claim Brand Namespace →
            </Link>
            <Link href="/dashboard" className="btn-secondary text-sm">
              Open Dashboard
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="px-6 py-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="card p-6 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Protocol Modules</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card card-hover p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Namespace diagram */}
        <section className="px-6 py-16 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">ENS Namespace Structure</h2>
          <div className="card p-8 font-mono text-sm text-left" style={{ color: 'var(--accent)' }}>
            <div>e-car.eth</div>
            <div className="ml-4 mt-2" style={{ color: 'var(--text-muted)' }}>├── tesla.e-car.eth</div>
            <div className="ml-8" style={{ color: 'var(--text-primary)' }}>│   ├── 5YJSA1H21FFP12345.tesla.e-car.eth</div>
            <div className="ml-8" style={{ color: 'var(--text-primary)' }}>│   └── station-42.tesla.e-car.eth</div>
            <div className="ml-4 mt-1" style={{ color: 'var(--text-muted)' }}>├── rivian.e-car.eth</div>
            <div className="ml-4 mt-1" style={{ color: 'var(--text-muted)' }}>├── fleet.e-car.eth</div>
            <div className="ml-4 mt-1" style={{ color: 'var(--text-muted)' }}>└── [35 reserved brands]</div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
