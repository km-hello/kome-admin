<!-- TagSelector.vue - 标签选择器组件 -->
<script setup lang="ts">
import {ref, computed, watch, nextTick} from 'vue';
import {useI18n} from 'vue-i18n';
import {toast} from 'vue-sonner';
import {createTagApi, type TagResponse} from '@/api/tag.ts';
import {useSiteStore} from '@/stores/site.ts';
import {X, Plus, Search, Check, Loader2} from 'lucide-vue-next';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const {t} = useI18n();

/**
 * Props 定义
 * @property tags 所有可选标签
 * @property selectedIds 已选中的标签ID列表
 * @property disabled 是否禁用
 */
interface Props {
  tags: TagResponse[];
  selectedIds: number[];
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

/**
 * 事件定义
 * @event update:selectedIds 选中标签变化
 * @event tagCreated 新标签创建成功
 */
const emit = defineEmits<{
  (e: 'update:selectedIds', value: number[]): void;
  (e: 'tagCreated', tag: TagResponse): void;
}>();

const siteStore = useSiteStore();

/**
 *  Popover 打开状态
 */
const popoverOpen = ref(false);
/**
 * 搜索关键词
 */
const searchQuery = ref('');
/**
 * 是否正在创建标签
 */
const creating = ref(false);
/**
 * 输入框引用
 */
const inputRef = ref<InstanceType<typeof Input> | null>(null);

/**
 * 已选中的标签对象列表
 */
const selectedTags = computed(() => {
  return props.tags.filter(tag => props.selectedIds.includes(tag.id));
});

/**
 * 过滤后的标签列表
 */
const filteredTags = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.tags;
  }
  const query = searchQuery.value.toLowerCase().trim();
  return props.tags.filter(tag =>
      tag.name.toLowerCase().includes(query)
  );
});

/**
 * 是否显示创建新标签选项
 */
const showCreateOption = computed(() => {
  if (!searchQuery.value.trim()) return false;
  const query = searchQuery.value.toLowerCase().trim();
  // 检查是否已存在完全匹配的标签
  return !props.tags.some(tag => tag.name.toLowerCase() === query);
});

/**
 * 切换标签选中状态
 */
const toggleTag = (tagId: number) => {
  const newSelectedIds = [...props.selectedIds];
  const index = newSelectedIds.indexOf(tagId);

  if (index > -1) {
    newSelectedIds.splice(index, 1);
  } else {
    newSelectedIds.push(tagId);
  }

  emit('update:selectedIds', newSelectedIds);
};

/**
 * 移除已选标签
 */
const removeTag = (tagId: number, event: Event) => {
  event.stopPropagation();
  const newSelectedIds = props.selectedIds.filter(id => id !== tagId);
  emit('update:selectedIds', newSelectedIds);
};

/**
 * 创建新标签
 */
const createTag = async () => {
  const tagName = searchQuery.value.trim();
  if (!tagName || creating.value) return;

  creating.value = true;
  try {
    const newTag = await createTagApi({name: tagName});
    toast.success(t('tagSelector.createSuccess', {name: tagName}));

    // 标记统计数据已失效，让其他页面在进入时自动刷新
    siteStore.invalidateStats();

    // 通知父组件新标签已创建
    emit('tagCreated', newTag);

    // 自动选中新创建的标签
    const newSelectedIds = [...props.selectedIds, newTag.id];
    emit('update:selectedIds', newSelectedIds);

    // 清空搜索
    searchQuery.value = '';
  } catch (error) {
    console.error('Failed to create tag:', error);
    toast.error(t('tagSelector.createFailed'));
  } finally {
    creating.value = false;
  }
};

/**
 * 处理键盘事件
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && showCreateOption.value) {
    event.preventDefault();
    createTag();
  }
};

/**
 * Popover 打开时聚焦输入框
 */
watch(popoverOpen, (open) => {
  if (open) {
    nextTick(() => {
      (inputRef.value?.$el as HTMLInputElement)?.focus();
    });
  } else {
    searchQuery.value = '';
  }
});
</script>

<template>
  <div class="space-y-2">
    <!-- 已选标签展示 -->
    <div class="flex flex-wrap gap-2 min-h-8">
      <Badge
          v-for="tag in selectedTags"
          :key="tag.id"
          variant="default"
          class="gap-1 pr-1"
      >
        {{ tag.name }}
        <button
            type="button"
            class="ml-1 rounded-full hover:bg-slate-600 p-0.5 transition-colors"
            @click="removeTag(tag.id, $event)"
            :disabled="disabled"
        >
          <X class="w-3 h-3"/>
        </button>
      </Badge>

      <!-- 添加标签按钮 -->
      <Popover v-model:open="popoverOpen">
        <PopoverTrigger as-child>
          <button
              type="button"
              class="inline-flex items-center gap-1 px-2 py-1 text-sm text-slate-500 border border-dashed border-slate-300 rounded-md hover:border-slate-400 hover:text-slate-600 transition-colors"
              :disabled="disabled"
          >
            <Plus class="w-3 h-3"/>
            {{ t('tagSelector.addTag') }}
          </button>
        </PopoverTrigger>

        <PopoverContent
            class="w-64 p-0"
            align="start"
        >
          <!-- 搜索输入框 -->
          <div class="p-2 border-b border-slate-200">
            <div class="relative">
              <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <Input
                  ref="inputRef"
                  v-model="searchQuery"
                  :placeholder="t('tagSelector.searchOrCreate')"
                  class="pl-8 h-8 text-sm"
                  @keydown="handleKeydown"
              />
            </div>
          </div>

          <!-- 标签列表 -->
          <div class="max-h-48 overflow-y-auto scrollbar-thin p-1">
            <!-- 无匹配结果 -->
            <div
                v-if="filteredTags.length === 0 && !showCreateOption"
                class="px-2 py-3 text-center text-sm text-slate-500"
            >
              {{ t('tagSelector.noTagsFound') }}
            </div>

            <!-- 标签选项 -->
            <button
                v-for="tag in filteredTags"
                :key="tag.id"
                type="button"
                class="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-slate-100 transition-colors"
                @click="toggleTag(tag.id)"
            >
              <span>{{ tag.name }}</span>
              <Check
                  v-if="selectedIds.includes(tag.id)"
                  class="w-4 h-4 text-emerald-600"
              />
            </button>

            <!-- 创建新标签选项 -->
            <button
                v-if="showCreateOption"
                type="button"
                class="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-slate-100 transition-colors text-blue-600"
                :disabled="creating"
                @click="createTag"
            >
              <Loader2 v-if="creating" class="w-4 h-4 animate-spin"/>
              <Plus v-else class="w-4 h-4"/>
              <span>{{ t('tagSelector.createTag', {name: searchQuery.trim()}) }}</span>
            </button>
          </div>

          <!-- 提示 -->
          <div class="px-2 py-1.5 border-t border-slate-200 bg-slate-50">
            <p class="text-xs text-slate-500">
              {{ t('tagSelector.enterToCreate') }}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>