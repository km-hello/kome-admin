<!--
  App.vue - 应用根组件

  功能：
    - 渲染当前路由视图（router-view）
    - 挂载全局 Toast 通知组件（vue-sonner）
-->
<script setup lang="ts">
import { Toaster } from 'vue-sonner';
</script>

<template>
  <router-view />
  <Toaster position="top-right" :duration="3000" richColors />
</template>