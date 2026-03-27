import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import VoiceDemo from '../../components/voice/VoiceDemo'

const commands = [
  '"Pay for charging"', '"Check battery health"', '"Check balance"',
  '"Buy 50 dollars of ETH"', '"Send payment to [address]"',
]

export default function VoicePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <h1 className="text-4xl font-bold mb-3">Voice Demo</h1>
        <p className="mb-10" style={{ color: 'var(--text-muted)' }}>
          Test the e-car.eth voice SDK in your browser. Compatible with Tesla Grok, Alexa Auto, Google Assistant, and Siri CarPlay.
        </p>
        <VoiceDemo />
        <div className="mt-10">
          <h2 className="font-semibold mb-4">Supported Commands</h2>
          <div className="grid grid-cols-2 gap-2">
            {commands.map((cmd) => (
              <div key={cmd} className="card p-3 text-sm font-mono" style={{ color: 'var(--accent)' }}>
                {cmd}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
