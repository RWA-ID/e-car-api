import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import ClaimForm from '../../components/namespace/ClaimForm'

export default function ClaimPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16">
        <h1 className="text-4xl font-bold mb-3">Claim Brand Namespace</h1>
        <p className="mb-10" style={{ color: 'var(--text-muted)' }}>
          Register your OEM namespace under e-car.eth. One-time 10 ETH fee. Deploys a multi-sig, brand registry, and resolver.
        </p>
        <ClaimForm />
      </main>
      <Footer />
    </div>
  )
}
