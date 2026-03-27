export const typeDefs = `
  type Vehicle {
    tokenId: ID!
    manufacturer: String!
    model: String!
    year: Int!
    batteryCapacityKwh: String!
    registrationDate: String!
    locked: Boolean!
    owner: String
  }

  type BatteryEntry {
    vehicleId: ID!
    stateOfHealth: Int!
    cycleCount: Int!
    merkleRoot: String!
    timestamp: String!
  }

  type Brand {
    name: ID!
    registry: String!
    resolver: String!
    multiSig: String!
    claimed: Boolean!
    reserved: Boolean!
    claimedAt: String
  }

  type Payment {
    escrowId: ID!
    payer: String!
    payee: String!
    amount: String!
    token: String!
    paymentType: String!
    status: String!
    createdAt: String!
  }

  type ChargingSession {
    id: ID!
    stationId: String!
    escrowId: String!
    initiatedAt: String!
    finalizedAt: String
    actualKwh: String
    totalCost: String
  }

  type Query {
    vehicle(tokenId: ID!): Vehicle
    vehicles(manufacturer: String, limit: Int): [Vehicle!]!
    brand(name: String!): Brand
    brands(limit: Int): [Brand!]!
    chargingSession(id: ID!): ChargingSession
    payment(escrowId: ID!): Payment
  }
`
