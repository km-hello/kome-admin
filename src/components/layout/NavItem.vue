<!--
  NavItem.vue - 侧边栏导航项组件

  功能：
  - 渲染单个导航链接
  - 自动高亮当前激活的路由（支持子路由匹配）
  - 可选显示图标和徽章

  Props:
  - to: 路由路径
  - icon: 图标组件
  - label: 显示文本
  - badge: 可选徽章（如未读数量）
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Component } from 'vue';

interface Props {
  /** 路由路径，不传则渲染为普通链接 */
  to?: string
  /** 图标组件 */
  icon?: Component
  /** 导航项文本 */
  label: string
  /** 徽章内容（如未读消息数） */
  badge?: string | number
}

const props = defineProps<Props>();
const route = useRoute();

/**
 * 判断当前导航项是否激活
 * 支持精确匹配和子路由匹配（如 /posts 匹配 /posts/new）
 */
const isActive = computed(() => {
  if (!props.to) return false;
  return route.path === props.to || route.path.startsWith(props.to + '/');
});

/**
 * 动态计算导航项样式类
 */
const linkClass = computed(() => {
  const baseClass = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer';

  if (isActive.value) {
    return `${baseClass} bg-slate-900 text-white shadow-md hover:bg-slate-800`;
  }

  return `${baseClass} text-slate-600 hover:bg-slate-100 hover:text-slate-900`;
});
</script>

<template>
  <!-- 动态渲染为 router-link 或普通 a 标签 -->
  <component
      :is="to ? 'router-link' : 'a'"
      :to="to"
      :href="to ? undefined : '#'"
      :class="linkClass"
  >
    <!-- 图标 -->
    <component v-if="icon" :is="icon" class="w-4 h-4" />
    <!-- 文本 -->
    <span>{{ label }}</span>
    <!-- 徽章 -->
    <span v-if="badge" class="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
      {{ badge }}
    </span>
  </component>
</template>