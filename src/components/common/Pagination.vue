
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
  /** 显示的实体名称，默认为 'results' */
  itemName?: string;
  /** 每页数量选项 */
  pageSizeOptions?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  itemName: 'results',
  pageSizeOptions: () => [10, 20, 50, 100],
});

// ========== Emits 定义 ==========
const emit = defineEmits<{
  (e: 'update:current', page: number): void;
  (e: 'update:pageSize', size: number): void;
  (e: 'change', page: number): void;
  (e: 'pageSizeChange', size: number): void;
}>();

// ========== 状态 ==========
const jumpPage = ref(props.current.toString());

// 监听 current 变化，同步 jumpPage
watch(() => props.current, (newVal) => {
  jumpPage.value = newVal.toString();
});

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

/** 跳转到指定页码 */
const handleJump = () => {
  const page = parseInt(jumpPage.value, 10);
  if (isNaN(page)) {
    jumpPage.value = props.current.toString();
    return;
  }
  // 限制在有效范围内
  const validPage = Math.min(Math.max(1, page), totalPages.value);
  jumpPage.value = validPage.toString();
  handlePageChange(validPage);
};
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <!-- 左侧：显示信息 + 每页数量选择 -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <div class="hidden sm:block text-sm text-slate-500">
        <template v-if="total > 0">
          Showing {{ startItem }} to {{ endItem }} of {{ total }} {{ itemName }}
        </template>
        <template v-else>
          No {{ itemName }}
        </template>
      </div>

      <!-- 每页数量选择 -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-500">per page</span>
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
      </div>
    </div>

    <!-- 右侧：分页控制 -->
    <div class="flex items-center gap-2">
      <Button
          @click="goPrev"
          :disabled="!hasPrev"
          variant="outline"
          size="sm"
      >
        <span class="hidden sm:inline">Previous</span>
        <span class="sm:hidden">Prev</span>
      </Button>

      <!-- 页码跳转 -->
      <div class="flex items-center gap-1.5">
        <span class="text-sm text-slate-500">Page</span>
        <Input
            v-model="jumpPage"
            type="text"
            class="w-14 h-8 text-center"
            @keyup.enter="handleJump"
            @blur="handleJump"
        />
        <span class="text-sm text-slate-500">of {{ totalPages }}</span>
      </div>

      <Button
          @click="goNext"
          :disabled="!hasNext"
          variant="outline"
          size="sm"
      >
        <span class="hidden sm:inline">Next</span>
        <span class="sm:hidden">Next</span>
      </Button>
    </div>
  </div>
</template>