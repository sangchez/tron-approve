import {
  TRON_FULL_HOST,
  TRON_NETWORK_HOSTS,
  TRON_RPC_PROXY,
  TRONGRID_API_KEY,
} from '@/config/tron'
import type { TronTransactionInfo, TronWebInstance } from '@/types/tron-types'

export function getTronLink() {
  if (typeof window === 'undefined') return undefined
  return window.tronLink
}

export function getTronWeb(): TronWebInstance | undefined {
  const tronLink = getTronLink()
  return tronLink?.tronWeb ?? window.tronWeb
}

export function isTronLinkInstalled(): boolean {
  return Boolean(getTronLink() || getTronWeb())
}

/** 开发环境走 Vite 同源代理，避免 TronGrid CORS */
export function getTronRpcBaseUrl(): string {
  if (import.meta.env.DEV && TRON_RPC_PROXY) {
    const normalizedPath = TRON_RPC_PROXY.startsWith('/') ? TRON_RPC_PROXY : `/${TRON_RPC_PROXY}`
    return `${window.location.origin}${normalizedPath}`
  }

  return TRON_FULL_HOST
}

export function isTronTargetNetwork(tronWeb?: TronWebInstance): boolean {
  const host = tronWeb?.fullNode?.host ?? ''
  if (!host) return false
  return TRON_NETWORK_HOSTS.some((item) => host.includes(item))
}

/** 将 TronWeb RPC 指向同源代理并附加 TronGrid API Key */
export function configureTronWebRpc(tronWeb?: TronWebInstance): void {
  if (!tronWeb) return

  const rpcBaseUrl = getTronRpcBaseUrl()

  if (typeof tronWeb.setFullNode === 'function') {
    tronWeb.setFullNode(rpcBaseUrl)
  }

  if (typeof tronWeb.setSolidityNode === 'function') {
    tronWeb.setSolidityNode(rpcBaseUrl)
  }

  if (TRONGRID_API_KEY && typeof tronWeb.setHeader === 'function') {
    tronWeb.setHeader({ 'TRON-PRO-API-KEY': TRONGRID_API_KEY })
  }
}

export function normalizeTronUint(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(value)
  if (typeof value === 'string') {
    if (!value) return 0n
    return BigInt(value.startsWith('0x') ? value : value)
  }
  if (value && typeof value === 'object') {
    if ('_hex' in value && typeof value._hex === 'string') {
      return BigInt(value._hex)
    }
    if ('toString' in value && typeof value.toString === 'function') {
      const text = value.toString()
      if (text && text !== '[object Object]') {
        return BigInt(text)
      }
    }
  }
  return 0n
}

export function waitForTronLinkReady(timeoutMs = 3000): Promise<boolean> {
  if (getTronLink()?.ready || getTronWeb()?.ready) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(false), timeoutMs)

    window.addEventListener(
      'tronLink#initialized',
      () => {
        window.clearTimeout(timer)
        resolve(true)
      },
      { once: true },
    )
  })
}

export async function waitForTronTransaction(
  tronWeb: TronWebInstance,
  txid: string,
  timeoutMs = 60_000,
  intervalMs = 2_000,
): Promise<TronTransactionInfo> {
  configureTronWebRpc(tronWeb)

  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const info = await tronWeb.trx.getTransactionInfo(txid)
    if (info && Object.keys(info).length > 0) {
      return info
    }
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs))
  }

  throw new Error('Transaction confirmation timeout')
}
