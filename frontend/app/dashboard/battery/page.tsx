import Header from '../../../components/layout/Header'
import Sidebar from '../../../components/layout/Sidebar'
import Footer from '../../../components/layout/Footer'
import HealthGauge from '../../../components/battery/HealthGauge'
import DegradationChart from '../../../components/battery/DegradationChart'
import PassportViewer from '../../../components/battery/PassportViewer'

// Mock data for demo
const mockHistory = [
  { timestamp: 1700000000, stateOfHealth: 97, cycleCount: 10 },
  { timestamp: 1707000000, stateOfHealth: 94, cycleCount: 100 },
  { timestamp: 1714000000, stateOfHealth: 91, cycleCount: 200 },
  { timestamp: 1721000000, stateOfHealth: 89, cycleCount: 280 },
  { timestamp: 1728000000, stateOfHealth: 87, cycleCount: 342 },
]

export default function BatteryPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Battery Passport</h1>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="card p-6 flex flex-col items-center">
              <h2 className="font-semibold mb-4 self-start">State of Health</h2>
              <HealthGauge soh={87} />
            </div>
            <div className="card p-6 md:col-span-2">
              <h2 className="font-semibold mb-4">Degradation History</h2>
              <DegradationChart history={mockHistory} />
            </div>
          </div>
          <PassportViewer
            merkleRoot="0xabababababababababababababababababababababababababababababababababab"
            vehicleId={1n}
          />
        </main>
      </div>
      <Footer />
    </div>
  )
}
