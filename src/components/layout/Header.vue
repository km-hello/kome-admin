<!-- Header.vue - 顶部导航栏 -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ExternalLink, Sun, Settings, Languages, Check } from 'lucide-vue-next';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { setLocale } from '@/i18n';

/**
 * Props 定义
 * @property siteUrl 前台站点 URL
 */
interface Props {
  siteUrl?: string
}

withDefaults(defineProps<Props>(), {
  siteUrl: '/',
});

/**
 * 事件定义
 * @event toggleSidebar 切换侧边栏显示状态
 */
const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>();

const router = useRouter();
const { locale, t } = useI18n();

/**
 * 语言选择器弹出层开关状态
 */
const langOpen = ref(false);

/**
 * 可选语言列表，code 对应 i18n locale，label 对应翻译键
 */
const languages = [
  { code: 'en', label: 'header.english' },
  { code: 'zh-CN', label: 'header.chinese' },
] as const;

/**
 * 切换至指定语言并关闭下拉弹出层。
 * @param code - 目标语言 locale 代码
 */
const switchLanguage = (code: 'en' | 'zh-CN'): void => {
  setLocale(code);
  langOpen.value = false;
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

      <!-- 语言选择器 -->
      <Popover v-model:open="langOpen">
        <PopoverTrigger as-child>
          <button
              class="inline-flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              :title="t('header.language')"
          >
            <Languages class="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" :side-offset="8" class="w-40 p-1">
          <button
              v-for="lang in languages"
              :key="lang.code"
              class="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors"
              :class="locale === lang.code ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'"
              @click="switchLanguage(lang.code)"
          >
            {{ t(lang.label) }}
            <Check v-if="locale === lang.code" class="w-4 h-4 text-slate-600" />
          </button>
        </PopoverContent>
      </Popover>

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
