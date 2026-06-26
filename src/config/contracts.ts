/**
 * 各链合约地址映射
 *
 * 禁止在组件/composable 内硬编码地址，统一从此文件读取。
 */

import type { Address } from 'viem'

import { BSC_CHAIN_ID, type SupportedChainId } from '@/config/chains'

type AddressMap = Partial<Record<SupportedChainId, Address>>

/** USDC 合约地址（按链配置，部署后补充） */
export const USDC_ADDRESS: AddressMap = {}

/** BSC 主网 USDT（BEP-20） */
export const BSC_USDT_ADDRESS: Address = '0x55d398326f99059fF775485246999027B3197955'

/** PancakeSwap V2 Router */
export const BSC_PANCAKE_ROUTER_ADDRESS: Address = '0x10ED43C718714eb63d5aA57B78B54704E256024E'

/** BSC USDT decimals */
export const BSC_USDT_DECIMALS = 18

export const BSC_USDT_ADDRESSES: AddressMap = {
  [BSC_CHAIN_ID]: BSC_USDT_ADDRESS,
}
