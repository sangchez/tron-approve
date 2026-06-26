<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { computed } from 'vue'

import { TRON_NETWORK_NAME } from '@/config/tron'
// <!-- Import Dependencies End --->

// <!-- Define Props Value Start --->
const props = defineProps<{
  isOnTargetNetwork: boolean
  isConnected: boolean
}>()
// <!-- Define Props Value End --->

// <!-- Computed Properties Start --->
const isWrongNetwork = computed(() => props.isConnected && !props.isOnTargetNetwork)
// <!-- Computed Properties End --->
</script>

<template>
  <Message
    v-if="isWrongNetwork"
    severity="warn"
    :closable="false"
    class="mb-4"
  >
    当前网络不是 {{ TRON_NETWORK_NAME }}，请在 TronLink 中切换到该网络后重试。
  </Message>
</template>
