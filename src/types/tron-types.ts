export interface TronWebContract {
  allowance(owner: string, spender: string): {
    call(): Promise<unknown>
  }
  approve(spender: string, amount: bigint | string): {
    send(options?: { feeLimit?: number }): Promise<string>
  }
}

export interface TronWebInstance {
  ready?: boolean
  defaultAddress?: {
    base58?: string
    hex?: string
  }
  fullNode?: {
    host?: string
  }
  setHeader?(headers: Record<string, string>): void
  setFullNode?(host: string): void
  setSolidityNode?(host: string): void
  contract(
    abi?: unknown,
    address?: string,
  ): Promise<TronWebContract>
  trx: {
    getTransactionInfo(txid: string): Promise<TronTransactionInfo | Record<string, never>>
  }
}

export interface TronTransactionInfo {
  id?: string
  receipt?: {
    result?: string
  }
}

export interface TronLinkWallet {
  ready?: boolean
  request(args: { method: string }): Promise<TronLinkRequestResult>
  tronWeb?: TronWebInstance
}

export interface TronLinkRequestResult {
  code?: number
  message?: string
}

declare global {
  interface Window {
    tronLink?: TronLinkWallet
    tronWeb?: TronWebInstance
  }
}

export {}
