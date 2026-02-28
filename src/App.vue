<!-- App.vue - 应用根组件 -->
<script setup lang="ts">
import { Toaster } from 'vue-sonner';
</script>

<template>
  <router-view />
  <Toaster position="top-right" :duration="3000" richColors />
</template>