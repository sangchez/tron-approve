import { computed, ref } from 'vue'

import { TRON_NETWORK_NAME } from '@/config/tron'
import type { TronWebInstance } from '@/types/tron-types'
import { mapTronErrorMessage } from '@/utils/tron-error-util'
import {
  configureTronWebRpc,
  getTronLink,
  getTronWeb,
  isTronLinkInstalled,
  isTronTargetNetwork,
  waitForTronLinkReady,
} from '@/utils/tron-util'

type WalletStatus = 'disconnected' | 'connecting' | 'connected'

export function useTronWallet() {
  const address = ref<string | null>(null)
  const walletStatus = ref<WalletStatus>('disconnected')
  const walletError = ref('')
  const walletName = ref('TronLink')
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

    try {
      if (!isTronLinkInstalled()) {
        throw new Error('未检测到 TronLink 钱包，请先安装并启用')
      }

      await waitForTronLinkReady()

      const tronLink = getTronLink()
      if (!tronLink) {
        throw new Error('未检测到 TronLink 钱包，请先安装并启用')
      }

      const result = await tronLink.request({ method: 'tron_requestAccounts' })
      if (result.code === 4001) {
        throw new Error('用户已拒绝连接钱包')
      }

      const instance = getTronWeb()
      if (!instance) {
        throw new Error('钱包已连接，但未获取到 TronWeb 实例')
      }

      walletRpcHost.value = instance.fullNode?.host ?? ''
      isOnTargetNetwork.value = isTronTargetNetwork(instance)

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
