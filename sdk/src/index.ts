// Main client
export { ECarClient } from './client'
export type { ECarClientConfig } from './client'

// Vehicle
export { VehicleModule } from './vehicle/identity'
export { BatteryModule } from './vehicle/battery'
export type { VehicleData, VehicleRegistration, PassportEntry, BrandInfo, CreateEscrowParams } from './vehicle/types'

// Namespace
export { NamespaceModule } from './namespace/registry'
export { ResolverModule } from './namespace/resolver'

// Payments
export { EscrowModule } from './payments/escrow'
export { ChargingModule } from './payments/charging'
export { RampModule } from './payments/ramp'

// Voice
export { VoiceRouter } from './voice/router'
export { BaseVoiceAdapter } from './voice/adapters/base'
export type { ParsedIntent } from './voice/adapters/base'
export { TeslaGrokAdapter } from './voice/adapters/tesla-grok'
export { AlexaAutoAdapter } from './voice/adapters/generic-alexa'
export { GoogleAssistantAdapter } from './voice/adapters/generic-google'
export { SiriCarPlayAdapter } from './voice/adapters/generic-siri'
export { MoonpayProvider } from './voice/ramp-providers/moonpay'
export { RampNetworkProvider } from './voice/ramp-providers/ramp-network'
export { TransakProvider } from './voice/ramp-providers/transak'

// Agent
export { AgentWalletModule } from './agent/wallet'
export { BundlerClient } from './agent/bundler'
export type { UserOperation } from './agent/bundler'

// CCIP
export { CCIPReader } from './ccip/reader'

// Utils
export { namehash, labelhash, encodeName, vehicleNode } from './utils/ens'
export { hashLeaf, buildTree, verifyProof } from './utils/merkle'
export { CONTRACTS, SEPOLIA_CHAIN_ID, MAINNET_CHAIN_ID, CLAIM_FEE, SUBNAME_FEE, VOICE_INTENTS } from './utils/constants'
