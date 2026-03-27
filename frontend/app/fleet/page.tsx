import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'

export default function FleetPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16">
        <h1 className="text-4xl font-bold mb-3">Fleet Management</h1>
        <p className="mb-10" style={{ color: 'var(--text-muted)' }}>
          Register commercial fleets under fleet.e-car.eth. Bulk vehicle registration, maintenance scheduling, and geofencing.
        </p>
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🚛</div>
          <p style={{ color: 'var(--text-muted)' }}>Connect your wallet to register or manage a fleet.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
