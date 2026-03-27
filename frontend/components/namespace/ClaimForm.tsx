'use client'

import { useState } from 'react'
import { useClaimBrand, useBrandInfo } from '../../hooks/useNamespace'
import { RESERVED_BRANDS } from '../../lib/constants'
import LoadingSpinner from '../shared/LoadingSpinner'

export default function ClaimForm() {
  const [brand, setBrand] = useState('')
  const [signer, setSigner] = useState('')
  const { info, reserved, isLoading: infoLoading } = useBrandInfo(brand)
  const { claim, isPending, isConfirming, isSuccess, error } = useClaimBrand()

  const isReservedLocally = RESERVED_BRANDS.includes(brand.toLowerCase())
  const isClaimed = info?.claimed

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!brand || !signer) return
    claim(brand, [signer as `0x${string}`])
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4">
      <div>
        <label className="text-sm mb-1 block" style={{ color: 'var(--text-muted)' }}>Brand Name</label>
        <div className="flex items-center gap-2">
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value.toLowerCase())}
            placeholder="rivian"
            className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>.e-car.eth</span>
        </div>
        {brand.length >= 2 && (
          <div className="mt-1 text-xs font-mono">
            {infoLoading ? <LoadingSpinner size={12} label="Checking..." /> :
             isClaimed ? <span style={{ color: '#ef4444' }}>✗ Already claimed</span> :
             isReservedLocally ? <span style={{ color: '#facc15' }}>⚠ Reserved brand — contact e-car.eth team</span> :
             <span style={{ color: '#00ff88' }}>✓ Available</span>}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm mb-1 block" style={{ color: 'var(--text-muted)' }}>Your Wallet (multi-sig signer)</label>
        <input
          value={signer}
          onChange={(e) => setSigner(e.target.value)}
          placeholder="0x..."
          className="w-full px-3 py-2 rounded-lg font-mono text-sm"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      <div className="card p-4" style={{ background: 'rgba(0,212,255,0.05)' }}>
        <div className="text-sm font-semibold mb-1">Fee: 10 ETH</div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Deploys a multi-sig wallet, brand registry, and resolver. Grants ADMIN_ROLE to multi-sig.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending || isConfirming || !brand || !signer || isReservedLocally || !!isClaimed}
        className="btn-primary text-sm disabled:opacity-50"
      >
        {isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : isSuccess ? '✓ Claimed!' : 'Claim Namespace (10 ETH)'}
      </button>

      {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error.message}</p>}
    </form>
  )
}
