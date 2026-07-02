<script setup lang="ts">
// <!-- Import Dependencies Start --->
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import PAGE_STATE from "@/utils/page-state-util";
import type { PageState } from "@/types/ui-types";
// <!-- Import Dependencies End --->

// <!-- Import Custom Components Start --->
import BaseStateContainer from "@/components/BaseStateContainer.vue";
// <!-- Import Custom Components End --->

// <!-- Reactive Data Start --->
const { t } = useI18n();
const router = useRouter();
const pageState = ref<PageState>(PAGE_STATE.LOADING);
const isReloading = ref(false);
// <!-- Reactive Data End --->

// <!-- Function & API Request Start --->
const loadPage = async () => {
  pageState.value = PAGE_STATE.LOADING;
  try {
    // 首页暂无异步数据源，直接进入正常态
    pageState.value = PAGE_STATE.NORMAL;
  } catch {
    pageState.value = PAGE_STATE.ERROR;
  }
};

const handleReload = async () => {
  if (isReloading.value) return;
  isReloading.value = true;
  try {
    await loadPage();
  } finally {
    isReloading.value = false;
  }
};
// <!-- Function & API Request End --->

// <!-- Life Cycle Start --->
onMounted(() => {
  loadPage();
});
// <!-- Life Cycle End --->
</script>

<template></template>
