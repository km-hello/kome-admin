<!--
  StatsCard.vue - 统计卡片组件

  用于展示统计数值，支持自定义图标和颜色
-->
<script setup lang="ts">
import type { Component } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  /** 卡片标题 */
  title: string
  /** 主要数值 */
  value: number | string
  /** 描述文字 */
  description?: string
  /** 图标组件 */
  icon?: Component
  /** 图标容器背景色 class */
  iconBgClass?: string
  /** 图标颜色 class */
  iconClass?: string
}

withDefaults(defineProps<Props>(), {
  iconBgClass: 'bg-slate-50',
  iconClass: 'text-slate-600',
})
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium text-slate-600">{{ title }}</CardTitle>
      <div
          v-if="icon"
          class="w-8 h-8 rounded-lg flex items-center justify-center"
          :class="iconBgClass"
      >
        <component :is="icon" class="h-4 w-4" :class="iconClass" />
      </div>
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold text-slate-900">{{ value }}</div>
      <p v-if="description" class="text-xs text-slate-400 mt-1">{{ description }}</p>
      <slot />
    </CardContent>
  </Card>
</template>