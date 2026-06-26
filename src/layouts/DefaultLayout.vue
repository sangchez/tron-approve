<script setup lang="ts">
// <!-- Import Custom Components Start --->
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
// <!-- Import Custom Components End --->
</script>

<template>
  <header class="bg-white dark:bg-surface-900">
    <div class="max-w-300 mx-auto">
      <AppHeader />
    </div>
  </header>

  <main class="flex-1">
    <div class="max-w-300 mx-auto px-4 py-6">
      <router-view />
    </div>
  </main>

  <footer class="bg-white dark:bg-surface-900">
    <div class="max-w-300 mx-auto">
      <AppFooter />
    </div>
  </footer>
</template>
