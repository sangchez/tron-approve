import {
  TRON_FULL_HOST,
  TRON_NETWORK_HOSTS,
  TRON_RPC_PROXY,
  TRONGRID_API_KEY,
} from '@/config/tron'
import type { TronTransactionInfo, TronWebInstance } from '@/types/tron-types'

const TESTNET_HOST_KEYWORDS = ['shasta', 'nile', 'testnet'] as const

export function isImTokenBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /imtoken/i.test(navigator.userAgent)
}

export function isOkxWalletBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /okx|okex/i.test(navigator.userAgent) || Boolean(window.okxwallet)
}

export function getOkxWallet() {
  if (typeof window === 'undefined') return undefined
  return window.okxwallet
}

export function getOkxTronLink() {
  return getOkxWallet()?.tronLink
}

export function getTronLink() {
  if (typeof window === 'undefined') return undefined
  return getOkxTronLink() ?? window.tronLink
}

export function getTokenPocket() {
  if (typeof window === 'undefined') return undefined
  return window.tokenpocket
}

export function getInjectedTronWeb(): TronWebInstance | undefined {
  if (typeof window === 'undefined') return undefined
  return window.tronWeb ?? window.tronweb
}

export function getTronWeb(): TronWebInstance | undefined {
  const okxTronLink = getOkxTronLink()
  const tokenPocket = getTokenPocket()
  const tronLink = getTronLink()
  const tronProvider = window.tron?.tronWeb
  const injected = getInjectedTronWeb()

  return (
    okxTronLink?.tronWeb
    ?? tokenPocket?.tronWeb
    ?? tronLink?.tronWeb
    ?? tronProvider
    ?? injected
  )
}

export function isTronWalletInstalled(): boolean {
  return Boolean(
    getOkxTronLink()
    || getTokenPocket()?.tronWeb
    || getTokenPocket()?.tron
    || window.tronLink
    || window.tron?.tronWeb
    || getInjectedTronWeb(),
  )
}

/** 等待钱包注入（imToken 内置浏览器注入较慢） */
export async function ensureTronWalletAvailable(timeoutMs = 5000): Promise<boolean> {
  if (isTronWalletInstalled()) return true

  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (isTronWalletInstalled()) return true
    await new Promise((resolve) => window.setTimeout(resolve, 200))
  }

  return isTronWalletInstalled()
}

export function getTronWalletName(): string {
  if (getOkxTronLink() || isOkxWalletBrowser()) return 'OKX Wallet'
  if (isImTokenBrowser()) return 'imToken'
  if (getTokenPocket()?.tronWeb || getTokenPocket()?.tron) return 'TokenPocket'
  if (window.tronLink || window.tron) return 'TronLink'
  if (getInjectedTronWeb()) return 'Tron 钱包'
  return 'Tron 钱包'
}

/** 开发环境走 Vite 同源代理，避免 TronGrid CORS */
export function getTronRpcBaseUrl(): string {
  if (import.meta.env.DEV && TRON_RPC_PROXY) {
    const normalizedPath = TRON_RPC_PROXY.startsWith('/') ? TRON_RPC_PROXY : `/${TRON_RPC_PROXY}`
    return `${window.location.origin}${normalizedPath}`
  }

  return TRON_FULL_HOST
}

export function getTronRpcHost(tronWeb?: TronWebInstance): string {
  const fullHost = tronWeb?.fullNode?.host ?? ''
  const solidityHost = tronWeb?.solidityNode?.host ?? ''
  return (fullHost || solidityHost).toLowerCase()
}

function isShastaTargetNetwork(): boolean {
  return TRON_NETWORK_HOSTS.some((host) => host.toLowerCase().includes('shasta'))
}

function isTestnetRpcHost(host: string): boolean {
  const lowerHost = host.toLowerCase()
  return TESTNET_HOST_KEYWORDS.some((keyword) => lowerHost.includes(keyword))
}

/** 同步网络判断（兼容 TokenPocket / imToken 自有主网节点） */
export function isTronTargetNetwork(tronWeb?: TronWebInstance): boolean {
  const host = getTronRpcHost(tronWeb)
  const shastaTarget = isShastaTargetNetwork()

  if (shastaTarget) {
    return host.includes('shasta')
  }

  if (host) {
    if (isTestnetRpcHost(host)) return false
    if (TRON_NETWORK_HOSTS.some((item) => host.includes(item.toLowerCase()))) return true
    return true
  }

  return Boolean(tronWeb?.defaultAddress?.base58)
}

export async function isTronTargetNetworkAsync(tronWeb?: TronWebInstance): Promise<boolean> {
  if (!tronWeb) return false

  const host = getTronRpcHost(tronWeb)
  if (host) {
    return isTronTargetNetwork(tronWeb)
  }

  if (!tronWeb.defaultAddress?.base58) {
    return false
  }

  if (isShastaTargetNetwork()) {
    return false
  }

  try {
    if (typeof tronWeb.trx.getBlock === 'function') {
      await tronWeb.trx.getBlock('latest')
      return true
    }
  } catch {
    return false
  }

  return true
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

/** 等待钱包注入 TronWeb（imToken 等移动端注入较慢） */
export async function waitForTronWalletReady(timeoutMs = 5000): Promise<boolean> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const tronWeb = getTronWeb()
    if (tronWeb?.ready && tronWeb.defaultAddress?.base58) {
      return true
    }
    if (getOkxTronLink()?.ready || getTronLink()?.ready || getTokenPocket()?.tronWeb?.ready) {
      return true
    }
    await new Promise((resolve) => window.setTimeout(resolve, 200))
  }

  return Boolean(getTronWeb())
}

export function waitForTronLinkReady(timeoutMs = 3000): Promise<boolean> {
  if (getTronWeb()?.ready || getTronLink()?.ready || getTokenPocket()?.tronWeb?.ready) {
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

async function requestViaTronProvider(): Promise<boolean> {
  if (!window.tron?.request) return false

  try {
    await window.tron.request({ method: 'eth_requestAccounts' })
    return true
  } catch {
    try {
      await window.tron.request({ method: 'tron_requestAccounts' })
      return true
    } catch {
      return false
    }
  }
}

export async function requestTronAccounts(): Promise<void> {
  if (await requestViaTronProvider()) {
    return
  }

  const okxTronLink = getOkxTronLink()
  if (okxTronLink?.request) {
    const result = await okxTronLink.request({ method: 'tron_requestAccounts' })
    if (result.code === 4001) {
      throw new Error('用户已拒绝连接钱包')
    }
    return
  }

  const tokenPocket = getTokenPocket()
  if (tokenPocket?.tron?.request) {
    await tokenPocket.tron.request({ method: 'tron_requestAccounts' })
    return
  }

  const tronLink = window.tronLink
  if (tronLink?.request) {
    const result = await tronLink.request({ method: 'tron_requestAccounts' })
    if (result.code === 4001) {
      throw new Error('用户已拒绝连接钱包')
    }
    return
  }

  const readyTimeout = isImTokenBrowser() ? 8000 : 5000
  await waitForTronWalletReady(readyTimeout)

  const tronWeb = getTronWeb()
  if (tronWeb?.defaultAddress?.base58) {
    return
  }

  if (isImTokenBrowser()) {
    throw new Error('imToken 未解锁或未授权，请在 imToken 内置浏览器中打开本页面')
  }

  throw new Error('未检测到 Tron 钱包（TronLink / TokenPocket / imToken / OKX）')
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
