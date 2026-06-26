import type { Address } from 'viem'

export interface ChainContractAddresses {
  chainId: number
  addresses: Record<string, Address>
}
