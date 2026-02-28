<!-- Tag.vue - 标签管理页面 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { useSiteStore } from '@/stores/site';
import { useTableSort } from '@/composables/useTableSort';
import {
  getAdminTagsApi,
  createTagApi,
  updateTagApi,
  deleteTagApi,
  type TagPostCountResponse,
  type TagCreateRequest,
  type TagUpdateRequest,
} from '@/api/tag';

import { Plus, Search, Edit, Trash2, Hash, FileText, Loader2, Calendar } from 'lucide-vue-next';

import PageHeader from '@/components/common/PageHeader.vue';
import StatsCard from '@/components/common/StatsCard.vue';
import Pagination from '@/components/common/Pagination.vue';
import SortableHead from '@/components/common/SortableHead.vue';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const siteStore = useSiteStore();

/**
 * 标签列表数据
 */
const tags = ref<TagPostCountResponse[]>([]);
const { sortedData: sortedTags, toggleSort, getSortOrder, resetSort } = useTableSort(tags);
/**
 * 加载状态
 */
const loading = ref(true);
/**
 * 搜索关键词
 */
const searchKeyword = ref('');

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
 * 表单数据
 */
const formData = ref({
  id: 0,
  name: '',
});

/**
 * 删除确认对话框
 */
const deleteDialogVisible = ref(false);
const deleteTarget = ref<TagPostCountResponse | null>(null);
const deleteLoading = ref(false);


onMounted(async () => {
  try {
    // 并行请求统计数据和标签列表
    await Promise.all([
      siteStore.fetchStats(),
      fetchTags(),
    ]);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
});


/**
 * 获取标签列表。
 * 根据当前分页和搜索关键词请求标签数据，包含文章关联计数。
 */
const fetchTags = async () => {
  loading.value = true;
  try {
    const data = await getAdminTagsApi({
      pageNum: pagination.value.current,
      pageSize: pagination.value.pageSize,
      keyword: searchKeyword.value || undefined,
    });

    tags.value = data.records;
    pagination.value.total = data.total;
    resetSort();
  } catch (error) {
    console.error('Failed to fetch tags:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索处理。
 * 重置页码到第一页并重新请求标签列表。
 */
const handleSearch = () => {
  pagination.value.current = 1;
  fetchTags();
};

/**
 * 打开创建对话框
 */
const openCreateDialog = () => {
  dialogMode.value = 'create';
  formData.value = { id: 0, name: '' };
  dialogVisible.value = true;
};

/**
 * 打开编辑对话框
 */
const openEditDialog = (tag: TagPostCountResponse) => {
  dialogMode.value = 'edit';
  formData.value = { id: tag.id, name: tag.name };
  dialogVisible.value = true;
};

/**
 * 提交表单。
 * 验证后根据对话框模式执行创建或更新操作，成功后刷新列表和统计。
 */
const handleSubmit = async () => {
  // 表单验证
  if (!formData.value.name.trim()) {
    toast.warning('请输入标签名称');
    return;
  }

  if (formData.value.name.length > 50) {
    toast.warning('标签名称不能超过 50 个字符');
    return;
  }

  dialogLoading.value = true;

  try {
    if (dialogMode.value === 'create') {
      const request: TagCreateRequest = { name: formData.value.name.trim() };
      await createTagApi(request);
      toast.success('标签创建成功');
    } else {
      const request: TagUpdateRequest = { name: formData.value.name.trim() };
      await updateTagApi(formData.value.id, request);
      toast.success('标签更新成功');
    }

    dialogVisible.value = false;

    // 刷新列表和统计数据
    await Promise.all([
      fetchTags(),
      siteStore.refreshStats(),
    ]);
  } catch (error) {
    console.error('Failed to submit tag:', error);
  } finally {
    dialogLoading.value = false;
  }
};

/**
 * 打开删除确认对话框
 */
const openDeleteDialog = (tag: TagPostCountResponse) => {
  deleteTarget.value = tag;
  deleteDialogVisible.value = true;
};

/**
 * 确认删除标签。
 * 删除成功后自动处理末页空数据回退，并刷新列表和统计。
 */
const handleDelete = async () => {
  if (!deleteTarget.value) return;

  deleteLoading.value = true;

  try {
    await deleteTagApi(deleteTarget.value.id);
    toast.success('标签删除成功');
    deleteDialogVisible.value = false;

    // 如果当前页没有数据了，回到上一页
    if (tags.value.length === 1 && pagination.value.current > 1) {
      pagination.value.current--;
    }

    // 刷新列表和统计数据
    await Promise.all([
      fetchTags(),
      siteStore.refreshStats(),
    ]);
  } catch (error) {
    console.error('Failed to delete tag:', error);
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
  fetchTags();
};

/**
 * 每页数量变化。
 * 更新每页数量并重置到第一页。
 *
 * @param size 每页显示数量
 */
const handlePageSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.current = 1; // 重置到第一页
  fetchTags();
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
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <PageHeader title="Tags" description="Manage and organize your content tags">
      <template #actions>
        <Button @click="openCreateDialog" class="bg-slate-900 hover:bg-slate-800 gap-2">
          <Plus class="w-4 h-4" />
          New Tag
        </Button>
      </template>
    </PageHeader>

    <!-- 统计卡片（2列 → md 3列，gap 响应式 3 → sm 4） -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
      <StatsCard
          class="col-span-2 md:col-span-1"
          title="Total Tags"
          :value="siteStore.totalTags"
          description="All classification tags"
          :icon="Hash"
          icon-bg-class="bg-emerald-50"
          icon-class="text-emerald-600"
      />
      <StatsCard
          title="Used Tags"
          :value="siteStore.stats.usedTagCount"
          description="With published posts"
          :icon="Hash"
          icon-bg-class="bg-teal-50"
          icon-class="text-teal-600"
      />
      <StatsCard
          title="Unused Tags"
          :value="siteStore.stats.unusedTagCount"
          description="No published posts"
          :icon="Hash"
          icon-bg-class="bg-slate-50"
          icon-class="text-slate-600"
      />
    </div>

    <!-- 标签列表 -->
    <Card class="overflow-hidden">
      <CardHeader class="border-b border-slate-100 py-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle class="text-lg font-bold text-slate-800">All Tags</CardTitle>
            <CardDescription class="mt-1">Manage and organize your content tags</CardDescription>
          </div>
          <div class="flex flex-wrap items-center gap-2 sm:gap-3">
            <!-- 搜索框（< sm 全宽 / >= sm 固定 w-64） -->
            <div class="relative w-full sm:w-64">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                  v-model="searchKeyword"
                  placeholder="Search tags..."
                  class="pl-9 pr-9 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  @keyup.enter="handleSearch"
              />
              <button
                  @click="handleSearch"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Search"
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
              <SortableHead class="w-16 pl-4 sm:pl-6" :sort-order="getSortOrder('id')" @sort="toggleSort('id')">ID</SortableHead>
              <SortableHead class="w-[30%]" :sort-order="getSortOrder('name')" @sort="toggleSort('name')">Tag Name</SortableHead>
              <SortableHead :sort-order="getSortOrder('postCount')" @sort="toggleSort('postCount')">Post Count</SortableHead>
              <SortableHead :sort-order="getSortOrder('createTime')" @sort="toggleSort('createTime')">Created At</SortableHead>
              <TableHead class="text-right pr-4 sm:pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <!-- 标签列表 -->
            <TableRow
                v-for="tag in sortedTags"
                :key="tag.id"
                class="hover:bg-slate-50/50 transition-colors border-slate-100"
            >
              <!-- ID 列 -->
              <TableCell class="font-mono text-xs text-slate-500 pl-4 sm:pl-6">
                #{{ tag.id }}
              </TableCell>

              <!-- 标签名称列 -->
              <TableCell>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Hash class="w-4 h-4 text-slate-600" />
                  </div>
                  <span class="font-semibold text-slate-900 truncate min-w-0" :title="tag.name">{{ tag.name }}</span>
                </div>
              </TableCell>

              <!-- 文章数量列 -->
              <TableCell>
                <div class="flex items-center gap-1.5">
                  <FileText class="w-3.5 h-3.5 text-slate-400" />
                  <span class="font-mono text-sm text-slate-600">{{ tag.postCount }}</span>
                  <span class="text-xs text-slate-400">posts</span>
                </div>
              </TableCell>

              <!-- 创建时间列 -->
              <TableCell>
                <div class="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(tag.createTime) }}
                </div>
              </TableCell>

              <!-- 操作列 -->
              <TableCell class="text-right pr-4 sm:pr-6">
                <div class="flex items-center justify-end gap-2">
                  <Button
                      @click="openEditDialog(tag)"
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      title="Edit"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  <Button
                      @click="openDeleteDialog(tag)"
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            <!-- 加载状态 -->
            <TableRow v-if="loading">
              <TableCell colspan="5" class="text-center py-12">
                <div class="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 class="w-5 h-5 animate-spin" />
                  <span>Loading tags...</span>
                </div>
              </TableCell>
            </TableRow>

            <!-- 空状态 -->
            <TableRow v-else-if="tags.length === 0">
              <TableCell colspan="5" class="h-32 text-center">
                <div class="flex flex-col items-center justify-center text-slate-400">
                  <Hash class="w-12 h-12 mb-2 opacity-20" />
                  <p class="text-sm font-medium">
                    {{ searchKeyword ? 'No tags found' : 'No tags yet' }}
                  </p>
                  <p class="text-xs mt-1">
                    {{ searchKeyword ? 'Try adjusting your filters' : 'Create your first tag to get started' }}
                  </p>
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
      <DialogContent class="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{{ dialogMode === 'create' ? 'Create New Tag' : 'Edit Tag' }}</DialogTitle>
          <DialogDescription>
            {{ dialogMode === 'create' ? 'Add a new tag to organize your content' : 'Update the tag information' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label htmlFor="tag-name">
              Tag Name <span class="text-red-500">*</span>
            </Label>
            <Input
                id="tag-name"
                v-model="formData.name"
                placeholder="Enter tag name"
                maxlength="50"
                :disabled="dialogLoading"
                @keyup.enter="handleSubmit"
            />
            <p class="text-xs text-slate-500">
              {{ formData.name.length }}/50
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
              @click="dialogVisible = false"
              variant="outline"
              :disabled="dialogLoading"
          >
            Cancel
          </Button>
          <Button
              @click="handleSubmit"
              class="bg-slate-900 hover:bg-slate-800 gap-2"
              :disabled="dialogLoading"
          >
            <Loader2 v-if="dialogLoading" class="h-4 w-4 animate-spin" />
            {{ dialogMode === 'create' ? 'Create' : 'Update' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 删除确认对话框 -->
    <AlertDialog v-model:open="deleteDialogVisible">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the tag
            <span class="font-semibold text-slate-900">"{{ deleteTarget?.name }}"</span>.
            <span v-if="deleteTarget && deleteTarget.postCount > 0" class="block mt-2 text-amber-600">
                  ⚠️ This tag is used in {{ deleteTarget.postCount }} post(s).
                </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleteLoading">Cancel</AlertDialogCancel>
          <AlertDialogAction
              @click="handleDelete"
              class="bg-red-600 hover:bg-red-700 gap-2"
              :disabled="deleteLoading"
          >
            <Loader2 v-if="deleteLoading" class="h-4 w-4 animate-spin" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>