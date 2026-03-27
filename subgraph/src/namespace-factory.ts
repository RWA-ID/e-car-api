import { NamespaceCreated, BrandReserved } from '../generated/NamespaceGovernorFactory/NamespaceGovernorFactory'
import { Brand } from '../generated/schema'

export function handleNamespaceCreated(event: NamespaceCreated): void {
  let brand = Brand.load(event.params.brand)
  if (!brand) brand = new Brand(event.params.brand)

  brand.name = event.params.brand
  brand.registry = event.params.registry.toHexString()
  brand.resolver = event.params.resolver.toHexString()
  brand.multiSig = event.params.multiSig.toHexString()
  brand.claimed = true
  brand.reserved = true
  brand.claimedAt = event.block.timestamp

  brand.save()
}

export function handleBrandReserved(event: BrandReserved): void {
  let brand = Brand.load(event.params.brand)
  if (!brand) brand = new Brand(event.params.brand)

  brand.name = event.params.brand
  brand.registry = ''
  brand.resolver = ''
  brand.multiSig = ''
  brand.claimed = false
  brand.reserved = true

  brand.save()
}
