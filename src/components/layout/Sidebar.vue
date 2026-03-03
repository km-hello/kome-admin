<!-- Sidebar.vue - 侧边栏组件 -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Component } from 'vue'
import { LogOut } from 'lucide-vue-next'

/**
 * 导航项配置
 * @property to 路由路径
 * @property icon 图标组件
 * @property label 显示文字
 * @property badge 徽章数字或文字（可选）
 */
export interface NavItemConfig {
  to: string
  icon: Component
  label: string
  badge?: string | number
}

/**
 * 导航分组配置
 * @property title 分组标题
 * @property items 导航项列表
 */
export interface NavGroup {
  title: string
  items: NavItemConfig[]
}

/**
 * Props 定义
 * @property navGroups 导航分组列表
 * @property userAvatar 用户头像 URL
 * @property userNickname 用户昵称
 * @property userEmail 用户邮箱
 * @property mobile 移动端模式（始终显示，不受 md:flex 控制）
 */
interface Props {
  navGroups: NavGroup[]
  userAvatar?: string
  userNickname?: string
  userEmail?: string
  mobile?: boolean
}

withDefaults(defineProps<Props>(), {
  userAvatar: '',
  userNickname: '',
  userEmail: '',
  mobile: false,
})

/**
 * 事件定义
 * @event logout 用户登出
 * @event navigate 导航项点击
 */
const emit = defineEmits<{
  (e: 'logout'): void
  (e: 'navigate'): void
}>()

const route = useRoute()
const { t } = useI18n()

/**
 * 判断路径是否激活
 */
const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

/**
 * 获取导航项样式类
 */
const getNavItemClass = (path: string) => {
  const base = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer'
  return isActive(path)
      ? `${base} bg-slate-900 text-white shadow-md hover:bg-slate-800`
      : `${base} text-slate-600 hover:bg-slate-100 hover:text-slate-900`
}
</script>

<template>
  <!-- 侧边栏容器（移动端全宽 / >= md 固定宽度 hidden） -->
  <aside :class="mobile ? 'w-full bg-white h-full flex flex-col' : 'w-64 bg-white h-full border-r flex-col hidden md:flex shrink-0'">
    <!-- Logo 区域 -->
    <div class="h-16 flex items-center px-6 border-b border-border/50 shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-md">
          K
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-slate-800 text-sm tracking-tight">{{ t('brand.name') }}</span>
          <span class="text-[10px] text-slate-400 font-medium">{{ t('brand.tagline') }}</span>
        </div>
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
      <template v-for="(group, index) in navGroups" :key="group.title">
        <!-- 分组标题 -->
        <div
            class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
            :class="{ 'mt-6': index > 0, 'mb-2': true }"
        >
          {{ group.title }}
        </div>
        <!-- 导航项 -->
        <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            :class="getNavItemClass(item.to)"
            @click="emit('navigate')"
        >
          <component :is="item.icon" class="w-4 h-4" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {{ item.badge }}
          </span>
        </router-link>
      </template>
    </nav>

    <!-- 用户信息卡片 -->
    <div class="p-4 border-t border-border/50 shrink-0">
      <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
        <img
            :src="userAvatar"
            class="w-10 h-10 rounded-full bg-white border-2 border-slate-200"
            alt="User Avatar"
        >
        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold text-slate-800 truncate">{{ userNickname }}</div>
          <div class="text-xs text-slate-500 truncate">{{ userEmail }}</div>
        </div>
        <!-- 登出按钮 -->
        <button
            @click="emit('logout')"
            class="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded"
            :title="t('sidebar.logout')"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </div>
  </aside>
</template>
