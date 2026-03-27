'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseEther } from 'viem'
import { ADDRESSES, NAMESPACE_FACTORY_ABI } from '../lib/contracts'
import { SEPOLIA_CHAIN_ID } from '../lib/constants'

export function useBrandInfo(brand: string) {
  const chainId = useChainId()
  const address = chainId === SEPOLIA_CHAIN_ID ? ADDRESSES.sepolia.namespaceFactory : ADDRESSES.mainnet.namespaceFactory

  const { data: info, isLoading } = useReadContract({
    address,
    abi: NAMESPACE_FACTORY_ABI,
    functionName: 'getBrandInfo',
    args: [brand],
    query: { enabled: brand.length >= 2 },
  })

  const { data: reserved } = useReadContract({
    address,
    abi: NAMESPACE_FACTORY_ABI,
    functionName: 'isReserved',
    args: [brand],
    query: { enabled: brand.length >= 2 },
  })

  return { info, reserved, isLoading }
}

export function useClaimBrand() {
  const chainId = useChainId()
  const address = chainId === SEPOLIA_CHAIN_ID ? ADDRESSES.sepolia.namespaceFactory : ADDRESSES.mainnet.namespaceFactory
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claim = (brand: string, signers: `0x${string}`[]) => {
    writeContract({
      address,
      abi: NAMESPACE_FACTORY_ABI,
      functionName: 'claimBrand',
      args: [brand, signers],
      value: parseEther('10'),
    })
  }

  return { claim, hash, isPending, isConfirming, isSuccess, error }
}
