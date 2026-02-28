<!-- StatsCard.vue - 统计卡片组件 -->
<script setup lang="ts">
import type {Component} from 'vue'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'

/**
 * Props 定义
 * @property title 卡片标题
 * @property value 主要数值
 * @property description 描述文字
 * @property icon 图标组件
 * @property iconBgClass 图标容器背景色 class
 * @property iconClass 图标颜色 class
 */
interface Props {
  title: string
  value: number | string
  description?: string
  icon?: Component
  iconBgClass?: string
  iconClass?: string
}

withDefaults(defineProps<Props>(), {
  iconBgClass: 'bg-slate-50',
  iconClass: 'text-slate-600',
})
</script>

<template>
  <!-- 统计卡片（sm+ padding 和 gap 增大） -->
  <Card class="relative py-4 gap-2 sm:py-6 sm:gap-6">
    <!-- 卡片头部（标题 + 图标） -->
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-0 px-4 sm:px-6">
      <CardTitle class="text-xs sm:text-sm font-medium text-slate-600">{{ title }}</CardTitle>
      <!-- 图标容器 -->
      <div
          v-if="icon"
          class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center"
          :class="iconBgClass"
      >
        <component :is="icon" class="h-3.5 w-3.5 sm:h-4 sm:w-4" :class="iconClass"/>
      </div>
    </CardHeader>
    <!-- 卡片内容（数值 + 描述） -->
    <CardContent class="px-4 sm:px-6 pr-12 sm:pr-14">
      <div class="text-xl sm:text-2xl font-bold text-slate-900">{{ value }}</div>
      <p v-if="description" class="text-xs text-slate-400 mt-1">{{ description }}</p>
      <slot/>
    </CardContent>
  </Card>
</template>