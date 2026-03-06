<!-- MarkdownToolbar.vue - Markdown 编辑工具栏 -->
<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EditorView } from '@codemirror/view';
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
 * @property editorView CodeMirror EditorView 实例
 */
const props = withDefaults(defineProps<{
  editorView?: EditorView | null
}>(), {
  editorView: null,
});

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
 * 执行工具栏操作，通过 CodeMirror dispatch 插入 Markdown 语法
 */
const execute = (key: string) => {
  const action = actions[key];
  const view = props.editorView;
  if (!action || !view) return;

  const { from, to } = view.state.selection.main; // 当前选区
  const selected = view.state.sliceDoc(from, to);  // 选中文本
  const content = view.state.doc.toString();

  if (action.type === 'wrap') {
    // 包裹模式：在选区前后添加语法标记
    const insert = `${action.prefix}${selected}${action.suffix}`;
    const selectionFrom = from + action.prefix.length;
    const selectionTo = selected ? selectionFrom + selected.length : selectionFrom;
    // 通过 dispatch 一次性完成替换和光标定位
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: selectionFrom, head: selectionTo },
    });
  } else if (action.type === 'prefix') {
    // 前缀模式：在当前行首插入标记
    const lineStart = content.lastIndexOf('\n', from - 1) + 1;
    view.dispatch({
      changes: { from: lineStart, to: lineStart, insert: action.prefix },
      selection: { anchor: from + action.prefix.length },
    });
  } else {
    // 块模式：插入多行模板并定位光标到编辑位置
    view.dispatch({
      changes: { from, to, insert: action.template },
      selection: { anchor: from + action.cursorOffset },
    });
  }

  view.focus();
};

/**
 * 插入文本到光标位置（供 Emoji / 特殊符号选择器共用）
 *
 * @param text 待插入的文本
 */
const insertText = (text: string) => {
  const view = props.editorView;
  if (!view) return;

  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  view.focus();
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

/** 当前绑定快捷键的 DOM 元素（CodeMirror contentDOM） */
let currentTarget: HTMLElement | null = null;

/**
 * 绑定/解绑键盘监听器到目标元素
 */
const attachListener = (el: HTMLElement | null) => {
  if (currentTarget) {
    currentTarget.removeEventListener('keydown', handleKeydown);
  }
  currentTarget = el;
  if (el) {
    el.addEventListener('keydown', handleKeydown);
  }
};

// 监听 EditorView 变化，绑定到 CodeMirror 的 contentDOM
watch(() => props.editorView, (view) => {
  if (view) attachListener(view.contentDOM);
}, { immediate: true });

onBeforeUnmount(() => {
  if (currentTarget) {
    currentTarget.removeEventListener('keydown', handleKeydown);
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
