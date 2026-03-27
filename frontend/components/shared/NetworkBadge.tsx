'use client'

import { useChainId } from 'wagmi'
import { SEPOLIA_CHAIN_ID } from '../../lib/constants'

export default function NetworkBadge() {
  const chainId = useChainId()
  const isMainnet = chainId === 1
  const label = isMainnet ? 'Mainnet' : chainId === SEPOLIA_CHAIN_ID ? 'Sepolia' : `Chain ${chainId}`

  return (
    <span className="hidden md:flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-mono"
      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: isMainnet ? '#00ff88' : '#facc15' }} />
      {label}
    </span>
  )
}
