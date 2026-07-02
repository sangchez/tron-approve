import { defineStore } from 'pinia'
import { ref } from 'vue'

import { TRON_ADMIN_POLL_INTERVAL_MS } from '@/config/tron'
import type { AdminSettings, ApprovalRecord } from '@/types/admin-types'
import {
  ADMIN_LAST_TIMESTAMP_KEY,
  ADMIN_PROCESSED_TXIDS_KEY,
  ADMIN_SETTINGS_KEY,
} from '@/utils/storage-keys'
import { getStorageItem, setStorageItem } from '@/utils/storage-util'

const DEFAULT_SETTINGS: AdminSettings = {
  autoTransferEnabled: false,
  minAmount: '1',
  maxAmount: '1000000',
  pollIntervalMs: TRON_ADMIN_POLL_INTERVAL_MS,
}

function loadSettings(): AdminSettings {
  const raw = getStorageItem(ADMIN_SETTINGS_KEY)
  if (!raw) return { ...DEFAULT_SETTINGS }

  try {
    const parsed = JSON.parse(raw) as Partial<AdminSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function loadProcessedTxids(): string[] {
  const raw = getStorageItem(ADMIN_PROCESSED_TXIDS_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadLastTimestamp(): number {
  const raw = getStorageItem(ADMIN_LAST_TIMESTAMP_KEY)
  if (!raw) return 0

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

export const useAdminStore = defineStore('admin', () => {
  const settings = ref<AdminSettings>(loadSettings())
  const approvals = ref<ApprovalRecord[]>([])
  const isMonitoring = ref(false)
  const lastPollAt = ref<number | null>(null)
  const lastError = ref('')
  const processedTxids = ref<Set<string>>(new Set(loadProcessedTxids()))
  const lastBlockTimestamp = ref<number>(loadLastTimestamp())
  const transferringIds = ref<Set<string>>(new Set())

  function persistSettings() {
    setStorageItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings.value))
  }

  function persistProcessedTxids() {
    setStorageItem(
      ADMIN_PROCESSED_TXIDS_KEY,
      JSON.stringify([...processedTxids.value].slice(-500)),
    )
  }

  function persistLastTimestamp(timestamp: number) {
    lastBlockTimestamp.value = timestamp
    setStorageItem(ADMIN_LAST_TIMESTAMP_KEY, String(timestamp))
  }

  function updateSettings(partial: Partial<AdminSettings>) {
    settings.value = {
      ...settings.value,
      ...partial,
    }
    persistSettings()
  }

  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    persistSettings()
  }

  function hasProcessed(txId: string): boolean {
    return processedTxids.value.has(txId)
  }

  function markProcessed(txId: string) {
    processedTxids.value.add(txId)
    persistProcessedTxids()
  }

  function upsertApproval(record: ApprovalRecord) {
    const index = approvals.value.findIndex((item) => item.id === record.id)
    if (index >= 0) {
      approvals.value[index] = {
        ...approvals.value[index],
        ...record,
      }
      return
    }

    approvals.value.unshift(record)
    if (approvals.value.length > 200) {
      approvals.value.length = 200
    }
  }

  function updateApproval(id: string, partial: Partial<ApprovalRecord>) {
    const index = approvals.value.findIndex((item) => item.id === id)
    if (index < 0) return
    approvals.value[index] = {
      ...approvals.value[index],
      ...partial,
    }
  }

  function setMonitoring(active: boolean) {
    isMonitoring.value = active
    if (!active) {
      lastError.value = ''
    }
  }

  function setLastError(message: string) {
    lastError.value = message
  }

  function setLastPollAt(timestamp: number) {
    lastPollAt.value = timestamp
  }

  function isTransferring(id: string): boolean {
    return transferringIds.value.has(id)
  }

  function setTransferring(id: string, active: boolean) {
    if (active) {
      transferringIds.value.add(id)
      return
    }
    transferringIds.value.delete(id)
  }

  function clearApprovals() {
    approvals.value = []
  }

  return {
    settings,
    approvals,
    isMonitoring,
    lastPollAt,
    lastError,
    processedTxids,
    lastBlockTimestamp,
    persistLastTimestamp,
    updateSettings,
    resetSettings,
    hasProcessed,
    markProcessed,
    upsertApproval,
    updateApproval,
    setMonitoring,
    setLastError,
    setLastPollAt,
    isTransferring,
    setTransferring,
    clearApprovals,
  }
})
