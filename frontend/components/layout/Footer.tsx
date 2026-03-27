export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
          e-car.eth — Decentralized EV Protocol
        </div>
        <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>Sepolia Testnet</span>
          <span>Built on Ethereum</span>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent)' }} className="hover:underline">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
