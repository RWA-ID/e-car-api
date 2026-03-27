export interface VehicleData {
  vinHash: `0x${string}`
  manufacturer: string
  model: string
  year: number
  batteryCapacityKwh: bigint
  registrationDate: bigint
  transferApproved: boolean
}

export interface VehicleRegistration {
  vin: string
  manufacturer: string
  model: string
  year: number
  batteryCapacityKwh: number
}

export interface PassportEntry {
  merkleRoot: `0x${string}`
  timestamp: bigint
  stateOfHealth: bigint
  cycleCount: bigint
}

export interface BrandInfo {
  registry: string
  resolver: string
  multiSig: string
  reserved: boolean
  claimed: boolean
  claimedBy: string
}

export interface CreateEscrowParams {
  payee: `0x${string}`
  amount: bigint
  token: `0x${string}`
  paymentType: number
}
