<script setup lang="ts">
// <!-- Define Props Value Start --->
const props = withDefaults(defineProps<{
  /** 错误标题 */
  errorText?: string
  /** 错误描述 */
  errorDescription?: string
  /** 是否展示重试按钮 */
  showRetry?: boolean
}>(), {
  errorText: '加载失败',
  errorDescription: '请检查网络后重试',
  showRetry: true,
})

const emit = defineEmits<{
  retry: []
}>()
// <!-- Define Props Value End --->
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 py-12">
    <Message severity="error" :closable="false">
      <div class="font-medium">{{ props.errorText }}</div>
      <div class="mt-1 text-sm">{{ props.errorDescription }}</div>
    </Message>
    <Button
      v-if="props.showRetry"
      label="重试"
      icon="pi pi-refresh"
      @click="emit('retry')"
    />
  </div>
</template>
