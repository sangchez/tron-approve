import { computed, ref } from 'vue'

import { TRON_NETWORK_NAME } from '@/config/tron'
import type { TronWebInstance } from '@/types/tron-types'
import { mapTronErrorMessage } from '@/utils/tron-error-util'
import {
  configureTronWebRpc,
  ensureTronWalletAvailable,
  getTronRpcHost,
  getTronWalletName,
  getTronWeb,
  isImTokenBrowser,
  isTronTargetNetworkAsync,
  requestTronAccounts,
  waitForTronWalletReady,
} from '@/utils/tron-util'

type WalletStatus = 'disconnected' | 'connecting' | 'connected'

export function useTronWallet() {
  const address = ref<string | null>(null)
  const walletStatus = ref<WalletStatus>('disconnected')
  const walletError = ref('')
  const walletName = ref(getTronWalletName())
  const walletRpcHost = ref('')
  const isOnTargetNetwork = ref(false)

  const isConnecting = computed(() => walletStatus.value === 'connecting')
  const isConnected = computed(() => walletStatus.value === 'connected' && !!address.value)

  const tronWeb = computed(() => getTronWeb())

  const networkLabel = computed(() => {
    if (!isConnected.value) return '—'
    return isOnTargetNetwork.value
      ? TRON_NETWORK_NAME
      : (walletRpcHost.value || tronWeb.value?.fullNode?.host || '未知网络')
  })

  const syncAddressFromTronWeb = (instance?: TronWebInstance) => {
    const currentAddress = instance?.defaultAddress?.base58
    if (currentAddress) {
      address.value = currentAddress
      walletStatus.value = 'connected'
      return true
    }
    return false
  }

  const connect = async () => {
    if (isConnecting.value) return

    walletError.value = ''
    walletStatus.value = 'connecting'
    walletName.value = getTronWalletName()

    try {
      const walletTimeout = isImTokenBrowser() ? 8000 : 5000
      const walletAvailable = await ensureTronWalletAvailable(walletTimeout)
      if (!walletAvailable) {
        throw new Error('未检测到 Tron 钱包（TronLink / TokenPocket / imToken / OKX），请在钱包内置浏览器中打开本页面')
      }

      await waitForTronWalletReady(walletTimeout)
      await requestTronAccounts()

      const instance = getTronWeb()
      if (!instance) {
        throw new Error('钱包已连接，但未获取到 TronWeb 实例')
      }

      walletRpcHost.value = getTronRpcHost(instance) || instance.fullNode?.host || ''
      isOnTargetNetwork.value = await isTronTargetNetworkAsync(instance)

      configureTronWebRpc(instance)

      if (!syncAddressFromTronWeb(instance)) {
        throw new Error('钱包已连接，但未获取到地址')
      }
    } catch (error) {
      walletStatus.value = 'disconnected'
      address.value = null
      isOnTargetNetwork.value = false
      walletRpcHost.value = ''
      walletError.value = mapTronErrorMessage(error)
    }
  }

  return {
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
  }
}
