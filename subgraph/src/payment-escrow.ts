import { BigInt } from '@graphprotocol/graph-ts'
import { EscrowCreated, EscrowReleased, EscrowRefunded } from '../generated/UniversalPaymentEscrow/UniversalPaymentEscrow'
import { Payment } from '../generated/schema'

const PAYMENT_TYPES = ['CHARGING', 'TOLL', 'PARKING', 'MARKETPLACE', 'V2G', 'SERVICE']

export function handleEscrowCreated(event: EscrowCreated): void {
  const id = event.params.escrowId.toString()
  let payment = new Payment(id)

  payment.escrowId = event.params.escrowId
  payment.payer = event.params.payer.toHexString()
  payment.payee = event.params.payee.toHexString()
  payment.amount = event.params.amount
  payment.token = event.params.token.toHexString()
  payment.paymentType = PAYMENT_TYPES[event.params.pType]
  payment.status = 'PENDING'
  payment.createdAt = event.block.timestamp

  payment.save()
}

export function handleEscrowReleased(event: EscrowReleased): void {
  const id = event.params.escrowId.toString()
  let payment = Payment.load(id)
  if (!payment) return

  payment.status = 'RELEASED'
  payment.settledAt = event.block.timestamp
  payment.save()
}

export function handleEscrowRefunded(event: EscrowRefunded): void {
  const id = event.params.escrowId.toString()
  let payment = Payment.load(id)
  if (!payment) return

  payment.status = 'REFUNDED'
  payment.settledAt = event.block.timestamp
  payment.save()
}
