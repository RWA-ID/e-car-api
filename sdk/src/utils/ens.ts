import { keccak256, encodePacked, toBytes } from 'viem'

/**
 * Compute ENS namehash for a name
 * Reference: https://eips.ethereum.org/EIPS/eip-137
 */
export function namehash(name: string): `0x${string}` {
  let node: `0x${string}` = '0x0000000000000000000000000000000000000000000000000000000000000000'
  if (name === '') return node

  const labels = name.split('.')
  for (let i = labels.length - 1; i >= 0; i--) {
    const labelHash = labelhash(labels[i])
    node = keccak256(encodePacked(['bytes32', 'bytes32'], [node, labelHash]))
  }
  return node
}

/**
 * Compute keccak256 of a single ENS label
 */
export function labelhash(label: string): `0x${string}` {
  return keccak256(toBytes(label))
}

/**
 * DNS-encode an ENS name for use in CCIP-Read
 */
export function encodeName(name: string): string {
  if (name === '.') {
    return '0x00'
  }

  const buf: number[] = []
  for (const label of name.split('.')) {
    const labelBytes = toBytes(label)
    buf.push(labelBytes.length)
    buf.push(...labelBytes)
  }
  buf.push(0)

  return '0x' + Buffer.from(buf).toString('hex')
}

/**
 * Get the ENS node for a vehicle subdomain
 * Format: {vin}.{brand}.e-car.eth
 */
export function vehicleNode(vin: string, brand: string): `0x${string}` {
  return namehash(`${vin}.${brand}.e-car.eth`)
}
