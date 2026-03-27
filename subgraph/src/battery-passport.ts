import { PassportUpdated } from '../generated/BatteryPassport/BatteryPassport'
import { BatteryEntry } from '../generated/schema'

export function handlePassportUpdated(event: PassportUpdated): void {
  const id = event.params.vehicleId.toString() + '-' + event.block.timestamp.toString()
  let entry = new BatteryEntry(id)

  entry.vehicle = event.params.vehicleId.toString()
  entry.merkleRoot = event.params.merkleRoot
  entry.stateOfHealth = event.params.stateOfHealth
  entry.cycleCount = event.params.cycleCount
  entry.timestamp = event.block.timestamp

  entry.save()
}
