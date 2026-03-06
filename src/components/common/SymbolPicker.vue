<!-- SymbolPicker.vue - 特殊符号选择器 -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Omega } from 'lucide-vue-next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

/**
 * 事件定义
 * @event select 选中符号后触发，传递符号字符串
 */
const emit = defineEmits<{
  (e: 'select', symbol: string): void
}>();

const { t } = useI18n();

/**
 * Popover 打开状态
 */
const open = ref(false);

/**
 * 当前激活的分类索引
 */
const activeCategory = ref(0);

/**
 * 符号分类数据
 * 包含 8 个分类：箭头、数学、希腊字母、货币、标点、形状、星星、杂项
 */
const categories = [
  {
    key: 'arrows',
    icon: '→',
    items: [
      '→', '←', '↑', '↓', '↔', '↕', '⇒', '⇐', '⇑', '⇓', '⇔', '⇕',
      '➡', '⬅', '⬆', '⬇', '↗', '↘', '↙', '↖', '⟹', '⟸', '⟺',
      '↦', '↪', '↩', '⤴', '⤵', '↻', '↺', '⟵', '⟶', '⟷',
      '▶', '◀', '▲', '▼', '⏩', '⏪', '⏫', '⏬',
    ],
  },
  {
    key: 'math',
    icon: '∑',
    items: [
      '±', '×', '÷', '≠', '≈', '≤', '≥', '∞', '∑', '∏', '√', '∫',
      '∂', '∆', '∇', '∈', '∉', '⊂', '⊃', '⊆', '⊇', '∪', '∩', '∅',
      '∀', '∃', '¬', '∧', '∨', '⊕', '⊗', '⊙', '∝', '∴', '∵', '≡',
      '≅', '≜', '≐', '≪', '≫', '∥', '⊥', '∠', '∟', '⌊', '⌋', '⌈',
      '⌉', '⟨', '⟩', '∘', '⊢', '⊣', '⊨', '⊤', '⋅', '⋆',
    ],
  },
  {
    key: 'greek',
    icon: 'α',
    items: [
      'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ',
      'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω',
      'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ',
      'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω',
    ],
  },
  {
    key: 'currency',
    icon: '¥',
    items: [
      '$', '€', '£', '¥', '₩', '₹', '₽', '₿', '¢', '₫', '₱', '₺',
      '₴', '₸', '₡', '₦', '₮', '₲', '₵', '₢', '₠', '₣', '₤', '₥',
      '₧', '₨', '₪', '₭', '₯', '₰', '₳', '₶', '₷', '₻', '₼', '₾',
    ],
  },
  {
    key: 'punctuation',
    icon: '…',
    items: [
      '…', '—', '–', '·', '•', '‣', '※', '†', '‡', '§', '¶', '‰',
      '‱', '′', '″', '‴', '‵', '‶', '‷', '«', '»', '‹', '›',
      '「', '」', '『', '』', '【', '】', '〔', '〕', '〈', '〉',
      '《', '》', '〖', '〗', '〘', '〙',
    ],
  },
  {
    key: 'shapes',
    icon: '◆',
    items: [
      '●', '○', '◉', '◎', '◌', '◍', '◐', '◑', '◒', '◓', '◔', '◕',
      '■', '□', '◆', '◇', '◈', '▪', '▫', '▬', '▭', '▮', '▯',
      '▲', '△', '▴', '▵', '▼', '▽', '▾', '▿', '◀', '◁', '▶', '▷',
      '◣', '◢', '◤', '◥', '⬟', '⬠', '⬡', '⬢', '⬣',
    ],
  },
  {
    key: 'stars',
    icon: '★',
    items: [
      '★', '☆', '✦', '✧', '✩', '✪', '✫', '✬', '✭', '✮', '✯', '✰',
      '⭐', '🌟', '✨', '💫', '⚝', '✵', '❋', '❊', '❉', '❈', '❇', '❆',
      '❅', '❄', '❃', '❂', '❁', '❀', '✿', '✾', '✽', '✼',
      '♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟',
    ],
  },
  {
    key: 'misc',
    icon: '⚙',
    items: [
      '©', '®', '™', '℗', '℠', '℃', '℉', '№', 'Å', 'Ω',
      '♠', '♣', '♥', '♦', '♪', '♫', '♬', '♩',
      '✓', '✔', '✗', '✘', '☐', '☑', '☒',
      '⚡', '☀', '☁', '☂', '☃', '☄', '☮', '☯', '☸', '✡', '☪',
      '⚙', '⚠', '☎', '✉', '✂', '✍', '⌘', '⌥', '⇧', '⌫', '⏎',
      '⌚', '⌛', '⏰', '⏳', '♻', '⚕', '⚖', '⚗', '⚘', '⚛', '⚜',
    ],
  },
];

/**
 * 当前激活分类的符号列表
 */
const activeItems = computed(() => categories[activeCategory.value]?.items ?? []);

/**
 * 选中符号并关闭弹出框
 */
const handleSelect = (symbol: string) => {
  emit('select', symbol);
  open.value = false;
};
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
          type="button"
          variant="ghost"
          size="sm"
          class="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 shrink-0"
          :title="t('symbolPicker.title')"
      >
        <Omega class="w-4 h-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
        align="end"
        :side-offset="8"
        class="w-80 p-0"
    >
      <!-- 分类标签页 -->
      <div class="flex items-center gap-0.5 px-2 pt-2 pb-1 border-b border-slate-100 overflow-x-auto scrollbar-thin">
        <button
            v-for="(cat, index) in categories"
            :key="cat.key"
            @click="activeCategory = index"
            class="p-1.5 rounded-md text-sm transition-colors hover:bg-slate-100 shrink-0"
            :class="activeCategory === index ? 'bg-slate-100' : ''"
            :title="t(`symbolPicker.categories.${cat.key}`)"
        >
          {{ cat.icon }}
        </button>
      </div>

      <!-- 符号网格 -->
      <div class="h-56 overflow-y-auto px-2 py-2 scrollbar-thin">
        <div class="grid grid-cols-8 gap-0.5">
          <button
              v-for="symbol in activeItems"
              :key="symbol"
              @click="handleSelect(symbol)"
              class="p-1.5 rounded-md text-base leading-none hover:bg-slate-100 transition-colors text-center text-slate-700 hover:text-slate-900"
          >
            {{ symbol }}
          </button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
