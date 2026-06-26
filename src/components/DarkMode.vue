<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { ref, onMounted } from 'vue'

import { isDarkModeEnabled, setDarkMode } from '@/utils/theme-util'
import { getStorageItem } from '@/utils/storage-util'
import { DARK_MODE_KEY } from '@/utils/storage-keys'
// <!-- Import Dependencies End --->

// <!-- Reactive Data Start --->
const isDarkTheme = ref(false)
// <!-- Reactive Data End --->

// <!-- Life Cycle Start --->
onMounted(() => {
  isDarkTheme.value = getStorageItem(DARK_MODE_KEY) === 'true' || isDarkModeEnabled()
})
// <!-- Life Cycle End --->

// <!-- Function & API Request Start --->
const handleThemeChange = (value: boolean) => {
  setDarkMode(value)
}
// <!-- Function & API Request End --->
</script>

<template>
  <ToggleSwitch
    v-model="isDarkTheme"
    @update:model-value="handleThemeChange"
  >
    <template #handle="{ checked }">
      <i :class="['text-xs! pi', { 'pi-moon': checked, 'pi-sun': !checked }]" />
    </template>
  </ToggleSwitch>
</template>
