<!-- SortableHead.vue - 可排序表头组件 -->
<script setup lang="ts">
import type {HTMLAttributes} from 'vue'
import type {SortOrder} from '@/composables/useTableSort'
import {TableHead} from '@/components/ui/table'
import {ArrowUpDown, ArrowUp, ArrowDown} from 'lucide-vue-next'

/**
 * Props 定义
 * @property sortOrder 当前排序状态（'asc' | 'desc' | null）
 * @property class 自定义样式类
 */
defineProps<{
  sortOrder: SortOrder
  class?: HTMLAttributes['class']
}>()

/**
 * 事件定义
 * @event sort 点击表头触发排序
 */
defineEmits<{
  sort: []
}>()
</script>

<template>
  <TableHead
      :class="['cursor-pointer select-none hover:text-slate-900', $props.class]"
      @click="$emit('sort')"
  >
    <div class="flex items-center gap-1">
      <slot/>
      <ArrowUp v-if="sortOrder === 'asc'" class="w-3.5 h-3.5 text-slate-700"/>
      <ArrowDown v-else-if="sortOrder === 'desc'" class="w-3.5 h-3.5 text-slate-700"/>
      <ArrowUpDown v-else class="w-3.5 h-3.5 text-slate-400"/>
    </div>
  </TableHead>
</template>
