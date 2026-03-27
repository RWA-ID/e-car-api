import Header from '../../../components/layout/Header'
import Sidebar from '../../../components/layout/Sidebar'
import Footer from '../../../components/layout/Footer'
import RegisterForm from '../../../components/vehicle/RegisterForm'

export default function VehiclesPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Vehicles</h1>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-semibold mb-4">Register New Vehicle</h2>
              <RegisterForm />
            </div>
            <div>
              <h2 className="font-semibold mb-4">Your Vehicles</h2>
              <div className="card p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                Connect wallet to see registered vehicles.
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
