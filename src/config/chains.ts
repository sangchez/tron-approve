/**
 * 支持的 EVM 链配置
 *
 * 业务逻辑通过 chainId 索引，禁止硬编码假设 mainnet。
 */

import { bsc, mainnet, sepolia } from 'viem/chains'

export const DEFAULT_CHAIN_ID = mainnet.id

/** BNB Smart Chain 主网 chainId */
export const BSC_CHAIN_ID = bsc.id

export const supportedChains = [mainnet, sepolia, bsc] as const

export type SupportedChainId = (typeof supportedChains)[number]['id']

/** 根据 chainId 获取链名称，未知链返回 chainId 字符串 */
export function getChainName(chainId: number): string {
  const chain = supportedChains.find((item) => item.id === chainId)
  return chain?.name ?? String(chainId)
}
