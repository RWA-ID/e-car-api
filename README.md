# ⚡ e-car.eth — The Protocol Layer for Electric Vehicles

> **Neutral ENS infrastructure for the global EV ecosystem.** Decentralized identity, programmable payments, battery lifecycle transparency, voice-activated transactions, supply chain provenance, and fleet intelligence — all on Ethereum.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue)](https://soliditylang.org)
[![Network](https://img.shields.io/badge/Network-Ethereum%20Sepolia-purple)](https://sepolia.etherscan.io)
[![Tests](https://img.shields.io/badge/Tests-47%2F47%20passing-brightgreen)](#testing)
[![Contracts](https://img.shields.io/badge/Contracts-10%20Verified-cyan)](#deployed-contracts)

---

## Table of Contents

1. [What Is e-car.eth?](#what-is-e-careth)
2. [The Problem](#the-problem)
3. [The Solution: A Neutral Protocol Layer](#the-solution-a-neutral-protocol-layer)
4. [ENS Namespace Architecture](#ens-namespace-architecture)
5. [Core Features](#core-features)
6. [Use Cases by Stakeholder](#use-cases-by-stakeholder)
7. [API Reference](#api-reference)
8. [SDK](#sdk)
9. [Voice SDK](#voice-sdk)
10. [Deployed Contracts](#deployed-contracts)
11. [Monorepo Structure](#monorepo-structure)
12. [Getting Started](#getting-started)
13. [Testing](#testing)
14. [Protocol Economics](#protocol-economics)
15. [Roadmap](#roadmap)

---

## What Is e-car.eth?

**e-car.eth** is an open, neutral protocol that gives every electric vehicle on the planet a permanent, programmable identity on Ethereum. It is not an app, not a consumer product, and not controlled by any single OEM. It is **infrastructure** — the same way ENS is infrastructure for human-readable names, e-car.eth is infrastructure for vehicle-readable identity, payments, and data.

Any OEM (Tesla, Ford, Rivian, BYD, BMW, etc.) can integrate via a single API key. Any charging network can plug in. Any fleet operator can onboard. The protocol is brand-neutral: no single manufacturer owns it, no platform can de-list a competitor's vehicles, and no intermediary takes a rent-seeking cut beyond the transparent on-chain fee.

The protocol is live on **Ethereum Sepolia testnet** with 10 source-verified smart contracts. Mainnet deployment follows OEM onboarding.

---

## The Problem

The global EV ecosystem is deeply fragmented:

| Problem | Reality Today |
|---|---|
| **Identity** | Vehicle identity lives in siloed OEM databases. A Tesla VIN means nothing to a Rivian charger. |
| **Payments** | Charging requires OEM-specific apps, cards, or RFID fobs. No interoperability. |
| **Battery data** | State-of-health lives in the OEM cloud. Resale buyers, insurers, and regulators have no independent verification. |
| **Supply chain** | Battery materials — lithium, cobalt, nickel — have no on-chain traceability from mine to vehicle to recycler. |
| **Carbon credits** | EVs generate real environmental value but carbon credit minting is manual, opaque, and expensive. |
| **Fleet ops** | Fleet operators manage vehicles across 5+ platforms with separate billing and no unified settlement. |
| **Interoperability** | Voice commands work within one OEM's ecosystem only. Cross-brand payment is impossible. |

The root cause: **no shared identity and payment layer**. Every OEM re-builds the same infrastructure in isolation.

---

## The Solution: A Neutral Protocol Layer

e-car.eth sits **below** the OEM application layer as shared infrastructure:

```
┌─────────────────────────────────────────────────────────────────┐
│                     OEM Application Layer                        │
│         Tesla App · Ford Pass · Rivian App · BYD App            │
├─────────────────────────────────────────────────────────────────┤
│                    e-car.eth Protocol Layer                      │
│   Identity · Payments · Battery Data · Voice · Fleet · Carbon   │
├─────────────────────────────────────────────────────────────────┤
│                      Ethereum + ENS                              │
│              Immutable · Permissionless · Global                 │
└─────────────────────────────────────────────────────────────────┘
```

OEMs integrate once via REST API or TypeScript SDK, retain full UX control, and the protocol handles identity, payments, data provenance, and interoperability.

---

## ENS Namespace Architecture

Every entity in the EV ecosystem gets a human-readable, machine-resolvable ENS name under `e-car.eth`:

```
e-car.eth                                    ← Protocol root
│
├── tesla.e-car.eth                          ← OEM brand namespace (10 ETH claim)
│   ├── 5YJSA1H21FFP12345.tesla.e-car.eth   ← Individual vehicle (soulbound NFT)
│   ├── station-nyc-001.tesla.e-car.eth      ← Charging station
│   └── fleet-001.tesla.e-car.eth            ← Fleet unit
│
├── ford.e-car.eth
├── rivian.e-car.eth
├── byd.e-car.eth
│
├── fleet.e-car.eth                          ← Brand-neutral fleet namespace
│   └── hertz-001.fleet.e-car.eth
│
└── station.e-car.eth                        ← Brand-neutral charging namespace
```

**Why ENS:**
- **Human-readable**: `tesla.e-car.eth` is auditable; `0x54e01a...` is not
- **Machine-resolvable**: Any CCIP-enabled client resolves vehicle data by name
- **Composable**: Works with SIWE, The Graph, Uniswap hooks, and any ENS-aware protocol
- **Permissionless**: Once a brand claims their namespace, they control it independently

---

## Core Features

### 1. Decentralized Vehicle Identity (ERC-721 + ERC-5192)

**Contract:** `VehicleIdentity.sol` — [`0x54e01a...eB41d1`](https://sepolia.etherscan.io/address/0x54e01a35371a5cc945403b34f151bF082FeB41d1)

Every registered vehicle is minted as a **soulbound NFT**. The token stores the VIN as a `keccak256` hash (privacy-preserving, still verifiable), manufacturer, model, year, and battery capacity — permanently anchored on Ethereum.

```solidity
struct VehicleData {
    bytes32 vinHash;            // keccak256(VIN) — privacy-preserving
    string manufacturer;        // "Tesla"
    string model;               // "Model 3"
    uint16 year;                // 2024
    uint256 batteryCapacityKwh; // 82000 Wh
    uint256 registrationDate;   // Unix timestamp
    bool transferApproved;      // ERC-5192 soulbound state
}
```

**What this enables:**

| Capability | Impact |
|---|---|
| Cross-OEM interoperability | A BMW charger verifies a Tesla without calling Tesla's API |
| Resale transparency | Buyers verify ownership history and battery specs on-chain |
| EU Digital Product Passport | Tamper-proof vehicle identity for regulatory compliance |
| Insurance underwriting | Verified vehicle data without owner self-reporting |
| Theft deterrence | Soulbound binding makes NFT title theft structurally impossible |

```bash
curl https://api.e-car.eth/api/v1/vehicles/1 -H "x-api-key: ecar_..."
# Live response from VehicleIdentity.sol on Sepolia:
# { "tokenId":"1", "manufacturer":"Tesla", "model":"Model 3", "year":2024,
#   "batteryCapacityKwh":"82000", "locked":true, "owner":"0x5f11...1165b" }
```

---

### 2. Battery Passport & Supply Chain Transparency

**Contracts:** `BatteryPassport.sol` + `MerkleBatchOracle.sol`

The battery passport is a permanent, append-only on-chain ledger of a battery's health. Data is anchored via **Merkle roots** — full telemetry lives off-chain (IPFS/OEM), but the cryptographic commitment lives on Ethereum forever.

#### Full Supply Chain Traceability

```
Mine → Refinery → Cell Manufacturer → Pack Assembly → OEM → Driver → Second Life → Recycler
  ↓         ↓              ↓                 ↓           ↓       ↓          ↓           ↓
[Hash]   [Hash]          [Hash]            [Hash]     [NFT]  [Passport] [Transfer]  [Retire]
```

Each step posts a signed Merkle root. Any party — regulator, buyer, insurer, recycler — independently verifies provenance without trusting any single party.

#### EU Battery Regulation 2023/1542 Compliance

The EU mandates a Digital Battery Passport for all EV batteries over 2 kWh sold in Europe after 2026. e-car.eth's BatteryPassport is built for this:
- Immutable history regulators can audit independently
- Cryptographic proof verification against on-chain Merkle roots
- Transferable with the vehicle through resale, lease return, and second-life deployment

#### Resale Market Transformation

Used EV listings show verified, OEM-signed state-of-health. Buyers see: *"This battery has 91% health, 287 cycles, last updated 3 days ago by Tesla's oracle."* No third-party inspection — the blockchain is the inspector.

```bash
curl https://api.e-car.eth/api/v1/battery/1 -H "x-api-key: ecar_..."
# Live from BatteryPassport.sol:
# { "vehicleId":"1", "stateOfHealth":91, "cycleCount":287,
#   "merkleRoot":"0x9c014e...0244", "timestamp":"1774575252" }
```

---

### 3. Programmable & Autonomous Payments

**Contracts:** `UniversalPaymentEscrow.sol` + `ChargingPaymentRouter.sol` + `TollGateRegistry.sol` + `ParkingPayment.sol`

This is e-car.eth's most transformative capability: **vehicles that pay for themselves**.

#### How It Works

```
Vehicle arrives at station
         │
         ▼
Agent wallet calls lock(stationNodeId, estimatedKwh, token)
         │
         ▼
[Escrow Created — funds locked on-chain]
         │
         ▼
[Charging Session Active — no human required]
         │
         ▼
release(actualKwh)
         │
         ├─→ Operator paid instantly (USDC/ETH/any ERC-20)
         ├─→ Owner refunded for unused estimate
         └─→ 0.3% protocol fee auto-deducted
```

#### Multi-Token Payment
Station operators whitelist accepted tokens: ETH, USDC, WBTC, or any ERC-20. A European EV pays a Japanese charger in USDC with no currency conversion.

#### Toll & Parking Automation

```typescript
// Vehicle pays toll automatically — zero human interaction
await client.tolls.pay({ vehicleId: 1n, gateId: 'E-ZPass-NYC-001', amount: parseUnits('4.75', 6) })

// Vehicle parks and pays automatically on exit
await client.parking.initiate({ vehicleId: 1n, lotId: 'LOT-JFK-T4', estimatedHours: 6 })
```

**Why this matters:**
- No friction — drivers never open an app to pay for energy, parking, or tolls
- No chargebacks — crypto escrow is final
- Instant settlement — operators receive funds in the same block session closes
- Programmable rules — spending limits enforced at smart contract level, not backend

---

### 4. Voice-Activated On-Chain Payments

**Package:** `@e-car-eth/voice-sdk` | **Contract:** `VoiceRampRouter.sol`

The Voice SDK bridges natural language to on-chain transactions. Drop one package into your in-car middleware:

```typescript
import { ECarVoicePlugin } from '@e-car-eth/voice-sdk'

const plugin = new ECarVoicePlugin({
  vehicleId: 1n,
  apiKey: process.env.ECAR_API_KEY,
  adapter: 'tesla-grok', // or alexa-auto | google-assistant | siri-carplay
})

const tts = await plugin.handleUtterance(
  "Charge my car to 80% at the nearest Tesla station and pay with USDC"
)
// → Classifies intent → Finds station on-chain → Locks escrow → Returns TTS string
// → "Starting 33 kWh session at STATION-NYC-001. $8.40 USDC locked. ~45 minutes."
```

#### Supported Intents

| Voice Command | On-Chain Action |
|---|---|
| "Charge my car to 80%" | `ChargingPaymentRouter.initiateSession()` |
| "Pay for parking at JFK" | `ParkingPayment.initiate()` |
| "Buy $50 of ETH" | `VoiceRampRouter.initiateRamp()` → MoonPay/Transak |
| "Send 10 USDC to my wife's car" | `AgentWallet.execute()` |
| "What's my battery health?" | `BatteryPassport.getHistory()` |
| "Stop charging" | `ChargingPaymentRouter.finalizeSession()` |

#### Platform Adapters
- `tesla-grok` — Tesla FSD Computer / Grok LLM
- `alexa-auto` — Amazon Alexa Auto SDK
- `google-assistant` — Google Assistant / Android Auto
- `siri-carplay` — Apple Siri / CarPlay

#### Fiat On-Ramp (No Crypto Required)
If agent wallet balance is insufficient, VoiceRampRouter triggers MoonPay/Transak in-car. Credit card → USDC in ~60 seconds → charging starts automatically.

---

### 5. Agent Wallets per Vehicle (ERC-4337)

**Contract:** `AgentWallet.sol` — [`0x0a235B...6f7f`](https://sepolia.etherscan.io/address/0x0a235Bf7f71349b6663e5875d7B60F18b7a26f7f)

Every vehicle gets a dedicated **ERC-4337 smart account** — a programmable wallet that acts autonomously on the vehicle's behalf.

```
Owner sets rules once → Agent wallet enforces forever:
  ✓ Pay for charging up to $50/session
  ✓ Pay for parking up to $30/session
  ✓ Pay tolls under $5 each
  ✗ Reject any single tx > $100
  ✗ Reject any vendor not on approved list
```

Rules are enforced at the smart contract level — not by an app that can be hacked, not by a backend that can go down.

**Use cases:**
- **Robotaxis**: Earn fares, pay for charging, zero human intervention
- **Fleet cards**: Company wallets restricted to approved stations only
- **Parental controls**: Spending limits on teenager's vehicle enforced on-chain
- **Subscription billing**: Station operators charge recurring fees automatically

---

### 6. Charging Station Registry

**Contract:** `ChargingStationRegistry.sol` — [`0xfB91A8...46E5`](https://sepolia.etherscan.io/address/0xfB91A8d3599952e2425534cA656396E9488646E5)

Any charging operator registers stations on-chain. Each station gets a deterministic `nodeId`, ENS subname, and on-chain pricing. Any protocol-compatible vehicle from any OEM can initiate a payment session without prior registration or app download.

**Live on Sepolia:** `STATION-NYC-001.tesla.e-car.eth` at 0.00025 ETH/kWh is queryable right now.

---

### 7. Vehicle-to-Grid (V2G) Settlement

**Contract:** `V2GSettlement.sol`

EVs are mobile batteries. During peak demand, they export energy and earn USDC automatically:

```
Grid signals peak demand
         ↓
V2GSettlement.requestEnergy(vehicleIds, kwhTarget, pricePerKwh)
         ↓
Oracle attests kWh delivered (signed, verifiable)
         ↓
USDC auto-sent to each vehicle's agent wallet
```

A fleet of 100 EVs participating in V2G can earn $10,000–$50,000/month in passive revenue — currently uncaptured because settlement infrastructure doesn't exist.

---

### 8. Carbon Credit Automation (ERC-1155)

**Contract:** `CarbonCreditMinter.sol`

Every EV mile driven avoids ICE emissions. The minter quantifies and tokenizes this:

1. **Mint**: Credits minted per kWh charged, weighted by grid carbon intensity (coal grid = less credit, renewable = more)
2. **Trade**: ERC-1155 tokens tradeable on any marketplace
3. **Retire**: Burned with immutable proof of retirement — timestamp, quantity, retiree identity

**Who needs this:**
- Fleet operators: Demonstrate Scope 1/2 reductions to regulators
- OEMs: EU CAFE fleet emission targets via transparent on-chain credits
- ESG funds: Verifiable (not self-reported) sustainability data
- Airlines: CORSIA-compliant carbon offsets from verified EV operation

---

### 9. Fleet Management

**Contract:** `FleetRegistry.sol`

```bash
# Aggregated fleet payment report — single API call
GET /api/v1/fleet/:fleetId/payments
→ {
    "totalChargingSpend": "4500.00 USDC",
    "totalTollSpend": "320.00 USDC",
    "totalParkingSpend": "180.00 USDC",
    "totalV2GEarnings": "750.00 USDC",
    "period": "30d"
  }
```

Fleet use cases:
- **Rental companies**: Geofences prevent EVs from leaving metro area
- **Logistics**: Per-route charging cost allocation across national fleet
- **Ride-share**: Drivers restricted to rate-negotiated stations only
- **Municipal transit**: Transparent, auditable charging expenditure for public accountability

---

### 10. OTA Firmware Verification

**Contract:** `OTAVerifier.sol`

Cryptographic gate before any firmware update installs:

```
OEM signs update:  signature = ECDSA.sign(keccak256(firmware), oem_private_key)
Vehicle verifies:  OTAVerifier.verify(firmwareHash, signature, oem_address)
                   → true: install  |  false: reject + alert driver
```

Prevents malicious firmware injection even if the OEM's update server is compromised. Required for ISO 21434 and UN R155 automotive cybersecurity compliance.

---

### 11. Insurance Vault

**Contract:** `InsuranceVault.sol`

On-chain risk pooling for EV-specific coverage:
- Premiums calculated from verified battery health, oracle-attested mileage, and charging behavior
- Claims triggered by oracle-attested events — no human adjuster for standard claims
- Funds held in smart contract — no counterparty risk from insurer insolvency
- Surplus distributed to policyholders automatically

---

### 12. Data Marketplace

**Contract:** `DataMarketplace.sol`

Vehicle owners monetize their own data via privacy-preserving Merkle proofs. Buyers (insurers, researchers, planners) purchase proof of data properties without accessing raw values. Each sale requires on-chain owner authorization and settles in USDC micropayments.

---

## Use Cases by Stakeholder

### Auto Manufacturers (OEMs)
```
✓ Claim brand.e-car.eth (10 ETH one-time) → deploy BrandRegistry + MultiSig
✓ Mint vehicle NFTs at production line
✓ Post battery passport oracle data for regulatory compliance
✓ Enable in-car voice payments via Voice SDK (1 npm install)
✓ Sell vehicles with "blockchain-verified battery health" as a feature
```

### Charging Networks
```
✓ Register stations via POST /charging/stations
✓ Accept ETH, USDC, or any ERC-20 — no credit card processor
✓ Instant settlement — no chargebacks, no invoice cycles
✓ Access fleet corporate accounts automatically
✓ Interoperate with every OEM on the protocol
```

### Fleet Operators
```
✓ Unified payment layer across all OEM vehicles
✓ Per-vehicle spending limits at smart contract level
✓ Aggregated payment reporting across all vehicles and vendors
✓ Carbon credit generation for ESG compliance automatically
✓ V2G revenue from idle fleet during peak demand
```

### Grid Operators & Utilities
```
✓ Define V2G program parameters on-chain
✓ Signal demand events via oracle
✓ Automatic per-kWh micropayment to participating vehicles
✓ Real-time visibility into available grid-connected EV capacity
```

### Insurance Companies
```
✓ Query verified battery health history via API — no self-reporting
✓ Access oracle-attested mileage and charging behavior
✓ Trigger parametric claims via on-chain events
✓ Participate in InsuranceVault as underwriter
```

### Regulators & Government
```
✓ EU Battery Regulation 2023/1542 compliance out-of-the-box
✓ Independent verification of carbon credit claims
✓ Tamper-proof vehicle registration records
✓ Public visibility into fleet emission reduction progress
✓ Cross-border vehicle identity resolution (no API dependencies)
```

### Autonomous Vehicle Operators
```
✓ Deploy ERC-4337 agent wallet per vehicle
✓ Robotaxi earns fares + pays charging + zero human intervention
✓ All transactions verifiable on-chain in real time
✓ Programmable spending rules enforced at smart contract level
```

### Developers & Startups
```
✓ Free Sepolia API key — no OEM partnership required
✓ Build EV insurance, fleet analytics, carbon markets on top
✓ Open protocol — permissionless composition
✓ Live contract data available immediately
```

---

## API Reference

### Authentication

```bash
# Generate API key
curl -X POST https://api.e-car.eth/auth/keys \
  -H "Content-Type: application/json" \
  -d '{"label": "my-integration", "tier": "free"}'

# Use in all requests
curl https://api.e-car.eth/api/v1/vehicles/1 -H "x-api-key: ecar_fre_..."
```

### Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check (no auth) |
| `POST` | `/auth/keys` | Generate API key |
| `GET` | `/api/v1/vehicles/:tokenId` | Get vehicle — reads `VehicleIdentity.sol` |
| `POST` | `/api/v1/vehicles` | Register vehicle (OEM) |
| `GET` | `/api/v1/battery/:vehicleId` | Latest passport — reads `BatteryPassport.sol` |
| `GET` | `/api/v1/battery/:vehicleId/history` | Full battery history |
| `GET` | `/api/v1/charging/stations` | List stations — reads `ChargingStationRegistry.sol` |
| `POST` | `/api/v1/charging/sessions` | Initiate charging session |
| `GET` | `/api/v1/brands/:brand` | Brand namespace info |
| `POST` | `/api/v1/brands/:brand/claim` | Claim namespace (returns unsigned tx) |
| `GET` | `/api/v1/fleet/:fleetId/payments` | Fleet payment summary |
| `GET` | `/api/v1/carbon/:vehicleId` | Carbon credit balance |
| `POST` | `/api/v1/voice/intent` | Process voice intent |
| `GET` | `/graphql` | GraphQL endpoint |
| `WS` | `/ws` | WebSocket real-time events |
| `GET` | `/docs` | Swagger UI |

### WebSocket Events

```javascript
const ws = new WebSocket('wss://api.e-car.eth/ws')
ws.send(JSON.stringify({ type: 'subscribe', channels: ['vehicles', 'charging', 'battery'] }))

// { type: 'vehicle:registered', tokenId: '2', manufacturer: 'Ford' }
// { type: 'session:started', sessionId: '...', stationNodeId: '0x...' }
// { type: 'battery:updated', vehicleId: '1', stateOfHealth: 91 }
// { type: 'carbon:minted', vehicleId: '1', credits: '42' }
```

### GraphQL

```graphql
query {
  vehicle(tokenId: "1") {
    manufacturer
    model
    locked
    owner
    batteryPassport {
      stateOfHealth
      cycleCount
      merkleRoot
    }
  }
}
```

---

## SDK

```bash
npm install @e-car-eth/sdk
```

```typescript
import { ECarClient } from '@e-car-eth/sdk'

const client = new ECarClient({ apiKey: '...', network: 'sepolia' })

const vehicle  = await client.vehicles.get(1n)
const passport = await client.battery.getPassport(1n)
const stations = await client.charging.listStations({ brand: 'tesla' })
const session  = await client.charging.initiate({ vehicleId: 1n, stationNodeId: '0x...', estimatedKwh: 30 })
const fleet    = await client.fleet.getPayments(fleetId, '30d')
const credits  = await client.carbon.getBalance(1n)
const tx       = await client.brands.claim('ford', signerAddress)
```

---

## Voice SDK

```bash
npm install @e-car-eth/voice-sdk
```

```typescript
import { ECarVoicePlugin } from '@e-car-eth/voice-sdk'

const plugin = new ECarVoicePlugin({
  vehicleId: 1n,
  apiKey: '...',
  adapter: 'tesla-grok', // alexa-auto | google-assistant | siri-carplay
  rampProvider: 'moonpay',
})

const tts = await plugin.handleUtterance("Charge to 80% and pay with USDC")
// → "Starting 33 kWh session at STATION-NYC-001. $8.40 locked. ~45 minutes."
```

---

## Deployed Contracts

All 10 contracts deployed and **source-verified** on Ethereum Sepolia (Chain ID: 11155111).

| Contract | Address | Standard | Etherscan |
|---|---|---|---|
| `VehicleIdentity` | `0x54e01a35371a5cc945403b34f151bF082FeB41d1` | ERC-721 + ERC-5192 | [View](https://sepolia.etherscan.io/address/0x54e01a35371a5cc945403b34f151bF082FeB41d1) |
| `BatteryPassport` | `0x0931166d309C43E3a4C9e1108cA294a80C794E15` | AccessControl + Merkle | [View](https://sepolia.etherscan.io/address/0x0931166d309C43E3a4C9e1108cA294a80C794E15) |
| `UniversalPaymentEscrow` | `0x7c9aDE7EBf0De8A98263889E40B835e775246c9f` | ReentrancyGuard + ERC-20 | [View](https://sepolia.etherscan.io/address/0x7c9aDE7EBf0De8A98263889E40B835e775246c9f) |
| `AgentWallet` (impl) | `0x0a235Bf7f71349b6663e5875d7B60F18b7a26f7f` | ERC-4337 | [View](https://sepolia.etherscan.io/address/0x0a235Bf7f71349b6663e5875d7B60F18b7a26f7f) |
| `MerkleBatchOracle` | `0x8d0324e1AeeeC039c31ed28f1C148A8F34961982` | AccessControl | [View](https://sepolia.etherscan.io/address/0x8d0324e1AeeeC039c31ed28f1C148A8F34961982) |
| `NamespaceGovernorFactory` | `0x9544eA93D662a2d7AF2F66061C1863079992a89C` | Factory | [View](https://sepolia.etherscan.io/address/0x9544eA93D662a2d7AF2F66061C1863079992a89C) |
| `MultiSigFactory` | `0x5d10C00CFDBd5E73B1973c2275f5a028288400a9` | 2-of-2 Multisig | [View](https://sepolia.etherscan.io/address/0x5d10C00CFDBd5E73B1973c2275f5a028288400a9) |
| `ChargingStationRegistry` | `0xfB91A8d3599952e2425534cA656396E9488646E5` | Ownable | [View](https://sepolia.etherscan.io/address/0xfB91A8d3599952e2425534cA656396E9488646E5) |
| `ChargingPaymentRouter` | `0x3aeC1c86933a8E5b037E9dbC2Fa996fF24992462` | Payment Router | [View](https://sepolia.etherscan.io/address/0x3aeC1c86933a8E5b037E9dbC2Fa996fF24992462) |
| `VoiceRampRouter` | `0x3a1e3C07c3a60e783ce42128724040Fe45093080` | Fiat On-Ramp | [View](https://sepolia.etherscan.io/address/0x3a1e3C07c3a60e783ce42128724040Fe45093080) |

### Live Testnet State
- **Vehicle #1**: Tesla Model 3 (2024), 82 kWh, soulbound to `0x5f11...1165b`
- **Battery Passport**: SoH 91%, 287 cycles, Merkle root `0x9c014e...`
- **Charging Station**: `STATION-NYC-001.tesla.e-car.eth`, 0.00025 ETH/kWh, active

---

## Monorepo Structure

```
e-car-eth/
├── contracts/          # Foundry smart contracts (20+ contracts)
│   ├── src/core/       # VehicleIdentity, BatteryPassport, PaymentEscrow, AgentWallet
│   ├── src/namespace/  # NamespaceGovernorFactory, BrandRegistry, MultiSigFactory
│   ├── src/charging/   # ChargingStationRegistry, ChargingPaymentRouter
│   ├── src/carbon/     # CarbonCreditMinter
│   ├── src/fleet/      # FleetRegistry
│   ├── src/v2g/        # V2GSettlement
│   ├── src/voice/      # VoiceRampRouter
│   ├── src/ota/        # OTAVerifier
│   ├── src/insurance/  # InsuranceVault
│   ├── src/marketplace/# VehicleMarketplace, DataMarketplace
│   ├── src/payments/   # TollGateRegistry, ParkingPayment
│   ├── test/           # 47 Foundry tests
│   └── script/         # Deploy scripts
├── api/                # Express REST + GraphQL + WebSocket
│   └── src/
│       ├── routes/     # vehicles, battery, charging, brands, fleet, carbon, voice
│       ├── lib/        # Viem client + live contract reads
│       ├── ws/         # WebSocket event server
│       └── openapi/    # OpenAPI 3.0.3 spec → Swagger UI at /docs
├── sdk/                # @e-car-eth/sdk TypeScript SDK
├── voice-sdk/          # @e-car-eth/voice-sdk (Tesla/Alexa/Google/Siri)
├── subgraph/           # The Graph event indexing
├── ccip-gateway/       # CCIP-Read off-chain gateway
├── frontend/           # Next.js dApp (reference implementation)
└── landing/            # IPFS landing page (zero dependencies)
```

---

## Getting Started

### Prerequisites
- [Foundry](https://getfoundry.sh) (`foundryup`)
- Node.js 18+
- Alchemy or Infura API key

### 1. Clone & Install

```bash
git clone https://github.com/RWA-ID/e-car-api.git
cd e-car-api
npm install
```

### 2. Configure Environment

```bash
cp .env.example api/.env
# Edit api/.env — set RPC_URL to your Alchemy Sepolia key
```

```env
PORT=3001
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

VEHICLE_IDENTITY_ADDRESS=0x54e01a35371a5cc945403b34f151bF082FeB41d1
BATTERY_PASSPORT_ADDRESS=0x0931166d309C43E3a4C9e1108cA294a80C794E15
PAYMENT_ESCROW_ADDRESS=0x7c9aDE7EBf0De8A98263889E40B835e775246c9f
NAMESPACE_FACTORY_ADDRESS=0x9544eA93D662a2d7AF2F66061C1863079992a89C
CHARGING_REGISTRY_ADDRESS=0xfB91A8d3599952e2425534cA656396E9488646E5
CHARGING_ROUTER_ADDRESS=0x3aeC1c86933a8E5b037E9dbC2Fa996fF24992462
VOICE_ROUTER_ADDRESS=0x3a1e3C07c3a60e783ce42128724040Fe45093080
```

### 3. Start the API

```bash
cd api && npm run dev
# REST     → http://localhost:3001/api/v1
# GraphQL  → http://localhost:3001/graphql
# WebSocket→ ws://localhost:3001/ws
# Docs     → http://localhost:3001/docs
```

### 4. Get an API Key & Test Live Data

```bash
# Generate key
curl -X POST http://localhost:3001/auth/keys \
  -H "Content-Type: application/json" \
  -d '{"label":"test","tier":"free"}'

# Read live vehicle (Token #1 on Sepolia)
curl http://localhost:3001/api/v1/vehicles/1 -H "x-api-key: YOUR_KEY"

# Read live battery passport
curl http://localhost:3001/api/v1/battery/1 -H "x-api-key: YOUR_KEY"

# List live charging stations
curl http://localhost:3001/api/v1/charging/stations -H "x-api-key: YOUR_KEY"
```

### 5. Run Contract Tests

```bash
cd contracts
export PATH="$HOME/.foundry/bin:$PATH"
forge test -vv
# Test result: ok. 47 passed; 0 failed
```

---

## Testing

```
contracts/test/
├── core/VehicleIdentity.t.sol          # Minting, soulbound locking, access control
├── core/BatteryPassport.t.sol          # Passport updates, history, Merkle verification
├── core/PaymentEscrow.t.sol            # Escrow create/release/cancel, fee split
├── core/AgentWallet.t.sol              # ERC-4337 execution, ETH receive/send
├── namespace/NamespaceGovernorFactory.t.sol  # Brand claims, 10 ETH fee
├── namespace/BrandRegistry.t.sol            # Subname registration
├── charging/ChargingPaymentRouter.t.sol     # Session lifecycle
├── battery/BatteryHealthOracle.t.sol        # Oracle role, batch updates
└── voice/VoiceRampRouter.t.sol              # Ramp initiation

forge test -vv
# [PASS] test_registerVehicle() (gas: 248k)
# [PASS] test_soulboundCannotTransfer()
# [PASS] test_batteryPassportMerkleVerification()
# [PASS] test_escrowCreateAndRelease()
# [PASS] test_agentWalletAutonomousPayment()
# [PASS] test_namespaceClaim10EthFee()
# ... 41 more
# Result: ok. 47 passed; 0 failed
```

---

## Protocol Economics

### API Tiers

| Tier | Price | Requests | Network |
|---|---|---|---|
| Developer | Free | 10,000/mo | Sepolia |
| OEM | $5,000/mo | 5,000,000/mo | Mainnet + Sepolia |
| Enterprise | $25,000/mo | Unlimited | Multi-chain |

### On-Chain Fees

| Action | Fee | Split |
|---|---|---|
| Brand namespace claim | 10 ETH | 100% treasury |
| Vehicle registration | 0.01 ETH | 100% treasury |
| Charging payment | 0.3% of session | 70% operator / 30% treasury |
| Marketplace transaction | 1% | 100% treasury |
| Carbon credit mint | 5% of credits | 100% treasury |

Treasury governed by `ECarDAO.sol` — token holders vote on upgrades, fee changes, and grant allocations.

---

## Roadmap

### Phase 1 — Foundation ✅ Complete
- [x] 20+ Solidity contracts
- [x] 10 contracts deployed + verified on Sepolia
- [x] REST + GraphQL + WebSocket API (live chain reads)
- [x] TypeScript SDK + Voice SDK (4 adapters)
- [x] IPFS landing page at `e-car.eth`
- [x] GitHub open source release

### Phase 2 — OEM Onboarding (Q2 2025)
- [ ] First OEM brand namespace claim
- [ ] Battery passport oracle network (3+ operators)
- [ ] The Graph subgraph deployment
- [ ] SDK npm publish

### Phase 3 — Ecosystem (Q3 2025)
- [ ] Ethereum mainnet deployment
- [ ] Insurance Vault launch
- [ ] V2G pilot with grid operator
- [ ] Carbon credit market integration

### Phase 4 — Scale (Q4 2025)
- [ ] ECarDAO governance launch
- [ ] Multi-chain (Polygon, Arbitrum, Base)
- [ ] ZK battery proofs (privacy-preserving health data)
- [ ] Mobile SDK (iOS, Android)

---

## License

MIT — see [LICENSE](LICENSE)

---

## Links

- **Landing Page**: [e-car.eth.limo](https://e-car.eth.limo)
- **IPFS**: `ipfs://bafybeifna4bucm3fg7utsmhjntj65bsybfv4u2cqjloi3qfdvawimhvpma`
- **GitHub**: [github.com/RWA-ID/e-car-api](https://github.com/RWA-ID/e-car-api)
- **Sepolia Contracts**: [sepolia.etherscan.io](https://sepolia.etherscan.io/address/0x54e01a35371a5cc945403b34f151bF082FeB41d1)
- **Request Access**: Fill the form at [e-car.eth.limo](https://e-car.eth.limo)

---

*Built on Ethereum · Powered by ENS · MIT Licensed · Open Protocol*
