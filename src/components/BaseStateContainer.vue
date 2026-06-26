<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { computed } from 'vue'
import type { PageState } from '@/types/ui-types'
// <!-- Import Dependencies End --->

// <!-- Import Custom Components Start --->
import BaseEmptyState from '@/components/BaseEmptyState.vue'
import BaseErrorState from '@/components/BaseErrorState.vue'
import BaseLoadingState from '@/components/BaseLoadingState.vue'
// <!-- Import Custom Components End --->

// <!-- Define Props Value Start --->
const props = withDefaults(defineProps<{
  /** 页面状态 */
  state?: PageState
  loadingText?: string
  emptyText?: string
  errorText?: string
  errorDescription?: string
}>(), {
  state: 'normal',
  loadingText: '加载中...',
  emptyText: '暂无数据',
  errorText: '加载失败',
  errorDescription: '请检查网络后重试',
})

const emit = defineEmits<{
  retry: []
}>()
// <!-- Define Props Value End --->

// <!-- Computed Properties Start --->
const isLoading = computed(() => props.state === 'loading')
const isEmpty = computed(() => props.state === 'empty')
const isError = computed(() => props.state === 'error')
const isNormal = computed(() => props.state === 'normal')
// <!-- Computed Properties End --->
</script>

<template>
  <template v-if="isLoading">
    <slot name="loading">
      <BaseLoadingState :loading-text="loadingText" />
    </slot>
  </template>

  <template v-else-if="isEmpty">
    <slot name="empty">
      <BaseEmptyState :empty-text="emptyText" />
    </slot>
  </template>

  <template v-else-if="isError">
    <slot name="error" :on-retry="() => emit('retry')">
      <BaseErrorState
        :error-text="errorText"
        :error-description="errorDescription"
        @retry="emit('retry')"
      />
    </slot>
  </template>

  <template v-else-if="isNormal">
    <slot />
  </template>
</template>
