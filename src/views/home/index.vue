<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import PAGE_STATE from '@/utils/page-state-util'
import type { PageState } from '@/types/ui-types'
// <!-- Import Dependencies End --->

// <!-- Import Custom Components Start --->
import BaseStateContainer from '@/components/BaseStateContainer.vue'
// <!-- Import Custom Components End --->

// <!-- Reactive Data Start --->
const { t } = useI18n()
const router = useRouter()
const pageState = ref<PageState>(PAGE_STATE.LOADING)
const isReloading = ref(false)
// <!-- Reactive Data End --->

// <!-- Function & API Request Start --->
const loadPage = async () => {
  pageState.value = PAGE_STATE.LOADING
  try {
    // 首页暂无异步数据源，直接进入正常态
    pageState.value = PAGE_STATE.NORMAL
  } catch {
    pageState.value = PAGE_STATE.ERROR
  }
}

const handleReload = async () => {
  if (isReloading.value) return
  isReloading.value = true
  try {
    await loadPage()
  } finally {
    isReloading.value = false
  }
}
// <!-- Function & API Request End --->

// <!-- Life Cycle Start --->
onMounted(() => {
  loadPage()
})
// <!-- Life Cycle End --->
</script>

<template>
  <BaseStateContainer
    :state="pageState"
    :loading-text="t('common.tips.loading')"
    :empty-text="t('common.tips.no-data')"
    :error-text="t('common.tips.error')"
    error-description="请检查网络后重试"
    @retry="handleReload"
  >
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold">
        {{ t('views.home.title') }}
      </h1>
      <p class="text-surface-600">
        {{ t('views.home.desc') }}
      </p>
      <Button
        :label="t('route.state-acceptance')"
        icon="pi pi-check-square"
        severity="secondary"
        outlined
        class="mt-4 w-fit"
        @click="router.push({ name: 'state-acceptance' })"
      />
    </div>
  </BaseStateContainer>
</template>
