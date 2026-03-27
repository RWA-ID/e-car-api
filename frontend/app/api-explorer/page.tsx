import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'

const endpoints = [
  { method: 'GET', path: '/api/v1/vehicles/:tokenId', desc: 'Get vehicle data' },
  { method: 'POST', path: '/api/v1/vehicles', desc: 'Register a vehicle' },
  { method: 'GET', path: '/api/v1/battery/:vehicleId', desc: 'Latest battery passport' },
  { method: 'GET', path: '/api/v1/battery/:vehicleId/history', desc: 'Battery history' },
  { method: 'POST', path: '/api/v1/pay/escrow', desc: 'Create escrow' },
  { method: 'POST', path: '/api/v1/pay/charging/initiate', desc: 'Initiate charging session' },
  { method: 'POST', path: '/api/v1/voice/intent', desc: 'Process voice intent' },
  { method: 'GET', path: '/api/v1/ramp/providers', desc: 'List ramp providers' },
  { method: 'POST', path: '/api/v1/merkle/verify', desc: 'Verify merkle proof' },
]

const METHOD_COLORS: Record<string, string> = {
  GET: '#00ff88', POST: '#00d4ff', PUT: '#ffd700', DELETE: '#ef4444',
}

export default function ApiExplorerPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16">
        <h1 className="text-4xl font-bold mb-3">API Explorer</h1>
        <p className="mb-10" style={{ color: 'var(--text-muted)' }}>
          REST API at <code className="font-mono text-sm" style={{ color: 'var(--accent)' }}>localhost:3001</code> · GraphQL at <code className="font-mono text-sm" style={{ color: 'var(--accent)' }}>/graphql</code>
        </p>
        <div className="flex flex-col gap-2">
          {endpoints.map((e) => (
            <div key={e.path} className="card p-4 flex items-center gap-4">
              <span className="text-xs font-mono font-bold w-12" style={{ color: METHOD_COLORS[e.method] }}>
                {e.method}
              </span>
              <code className="font-mono text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{e.path}</code>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.desc}</span>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
