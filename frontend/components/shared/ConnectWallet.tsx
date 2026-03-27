'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useChainId } from 'wagmi'
import { SEPOLIA_CHAIN_ID } from '../../lib/constants'

export default function ConnectWallet() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const wrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID

  if (!isConnected) {
    return (
      <button onClick={() => open()} className="btn-primary text-sm">
        Connect Wallet
      </button>
    )
  }

  return (
    <button
      onClick={() => open()}
      className="text-sm px-3 py-1.5 rounded-lg font-mono transition-colors"
      style={{
        background: wrongNetwork ? 'rgba(239,68,68,0.1)' : 'rgba(0,212,255,0.1)',
        border: `1px solid ${wrongNetwork ? '#ef4444' : 'var(--accent)'}`,
        color: wrongNetwork ? '#ef4444' : 'var(--accent)',
      }}
    >
      {wrongNetwork ? '⚠️ Wrong Network' : `${address?.slice(0, 6)}…${address?.slice(-4)}`}
    </button>
  )
}
