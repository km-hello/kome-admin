
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AcceptableValue } from 'reka-ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ========== Props 定义 ==========
interface Props {
  /** 当前页码（从1开始） */
  current: number;
  /** 每页数量 */
  pageSize: number;
  /** 总数量 */
  total: number;
  /** 每页数量选项 */
  pageSizeOptions?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [10, 20, 50, 100],
});

// ========== Emits 定义 ==========
const emit = defineEmits<{
  (e: 'update:current', page: number): void;
  (e: 'update:pageSize', size: number): void;
  (e: 'change', page: number): void;
  (e: 'pageSizeChange', size: number): void;
}>();

// ========== 计算属性 ==========

/** 总页数 */
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.total / props.pageSize));
});

/** 当前显示范围的起始项 */
const startItem = computed(() => {
  if (props.total === 0) return 0;
  return (props.current - 1) * props.pageSize + 1;
});

/** 当前显示范围的结束项 */
const endItem = computed(() => {
  return Math.min(props.current * props.pageSize, props.total);
});

/** 是否有上一页 */
const hasPrev = computed(() => props.current > 1);

/** 是否有下一页 */
const hasNext = computed(() => props.current < totalPages.value);

// ========== 方法 ==========

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value || page === props.current) return;
  emit('update:current', page);
  emit('change', page);
};

const goPrev = () => {
  if (hasPrev.value) {
    handlePageChange(props.current - 1);
  }
};

const goNext = () => {
  if (hasNext.value) {
    handlePageChange(props.current + 1);
  }
};

const handlePageSizeChange = (value: AcceptableValue) => {
  const newSize = Number(value);
  emit('update:pageSize', newSize);
  emit('pageSizeChange', newSize);
};

// ========== 页码跳转 ==========

const jumpPage = ref(props.current.toString());

watch(() => props.current, (newVal) => {
  jumpPage.value = newVal.toString();
});

const handleJump = () => {
  const page = parseInt(jumpPage.value, 10);
  if (isNaN(page)) {
    jumpPage.value = props.current.toString();
    return;
  }
  const validPage = Math.min(Math.max(1, page), totalPages.value);
  jumpPage.value = validPage.toString();
  handlePageChange(validPage);
};
</script>

<template>
  <div class="flex items-center justify-between">
    <!-- 左侧：显示信息 + 每页数量 -->
    <div class="flex items-center gap-3">
      <Select :model-value="pageSize.toString()" @update:model-value="handlePageSizeChange">
        <SelectTrigger class="w-17.5 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
              v-for="size in pageSizeOptions"
              :key="size"
              :value="size.toString()"
          >
            {{ size }}
          </SelectItem>
        </SelectContent>
      </Select>

      <span class="hidden sm:inline text-sm text-slate-500">
        <template v-if="total > 0">{{ startItem }}-{{ endItem }} of {{ total }}</template>
        <template v-else>No results</template>
      </span>
    </div>

    <!-- 右侧：翻页控制 -->
    <div class="flex items-center gap-1.5">
      <Button
          @click="goPrev"
          :disabled="!hasPrev"
          variant="outline"
          size="icon"
          class="h-8 w-8"
      >
        <ChevronLeft class="w-4 h-4" />
      </Button>

      <div class="flex items-center gap-1">
        <Input
            v-model="jumpPage"
            type="text"
            class="w-10 h-8 text-center text-sm tabular-nums px-1"
            @keyup.enter="handleJump"
            @blur="handleJump"
        />
        <span class="text-sm text-slate-400">/</span>
        <span class="text-sm text-slate-600 tabular-nums">{{ totalPages }}</span>
      </div>

      <Button
          @click="goNext"
          :disabled="!hasNext"
          variant="outline"
          size="icon"
          class="h-8 w-8"
      >
        <ChevronRight class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>
