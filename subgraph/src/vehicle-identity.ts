import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { VehicleRegistered, VehicleTransferred } from '../generated/VehicleIdentity/VehicleIdentity'
import { Vehicle } from '../generated/schema'

export function handleVehicleRegistered(event: VehicleRegistered): void {
  const id = event.params.tokenId.toString()
  let vehicle = new Vehicle(id)

  vehicle.tokenId = event.params.tokenId
  vehicle.vinHash = event.params.vinHash
  vehicle.manufacturer = event.params.manufacturer
  vehicle.model = event.params.model
  vehicle.year = event.params.year
  vehicle.batteryCapacityKwh = BigInt.fromI32(0)
  vehicle.registrationDate = event.block.timestamp
  vehicle.owner = event.transaction.from.toHexString()
  vehicle.locked = true

  vehicle.save()
}

export function handleVehicleTransferred(event: VehicleTransferred): void {
  const id = event.params.tokenId.toString()
  let vehicle = Vehicle.load(id)
  if (!vehicle) return

  vehicle.owner = event.params.newOwner.toHexString()
  vehicle.locked = false
  vehicle.save()
}
