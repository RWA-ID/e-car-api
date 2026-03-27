'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { keccak256, encodePacked } from 'viem'
import { ADDRESSES, VEHICLE_IDENTITY_ABI } from '../lib/contracts'
import { SEPOLIA_CHAIN_ID } from '../lib/constants'

export function useVehicleIdentity(tokenId: bigint) {
  const chainId = useChainId()
  const address = chainId === SEPOLIA_CHAIN_ID ? ADDRESSES.sepolia.vehicleIdentity : ADDRESSES.mainnet.vehicleIdentity

  const { data: vehicle, isLoading, error } = useReadContract({
    address,
    abi: VEHICLE_IDENTITY_ABI,
    functionName: 'getVehicle',
    args: [tokenId],
    query: { enabled: tokenId > 0n },
  })

  const { data: locked } = useReadContract({
    address,
    abi: VEHICLE_IDENTITY_ABI,
    functionName: 'locked',
    args: [tokenId],
    query: { enabled: tokenId > 0n },
  })

  return { vehicle, locked, isLoading, error }
}

export function useRegisterVehicle() {
  const chainId = useChainId()
  const address = chainId === SEPOLIA_CHAIN_ID ? ADDRESSES.sepolia.vehicleIdentity : ADDRESSES.mainnet.vehicleIdentity
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const register = (vin: string, manufacturer: string, model: string, year: number, batteryKwh: bigint) => {
    const vinHash = keccak256(encodePacked(['string'], [vin]))
    writeContract({
      address,
      abi: VEHICLE_IDENTITY_ABI,
      functionName: 'registerVehicle',
      args: [vinHash, manufacturer, model, year, batteryKwh],
    })
  }

  return { register, hash, isPending, isConfirming, isSuccess, error }
}
