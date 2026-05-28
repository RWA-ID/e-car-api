/**
 * SQLite-backed store for OEM preauthorization batches.
 *
 * Drop-in replacement for the prior in-memory `Map<string, BatchEntry>` —
 * matches the same get/set shape so route handlers stay identical.
 *
 * Schema:
 *   batches(batch_id PK, merkle_root, manufacturer, model, year,
 *           battery_capacity_kwh, default_soulbound, total, created_at)
 *   batch_vehicles(batch_id FK, vin, vin_hash, soulbound, leaf, proof_json,
 *                  PRIMARY KEY (batch_id, vin))
 *
 * Path: process.env.BATCH_DB_PATH (default './data/batches.db')
 *       Tests set it to ':memory:' for isolation.
 */
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

export interface BatchVehicle {
  vin: string
  vinHash: `0x${string}`
  soulbound: boolean
  leaf: `0x${string}`
  proof: `0x${string}`[]
}

export interface BatchEntry {
  batchId: string
  merkleRoot: `0x${string}`
  manufacturer: string
  model: string
  year: number
  batteryCapacityKwh: number
  defaultSoulbound: boolean
  total: number
  createdAt: string
  vehicles: BatchVehicle[]
}

const DB_PATH = process.env.BATCH_DB_PATH ?? path.resolve(process.cwd(), 'data/batches.db')

function openDb(): Database.Database {
  if (DB_PATH !== ':memory:') {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  }
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS batches (
      batch_id              TEXT PRIMARY KEY,
      merkle_root           TEXT NOT NULL,
      manufacturer          TEXT NOT NULL,
      model                 TEXT NOT NULL,
      year                  INTEGER NOT NULL,
      battery_capacity_kwh  INTEGER NOT NULL,
      default_soulbound     INTEGER NOT NULL,
      total                 INTEGER NOT NULL,
      soulbound_count       INTEGER NOT NULL DEFAULT 0,
      transferable_count    INTEGER NOT NULL DEFAULT 0,
      created_at            TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS batch_vehicles (
      batch_id    TEXT NOT NULL,
      vin         TEXT NOT NULL,
      vin_hash    TEXT NOT NULL,
      soulbound   INTEGER NOT NULL,
      leaf        TEXT NOT NULL,
      proof_json  TEXT NOT NULL,
      idx         INTEGER NOT NULL,
      PRIMARY KEY (batch_id, vin),
      FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_batch_vehicles_batch_idx
      ON batch_vehicles (batch_id, idx);
  `)
  return db
}

const db = openDb()

const insertBatch = db.prepare(`
  INSERT INTO batches (batch_id, merkle_root, manufacturer, model, year,
                       battery_capacity_kwh, default_soulbound, total,
                       soulbound_count, transferable_count, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const insertVehicle = db.prepare(`
  INSERT INTO batch_vehicles (batch_id, vin, vin_hash, soulbound, leaf, proof_json, idx)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)
const selectBatch = db.prepare(`SELECT * FROM batches WHERE batch_id = ?`)
const selectVehicleByVin = db.prepare(`
  SELECT * FROM batch_vehicles WHERE batch_id = ? AND vin = ?
`)
const selectVehiclesPage = db.prepare(`
  SELECT * FROM batch_vehicles WHERE batch_id = ?
  ORDER BY idx ASC LIMIT ? OFFSET ?
`)
type BatchRow = {
  batch_id: string
  merkle_root: string
  manufacturer: string
  model: string
  year: number
  battery_capacity_kwh: number
  default_soulbound: number
  total: number
  soulbound_count: number
  transferable_count: number
  created_at: string
}
type VehicleRow = {
  batch_id: string
  vin: string
  vin_hash: string
  soulbound: number
  leaf: string
  proof_json: string
  idx: number
}

function rowToVehicle(r: VehicleRow): BatchVehicle {
  return {
    vin: r.vin,
    vinHash: r.vin_hash as `0x${string}`,
    soulbound: r.soulbound === 1,
    leaf: r.leaf as `0x${string}`,
    proof: JSON.parse(r.proof_json),
  }
}

export const batchStore = {
  /** Persist a fresh batch + its vehicles atomically. */
  put(entry: BatchEntry): void {
    const sb = entry.vehicles.reduce((n, v) => n + (v.soulbound ? 1 : 0), 0)
    const tr = entry.total - sb
    const insertMany = db.transaction((e: BatchEntry) => {
      insertBatch.run(
        e.batchId, e.merkleRoot, e.manufacturer, e.model, e.year,
        e.batteryCapacityKwh, e.defaultSoulbound ? 1 : 0, e.total,
        sb, tr, e.createdAt,
      )
      e.vehicles.forEach((v, idx) => {
        insertVehicle.run(
          e.batchId, v.vin, v.vinHash, v.soulbound ? 1 : 0,
          v.leaf, JSON.stringify(v.proof), idx,
        )
      })
    })
    insertMany(entry)
  },

  /** Whole batch including all vehicles (used rarely — heavy for 100K). */
  get(batchId: string): BatchEntry | null {
    const row = selectBatch.get(batchId) as BatchRow | undefined
    if (!row) return null
    const vehicles = selectVehiclesPage.all(batchId, 1_000_000, 0) as VehicleRow[]
    return {
      batchId: row.batch_id,
      merkleRoot: row.merkle_root as `0x${string}`,
      manufacturer: row.manufacturer,
      model: row.model,
      year: row.year,
      batteryCapacityKwh: row.battery_capacity_kwh,
      defaultSoulbound: row.default_soulbound === 1,
      total: row.total,
      createdAt: row.created_at,
      vehicles: vehicles.map(rowToVehicle),
    }
  },

  /** Lightweight summary — no vehicle list. Used by GET /:batchId. */
  getSummary(batchId: string): (Omit<BatchEntry, 'vehicles'> & {
    soulboundCount: number
    transferableCount: number
  }) | null {
    const row = selectBatch.get(batchId) as BatchRow | undefined
    if (!row) return null
    return {
      batchId: row.batch_id,
      merkleRoot: row.merkle_root as `0x${string}`,
      manufacturer: row.manufacturer,
      model: row.model,
      year: row.year,
      batteryCapacityKwh: row.battery_capacity_kwh,
      defaultSoulbound: row.default_soulbound === 1,
      total: row.total,
      createdAt: row.created_at,
      soulboundCount: row.soulbound_count,
      transferableCount: row.transferable_count,
    }
  },

  /** Lookup a single vehicle in a batch by VIN. */
  getVehicle(batchId: string, vin: string): BatchVehicle | null {
    const row = selectVehicleByVin.get(batchId, vin) as VehicleRow | undefined
    return row ? rowToVehicle(row) : null
  },

  /** Paginated vehicle list. */
  getVehiclesPage(batchId: string, limit: number, offset: number): BatchVehicle[] {
    const rows = selectVehiclesPage.all(batchId, limit, offset) as VehicleRow[]
    return rows.map(rowToVehicle)
  },

  /** Test-only — wipe everything. */
  _resetForTests(): void {
    db.exec(`DELETE FROM batch_vehicles; DELETE FROM batches;`)
  },
}
