<script setup lang="ts">
// <!-- Define Props Value Start --->
const props = withDefaults(defineProps<{
  /** 空态文案 */
  emptyText?: string
}>(), {
  emptyText: '暂无数据',
})
// <!-- Define Props Value End --->
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12">
    <Message severity="secondary" :closable="false">
      {{ props.emptyText }}
    </Message>
  </div>
</template>
