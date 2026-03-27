import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL),
})

export const CONTRACTS = {
  vehicleIdentity:    process.env.VEHICLE_IDENTITY_ADDRESS   as `0x${string}`,
  batteryPassport:    process.env.BATTERY_PASSPORT_ADDRESS   as `0x${string}`,
  paymentEscrow:      process.env.PAYMENT_ESCROW_ADDRESS     as `0x${string}`,
  merkleOracle:       process.env.MERKLE_ORACLE_ADDRESS      as `0x${string}`,
  namespaceFactory:   process.env.NAMESPACE_FACTORY_ADDRESS  as `0x${string}`,
  chargingRegistry:   process.env.CHARGING_REGISTRY_ADDRESS  as `0x${string}`,
  chargingRouter:     process.env.CHARGING_ROUTER_ADDRESS    as `0x${string}`,
  voiceRouter:        process.env.VOICE_ROUTER_ADDRESS       as `0x${string}`,
}

export const VEHICLE_IDENTITY_ABI = [
  {
    type: 'function', name: 'getVehicle',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'vinHash', type: 'bytes32' },
        { name: 'manufacturer', type: 'string' },
        { name: 'model', type: 'string' },
        { name: 'year', type: 'uint16' },
        { name: 'batteryCapacityKwh', type: 'uint256' },
        { name: 'registrationDate', type: 'uint256' },
        { name: 'transferApproved', type: 'bool' },
      ],
    }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'safeTransferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'locked',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export const BATTERY_PASSPORT_ABI = [
  {
    type: 'function', name: 'getHistory',
    inputs: [{ name: 'vehicleId', type: 'uint256' }],
    outputs: [{
      name: '', type: 'tuple[]',
      components: [
        { name: 'merkleRoot', type: 'bytes32' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'stateOfHealth', type: 'uint256' },
        { name: 'cycleCount', type: 'uint256' },
      ],
    }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'getLatestRoot',
    inputs: [{ name: 'vehicleId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
] as const

export const CHARGING_REGISTRY_ABI = [
  {
    type: 'function', name: 'getStation',
    inputs: [{ name: 'nodeId', type: 'bytes32' }],
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'id', type: 'string' },
        { name: 'brand', type: 'string' },
        { name: 'ensNode', type: 'bytes32' },
        { name: 'operator', type: 'address' },
        { name: 'pricePerKwh', type: 'uint256' },
        { name: 'active', type: 'bool' },
      ],
    }],
    stateMutability: 'view',
  },
] as const
