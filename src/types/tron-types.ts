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
  solidityNode?: {
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
    getBlock?(block: string | number): Promise<unknown>
  }
}

export interface TronTransactionInfo {
  id?: string
  receipt?: {
    result?: string
  }
}

export interface TronProvider {
  request(args: { method: string; params?: unknown }): Promise<unknown>
  tronWeb?: TronWebInstance
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

export interface TokenPocketTronProvider {
  request(args: { method: string }): Promise<unknown>
}

export interface TokenPocketWallet {
  tron?: TokenPocketTronProvider
  tronWeb?: TronWebInstance
}

export interface OkxWallet {
  tronLink?: TronLinkWallet
}

declare global {
  interface Window {
    tron?: TronProvider
    tronLink?: TronLinkWallet
    tronWeb?: TronWebInstance
    tronweb?: TronWebInstance
    tokenpocket?: TokenPocketWallet
    okxwallet?: OkxWallet
  }
}

export {}
