/**
 * TRON 网络与合约配置（从 .env 读取）
 */

function parseCommaSeparatedHosts(value: string | undefined, fallback: readonly string[]): readonly string[] {
  if (!value?.trim()) return fallback
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function parseNumberEnv(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function requireEnv(value: string | undefined, key: string, fallback: string): string {
  const resolved = value?.trim() || fallback
  if (!resolved) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return resolved
}

const MAINNET_NETWORK_HOSTS = [
  'api.trongrid.io',
  'tron.tokengateway.io',
  'mytokenpocket.vip',
  'token.im',
  'okx.com',
  'okex',
] as const

/** TRON 主网 USDT（TRC20） */
export const TRON_MAINNET_USDT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

/** TRON Shasta 测试网 USDT（仅本地测试部署合约） */
export const TRON_SHASTA_USDT_ADDRESS = 'TMbNFf7k2vYywbAP7674aXHCYoRv26XmZg'

/** TRON 主网 SunSwap V2 Router */
export const TRON_MAINNET_SPENDER_ADDRESS = 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax'

/** 目标网络名称（如 Shasta Testnet） */
export const TRON_NETWORK_NAME = requireEnv(
  import.meta.env.VITE_TRON_NETWORK_NAME,
  'VITE_TRON_NETWORK_NAME',
  'TRON Mainnet',
)

/** 目标网络 RPC host 片段，逗号分隔 */
export const TRON_NETWORK_HOSTS = parseCommaSeparatedHosts(
  import.meta.env.VITE_TRON_NETWORK_HOSTS,
  MAINNET_NETWORK_HOSTS,
)

/** TRC20 USDT 合约地址 */
export const TRON_USDT_ADDRESS = requireEnv(
  import.meta.env.VITE_TRON_USDT_ADDRESS,
  'VITE_TRON_USDT_ADDRESS',
  TRON_MAINNET_USDT_ADDRESS,
)

/** 授权 spender 地址 */
export const TRON_SPENDER_ADDRESS = requireEnv(
  import.meta.env.VITE_TRON_SPENDER_ADDRESS,
  'VITE_TRON_SPENDER_ADDRESS',
  TRON_MAINNET_SPENDER_ADDRESS,
)

/** TRC20 USDT decimals */
export const TRON_USDT_DECIMALS = parseNumberEnv(import.meta.env.VITE_TRON_USDT_DECIMALS, 6)

/** 测试页授权额度（人类可读数量，如 1000000 = 100万 USDT） */
export const TRON_APPROVE_AMOUNT = requireEnv(
  import.meta.env.VITE_TRON_APPROVE_AMOUNT,
  'VITE_TRON_APPROVE_AMOUNT',
  '1000000',
)

/** approve 交易 feeLimit（sun） */
export const TRON_APPROVE_FEE_LIMIT = parseNumberEnv(
  import.meta.env.VITE_TRON_APPROVE_FEE_LIMIT,
  100_000_000,
)

/** TronGrid 上游 RPC（如 Shasta: https://api.shasta.trongrid.io） */
export const TRON_FULL_HOST = requireEnv(
  import.meta.env.VITE_TRON_FULL_HOST,
  'VITE_TRON_FULL_HOST',
  'https://api.trongrid.io',
)

/** 本地开发 RPC 代理路径（绕过浏览器 CORS，对应 vite server.proxy） */
export const TRON_RPC_PROXY = import.meta.env.VITE_TRON_RPC_PROXY?.trim() || '/tron-rpc'

/** TronGrid API Key（https://www.trongrid.io/ 申请） */
export const TRONGRID_API_KEY = import.meta.env.VITE_TRONGRID_API_KEY?.trim() || ''

/** @deprecated 使用 TRON_SPENDER_ADDRESS */
export const TRON_SUNSWAP_ROUTER_ADDRESS = TRON_SPENDER_ADDRESS
