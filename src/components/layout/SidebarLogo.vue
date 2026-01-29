<!--
  SidebarLogo.vue - 侧边栏 Logo 组件

  功能：
  - 显示品牌 Logo 和系统名称
  - 支持自定义标题和副标题
  - 支持通过插槽自定义 Logo 图标

  Props:
  - title: 系统名称
  - subtitle: 副标题

  Slots:
  - icon: 自定义 Logo 图标内容
-->
<script setup lang="ts">
interface Props {
  /** 系统名称 */
  title?: string
  /** 副标题 */
  subtitle?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Kome Admin',
  subtitle: 'Management System',
})
</script>

<template>
  <div class="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
    <div class="flex items-center gap-3">
      <!-- Logo 图标 -->
      <div class="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white text-sm font-serif font-bold shadow-md">
        <slot name="icon">K</slot>
      </div>
      <!-- 文字信息 -->
      <div class="flex flex-col">
        <span class="font-bold text-slate-800 text-sm tracking-tight">{{ title }}</span>
        <span class="text-[10px] text-slate-400 font-medium">{{ subtitle }}</span>
      </div>
    </div>
  </div>
</template>