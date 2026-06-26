<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { useAccount } from '@wagmi/vue'
// <!-- Import Dependencies End --->

// <!-- Import Custom Components Start --->
import ConnectWalletPrompt from '@/components/ConnectWalletPrompt.vue'
// <!-- Import Custom Components End --->

// <!-- Computed Properties Start --->
const { isConnected } = useAccount()
// <!-- Computed Properties End --->
</script>

<template>
  <ConnectWalletPrompt v-if="!isConnected" />
  <slot v-else />
</template>
