<!-- MarkdownEditor.vue - 基于 CodeMirror 的 Markdown 编辑器 -->
<script setup lang="ts">
import { shallowRef, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView, placeholder as cmPlaceholder, ViewPlugin, Decoration, keymap, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting, syntaxTree } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { GFM } from '@lezer/markdown';

/**
 * Props 定义
 * @property modelValue 绑定的文本内容（v-model）
 * @property placeholder 占位文本
 * @property disabled 是否禁用
 * @property maxHeight 最大高度 CSS 值（如 '60vh'）
 * @property fullHeight 是否填满父容器高度
 */
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
  maxHeight?: string
  fullHeight?: boolean
}>(), {
  placeholder: '',
  disabled: false,
  maxHeight: '60vh',
  fullHeight: false,
});

/**
 * 事件定义
 * @event update:modelValue 内容变化时触发
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>();

/**
 * 编辑器容器 DOM 引用
 */
const containerRef = shallowRef<HTMLDivElement | null>(null);

/**
 * CodeMirror EditorView 实例（使用 shallowRef 避免深层响应式代理）
 */
const editorView = shallowRef<EditorView | null>(null);

/**
 * 内部更新标记，防止 v-model 循环
 * 当 CodeMirror 内部变更触发 emit 后，跳过外部 prop 同步
 */
let isInternalUpdate = false;

/* ========== 语法高亮主题 ========== */

/**
 * Markdown 语法高亮样式（匹配 slate 配色）
 */
const highlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: '700', fontSize: '1.25em', color: '#0f172a' },
  { tag: tags.heading2, fontWeight: '700', fontSize: '1.125em', color: '#0f172a' },
  { tag: tags.heading3, fontWeight: '600', fontSize: '1em', color: '#0f172a' },
  { tag: tags.strong, fontWeight: '700', color: '#0f172a' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#64748b' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#94a3b8' },
  { tag: tags.link, color: '#3b82f6', textDecoration: 'underline' },
  { tag: tags.url, color: '#64748b' },
  { tag: tags.monospace, fontFamily: 'ui-monospace, monospace', color: '#475569', backgroundColor: '#f1f5f9', borderRadius: '2px' },
  { tag: tags.quote, color: '#475569' },
  { tag: tags.list, color: '#64748b' },
  { tag: tags.meta, color: '#94a3b8' },
  { tag: tags.processingInstruction, color: '#94a3b8' },
  { tag: tags.contentSeparator, color: '#cbd5e1' },
]);

/**
 * 块级元素行装饰插件
 * 遍历语法树，为 FencedCode / Table 节点内的行添加背景样式
 */
const blockHighlight = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || syntaxTree(update.state) !== syntaxTree(update.startState)) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const decorations: Array<{ from: number; value: Decoration }> = [];
        const tree = syntaxTree(view.state);
        // 语法树节点名 → 行装饰 CSS 类名
        const nodeStyles: Record<string, string> = {
          FencedCode: 'cm-codeblock-line',
          Table: 'cm-table-line',
        };

        tree.iterate({
          enter(node) {
            const className = nodeStyles[node.name];
            if (className) {
              const startLine = view.state.doc.lineAt(node.from).number;
              const endLine = view.state.doc.lineAt(node.to).number;
              for (let i = startLine; i <= endLine; i++) {
                const line = view.state.doc.line(i);
                decorations.push({
                  from: line.from,
                  value: Decoration.line({ class: className }),
                });
              }
            }
          },
        });

        return Decoration.set(decorations.map(d => d.value.range(d.from)));
      }
    },
    { decorations: (v) => v.decorations },
);

/**
 * 数学公式装饰插件
 * 基于正则匹配 $...$ (行内) 和 $$...$$ (块级) 并添加视觉样式
 */
const mathHighlight = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const doc = view.state.doc;
        const text = doc.toString();
        const ranges: ReturnType<Decoration['range']>[] = [];
        const blockRegions: Array<[number, number]> = [];

        // 块级公式：匹配 $$...$$ 对（最短匹配）
        const blockRe = /\$\$([\s\S]*?)\$\$/g;
        let match;
        while ((match = blockRe.exec(text)) !== null) {
          const from = match.index;
          const to = from + match[0].length;
          blockRegions.push([from, to]);
          // 为公式块内每一行添加行装饰
          const startLine = doc.lineAt(from).number;
          const endLine = doc.lineAt(to).number;
          for (let i = startLine; i <= endLine; i++) {
            ranges.push(Decoration.line({ class: 'cm-math-line' }).range(doc.line(i).from));
          }
        }

        // 行内公式：匹配单 $ 包裹的内容（排除 $$ 和块级区域）
        const inlineRe = /(?<!\$)\$(?!\$)(.+?)\$(?!\$)/g;
        while ((match = inlineRe.exec(text)) !== null) {
          const from = match.index;
          const to = from + match[0].length;
          // 跳过处于块级公式区域内的匹配
          if (blockRegions.some(([s, e]) => from >= s && to <= e)) continue;
          ranges.push(Decoration.mark({ class: 'cm-math-inline' }).range(from, to));
        }

        return Decoration.set(ranges, true); // true = 让 CodeMirror 自动排序
      }
    },
    { decorations: (v) => v.decorations },
);

/**
 * 编辑器基础主题样式
 */
const baseTheme = EditorView.theme({
  '&': {
    fontSize: '0.875rem',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '0.75rem',
    caretColor: '#1e293b',
    minHeight: '300px',
  },
  '.cm-line': {
    padding: '0 0.25rem',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-placeholder': {
    color: '#94a3b8',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#dbeafe !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#bfdbfe !important',
  },
  '.cm-activeLine': {
    backgroundColor: '#f8fafc',
  },
  // 代码块行背景样式
  '.cm-codeblock-line': {
    backgroundColor: '#f8fafc',
    borderLeft: '2px solid #e2e8f0',
    paddingLeft: '0.5rem !important',
  },
  // 表格行背景样式（与 blog 的 th bg + border 色系统一）
  '.cm-table-line': {
    backgroundColor: '#f8fafc',
    borderLeft: '2px solid #cbd5e1',
    paddingLeft: '0.5rem !important',
  },
  // 块级数学公式行背景样式
  '.cm-math-line': {
    backgroundColor: '#fffef5',
    borderLeft: '2px solid #fef3c7',
    paddingLeft: '0.5rem !important',
  },
  // 行内数学公式标记样式
  '.cm-math-inline': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    color: '#b45309',
    backgroundColor: '#fffef5',
    borderRadius: '2px',
    padding: '0 2px',
  },
});

/* ========== 编辑器初始化 ========== */

/**
 * 构建 CodeMirror 扩展配置
 */
const buildExtensions = (): Extension[] => {
  const exts: Extension[] = [
    markdown({ extensions: GFM, codeLanguages: languages }),
    syntaxHighlighting(highlightStyle),
    blockHighlight,
    mathHighlight,
    baseTheme,
    EditorView.lineWrapping,
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    // 监听文档变更，同步到 v-model
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        isInternalUpdate = true;
        emit('update:modelValue', update.state.doc.toString());
      }
    }),
  ];

  if (props.placeholder) {
    exts.push(cmPlaceholder(props.placeholder));
  }

  if (props.disabled) {
    exts.push(EditorView.editable.of(false));
  }

  return exts;
};

/**
 * 挂载时创建 EditorView 实例
 */
onMounted(() => {
  if (!containerRef.value) return;

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: buildExtensions(),
  });

  editorView.value = new EditorView({
    state,
    parent: containerRef.value,
  });
});

/**
 * 卸载前销毁 EditorView
 */
onBeforeUnmount(() => {
  editorView.value?.destroy();
  editorView.value = null;
});

/**
 * 监听外部 modelValue 变化，同步到 CodeMirror
 * 跳过由内部变更触发的更新，避免循环
 */
watch(() => props.modelValue, (newValue) => {
  if (isInternalUpdate) {
    isInternalUpdate = false;
    return;
  }

  const view = editorView.value;
  if (!view) return;

  const currentContent = view.state.doc.toString();
  if (newValue !== currentContent) {
    view.dispatch({
      changes: { from: 0, to: currentContent.length, insert: newValue },
    });
  }
});

/**
 * 编辑器容器动态样式
 */
const containerStyle = computed(() => {
  if (props.fullHeight) {
    return { height: '100%' };
  }
  return { maxHeight: props.maxHeight };
});

/**
 * 暴露 EditorView 供 MarkdownToolbar 使用
 */
defineExpose({
  editorView,
});
</script>

<template>
  <div
      ref="containerRef"
      class="border border-input rounded-md bg-white focus-within:border-ring focus-within:ring-ring/20 focus-within:ring-[3px] transition-[color,box-shadow]"
      :style="containerStyle"
  />
</template>

<!-- 将容器的高度约束传递给 CodeMirror 编辑器根元素，并应用自定义滚动条样式 -->
<style scoped>
:deep(.cm-editor) {
  max-height: inherit;
  height: inherit;
}

:deep(.cm-scroller) {
  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgb(226 232 240);
    border-radius: 4px;
  }
  &:hover::-webkit-scrollbar-thumb {
    background-color: rgb(203 213 225);
  }
  scrollbar-width: thin;
  scrollbar-color: rgb(226 232 240) transparent;
}
</style>
