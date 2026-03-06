<!-- Memo.vue - 动态管理页面 -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import i18n from '@/i18n';
import { useSiteStore } from '@/stores/site';
import { useTableSort } from '@/composables/useTableSort';
import {
  getAdminMemosApi,
  createMemoApi,
  updateMemoApi,
  deleteMemoApi,
  type MemoResponse,
  type MemoCreateRequest,
  type MemoUpdateRequest,
} from '@/api/memo';

import Pagination from '@/components/common/Pagination.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatsCard from '@/components/common/StatsCard.vue';
import SortableHead from '@/components/common/SortableHead.vue';
import MarkdownToolbar from '@/components/common/MarkdownToolbar.vue';
import MarkdownEditor from '@/components/common/MarkdownEditor.vue';

import { Plus, Search, Edit, Trash2, Activity, Loader2, Pin, Calendar, Globe, FileEdit } from 'lucide-vue-next';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const siteStore = useSiteStore();
const { t } = useI18n();

/**
 * MarkdownEditor 组件引用，用于获取 CodeMirror EditorView
 */
const markdownEditorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);

/**
 * 获取 CodeMirror EditorView 实例供 MarkdownToolbar 使用
 */
const editorView = computed(() => markdownEditorRef.value?.editorView ?? null);

/**
 * 动态列表数据
 */
const memos = ref<MemoResponse[]>([]);
const { sortedData: sortedMemos, toggleSort, getSortOrder, resetSort } = useTableSort(memos);
/**
 * 加载状态
 */
const loading = ref(true);
/**
 * 搜索关键词
 */
const searchKeyword = ref('');
/**
 * 状态筛选值
 */
const statusFilter = ref<number | undefined>(undefined);

/**
 * 分页状态
 */
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

/**
 * 对话框状态
 */
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const dialogLoading = ref(false);

/**
 * 动态表单数据类型
 * 基于 API 请求类型，增加 id 字段用于编辑模式
 */
type MemoFormData = MemoCreateRequest & { id: number };

/**
 * 表单数据
 */
const formData = ref<MemoFormData>({
  id: 0,
  content: '',
  isPinned: false,
  status: 0,
});

/**
 * 删除确认对话框
 */
const deleteDialogVisible = ref(false);
const deleteTarget = ref<MemoResponse | null>(null);
const deleteLoading = ref(false);


onMounted(async () => {
  try {
    // 并行请求统计数据和动态列表
    await Promise.all([
      siteStore.fetchStats(),
      fetchMemos(),
    ]);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
});


/**
 * 获取动态列表。
 * 根据当前分页、搜索关键词和状态筛选条件请求动态数据。
 */
const fetchMemos = async () => {
  loading.value = true;
  try {
    const data = await getAdminMemosApi({
      pageNum: pagination.value.current,
      pageSize: pagination.value.pageSize,
      keyword: searchKeyword.value || undefined,
      status: statusFilter.value,
    });

    memos.value = data.records;
    pagination.value.total = data.total;
    resetSort();
  } catch (error) {
    console.error('Failed to fetch memos:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索处理。
 * 重置页码到第一页并重新请求动态列表。
 */
const handleSearch = () => {
  pagination.value.current = 1;
  fetchMemos();
};

/**
 * 状态筛选变化。
 * 将选中值转换为数字状态码，重置页码并刷新列表。
 *
 * @param value 选中的筛选值，'all' 表示全部
 */
const handleStatusFilterChange = (value: string | null | undefined) => {
  // 处理空值或 'all' 的情况
  if (!value || value === 'all') {
    statusFilter.value = undefined;
  } else {
    statusFilter.value = Number(value);
  }

  // 重置到第一页并刷新数据
  pagination.value.current = 1;
  fetchMemos();
};

/**
 * 打开创建对话框
 */
const openCreateDialog = () => {
  dialogMode.value = 'create';
  formData.value = {
    id: 0,
    content: '',
    isPinned: false,
    status: 0,
  };
  dialogVisible.value = true;
};

/**
 * 打开编辑对话框
 */
const openEditDialog = (memo: MemoResponse) => {
  dialogMode.value = 'edit';
  formData.value = {
    id: memo.id,
    content: memo.content,
    isPinned: memo.isPinned,
    status: memo.status,
  };
  dialogVisible.value = true;
};

/**
 * 表单验证
 */
const validateForm = (): boolean => {
  if (!formData.value.content.trim()) {
    toast.warning(t('memo.validation.contentRequired'));
    return false;
  }

  if (formData.value.content.length > 2147483647) {
    toast.warning(t('memo.validation.contentTooLong'));
    return false;
  }

  return true;
};

/**
 * 提交表单。
 * 验证后根据对话框模式执行创建或更新操作，成功后刷新列表和统计。
 */
const handleSubmit = async () => {
  if (!validateForm()) return;

  dialogLoading.value = true;

  try {
    if (dialogMode.value === 'create') {
      const request: MemoCreateRequest = {
        content: formData.value.content.trim(),
        isPinned: formData.value.isPinned,
        status: formData.value.status,
      };
      await createMemoApi(request);
      toast.success(t('memo.createSuccess'));
    } else {
      const request: MemoUpdateRequest = {
        content: formData.value.content.trim(),
        isPinned: formData.value.isPinned,
        status: formData.value.status,
      };
      await updateMemoApi(formData.value.id, request);
      toast.success(t('memo.updateSuccess'));
    }

    dialogVisible.value = false;

    // 刷新列表和统计数据
    await Promise.all([
      fetchMemos(),
      siteStore.refreshStats(), // 强制刷新统计
    ]);
  } catch (error) {
    console.error('Failed to submit memo:', error);
  } finally {
    dialogLoading.value = false;
  }
};

/**
 * 打开删除确认对话框
 */
const openDeleteDialog = (memo: MemoResponse) => {
  deleteTarget.value = memo;
  deleteDialogVisible.value = true;
};

/**
 * 确认删除动态。
 * 删除成功后自动处理末页空数据回退，并刷新列表和统计。
 */
const handleDelete = async () => {
  if (!deleteTarget.value) return;

  deleteLoading.value = true;

  try {
    await deleteMemoApi(deleteTarget.value.id);
    toast.success(t('memo.deleteSuccess'));
    deleteDialogVisible.value = false;

    // 如果当前页没有数据了，回到上一页
    if (memos.value.length === 1 && pagination.value.current > 1) {
      pagination.value.current--;
    }

    // 刷新列表和统计数据
    await Promise.all([
      fetchMemos(),
      siteStore.refreshStats(), // 强制刷新统计
    ]);
  } catch (error) {
    console.error('Failed to delete memo:', error);
  } finally {
    deleteLoading.value = false;
  }
};

/**
 * 分页变化。
 *
 * @param page 目标页码
 */
const handlePageChange = (page: number) => {
  pagination.value.current = page;
  fetchMemos();
};

/**
 * 每页数量变化。
 * 更新每页数量并重置到第一页。
 *
 * @param size 每页显示数量
 */
const handlePageSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.current = 1;
  fetchMemos();
};

/**
 * 获取状态配置。
 * 根据状态值返回对应的显示标签、图标组件和样式类名。
 *
 * @param status 状态值 (0: 草稿, 1: 已发布)
 */
const getStatusConfig = (status: number) => {
  const configs = {
    0: { label: t('status.draft'), icon: FileEdit, class: 'text-slate-400' },
    1: { label: t('status.published'), icon: Globe, class: 'text-slate-600' },
  };
  return configs[status as keyof typeof configs] || configs[0];
};

/**
 * 格式化日期为中文格式。
 * 将 ISO 日期字符串转换为 "YYYY/MM/DD HH:mm" 格式。
 *
 * @param dateString ISO 格式的日期字符串
 */
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const locale = (i18n.global.locale as any).value === 'zh-CN' ? 'zh-CN' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 截断文本。
 * 超过最大长度时截断并追加省略号。
 *
 * @param text 原始文本
 * @param maxLength 最大字符数，默认 100
 */
const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <PageHeader :title="t('memo.title')" :description="t('memo.description')">
      <template #actions>
        <Button @click="openCreateDialog" class="bg-slate-900 hover:bg-slate-800 gap-2">
          <Plus class="w-4 h-4" />
          {{ t('memo.newMemo') }}
        </Button>
      </template>
    </PageHeader>

    <!-- 统计卡片（2列 → md 3列，gap 响应式 3 → sm 4） -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
      <StatsCard
          class="col-span-2 md:col-span-1"
          :title="t('statsCard.totalMemos')"
          :value="siteStore.totalMemos"
          :description="t('statsCard.totalQuickNotes')"
          :icon="Activity"
          icon-bg-class="bg-amber-50"
          icon-class="text-amber-600"
      />
      <StatsCard
          :title="t('statsCard.published')"
          :value="siteStore.stats.publishedMemoCount"
          :description="t('statsCard.visibleToPublic')"
          :icon="Activity"
          icon-bg-class="bg-teal-50"
          icon-class="text-teal-600"
      />
      <StatsCard
          :title="t('statsCard.draft')"
          :value="siteStore.stats.draftMemoCount"
          :description="t('statsCard.privateNotes')"
          :icon="Activity"
          icon-bg-class="bg-slate-50"
          icon-class="text-slate-600"
      />
    </div>

    <!-- 动态列表 -->
    <Card class="overflow-hidden">
      <CardHeader class="border-b border-slate-100 py-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle class="text-lg font-bold text-slate-800">{{ t('memo.allMemos') }}</CardTitle>
            <CardDescription class="mt-1">{{ t('memo.description') }}</CardDescription>
          </div>
          <div class="flex flex-wrap items-center gap-2 sm:gap-3">
            <!-- 状态筛选 -->
            <Select @update:model-value="(value) => handleStatusFilterChange(value as string)">
              <SelectTrigger class="w-35 h-9 bg-slate-50 border-slate-200">
                <SelectValue :placeholder="t('memo.allStatus')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{{ t('memo.allStatus') }}</SelectItem>
                <SelectItem value="1">{{ t('status.published') }}</SelectItem>
                <SelectItem value="0">{{ t('status.draft') }}</SelectItem>
              </SelectContent>
            </Select>

            <!-- 搜索框（< sm 全宽 / >= sm 固定 w-64） -->
            <div class="relative w-full sm:w-64">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                  v-model="searchKeyword"
                  :placeholder="t('memo.searchPlaceholder')"
                  class="pl-9 pr-9 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  @keyup.enter="handleSearch"
              />
              <button
                  @click="handleSearch"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  :title="t('common.search')"
              >
                <Search class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-transparent border-slate-100">
              <SortableHead class="w-15 pl-4 sm:pl-6" :sort-order="getSortOrder('id')" @sort="toggleSort('id')">{{ t('table.id') }}</SortableHead>
              <TableHead class="w-[50%]">{{ t('table.content') }}</TableHead>
              <SortableHead :sort-order="getSortOrder('status')" @sort="toggleSort('status')">{{ t('table.status') }}</SortableHead>
              <SortableHead :sort-order="getSortOrder('createTime')" @sort="toggleSort('createTime')">{{ t('table.createdAt') }}</SortableHead>
              <TableHead class="text-right pr-4 sm:pr-6">{{ t('table.actions') }}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <!-- 加载状态 -->
            <TableRow v-if="loading">
              <TableCell colspan="5" class="text-center py-12">
                <div class="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 class="w-5 h-5 animate-spin" />
                  <span>{{ t('memo.loadingMemos') }}</span>
                </div>
              </TableCell>
            </TableRow>

            <!-- 空状态 -->
            <TableRow v-else-if="memos.length === 0">
              <TableCell colspan="5" class="h-32 text-center">
                <div class="flex flex-col items-center justify-center text-slate-400">
                  <Activity class="w-12 h-12 mb-2 opacity-20" />
                  <p class="text-sm font-medium">
                    {{ searchKeyword || statusFilter !== undefined ? t('memo.noMemosFound') : t('memo.noMemosYet') }}
                  </p>
                  <p class="text-xs mt-1">
                    {{ searchKeyword || statusFilter !== undefined ? t('memo.tryAdjustingFilters') : t('memo.createFirstMemo') }}
                  </p>
                </div>
              </TableCell>
            </TableRow>

            <!-- 动态列表 -->
            <TableRow
                v-for="memo in sortedMemos"
                :key="memo.id"
                class="transition-colors border-slate-100 group"
                :class="[
                    memo.isPinned ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/50'
                  ]"
            >
              <!-- ID 列 -->
              <TableCell class="font-mono text-xs text-slate-500 pl-4 sm:pl-6 relative">
                <div class="flex items-center">
                  <span class="mr-1">#{{ memo.id }}</span>
                  <Pin v-if="memo.isPinned" class="w-3 h-3 text-amber-500 opacity-70" />
                </div>
              </TableCell>

              <!-- 内容列 -->
              <TableCell class="whitespace-normal">
                <p class="text-sm text-slate-700 line-clamp-2" :title="memo.content">
                  {{ truncateText(memo.content, 100) }}
                </p>
              </TableCell>

              <!-- 状态列 -->
              <TableCell>
                <div
                    class="inline-flex items-center gap-1.5 text-xs"
                    :class="getStatusConfig(memo.status).class"
                >
                  <component :is="getStatusConfig(memo.status).icon" class="w-3 h-3" />
                  {{ getStatusConfig(memo.status).label }}
                </div>
              </TableCell>

              <!-- 创建时间列 -->
              <TableCell>
                <div class="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(memo.createTime) }}
                </div>
              </TableCell>

              <!-- 操作列 -->
              <TableCell class="text-right pr-4 sm:pr-6">
                <div class="flex items-center justify-end gap-2">
                  <Button
                      @click="openEditDialog(memo)"
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      :title="t('common.edit')"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  <Button
                      @click="openDeleteDialog(memo)"
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      :title="t('common.delete')"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- 分页 -->
        <div class="border-t border-slate-100 px-4 sm:px-6 py-4">
          <Pagination
              :current="pagination.current"
              :page-size="pagination.pageSize"
              :total="pagination.total"
              @change="handlePageChange"
              @page-size-change="handlePageSizeChange"
          />
        </div>
      </CardContent>
    </Card>

    <!-- 创建/编辑对话框 -->
    <Dialog v-model:open="dialogVisible">
      <DialogContent class="sm:max-w-200">
        <DialogHeader>
          <DialogTitle>
            {{ dialogMode === 'create' ? t('memo.createNewMemo') : t('memo.editMemo') }}
          </DialogTitle>
          <DialogDescription>
            {{ dialogMode === 'create' ? t('memo.addNewNote') : t('memo.updateMemoDesc') }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- 内容输入 -->
          <div class="space-y-2">
            <Label for="content">
              {{ t('memo.contentLabel') }} <span class="text-red-500">*</span>
            </Label>
            <MarkdownToolbar
                :editor-view="editorView"
                class="mb-2"
            />
            <MarkdownEditor
                ref="markdownEditorRef"
                v-model="formData.content"
                :placeholder="t('memo.contentPlaceholder')"
                max-height="30vh"
                :disabled="dialogLoading"
            />
            <p class="text-xs text-slate-400">{{ formData.content.length }} {{ t('common.characters') }}</p>
          </div>

          <!-- 置顶选项 -->
          <div class="flex items-center space-x-2">
            <Checkbox
                id="isPinned"
                v-model="formData.isPinned"
                :disabled="dialogLoading"
            />
            <Label
                for="isPinned"
                class="text-sm font-normal cursor-pointer flex items-center gap-1.5"
            >
              <Pin class="w-3.5 h-3.5" />
              {{ t('memo.pinToTop') }}
            </Label>
          </div>

          <!-- 状态选择 -->
          <div class="space-y-2">
            <Label for="status">
              {{ t('memo.statusLabel') }} <span class="text-red-500">*</span>
            </Label>
            <Select
                v-model="formData.status"
                :disabled="dialogLoading"
            >
              <SelectTrigger id="status">
                <SelectValue :placeholder="t('memo.selectStatus')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="1">{{ t('status.published') }}</SelectItem>
                <SelectItem :value="0">{{ t('status.draft') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
              @click="dialogVisible = false"
              variant="outline"
              :disabled="dialogLoading"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
              @click="handleSubmit"
              :disabled="dialogLoading"
              class="gap-2"
          >
            <Loader2 v-if="dialogLoading" class="w-4 h-4 animate-spin" />
            {{ dialogMode === 'create' ? t('common.create') : t('common.update') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 删除确认对话框 -->
    <AlertDialog v-model:open="deleteDialogVisible">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('memo.deleteConfirmTitle') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('memo.deleteConfirmDesc') }}
            <span v-if="deleteTarget" class="font-semibold text-slate-700">
              "{{ truncateText(deleteTarget.content, 50) }}"
            </span>.
            {{ t('memo.deleteCannotUndo') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleteLoading">{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction
              @click="handleDelete"
              :disabled="deleteLoading"
              class="bg-red-600 hover:bg-red-700 gap-2"
          >
            <Loader2 v-if="deleteLoading" class="w-4 h-4 animate-spin" />
            {{ t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
