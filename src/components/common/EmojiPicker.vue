<!-- EmojiPicker.vue - Emoji 表情选择器 -->
<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Smile } from 'lucide-vue-next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import 'emoji-picker-element';

/**
 * 事件定义
 * @event select 选中 emoji 后触发，传递 Unicode 字符串
 */
const emit = defineEmits<{
  (e: 'select', emoji: string): void
}>();

const { t } = useI18n();

/**
 * Popover 打开状态
 */
const open = ref(false);

/**
 * 处理 emoji-picker-element 的选中事件。
 * 从 CustomEvent.detail 中提取 unicode 字符并触发 select 事件。
 */
const handleEmojiClick = (event: Event) => {
  const detail = (event as CustomEvent).detail;
  if (detail?.unicode) {
    emit('select', detail.unicode);
    open.value = false;
  }
};
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <!-- 默认触发按钮，可通过 slot 覆盖 -->
      <slot>
        <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 shrink-0"
            :title="t('emojiPicker.title')"
        >
          <Smile class="w-4 h-4" />
        </Button>
      </slot>
    </PopoverTrigger>
    <PopoverContent
        align="end"
        :side-offset="8"
        class="w-auto p-0 border-0 shadow-lg"
    >
      <!-- emoji-picker-element Web Component -->
      <emoji-picker
          @emoji-click="handleEmojiClick"
          class="light"
      />
    </PopoverContent>
  </Popover>
</template>

<!--
  emoji-picker-element Shadow DOM 样式覆盖
  该组件使用 Web Component，内部 DOM 封装在 Shadow DOM 中，
  Tailwind 类名无法穿透 Shadow DOM 边界，只能通过 CSS 自定义属性覆盖样式。
-->
<style scoped>
emoji-picker {
  --num-columns: 8;
  --emoji-padding: 0.4rem;
  --border-color: #e2e8f0;
  --background: #ffffff;
  --category-emoji-size: 1.125rem;
  --emoji-size: 1.25rem;
  --input-border-color: #e2e8f0;
  --input-font-size: 0.875rem;
  --input-padding: 0.375rem 0.625rem;
  --outline-size: 0;
}
</style>
