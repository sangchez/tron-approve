<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useToast } from "primevue/usetoast";

import { useTronApprovalMonitor } from "@/composables/use-tron-approval-monitor";
import { useAdminStore } from "@/stores/admin-store";
import type {
  ApprovalRecord,
  ApprovalTransferStatus,
} from "@/types/admin-types";
import {
  copyText,
  formatTronTimestamp,
  shortenTronAddress,
} from "@/utils/tron-admin-util";

const toast = useToast();
const adminStore = useAdminStore();

const {
  settings,
  approvals,
  isMonitoring,
  lastPollAt,
  lastError,
  spenderAddress,
  canTransfer,
  transferBlockedReason,
  isWalletReady,
  wallet,
  isBootstrapping,
  bootstrapHistory,
  startMonitoring,
  stopMonitoring,
  manualTransfer,
  pollOnce,
} = useTronApprovalMonitor();

const isManualPolling = ref(false);

const signerStatusLabel = computed(() => {
  if (wallet.isConnecting.value) return "连接钱包中...";
  if (isWalletReady.value) return "钱包已连接（可转账）";
  if (wallet.isConnected.value) return "钱包地址与 Spender 不一致";
  return "未连接钱包";
});

const signerStatusSeverity = computed(() => {
  if (wallet.isConnecting.value) return "info";
  if (isWalletReady.value) return "success";
  if (wallet.isConnected.value) return "danger";
  return "warn";
});

const connectButtonLabel = computed(() => {
  if (wallet.isConnecting.value) return "连接中...";
  if (wallet.isConnected.value) return "重新连接";
  return "连接 Spender 钱包";
});

const monitoringStatusLabel = computed(() => {
  if (isMonitoring.value) return "监听中";
  return "已停止";
});

const lastPollLabel = computed(() => {
  if (!lastPollAt.value) return "尚未轮询";
  return formatTronTimestamp(lastPollAt.value);
});

function statusLabel(status: ApprovalTransferStatus): string {
  const map: Record<ApprovalTransferStatus, string> = {
    detected: "已检测",
    eligible: "符合区间",
    transferring: "转账中",
    transferred: "已转账",
    skipped: "已跳过",
    failed: "失败",
  };
  return map[status];
}

function statusSeverity(
  status: ApprovalTransferStatus,
): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
  switch (status) {
    case "transferred":
      return "success";
    case "transferring":
    case "eligible":
      return "info";
    case "failed":
      return "danger";
    case "skipped":
      return "warn";
    default:
      return "secondary";
  }
}

function canManualTransfer(record: ApprovalRecord): boolean {
  return (
    canTransfer.value &&
    record.transferStatus !== "transferring" &&
    record.transferStatus !== "transferred"
  );
}

async function handleConnectWallet() {
  await wallet.connect();
}

async function handleToggleMonitoring() {
  if (isMonitoring.value) {
    stopMonitoring();
    return;
  }
  await startMonitoring();
}

async function handleManualPoll() {
  if (isManualPolling.value) return;
  isManualPolling.value = true;
  try {
    await pollOnce();
    toast.add({
      severity: "success",
      summary: "刷新完成",
      life: 2000,
    });
  } catch {
    toast.add({
      severity: "error",
      summary: "刷新失败",
      detail: lastError.value,
      life: 4000,
    });
  } finally {
    isManualPolling.value = false;
  }
}

async function handleCopy(text: string) {
  const ok = await copyText(text);
  toast.add({
    severity: ok ? "success" : "error",
    summary: ok ? "已复制" : "复制失败",
    life: 2000,
  });
}

function saveSettings() {
  adminStore.updateSettings({
    autoTransferEnabled: settings.value.autoTransferEnabled,
    minAmount: settings.value.minAmount.trim(),
    maxAmount: settings.value.maxAmount.trim(),
    pollIntervalMs:
      Number(settings.value.pollIntervalMs) || settings.value.pollIntervalMs,
  });
  toast.add({
    severity: "success",
    summary: "设置已保存",
    life: 2000,
  });

  if (isMonitoring.value) {
    void startMonitoring();
  }
}

onMounted(async () => {
  await bootstrapHistory();
});
</script>

<template>
  <div class="admin-page">
    <div class="admin-header">
      <div>
        <h1 class="admin-title">TRON 授权 Admin</h1>
        <p class="admin-subtitle">
          实时监听 USDT 对 Spender 的授权，并按区间自动 transferFrom
        </p>
      </div>
      <div class="admin-header-actions">
        <Button
          :label="isMonitoring ? '停止监听' : '开始监听'"
          :icon="isMonitoring ? 'pi pi-stop' : 'pi pi-play'"
          :severity="isMonitoring ? 'danger' : 'success'"
          @click="handleToggleMonitoring"
        />
        <Button
          label="立即刷新"
          icon="pi pi-refresh"
          outlined
          :loading="isManualPolling"
          @click="handleManualPoll"
        />
      </div>
    </div>

    <div class="admin-stats">
      <Card class="admin-stat-card">
        <template #title> 监听状态 </template>
        <template #content>
          <Tag
            :value="monitoringStatusLabel"
            :severity="isMonitoring ? 'success' : 'secondary'"
          />
          <p class="admin-stat-meta">上次轮询：{{ lastPollLabel }}</p>
        </template>
      </Card>

      <Card class="admin-stat-card">
        <template #title> Spender 地址 </template>
        <template #content>
          <div class="admin-address-row">
            <code>{{ spenderAddress }}</code>
            <Button
              icon="pi pi-copy"
              text
              rounded
              aria-label="copy spender"
              @click="handleCopy(spenderAddress)"
            />
          </div>
        </template>
      </Card>

      <Card class="admin-stat-card">
        <template #title> Spender 钱包 </template>
        <template #content>
          <Tag :value="signerStatusLabel" :severity="signerStatusSeverity" />
          <p
            v-if="wallet.address.value"
            class="admin-stat-meta"
          >
            当前账户：{{ wallet.address.value }}
          </p>
          <p
            v-else
            class="admin-stat-meta"
          >
            请连接地址为 <code>{{ spenderAddress }}</code> 的钱包账户
          </p>
          <Button
            class="admin-connect-btn"
            :label="connectButtonLabel"
            icon="pi pi-wallet"
            size="small"
            :loading="wallet.isConnecting.value"
            @click="handleConnectWallet"
          />
          <Message
            v-if="wallet.walletError.value"
            severity="error"
            :closable="false"
            class="admin-wallet-error"
          >
            {{ wallet.walletError.value }}
          </Message>
        </template>
      </Card>
    </div>

    <Message
      v-if="settings.autoTransferEnabled && !canTransfer"
      severity="warn"
      :closable="false"
      class="admin-message"
    >
      {{ transferBlockedReason }}。自动转账已开启，但当前无法签名。
    </Message>

    <Message
      v-if="lastError"
      severity="error"
      :closable="false"
      class="admin-message"
    >
      {{ lastError }}
    </Message>

    <Card class="admin-settings-card">
      <template #title> 自动转账设置 </template>
      <template #content>
        <div class="admin-settings-grid">
          <div class="admin-setting-item">
            <label for="auto-transfer">启用自动转账</label>
            <ToggleSwitch
              id="auto-transfer"
              v-model="settings.autoTransferEnabled"
              @update:model-value="saveSettings"
            />
          </div>

          <div class="admin-setting-item">
            <label for="min-amount">最小区间 (USDT)</label>
            <InputText
              id="min-amount"
              v-model="settings.minAmount"
              inputmode="decimal"
              @blur="saveSettings"
            />
          </div>

          <div class="admin-setting-item">
            <label for="max-amount">最大区间 (USDT)</label>
            <InputText
              id="max-amount"
              v-model="settings.maxAmount"
              inputmode="decimal"
              @blur="saveSettings"
            />
          </div>

          <div class="admin-setting-item">
            <label for="poll-interval">轮询间隔 (ms)</label>
            <InputNumber
              id="poll-interval"
              v-model="settings.pollIntervalMs"
              :min="3000"
              :step="1000"
              @blur="saveSettings"
            />
          </div>
        </div>

        <p class="admin-settings-hint">
          授权金额落在区间内时将自动调用 transferFrom，将 USDT 转入 Spender 地址。
          无限授权时按用户余额判断区间。自动转账需保持 Spender 钱包已连接，
          每笔 transferFrom 会弹出钱包签名确认。
        </p>
      </template>
    </Card>

    <Card>
      <template #title>
        授权记录
        <Tag
          v-if="isBootstrapping"
          value="加载中"
          severity="info"
          class="admin-inline-tag"
        />
      </template>
      <template #content>
        <DataTable
          :value="approvals"
          paginator
          :rows="10"
          :rows-per-page-options="[10, 20, 50]"
          striped-rows
          removable-sort
          sort-field="blockTimestamp"
          :sort-order="-1"
          empty-message="暂无授权记录，请开始监听或刷新"
        >
          <Column field="blockTimestamp" header="时间" sortable>
            <template #body="{ data }">
              {{ formatTronTimestamp(data.blockTimestamp) }}
            </template>
          </Column>

          <Column field="owner" header="授权方">
            <template #body="{ data }">
              <div class="admin-address-row">
                <span>{{ shortenTronAddress(data.owner) }}</span>
                <Button
                  icon="pi pi-copy"
                  text
                  rounded
                  size="small"
                  aria-label="copy owner"
                  @click="handleCopy(data.owner)"
                />
              </div>
            </template>
          </Column>

          <Column field="amountLabel" header="授权金额" sortable />

          <Column field="transferStatus" header="状态" sortable>
            <template #body="{ data }">
              <Tag
                :value="statusLabel(data.transferStatus)"
                :severity="statusSeverity(data.transferStatus)"
              />
            </template>
          </Column>

          <Column field="txId" header="授权 Tx">
            <template #body="{ data }">
              <div class="admin-address-row">
                <span>{{ shortenTronAddress(data.txId, 8, 8) }}</span>
                <Button
                  icon="pi pi-copy"
                  text
                  rounded
                  size="small"
                  aria-label="copy tx"
                  @click="handleCopy(data.txId)"
                />
              </div>
            </template>
          </Column>

          <Column header="操作">
            <template #body="{ data }">
              <Button
                label="转账"
                size="small"
                outlined
                :disabled="!canManualTransfer(data)"
                :loading="data.transferStatus === 'transferring'"
                @click="manualTransfer(data)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.admin-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--p-text-color);
}

.admin-subtitle {
  margin: 0.5rem 0 0;
  color: var(--p-text-muted-color);
}

.admin-header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.admin-stat-card :deep(.p-card-body) {
  gap: 0.5rem;
}

.admin-stat-meta {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
}

.admin-connect-btn {
  margin-top: 0.75rem;
}

.admin-wallet-error {
  margin-top: 0.75rem;
}

.admin-address-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  word-break: break-all;
}

.admin-address-row code {
  font-size: 0.8125rem;
}

.admin-message {
  margin: 0;
}

.admin-settings-card {
  margin-top: 0;
}

.admin-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem 1.5rem;
}

.admin-setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.admin-setting-item label {
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
}

.admin-settings-hint {
  margin: 1rem 0 0;
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
  line-height: 1.5;
}

.admin-inline-tag {
  margin-left: 0.5rem;
  vertical-align: middle;
}
</style>
