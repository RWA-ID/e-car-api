import { Router } from 'express'
import { keccak256, encodePacked } from 'viem'

const router = Router()

// POST /api/v1/merkle/verify
router.post('/verify', async (req, res) => {
  const { root, proof, leaf } = req.body
  if (!root || !proof || !leaf) {
    res.status(400).json({ error: 'Missing root, proof, or leaf' })
    return
  }

  let computed: `0x${string}` = leaf as `0x${string}`
  for (const sibling of proof as string[]) {
    const [a, b] = computed < (sibling as `0x${string}`)
      ? [computed, sibling as `0x${string}`]
      : [sibling as `0x${string}`, computed]
    computed = keccak256(encodePacked(['bytes32', 'bytes32'], [a, b]))
  }

  res.json({ valid: computed.toLowerCase() === root.toLowerCase(), computed })
})

// POST /api/v1/merkle/generate
router.post('/generate', async (req, res) => {
  const { leaves } = req.body
  if (!Array.isArray(leaves) || leaves.length === 0) {
    res.status(400).json({ error: 'leaves must be a non-empty array' })
    return
  }

  let layer: `0x${string}`[] = leaves.map((l: string) => keccak256(encodePacked(['string'], [l])))
  const allLayers: `0x${string}`[][] = [layer]

  while (layer.length > 1) {
    const next: `0x${string}`[] = []
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i]
      const right = layer[i + 1] ?? left
      const [a, b] = left < right ? [left, right] : [right, left]
      next.push(keccak256(encodePacked(['bytes32', 'bytes32'], [a, b])))
    }
    layer = next
    allLayers.push(layer)
  }

  const root = layer[0]
  const proofs = leaves.map((_: string, idx: number) => {
    const proof: `0x${string}`[] = []
    let index = idx
    for (let l = 0; l < allLayers.length - 1; l++) {
      const sibling = index % 2 === 0 ? allLayers[l][index + 1] : allLayers[l][index - 1]
      if (sibling) proof.push(sibling)
      index = Math.floor(index / 2)
    }
    return proof
  })

  res.json({ root, proofs })
})

export default router
