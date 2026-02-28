<!-- PageHeader.vue - 页面标题组件 -->
<script setup lang="ts">
/**
 * Props 定义
 * @property title 页面标题
 * @property description 页面描述
 */
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex items-center justify-between flex-wrap gap-4">
    <!-- 标题和描述 -->
    <div>
      <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">{{ title }}</h2>
      <p v-if="description" class="text-slate-500 mt-1.5">{{ description }}</p>
    </div>
    <!-- 操作按钮插槽 -->
    <slot name="actions"/>
  </div>
</template>