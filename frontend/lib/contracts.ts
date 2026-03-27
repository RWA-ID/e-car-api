import type { Address } from 'viem'

export const ADDRESSES = {
  sepolia: {
    vehicleIdentity:          '0x0000000000000000000000000000000000000000' as Address,
    batteryPassport:          '0x0000000000000000000000000000000000000000' as Address,
    namespaceFactory:         '0x0000000000000000000000000000000000000000' as Address,
    paymentEscrow:            '0x0000000000000000000000000000000000000000' as Address,
    chargingStationRegistry:  '0x0000000000000000000000000000000000000000' as Address,
    chargingPaymentRouter:    '0x0000000000000000000000000000000000000000' as Address,
  },
  mainnet: {
    vehicleIdentity:          '0x0000000000000000000000000000000000000000' as Address,
    batteryPassport:          '0x0000000000000000000000000000000000000000' as Address,
    namespaceFactory:         '0x0000000000000000000000000000000000000000' as Address,
    paymentEscrow:            '0x0000000000000000000000000000000000000000' as Address,
    chargingStationRegistry:  '0x0000000000000000000000000000000000000000' as Address,
    chargingPaymentRouter:    '0x0000000000000000000000000000000000000000' as Address,
  },
} as const

export const VEHICLE_IDENTITY_ABI = [
  { name: 'registerVehicle', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'vinHash', type: 'bytes32' }, { name: 'manufacturer', type: 'string' },
      { name: 'model', type: 'string' }, { name: 'year', type: 'uint16' },
      { name: 'batteryKwh', type: 'uint256' },
    ], outputs: [{ name: 'tokenId', type: 'uint256' }] },
  { name: 'getVehicle', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'tuple', components: [
      { name: 'vinHash', type: 'bytes32' }, { name: 'manufacturer', type: 'string' },
      { name: 'model', type: 'string' }, { name: 'year', type: 'uint16' },
      { name: 'batteryCapacityKwh', type: 'uint256' }, { name: 'registrationDate', type: 'uint256' },
      { name: 'transferApproved', type: 'bool' },
    ]}] },
  { name: 'locked', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'VehicleRegistered', type: 'event',
    inputs: [{ name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'vinHash', type: 'bytes32' }, { name: 'manufacturer', type: 'string' },
      { name: 'model', type: 'string' }, { name: 'year', type: 'uint16' }] },
] as const

export const NAMESPACE_FACTORY_ABI = [
  { name: 'claimBrand', type: 'function', stateMutability: 'payable',
    inputs: [{ name: 'brand', type: 'string' }, { name: 'signers', type: 'address[]' }], outputs: [] },
  { name: 'getBrandInfo', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'brand', type: 'string' }],
    outputs: [{ name: '', type: 'tuple', components: [
      { name: 'registry', type: 'address' }, { name: 'resolver', type: 'address' },
      { name: 'multiSig', type: 'address' }, { name: 'reserved', type: 'bool' },
      { name: 'claimed', type: 'bool' }, { name: 'claimedBy', type: 'address' },
    ]}] },
  { name: 'isReserved', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'brand', type: 'string' }], outputs: [{ name: '', type: 'bool' }] },
] as const

export const PAYMENT_ESCROW_ABI = [
  { name: 'createEscrow', type: 'function', stateMutability: 'payable',
    inputs: [{ name: 'payee', type: 'address' }, { name: 'amount', type: 'uint256' },
      { name: 'token', type: 'address' }, { name: 'pType', type: 'uint8' }],
    outputs: [{ name: 'escrowId', type: 'uint256' }] },
  { name: 'releaseEscrow', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }], outputs: [] },
  { name: 'escrows', type: 'function', stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'tuple', components: [
      { name: 'payer', type: 'address' }, { name: 'payee', type: 'address' },
      { name: 'amount', type: 'uint256' }, { name: 'token', type: 'address' },
      { name: 'pType', type: 'uint8' }, { name: 'status', type: 'uint8' },
      { name: 'createdAt', type: 'uint256' },
    ]}] },
] as const
