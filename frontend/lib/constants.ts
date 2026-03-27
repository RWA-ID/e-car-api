import { parseEther } from 'viem'

export const SEPOLIA_CHAIN_ID = 11155111
export const MAINNET_CHAIN_ID = 1

export const ECAR_ROOT_NODE = '0x0000000000000000000000000000000000000000000000000000000000000000' as const // TODO: namehash('e-car.eth')

export const CLAIM_FEE = parseEther('10')
export const SUBNAME_FEE = parseEther('0.01')
export const SUBNAME_RENEWAL_FEE = parseEther('0.005')

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const RESERVED_BRANDS = [
  'tesla', 'ford', 'rivian', 'byd', 'lucid', 'bmw', 'mercedes', 'gm',
  'hyundai', 'nio', 'polestar', 'volkswagen', 'audi', 'porsche', 'volvo',
  'kia', 'toyota', 'honda', 'chevrolet', 'cadillac', 'genesis', 'fisker',
  'vinfast', 'xpeng', 'zeekr', 'lotus', 'maserati', 'jaguar', 'mini',
  'smart', 'cupra', 'renault', 'peugeot', 'citroen', 'opel',
]
