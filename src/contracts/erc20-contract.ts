import type { Address } from "viem";
import { formatUnits, parseUnits } from "viem";

import erc20Abi from "@/abi/Erc20.json";
import { BSC_CHAIN_ID } from "@/config/chains";
import {
  BSC_PANCAKE_ROUTER_ADDRESS,
  BSC_USDT_ADDRESS,
  BSC_USDT_DECIMALS,
} from "@/config/contracts";

export { erc20Abi };

/** BSC 测试页默认授权额度：100 USDT */
export const BSC_TEST_APPROVE_AMOUNT = parseUnits(
  "1000000000000",
  BSC_USDT_DECIMALS,
);

export const BSC_TEST_APPROVE_AMOUNT_LABEL = "1000000000000 USDT";

export function getBscUsdtApproveParams(
  spender: Address = BSC_PANCAKE_ROUTER_ADDRESS,
  amount: bigint = BSC_TEST_APPROVE_AMOUNT,
) {
  return {
    abi: erc20Abi,
    address: BSC_USDT_ADDRESS,
    functionName: "approve" as const,
    args: [spender, amount] as const,
    chainId: BSC_CHAIN_ID,
  };
}

export function getErc20AllowanceParams(
  token: Address,
  owner: Address,
  spender: Address,
) {
  return {
    abi: erc20Abi,
    address: token,
    functionName: "allowance" as const,
    args: [owner, spender] as const,
    chainId: BSC_CHAIN_ID,
  };
}

export function formatBscUsdtAmount(amount: bigint): string {
  return `${formatUnits(amount, BSC_USDT_DECIMALS)} USDT`;
}
