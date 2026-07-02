import { TronWeb } from 'tronweb'

import { TRONGRID_API_KEY, TRON_SPENDER_ADDRESS, TRON_SPENDER_PRIVATE_KEY } from '@/config/tron'
import type { TronWebInstance } from '@/types/tron-types'
import { getTronRpcBaseUrl } from '@/utils/tron-util'

let adminTronWeb: TronWebInstance | null = null
let readOnlyTronWeb: TronWebInstance | null = null

function buildTronWebHeaders(): Record<string, string> | undefined {
  return TRONGRID_API_KEY
    ? { 'TRON-PRO-API-KEY': TRONGRID_API_KEY }
    : undefined
}

export function hasAdminSigner(): boolean {
  return Boolean(TRON_SPENDER_PRIVATE_KEY)
}

export function isWalletMatchedSpender(walletAddress: string | null | undefined): boolean {
  return Boolean(walletAddress && walletAddress === TRON_SPENDER_ADDRESS)
}

export function canExecuteTransfer(walletAddress: string | null | undefined): boolean {
  if (isWalletMatchedSpender(walletAddress)) return true
  return hasAdminSigner() && isSignerMatchedSpender()
}

export function getSignerAddress(): string | null {
  if (!TRON_SPENDER_PRIVATE_KEY) return null

  try {
    const tronWeb = new TronWeb({
      fullHost: getTronRpcBaseUrl(),
      privateKey: TRON_SPENDER_PRIVATE_KEY,
    })
    return tronWeb.defaultAddress.base58 || null
  } catch {
    return null
  }
}

export function isSignerMatchedSpender(): boolean {
  const signerAddress = getSignerAddress()
  if (!signerAddress) return false
  return signerAddress === TRON_SPENDER_ADDRESS
}

/** 只读 TronWeb，用于查询余额/授权额度（无需钱包或私钥） */
export function getReadOnlyTronWeb(): TronWebInstance {
  if (!readOnlyTronWeb) {
    readOnlyTronWeb = new TronWeb({
      fullHost: getTronRpcBaseUrl(),
      headers: buildTronWebHeaders(),
    }) as unknown as TronWebInstance
  }

  return readOnlyTronWeb
}

/** 优先使用已连接钱包，其次使用 .env 私钥 */
export function getSignTronWeb(
  walletTronWeb?: TronWebInstance | null,
  walletAddress?: string | null,
): TronWebInstance | null {
  if (isWalletMatchedSpender(walletAddress) && walletTronWeb) {
    return walletTronWeb
  }

  return getAdminTronWeb()
}

export function getTransferBlockedReason(
  walletAddress: string | null | undefined,
): string | null {
  if (canExecuteTransfer(walletAddress)) return null

  if (walletAddress && walletAddress !== TRON_SPENDER_ADDRESS) {
    return `当前钱包 ${walletAddress} 与 Spender 地址不一致，请切换账户`
  }

  if (hasAdminSigner() && !isSignerMatchedSpender()) {
    return '私钥与 Spender 地址不匹配'
  }

  return '请先连接 Spender 钱包（TronLink / TokenPocket 等）'
}

export function getAdminTronWeb(): TronWebInstance | null {
  if (!TRON_SPENDER_PRIVATE_KEY) {
    return null
  }

  if (!adminTronWeb) {
    adminTronWeb = new TronWeb({
      fullHost: getTronRpcBaseUrl(),
      privateKey: TRON_SPENDER_PRIVATE_KEY,
      headers: buildTronWebHeaders(),
    }) as unknown as TronWebInstance
  }

  return adminTronWeb
}

export function normalizeTronAddress(address: string): string {
  if (!address) return ''
  if (address.startsWith('T')) return address

  try {
    return TronWeb.address.fromHex(address)
  } catch {
    return address
  }
}

export function shortenTronAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 3) return address
  return `${address.slice(0, head)}...${address.slice(-tail)}`
}

export function formatTronTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false })
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
