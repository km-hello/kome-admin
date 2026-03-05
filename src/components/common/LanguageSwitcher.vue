<!-- LanguageSwitcher.vue - 语言切换器 -->
<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Languages, Check } from 'lucide-vue-next';
import { setLocale } from '@/i18n';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const { locale, t } = useI18n();

/**
 * 下拉弹出层开关状态
 */
const open = ref(false);

/**
 * 可选语言列表
 * code: i18n locale 标识
 * label: 对应的 i18n 翻译键（显示为本地化名称）
 */
const languages = [
  { code: 'en', label: 'header.english' },
  { code: 'zh-CN', label: 'header.chinese' },
] as const;

/**
 * 切换至指定语言并关闭下拉弹出层
 */
const switchLanguage = (code: 'en' | 'zh-CN') => {
  setLocale(code);
  open.value = false;
};
</script>

<template>
  <Popover v-model:open="open">
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
</template>
