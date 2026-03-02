<!-- Header.vue - 顶部导航栏 -->
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Bell, ExternalLink, Sun, Settings, Languages } from 'lucide-vue-next';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import { setLocale } from '@/i18n';
import i18n from '@/i18n';

/**
 * Props 定义
 * @property siteUrl 前台站点 URL
 * @property showNotificationBadge 是否显示通知红点
 */
interface Props {
  siteUrl?: string
  showNotificationBadge?: boolean
}

withDefaults(defineProps<Props>(), {
  siteUrl: '/',
  showNotificationBadge: false,
});

/**
 * 事件定义
 * @event toggleSidebar 切换侧边栏显示状态
 */
const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>();

const router = useRouter();
const { t } = useI18n();

/**
 * 切换当前语言。
 *
 * 读取 `i18n.global.locale` 的当前值，若为 `'zh-CN'` 则切换为 `'en'`，否则切换回 `'zh-CN'`。
 * 通过 `setLocale` 更新全局语言设置。
 *
 * @returns {void}
 */
const toggleLanguage = (): void => {
  const current = (i18n.global.locale as any).value;
  setLocale(current === 'zh-CN' ? 'en' : 'zh-CN');
};
</script>

<template>
  <header class="h-16 bg-white/80 backdrop-blur-md border-b px-4 md:px-6 flex items-center justify-between shrink-0 z-10">
    <!-- 面包屑导航 -->
    <Breadcrumb @toggle-sidebar="emit('toggleSidebar')" />

    <!-- 操作按钮组 -->
    <div class="flex items-center gap-1.5">
      <!-- 查看前台站点 -->
      <a
          :href="siteUrl"
          target="_blank"
          class="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors group"
          :title="t('header.viewSite')"
      >
        <span class="hidden sm:inline">{{ t('header.viewSite') }}</span>
        <ExternalLink class="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>

      <div class="w-px h-5 bg-slate-200 mx-1" />

      <!-- 语言切换按钮 -->
      <button
          class="inline-flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          :title="t('header.language')"
          @click="toggleLanguage"
      >
        <Languages class="w-4 h-4" />
      </button>

      <!-- 通知按钮 -->
      <button
          class="relative inline-flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          :title="t('header.notifications')"
      >
        <Bell class="w-4 h-4" />
        <!-- 未读通知红点 -->
        <span
            v-if="showNotificationBadge"
            class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"
        />
      </button>

      <!-- 主题切换按钮 -->
      <button
          class="inline-flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          :title="t('header.toggleTheme')"
      >
        <Sun class="w-4 h-4" />
      </button>

      <!-- 设置按钮 -->
      <button
          class="inline-flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          :title="t('header.settings')"
          @click="router.push('/settings')"
      >
        <Settings class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
