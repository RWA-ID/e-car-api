// Resolvers read from The Graph subgraph or directly from RPC
// TODO: Replace mock data with live viem/subgraph calls

export const resolvers = {
  Query: {
    vehicle: async (_: unknown, { tokenId }: { tokenId: string }) => ({
      tokenId,
      manufacturer: 'Tesla',
      model: 'Model 3',
      year: 2024,
      batteryCapacityKwh: '82000',
      registrationDate: String(Math.floor(Date.now() / 1000)),
      locked: true,
      owner: '0x0000000000000000000000000000000000000001',
    }),

    vehicles: async (_: unknown, { manufacturer, limit = 10 }: { manufacturer?: string; limit?: number }) => [
      {
        tokenId: '1',
        manufacturer: manufacturer ?? 'Tesla',
        model: 'Model 3',
        year: 2024,
        batteryCapacityKwh: '82000',
        registrationDate: String(Math.floor(Date.now() / 1000)),
        locked: true,
        owner: '0x0000000000000000000000000000000000000001',
      },
    ],

    brand: async (_: unknown, { name }: { name: string }) => ({
      name,
      registry: '0x0000000000000000000000000000000000000002',
      resolver: '0x0000000000000000000000000000000000000003',
      multiSig: '0x0000000000000000000000000000000000000004',
      claimed: false,
      reserved: ['tesla', 'ford', 'rivian', 'bmw'].includes(name.toLowerCase()),
      claimedAt: null,
    }),

    brands: async (_: unknown, { limit = 10 }: { limit?: number }) => [],

    chargingSession: async (_: unknown, { id }: { id: string }) => null,

    payment: async (_: unknown, { escrowId }: { escrowId: string }) => null,
  },
}
