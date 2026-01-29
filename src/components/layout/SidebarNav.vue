<!--
  SidebarNav.vue - 侧边栏导航菜单组件

  功能：
  - 按分组渲染导航菜单
  - 支持数据驱动的菜单配置
  - 自动处理滚动

  Props:
  - groups: 导航分组配置数组

  导出类型：
  - NavGroup: 导航分组配置
  - NavItemConfig: 单个导航项配置
-->
<script setup lang="ts">
import type { Component } from 'vue';
import NavItem from './NavItem.vue';

/**
 * 导航分组配置
 */
export interface NavGroup {
  /** 分组标题 */
  title: string
  /** 分组内的导航项 */
  items: NavItemConfig[]
}

/**
 * 单个导航项配置
 */
export interface NavItemConfig {
  /** 路由路径 */
  to: string
  /** 图标组件 */
  icon: Component
  /** 显示文本 */
  label: string
  /** 可选徽章 */
  badge?: string | number
}

interface Props {
  /** 导航分组配置数组 */
  groups: NavGroup[]
}

defineProps<Props>();
</script>

<template>
  <nav class="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
    <template v-for="(group, index) in groups" :key="group.title">
      <!-- 分组标题 -->
      <div
          class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
          :class="{ 'mt-6': index > 0, 'mb-2': true }"
      >
        {{ group.title }}
      </div>
      <!-- 分组内的导航项 -->
      <NavItem
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          :badge="item.badge"
      />
    </template>
  </nav>
</template>