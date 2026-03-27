import { type PublicClient, type WalletClient } from 'viem'
import { VehicleModule } from './vehicle/identity'
import { BatteryModule } from './vehicle/battery'
import { NamespaceModule } from './namespace/registry'
import { ResolverModule } from './namespace/resolver'
import { EscrowModule } from './payments/escrow'
import { ChargingModule } from './payments/charging'
import { RampModule } from './payments/ramp'
import { VoiceRouter } from './voice/router'
import { AgentWalletModule } from './agent/wallet'
import { BundlerClient } from './agent/bundler'
import { CCIPReader } from './ccip/reader'

export interface ECarClientConfig {
  chainId?: number
  bundlerUrl?: string
  gatewayUrls?: string[]
  moonpayApiKey?: string
  transakApiKey?: string
}

export class ECarClient {
  public readonly vehicle: VehicleModule
  public readonly battery: BatteryModule
  public readonly namespace: NamespaceModule
  public readonly resolver: ResolverModule
  public readonly escrow: EscrowModule
  public readonly charging: ChargingModule
  public readonly ramp: RampModule
  public readonly voice: VoiceRouter
  public readonly bundler: BundlerClient
  public readonly ccip: CCIPReader

  private publicClient: PublicClient
  private walletClient?: WalletClient
  private chainId: number

  constructor(
    publicClient: PublicClient,
    walletClient?: WalletClient,
    config: ECarClientConfig = {}
  ) {
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.chainId = config.chainId ?? 11155111

    this.vehicle = new VehicleModule(publicClient, walletClient, this.chainId)
    this.battery = new BatteryModule(publicClient, this.chainId)
    this.namespace = new NamespaceModule(publicClient, walletClient, this.chainId)
    this.resolver = new ResolverModule(publicClient)
    this.escrow = new EscrowModule(publicClient, walletClient, this.chainId)
    this.charging = new ChargingModule(publicClient, walletClient, this.chainId)
    this.ramp = new RampModule(config.moonpayApiKey, config.transakApiKey)
    this.voice = new VoiceRouter(publicClient, walletClient, this.chainId)
    this.bundler = new BundlerClient(config.bundlerUrl ?? 'https://api.pimlico.io/v1/sepolia/rpc')
    this.ccip = new CCIPReader(config.gatewayUrls)
  }

  /** Get an agent wallet module for a specific vehicle wallet */
  agentWallet(walletAddress: `0x${string}`): AgentWalletModule {
    return new AgentWalletModule(this.publicClient, walletAddress, this.walletClient)
  }

  /** Get current chain ID */
  getChainId(): number {
    return this.chainId
  }
}
