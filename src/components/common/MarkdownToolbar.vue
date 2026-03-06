<!-- MarkdownToolbar.vue - Markdown 编辑工具栏 -->
<script setup lang="ts">
import { onBeforeUnmount, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Heading1, Heading2, Heading3,
  Bold, Italic, Strikethrough,
  Code, FileCode2,
  Link, ImagePlus,
  List, ListOrdered, Quote,
  Table, Minus, Sigma,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import EmojiPicker from '@/components/common/EmojiPicker.vue';
import SymbolPicker from '@/components/common/SymbolPicker.vue';

/**
 * Props 定义
 * @property modelValue 绑定的文本内容（v-model）
 * @property textareaEl 关联的原生 textarea 元素，用于光标定位
 */
const props = defineProps<{
  modelValue: string
  textareaEl: HTMLTextAreaElement | null
}>();

/**
 * 事件定义
 * @event update:modelValue 文本内容变化时触发
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>();

const { t } = useI18n();

/* ========== 工具栏操作类型定义 ========== */

/** 包裹操作：在选中文本前后插入前缀和后缀（如 **bold**） */
interface WrapAction {
  type: 'wrap'
  prefix: string
  suffix: string
}

/** 前缀操作：在行首插入前缀（如 # 标题） */
interface PrefixAction {
  type: 'prefix'
  prefix: string
}

/** 块操作：插入多行模板（如代码块、表格） */
interface BlockAction {
  type: 'block'
  template: string
  cursorOffset: number
}

type ToolbarAction = WrapAction | PrefixAction | BlockAction;

/**
 * 操作映射表
 * 定义每个工具栏按钮对应的 Markdown 语法插入行为
 */
const actions: Record<string, ToolbarAction> = {
  h1:            { type: 'prefix', prefix: '# ' },
  h2:            { type: 'prefix', prefix: '## ' },
  h3:            { type: 'prefix', prefix: '### ' },
  bold:          { type: 'wrap', prefix: '**', suffix: '**' },
  italic:        { type: 'wrap', prefix: '*', suffix: '*' },
  strikethrough: { type: 'wrap', prefix: '~~', suffix: '~~' },
  code:          { type: 'wrap', prefix: '`', suffix: '`' },
  link:          { type: 'wrap', prefix: '[', suffix: '](url)' },
  image:         { type: 'block', template: '![alt](url)', cursorOffset: 2 },
  codeBlock:     { type: 'block', template: '\n```\n\n```\n', cursorOffset: 5 },
  ul:            { type: 'prefix', prefix: '- ' },
  ol:            { type: 'prefix', prefix: '1. ' },
  quote:         { type: 'prefix', prefix: '> ' },
  table:         { type: 'block', template: '\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n|  |  |  |\n', cursorOffset: 2 },
  hr:            { type: 'block', template: '\n---\n', cursorOffset: 5 },
  mathInline:    { type: 'wrap', prefix: '$', suffix: '$' },
  mathBlock:     { type: 'block', template: '\n$$\n\n$$\n', cursorOffset: 4 },
};

/**
 * 工具栏按钮分组配置
 * 按功能分组：标题、格式、代码/数学、链接、列表、表格
 */
const toolbarGroups = [
  [
    { key: 'h1', icon: Heading1, label: 'H1' },
    { key: 'h2', icon: Heading2, label: 'H2' },
    { key: 'h3', icon: Heading3, label: 'H3' },
  ],
  [
    { key: 'bold', icon: Bold, label: 'Bold' },
    { key: 'italic', icon: Italic, label: 'Italic' },
    { key: 'strikethrough', icon: Strikethrough, label: 'Strikethrough' },
  ],
  [
    { key: 'code', icon: Code, label: 'Inline Code' },
    { key: 'codeBlock', icon: FileCode2, label: 'Code Block' },
    { key: 'mathInline', icon: Sigma, label: 'Math Inline' },
    { key: 'mathBlock', icon: null, label: 'Math Block', text: '$$' },
  ],
  [
    { key: 'link', icon: Link, label: 'Link' },
    { key: 'image', icon: ImagePlus, label: 'Image' },
  ],
  [
    { key: 'ul', icon: List, label: 'Unordered List' },
    { key: 'ol', icon: ListOrdered, label: 'Ordered List' },
    { key: 'quote', icon: Quote, label: 'Blockquote' },
  ],
  [
    { key: 'table', icon: Table, label: 'Table' },
    { key: 'hr', icon: Minus, label: 'Horizontal Rule' },
  ],
];

/* ========== 核心插入逻辑 ========== */

/**
 * 执行工具栏操作：将 Markdown 语法插入 textarea 光标位置或包裹选中文本
 */
const execute = (key: string) => {
  const action = actions[key];
  const textarea = props.textareaEl;
  if (!action || !textarea) return;

  const content = props.modelValue;
  const start = textarea.selectionStart;  // 光标起始位置
  const end = textarea.selectionEnd;      // 光标结束位置
  const selected = content.slice(start, end); // 当前选中的文本

  let newContent: string;
  let cursorStart: number;
  let cursorEnd: number;

  if (action.type === 'wrap') {
    // 包裹模式：在选中文本前后插入语法标记（如 **text**）
    const wrapped = `${action.prefix}${selected}${action.suffix}`;
    newContent = content.slice(0, start) + wrapped + content.slice(end);
    if (selected) {
      // 有选中文本时，光标选中包裹后的原始文本
      cursorStart = start + action.prefix.length;
      cursorEnd = cursorStart + selected.length;
    } else {
      // 无选中文本时，光标定位到前缀后等待输入
      cursorStart = cursorEnd = start + action.prefix.length;
    }
  } else if (action.type === 'prefix') {
    // 前缀模式：在当前行首插入语法标记（如 # ）
    const lineStart = content.lastIndexOf('\n', start - 1) + 1; // 定位当前行首
    newContent = content.slice(0, lineStart) + action.prefix + content.slice(lineStart);
    cursorStart = cursorEnd = start + action.prefix.length;
  } else {
    // 块模式：在光标处插入多行模板（如代码块、表格）
    newContent = content.slice(0, start) + action.template + content.slice(end);
    cursorStart = cursorEnd = start + action.cursorOffset; // 光标移到模板内的编辑位置
  }

  emit('update:modelValue', newContent);
  // 等待 DOM 更新后恢复光标位置并聚焦
  nextTick(() => {
    textarea.setSelectionRange(cursorStart, cursorEnd);
    textarea.focus();
  });
};

/**
 * 插入文本到光标位置（供 Emoji / 特殊符号选择器共用）
 *
 * @param text 待插入的文本
 */
const insertText = (text: string) => {
  const textarea = props.textareaEl;
  if (!textarea) {
    // 无 textarea 引用时，追加到末尾
    emit('update:modelValue', props.modelValue + text);
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const content = props.modelValue;
  // 替换选区或在光标处插入文本
  const newContent = content.slice(0, start) + text + content.slice(end);

  emit('update:modelValue', newContent);
  // 等待 DOM 更新后将光标移到插入文本之后
  nextTick(() => {
    const pos = start + text.length;
    textarea.setSelectionRange(pos, pos);
    textarea.focus();
  });
};

/* ========== 键盘快捷键 ========== */

/**
 * 快捷键映射表
 * 键为组合键字符串（ctrl+b），值为对应的操作 key
 */
const shortcutMap: Record<string, string> = {
  'ctrl+b': 'bold',
  'ctrl+i': 'italic',
  'ctrl+k': 'link',
  'ctrl+e': 'code',
  'ctrl+shift+x': 'strikethrough',
  'ctrl+shift+c': 'codeBlock',
  'ctrl+shift+m': 'mathInline',
};

/**
 * 处理键盘快捷键事件。
 * 解析按键组合并匹配对应的工具栏操作。
 */
const handleKeydown = (e: KeyboardEvent) => {
  // 拼接按键组合字符串，如 "ctrl+shift+m"
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  parts.push(e.key.toLowerCase());
  const combo = parts.join('+');

  // 匹配快捷键映射表，命中则执行对应操作
  const actionKey = shortcutMap[combo];
  if (actionKey) {
    e.preventDefault();
    execute(actionKey);
  }
};

/** 当前绑定快捷键的 textarea 元素 */
let currentTextarea: HTMLTextAreaElement | null = null;

/**
 * 绑定/解绑键盘监听器到 textarea 元素
 */
const attachListener = (el: HTMLTextAreaElement | null) => {
  if (currentTextarea) {
    currentTextarea.removeEventListener('keydown', handleKeydown);
  }
  currentTextarea = el;
  if (el) {
    el.addEventListener('keydown', handleKeydown);
  }
};

watch(() => props.textareaEl, (el) => attachListener(el), { immediate: true });

onBeforeUnmount(() => {
  if (currentTextarea) {
    currentTextarea.removeEventListener('keydown', handleKeydown);
  }
});
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-0.5 gap-y-1 px-1 py-1 rounded-md border border-slate-200 bg-slate-50/50">
    <template v-for="(group, gi) in toolbarGroups" :key="gi">
      <!-- 分组分隔线 -->
      <div v-if="gi > 0" class="w-px h-4 bg-slate-200 mx-0.5 shrink-0" />
      <template v-for="item in group" :key="item.key">
        <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-7 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 shrink-0"
            :class="item.text ? 'w-auto px-1.5 text-xs font-mono' : 'w-7'"
            :title="t(`markdownToolbar.${item.key}`)"
            @click="execute(item.key)"
        >
          <component v-if="item.icon" :is="item.icon" class="w-3.5 h-3.5" />
          <span v-else>{{ item.text }}</span>
        </Button>
      </template>
    </template>

    <!-- Emoji 和特殊符号选择器 -->
    <div class="w-px h-4 bg-slate-200 mx-0.5 shrink-0" />
    <EmojiPicker @select="insertText" />
    <SymbolPicker @select="insertText" />
  </div>
</template>
