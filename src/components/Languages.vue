<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { computed } from "vue";
import type { MenuItem } from "primevue/menuitem";

import { useLocale } from "@/composables/use-locale";
import { DEFAULT_LOCALE } from "@/config/i18n";
// <!-- Import Dependencies End --->

// <!-- Reactive Data Start --->
const { setLocale, localeOptions } = useLocale();
// <!-- Reactive Data End --->

// <!-- Computed Properties Start --->
const languagesItem = computed<MenuItem[]>(() =>
  localeOptions.map((item) => ({
    label: item.label,
    command: () => setLocale(item.value),
  })),
);
// <!-- Computed Properties End --->

// <!-- Function & API Request Start --->
const handleDefaultClick = () => {
  setLocale(DEFAULT_LOCALE);
};
// <!-- Function & API Request End --->
</script>

<template>
  <SplitButton
    :model="languagesItem"
    size="small"
    icon="pi pi-language"
    @click="handleDefaultClick"
  />
</template>
