// Bundled wallet integration for e-car.eth get-key page.
//
// Built with esbuild → ../wallet.js. The IPFS landing has no runtime CDN
// dependency.
//
// Exposes (synchronously, even when init fails):
//   window.ecarWallet         { init, openModal, signMessage, disconnect, describe }
//   window.ecarWalletStatus   'loading' | 'ready' | 'error'
//   window.ecarWalletError    { message, stack } when status === 'error'

import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { sepolia, mainnet } from '@reown/appkit/networks'
import { BrowserProvider } from 'ethers'

// Set status immediately so the page can read it even if init crashes
window.ecarWalletStatus = 'loading'

let appKit = null
let walletProvider = null
let initError = null

const ecarWallet = {
  async init({ projectId, onAccount }) {
    if (appKit) return appKit
    try {
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
    } catch (err) {
      initError = err
      throw err
    }
  },

  openModal() {
    if (!appKit) {
      throw new Error('Wallet not initialised — init() failed: ' + (initError?.message ?? 'unknown'))
    }
    return appKit.open()
  },

  closeModal() { return appKit?.close?.() },
  disconnect() { return appKit?.disconnect?.() },

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

  describe() {
    return {
      status: window.ecarWalletStatus,
      hasAppKit: !!appKit,
      hasProvider: !!this.getProvider(),
      hasWindowEthereum: typeof window !== 'undefined' && !!window.ethereum,
      initError: initError ? initError.message : null,
    }
  },
}

// Expose the API immediately — even before init is called — so the page
// always sees a working object. Then mark ready.
window.ecarWallet = ecarWallet
window.ecarWalletStatus = 'ready'

export default ecarWallet
