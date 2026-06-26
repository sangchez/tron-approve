<script setup lang="ts">
// <!-- Define Props Value Start --->
const props = withDefaults(defineProps<{
  /** 加载态文案 */
  loadingText?: string
}>(), {
  loadingText: '加载中...',
})
// <!-- Define Props Value End --->
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-12">
    <ProgressSpinner />
    <span class="text-sm text-surface-500">{{ props.loadingText }}</span>
  </div>
</template>
