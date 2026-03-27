import { describe, it, expect, vi } from 'vitest'
import { VehicleModule } from '../src/vehicle/identity'
import type { PublicClient, WalletClient } from 'viem'

const mockVehicleData = {
  vinHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`,
  manufacturer: 'Tesla',
  model: 'Model 3',
  year: 2024,
  batteryCapacityKwh: 82n,
  registrationDate: 1700000000n,
  transferApproved: false,
}

const mockPublicClient = {
  readContract: vi.fn().mockResolvedValue(mockVehicleData),
  waitForTransactionReceipt: vi.fn().mockResolvedValue({
    logs: [{ topics: ['0x0', '0x1'] }],
  }),
} as unknown as PublicClient

const mockWalletClient = {
  getAddresses: vi.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890']),
  writeContract: vi.fn().mockResolvedValue('0xdeadbeef'),
} as unknown as WalletClient

describe('VehicleModule', () => {
  const module = new VehicleModule(mockPublicClient, mockWalletClient, 11155111)

  it('gets vehicle data', async () => {
    const data = await module.getVehicle(1n)
    expect(data.manufacturer).toBe('Tesla')
    expect(data.model).toBe('Model 3')
    expect(data.year).toBe(2024)
  })

  it('checks locked status', async () => {
    vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(true)
    const locked = await module.isLocked(1n)
    expect(locked).toBe(true)
  })

  it('registers a vehicle', async () => {
    const result = await module.register({
      vin: 'VIN1234567890',
      manufacturer: 'Rivian',
      model: 'R1T',
      year: 2024,
      batteryCapacityKwh: 135,
    })
    expect(result.txHash).toBe('0xdeadbeef')
    expect(result.tokenId).toBeDefined()
  })

  it('throws without wallet client', async () => {
    const readOnlyModule = new VehicleModule(mockPublicClient, undefined, 11155111)
    await expect(readOnlyModule.register({
      vin: 'TEST',
      manufacturer: 'BMW',
      model: 'iX',
      year: 2024,
      batteryCapacityKwh: 111,
    })).rejects.toThrow('walletClient required')
  })
})
