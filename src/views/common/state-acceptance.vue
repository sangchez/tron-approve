<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import PAGE_STATE from '@/utils/page-state-util'
import type { PageState } from '@/types/ui-types'
// <!-- Import Dependencies End --->

// <!-- Import Custom Components Start --->
import BaseStateContainer from '@/components/BaseStateContainer.vue'
// <!-- Import Custom Components End --->

// <!-- Reactive Data Start --->
const { t } = useI18n()

const pageState = ref<PageState>(PAGE_STATE.NORMAL)
const isReloading = ref(false)
const useCustomLoading = ref(false)
const useCustomEmpty = ref(false)
const useCustomError = ref(false)
const loadDelayMs = ref(1200)
const lastAction = ref('')
// <!-- Reactive Data End --->

// <!-- Computed Properties Start --->
const stateOptions = computed(() => [
  { label: t('views.state-acceptance.states.loading'), value: PAGE_STATE.LOADING },
  { label: t('views.state-acceptance.states.normal'), value: PAGE_STATE.NORMAL },
  { label: t('views.state-acceptance.states.empty'), value: PAGE_STATE.EMPTY },
  { label: t('views.state-acceptance.states.error'), value: PAGE_STATE.ERROR },
])

const currentStateLabel = computed(() =>
  stateOptions.value.find((item) => item.value === pageState.value)?.label ?? pageState.value,
)

const checklist = computed(() => [
  { key: 'loading', label: t('views.state-acceptance.checklist.loading'), done: pageState.value === PAGE_STATE.LOADING },
  { key: 'normal', label: t('views.state-acceptance.checklist.normal'), done: pageState.value === PAGE_STATE.NORMAL },
  { key: 'empty', label: t('views.state-acceptance.checklist.empty'), done: pageState.value === PAGE_STATE.EMPTY },
  { key: 'error', label: t('views.state-acceptance.checklist.error'), done: pageState.value === PAGE_STATE.ERROR },
  { key: 'retry', label: t('views.state-acceptance.checklist.retry'), done: lastAction.value === 'retry' },
])
// <!-- Computed Properties End --->

// <!-- Function & API Request Start --->
const delay = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms)
})

/** 模拟异步加载并进入目标态 */
const simulateLoad = async (targetState: PageState, actionLabel: string) => {
  if (isReloading.value) return
  isReloading.value = true
  lastAction.value = actionLabel
  pageState.value = PAGE_STATE.LOADING
  try {
    await delay(loadDelayMs.value)
    pageState.value = targetState
  } catch {
    pageState.value = PAGE_STATE.ERROR
  } finally {
    isReloading.value = false
  }
}

const handleStateChange = (value: PageState) => {
  pageState.value = value
  lastAction.value = `switch:${value}`
}

const handleReload = async () => {
  if (isReloading.value) return
  lastAction.value = 'retry'
  await simulateLoad(PAGE_STATE.NORMAL, 'retry-success')
}
// <!-- Function & API Request End --->
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card>
      <template #title>
        {{ t('views.state-acceptance.title') }}
      </template>
      <template #subtitle>
        {{ t('views.state-acceptance.subtitle') }}
      </template>
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-surface-600">{{ t('views.state-acceptance.current') }}:</span>
            <Tag :value="currentStateLabel" severity="info" />
            <Tag
              v-if="isReloading"
              :value="t('common.tips.loading')"
              severity="warn"
            />
          </div>

          <SelectButton
            :model-value="pageState"
            :options="stateOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            @update:model-value="handleStateChange"
          />

          <div class="flex flex-wrap gap-2">
            <Button
              :label="t('views.state-acceptance.actions.simulate-load')"
              icon="pi pi-play"
              :loading="isReloading"
              :disabled="isReloading"
              @click="simulateLoad(PAGE_STATE.NORMAL, 'simulate-normal')"
            />
            <Button
              :label="t('views.state-acceptance.actions.simulate-empty')"
              icon="pi pi-inbox"
              severity="secondary"
              :loading="isReloading"
              :disabled="isReloading"
              @click="simulateLoad(PAGE_STATE.EMPTY, 'simulate-empty')"
            />
            <Button
              :label="t('views.state-acceptance.actions.simulate-error')"
              icon="pi pi-times-circle"
              severity="danger"
              :loading="isReloading"
              :disabled="isReloading"
              @click="simulateLoad(PAGE_STATE.ERROR, 'simulate-error')"
            />
          </div>

          <Divider />

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">{{ t('views.state-acceptance.slot-toggle') }}</span>
            <div class="flex flex-wrap gap-4">
              <div class="flex items-center gap-2">
                <ToggleSwitch v-model="useCustomLoading" input-id="custom-loading" />
                <label for="custom-loading">{{ t('views.state-acceptance.slots.loading') }}</label>
              </div>
              <div class="flex items-center gap-2">
                <ToggleSwitch v-model="useCustomEmpty" input-id="custom-empty" />
                <label for="custom-empty">{{ t('views.state-acceptance.slots.empty') }}</label>
              </div>
              <div class="flex items-center gap-2">
                <ToggleSwitch v-model="useCustomError" input-id="custom-error" />
                <label for="custom-error">{{ t('views.state-acceptance.slots.error') }}</label>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <label class="text-sm text-surface-600" for="load-delay">
              {{ t('views.state-acceptance.load-delay') }}
            </label>
            <InputNumber
              id="load-delay"
              v-model="loadDelayMs"
              :min="300"
              :max="5000"
              :step="100"
              suffix=" ms"
              class="w-40"
            />
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        {{ t('views.state-acceptance.preview') }}
      </template>
      <template #content>
        <BaseStateContainer
          :state="pageState"
          :loading-text="t('common.tips.loading')"
          :empty-text="t('common.tips.no-data')"
          :error-text="t('common.tips.error')"
          :error-description="t('views.state-acceptance.error-description')"
          @retry="handleReload"
        >
          <template v-if="useCustomLoading" #loading>
            <div class="flex flex-col gap-3 py-6">
              <Skeleton width="100%" height="1.5rem" />
              <Skeleton width="80%" height="1rem" />
              <Skeleton width="60%" height="1rem" />
            </div>
          </template>

          <template v-if="useCustomEmpty" #empty>
            <div class="flex flex-col items-center gap-3 py-10">
              <i class="pi pi-inbox text-4xl text-surface-400" />
              <span class="text-surface-600">{{ t('views.state-acceptance.custom-empty') }}</span>
            </div>
          </template>

          <template v-if="useCustomError" #error="{ onRetry }">
            <div class="flex flex-col items-center gap-4 py-10">
              <Message severity="error" :closable="false">
                {{ t('views.state-acceptance.custom-error') }}
              </Message>
              <Button
                :label="t('views.state-acceptance.retry')"
                icon="pi pi-refresh"
                :loading="isReloading"
                :disabled="isReloading"
                @click="onRetry"
              />
            </div>
          </template>

          <div class="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
            <h2 class="mb-2 text-lg font-semibold">
              {{ t('views.state-acceptance.normal-title') }}
            </h2>
            <p class="text-surface-600">
              {{ t('views.state-acceptance.normal-desc') }}
            </p>
          </div>
        </BaseStateContainer>
      </template>
    </Card>

    <Card>
      <template #title>
        {{ t('views.state-acceptance.checklist-title') }}
      </template>
      <template #content>
        <ul class="flex flex-col gap-2">
          <li
            v-for="item in checklist"
            :key="item.key"
            class="flex items-center gap-2 text-sm"
          >
            <i
              :class="item.done ? 'pi pi-check-circle text-green-500' : 'pi pi-circle text-surface-400'"
            />
            <span>{{ item.label }}</span>
          </li>
        </ul>
      </template>
    </Card>
  </div>
</template>
