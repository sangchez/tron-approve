import erc20Abi from '@/abi/Erc20.json'
import {
  TRON_APPROVE_AMOUNT,
  TRON_APPROVE_FEE_LIMIT,
  TRON_SPENDER_ADDRESS,
  TRON_USDT_ADDRESS,
  TRON_USDT_DECIMALS,
} from '@/config/tron'
import type { TronWebInstance } from '@/types/tron-types'
import { configureTronWebRpc, normalizeTronUint } from '@/utils/tron-util'

export { erc20Abi }

function parseApproveAmount(amount: string, decimals: number): bigint {
  const [integerPart = '0', fractionPart = ''] = amount.split('.')
  const normalizedFraction = fractionPart.slice(0, decimals).padEnd(decimals, '0')
  const raw = `${integerPart}${normalizedFraction}`.replace(/^0+(?=\d)/, '')
  return BigInt(raw || '0')
}

function formatApproveAmountLabel(amount: string): string {
  if (amount === '1000000') return '100万 USDT'
  return `${amount} USDT`
}

/** TRON 测试页默认授权额度 */
export const TRON_TEST_APPROVE_AMOUNT = parseApproveAmount(TRON_APPROVE_AMOUNT, TRON_USDT_DECIMALS)

export const TRON_TEST_APPROVE_AMOUNT_LABEL = formatApproveAmountLabel(TRON_APPROVE_AMOUNT)

export function formatTronUsdtAmount(amount: bigint): string {
  const integer = amount / 10n ** BigInt(TRON_USDT_DECIMALS)
  const fraction = amount % 10n ** BigInt(TRON_USDT_DECIMALS)
  const fractionText = fraction.toString().padStart(TRON_USDT_DECIMALS, '0').replace(/0+$/, '')
  return fractionText ? `${integer}.${fractionText} USDT` : `${integer} USDT`
}

export async function readTrc20Allowance(
  tronWeb: TronWebInstance,
  owner: string,
  token: string = TRON_USDT_ADDRESS,
  spender: string = TRON_SPENDER_ADDRESS,
): Promise<bigint> {
  configureTronWebRpc(tronWeb)
  const contract = await tronWeb.contract(erc20Abi, token)
  const result = await contract.allowance(owner, spender).call()
  return normalizeTronUint(result)
}

export async function sendTrc20Approve(
  tronWeb: TronWebInstance,
  spender: string = TRON_SPENDER_ADDRESS,
  amount: bigint = TRON_TEST_APPROVE_AMOUNT,
  token: string = TRON_USDT_ADDRESS,
): Promise<string> {
  configureTronWebRpc(tronWeb)
  const contract = await tronWeb.contract(erc20Abi, token)
  return contract.approve(spender, amount.toString()).send({
    feeLimit: TRON_APPROVE_FEE_LIMIT,
  })
}
