<!--
  PageHeader.vue - 页面标题组件

  用于统一页面顶部的标题栏样式
-->
<script setup lang="ts">
interface Props {
  /** 页面标题 */
  title: string
  /** 页面描述 */
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight text-slate-800">{{ title }}</h2>
      <p v-if="description" class="text-slate-500 mt-1">{{ description }}</p>
    </div>
    <slot name="actions" />
  </div>
</template>