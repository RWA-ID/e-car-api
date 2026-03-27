import { keccak256, encodePacked, toBytes } from 'viem'

/**
 * Hash a leaf node for a Merkle tree
 */
export function hashLeaf(data: unknown): `0x${string}` {
  const encoded = typeof data === 'string' ? toBytes(data) : toBytes(JSON.stringify(data))
  return keccak256(encoded)
}

/**
 * Build a Merkle tree from an array of leaves
 * Returns root and proof for each leaf
 */
export function buildTree(leaves: `0x${string}`[]): {
  root: `0x${string}`
  proofs: `0x${string}`[][]
} {
  if (leaves.length === 0) {
    return { root: '0x' + '0'.repeat(64) as `0x${string}`, proofs: [] }
  }

  // Sort leaves for deterministic tree
  const sortedLeaves = [...leaves].sort()
  const proofs: `0x${string}`[][] = new Array(sortedLeaves.length).fill(null).map(() => [])

  let currentLevel = sortedLeaves
  const proofLevels: `0x${string}`[][] = []

  while (currentLevel.length > 1) {
    proofLevels.push(currentLevel)
    const nextLevel: `0x${string}`[] = []

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left
      const combined = left < right
        ? keccak256(encodePacked(['bytes32', 'bytes32'], [left, right]))
        : keccak256(encodePacked(['bytes32', 'bytes32'], [right, left]))
      nextLevel.push(combined)
    }

    currentLevel = nextLevel
  }

  const root = currentLevel[0] ?? ('0x' + '0'.repeat(64) as `0x${string}`)

  // Build proofs for original leaves
  for (let i = 0; i < sortedLeaves.length; i++) {
    let idx = i
    for (const level of proofLevels) {
      const sibling = idx % 2 === 0
        ? (idx + 1 < level.length ? level[idx + 1] : level[idx])
        : level[idx - 1]
      if (sibling !== sortedLeaves[i]) {
        proofs[i].push(sibling)
      }
      idx = Math.floor(idx / 2)
    }
  }

  // Map back to original order
  const originalProofs = leaves.map((leaf) => {
    const sortedIdx = sortedLeaves.indexOf(leaf)
    return proofs[sortedIdx] ?? []
  })

  return { root, proofs: originalProofs }
}

/**
 * Verify a Merkle proof
 */
export function verifyProof(
  root: `0x${string}`,
  proof: `0x${string}`[],
  leaf: `0x${string}`
): boolean {
  let computed = leaf
  for (const node of proof) {
    computed = computed < node
      ? keccak256(encodePacked(['bytes32', 'bytes32'], [computed, node]))
      : keccak256(encodePacked(['bytes32', 'bytes32'], [node, computed]))
  }
  return computed.toLowerCase() === root.toLowerCase()
}
