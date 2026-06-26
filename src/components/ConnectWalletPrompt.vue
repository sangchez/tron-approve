<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { useConnect } from '@wagmi/vue'
import { useI18n } from 'vue-i18n'
// <!-- Import Dependencies End --->

// <!-- Reactive Data Start --->
const { t } = useI18n()
const { connect, connectors, isPending } = useConnect()
// <!-- Reactive Data End --->

// <!-- Function & API Request Start --->
const handleConnect = () => {
  const connector = connectors[0]
  if (connector) {
    connect({ connector })
  }
}
// <!-- Function & API Request End --->
</script>

<template>
  <Card class="max-w-md mx-auto">
    <template #title>
      {{ t('components.wallet-modal.title') }}
    </template>
    <template #content>
      <p class="mb-4 text-surface-600">
        {{ t('components.wallet-modal.tip') }}
      </p>
      <Button
        :label="t('components.wallet-modal.title')"
        icon="pi pi-wallet"
        class="w-full"
        :loading="isPending"
        :disabled="isPending || !connectors.length"
        @click="handleConnect"
      />
    </template>
  </Card>
</template>
