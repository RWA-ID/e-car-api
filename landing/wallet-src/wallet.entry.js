// Bundled wallet integration for e-car.eth get-key page.
//
// Built with esbuild → ../wallet.js (committed alongside the HTML so the
// IPFS landing has no runtime CDN dependency).
//
// Exposes a single global `ecarWallet` with:
//   await ecarWallet.init({ projectId, onAccount(account) })
//   ecarWallet.openModal()
//   ecarWallet.disconnect()
//   await ecarWallet.signMessage(message) -> 0x…
//
// The page wires its UI on top of these primitives — see get-key.html.

import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { sepolia, mainnet } from '@reown/appkit/networks'
import { BrowserProvider } from 'ethers'

let appKit = null
let walletProvider = null

const ecarWallet = {
  async init({ projectId, onAccount }) {
    if (appKit) return appKit

    appKit = createAppKit({
      adapters: [new EthersAdapter()],
      networks: [sepolia, mainnet],
      defaultNetwork: sepolia,
      projectId,
      metadata: {
        name: 'e-car.eth',
        description: 'Get your free Sepolia API key',
        url: window.location.origin || 'https://e-car.eth.limo',
        icons: [],
      },
      features: { analytics: false, email: false, socials: [] },
    })

    if (appKit.subscribeAccount) {
      appKit.subscribeAccount((account) => {
        if (typeof onAccount === 'function') onAccount(account)
      })
    }

    if (appKit.subscribeProviders) {
      appKit.subscribeProviders((state) => {
        walletProvider = state?.eip155 ?? walletProvider
      })
    }

    return appKit
  },

  openModal() {
    if (!appKit) throw new Error('Wallet not initialised — call init() first')
    return appKit.open()
  },

  closeModal() {
    return appKit?.close?.()
  },

  disconnect() {
    return appKit?.disconnect?.()
  },

  /** Try every documented way of getting the active EIP-1193 provider. */
  getProvider() {
    return (
      walletProvider ||
      appKit?.getWalletProvider?.() ||
      appKit?.getProvider?.('eip155') ||
      (typeof window !== 'undefined' ? window.ethereum : null)
    )
  },

  async signMessage(message) {
    const provider = this.getProvider()
    if (!provider) throw new Error('No wallet provider — connect a wallet first')
    const ethers = new BrowserProvider(provider)
    const signer = await ethers.getSigner()
    return signer.signMessage(message)
  },

  /** Diagnostic info — surfaces in get-key.html debug panel. */
  describe() {
    return {
      hasAppKit: !!appKit,
      hasProvider: !!this.getProvider(),
      hasWindowEthereum: typeof window !== 'undefined' && !!window.ethereum,
    }
  },
}

// Expose to window for the inline page script
window.ecarWallet = ecarWallet

export default ecarWallet
