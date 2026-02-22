
<!--
  Header.vue - 顶部导航栏组件

  功能：
  - 显示面包屑导航
  - 提供快捷操作按钮（查看站点、通知、主题切换、设置）

  Props:
  - siteUrl: 前台站点链接
  - showNotificationBadge: 是否显示通知红点
-->
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Bell, ExternalLink, Sun, Settings } from 'lucide-vue-next';
import Breadcrumb from '@/components/common/Breadcrumb.vue';

interface Props {
  /** 前台站点 URL */
  siteUrl?: string
  /** 是否显示通知红点 */
  showNotificationBadge?: boolean
}

withDefaults(defineProps<Props>(), {
  siteUrl: '/',
  showNotificationBadge: false,
});

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>();

const router = useRouter();
</script>

<template>
  <header class="h-16 bg-white/80 backdrop-blur-md border-b px-4 md:px-6 flex items-center justify-between shrink-0 z-10">
    <!-- 左侧：面包屑导航 -->
    <Breadcrumb @toggle-sidebar="emit('toggleSidebar')" />

    <!-- 右侧：操作按钮组 -->
    <div class="flex items-center gap-1.5">
      <!-- 查看前台站点 -->
      <a
          :href="siteUrl"
          target="_blank"
          class="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors group"
          title="View Site"
      >
        <span class="hidden sm:inline">View Site</span>
        <ExternalLink class="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>

      <div class="w-px h-5 bg-slate-200 mx-1" />

      <!-- 通知按钮 -->
      <button
          class="relative inline-flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
      >
        <Bell class="w-4 h-4" />
        <!-- 未读通知红点 -->
        <span
            v-if="showNotificationBadge"
            class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"
        />
      </button>

      <!-- 主题切换按钮（预留功能） -->
      <button
          class="inline-flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Toggle Theme"
      >
        <Sun class="w-4 h-4" />
      </button>

      <!-- 设置按钮 -->
      <button
          class="inline-flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Settings"
          @click="router.push('/settings')"
      >
        <Settings class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>