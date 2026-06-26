<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { computed } from 'vue'
import { useChainId, useSwitchChain } from '@wagmi/vue'
import { useI18n } from 'vue-i18n'

import { getChainName, supportedChains } from '@/config/chains'
// <!-- Import Dependencies End --->

// <!-- Define Props Value Start --->
const props = defineProps<{
  /** 期望的目标链 ID */
  targetChainId: number
}>()
// <!-- Define Props Value End --->

// <!-- Reactive Data Start --->
const { t } = useI18n()
const chainId = useChainId()
const { switchChain, isPending } = useSwitchChain()
// <!-- Reactive Data End --->

// <!-- Computed Properties Start --->
const isWrongNetwork = computed(() => chainId.value !== props.targetChainId)

const targetChainName = computed(() => getChainName(props.targetChainId))
// <!-- Computed Properties End --->

// <!-- Function & API Request Start --->
const handleSwitchChain = () => {
  const target = supportedChains.find((chain) => chain.id === props.targetChainId)
  if (target) {
    switchChain({ chainId: target.id })
  }
}
// <!-- Function & API Request End --->
</script>

<template>
  <Message
    v-if="isWrongNetwork"
    severity="warn"
    :closable="false"
    class="mb-4"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <span>{{ t('validation.network') }} ({{ targetChainName }})</span>
      <Button
        :label="targetChainName"
        size="small"
        :loading="isPending"
        :disabled="isPending"
        @click="handleSwitchChain"
      />
    </div>
  </Message>
</template>
