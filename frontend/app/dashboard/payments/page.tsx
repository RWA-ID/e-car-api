import Header from '../../../components/layout/Header'
import Sidebar from '../../../components/layout/Sidebar'
import Footer from '../../../components/layout/Footer'
import EscrowPanel from '../../../components/payments/EscrowPanel'
import ChargingPayment from '../../../components/payments/ChargingPayment'
import RampWidget from '../../../components/payments/RampWidget'

export default function PaymentsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Payments</h1>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <ChargingPayment />
            <RampWidget />
          </div>
          <EscrowPanel />
        </main>
      </div>
      <Footer />
    </div>
  )
}
