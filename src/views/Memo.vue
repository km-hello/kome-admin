<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { useSiteStore } from '@/stores/site';
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

// 图标
import { Plus, Search, Edit, Trash2, Activity, Loader2, Pin, Calendar, Globe, FileEdit } from 'lucide-vue-next';

// Shadcn 组件
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

// ========== 状态定义 ==========

// 使用站点统计 Store
const siteStore = useSiteStore();

const memos = ref<MemoResponse[]>([]);
const loading = ref(true);
const searchKeyword = ref('');
const statusFilter = ref<number | undefined>(undefined);

// 分页状态
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 对话框状态
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const dialogLoading = ref(false);

// 表单数据
const formData = ref({
  id: 0,
  content: '',
  isPinned: false,
  status: 0,
});

// 删除确认对话框
const deleteDialogVisible = ref(false);
const deleteTarget = ref<MemoResponse | null>(null);
const deleteLoading = ref(false);

// ========== 生命周期 ==========

onMounted(async () => {
  try {
    // 并行请求统计数据和备忘录列表
    await Promise.all([
      siteStore.fetchStats(),
      fetchMemos(),
    ]);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
});

// ========== 方法 ==========

/**
 * 获取备忘录列表
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
  } catch (error) {
    console.error('Failed to fetch memos:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索处理
 */
const handleSearch = () => {
  pagination.value.current = 1;
  fetchMemos();
};

/**
 * 状态筛选变化
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
    toast.warning('请输入Memo内容');
    return false;
  }

  if (formData.value.content.length > 2147483647) {
    toast.warning('Memo内容过长');
    return false;
  }

  return true;
};

/**
 * 提交表单
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
      toast.success('Memo创建成功');
    } else {
      const request: MemoUpdateRequest = {
        content: formData.value.content.trim(),
        isPinned: formData.value.isPinned,
        status: formData.value.status,
      };
      await updateMemoApi(formData.value.id, request);
      toast.success('Memo更新成功');
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
 * 确认删除
 */
const handleDelete = async () => {
  if (!deleteTarget.value) return;

  deleteLoading.value = true;

  try {
    await deleteMemoApi(deleteTarget.value.id);
    toast.success('Memo删除成功');
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
 * 分页变化
 */
const handlePageChange = (page: number) => {
  pagination.value.current = page;
  fetchMemos();
};

/**
 * 每页数量变化
 */
const handlePageSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.current = 1;
  fetchMemos();
};

/**
 * 获取状态配置
 */
const getStatusConfig = (status: number) => {
  const configs = {
    0: { label: 'Draft', icon: FileEdit, class: 'text-slate-400' },
    1: { label: 'Published', icon: Globe, class: 'text-slate-600' },
  };
  return configs[status as keyof typeof configs] || configs[0];
};

/**
 * 格式化日期
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

/**
 * 截断文本
 */
const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
</script>

<template>
  <div class="space-y-6">
    <!-- ========== 页面标题 ========== -->
    <PageHeader title="Memos" description="Manage your quick thoughts and notes">
      <template #actions>
        <Button @click="openCreateDialog" class="bg-slate-900 hover:bg-slate-800 gap-2">
          <Plus class="w-4 h-4" />
          New Memo
        </Button>
      </template>
    </PageHeader>

    <!-- ========== 统计卡片 ========== -->
    <div class="grid gap-4 md:grid-cols-3">
      <StatsCard
          title="Total Memos"
          :value="siteStore.totalMemos"
          description="Total quick notes"
          :icon="Activity"
          icon-bg-class="bg-amber-50"
          icon-class="text-amber-600"
      />
      <StatsCard
          title="Published"
          :value="siteStore.stats.publishedMemoCount"
          description="Visible to public"
          :icon="Activity"
          icon-bg-class="bg-teal-50"
          icon-class="text-teal-600"
      />
      <StatsCard
          title="Draft"
          :value="siteStore.stats.draftMemoCount"
          description="Private notes"
          :icon="Activity"
          icon-bg-class="bg-slate-50"
          icon-class="text-slate-600"
      />
    </div>

    <!-- ========== 备忘录列表 ========== -->
    <Card class="border-slate-200 shadow-sm">
      <CardHeader class="border-b border-slate-100 py-4">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-lg font-bold text-slate-800">All Memos</CardTitle>
            <CardDescription class="mt-1">Manage your quick thoughts and notes</CardDescription>
          </div>
          <div class="flex items-center gap-3">
            <!-- 状态筛选 -->
            <Select @update:model-value="(value) => handleStatusFilterChange(value as string)">
              <SelectTrigger class="w-35 h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="1">Published</SelectItem>
                <SelectItem value="0">Draft</SelectItem>
              </SelectContent>
            </Select>

            <!-- 搜索框 -->
            <div class="relative w-64">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                  v-model="searchKeyword"
                  placeholder="Search memos..."
                  class="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  @keyup.enter="handleSearch"
              />
            </div>
            <Button @click="handleSearch" variant="outline" size="sm" class="h-9">
              Search
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-transparent border-slate-100">
              <TableHead class="w-15 pl-6">ID</TableHead>
              <TableHead class="w-[50%]">Content</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead class="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <!-- 加载状态 -->
            <TableRow v-if="loading">
              <TableCell colspan="5" class="text-center py-12">
                <div class="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 class="w-5 h-5 animate-spin" />
                  <span>Loading memos...</span>
                </div>
              </TableCell>
            </TableRow>

            <!-- 空状态 -->
            <TableRow v-else-if="memos.length === 0">
              <TableCell colspan="5" class="h-32 text-center">
                <div class="flex flex-col items-center justify-center text-slate-400">
                  <Activity class="w-12 h-12 mb-2 opacity-20" />
                  <p class="text-sm font-medium">
                    {{ searchKeyword || statusFilter !== undefined ? 'No memos found' : 'No memos yet' }}
                  </p>
                  <p class="text-xs mt-1">
                    {{ searchKeyword || statusFilter !== undefined ? 'Try adjusting your filters' : 'Create your first memo to get started' }}
                  </p>
                </div>
              </TableCell>
            </TableRow>

            <!-- 备忘录列表 -->
            <TableRow
                v-for="memo in memos"
                :key="memo.id"
                class="transition-colors border-slate-100 group"
                :class="[
                    memo.isPinned ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/50'
                  ]"
            >
              <!-- ID 列 -->
              <TableCell class="font-mono text-xs text-slate-500 pl-6 relative">
                <div class="flex items-center">
                  <span class="mr-1">#{{ memo.id }}</span>
                  <Pin v-if="memo.isPinned" class="w-3 h-3 text-amber-500 opacity-70" />
                </div>
              </TableCell>

              <!-- 内容列 -->
              <TableCell>
                <div class="flex items-start gap-2">
                  <p class="text-sm text-slate-700 line-clamp-2" :title="memo.content">
                    {{ truncateText(memo.content, 150) }}
                  </p>
                </div>
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
              <TableCell class="text-right pr-6">
                <div class="flex items-center justify-end gap-2">
                  <Button
                      @click="openEditDialog(memo)"
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      title="Edit"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  <Button
                      @click="openDeleteDialog(memo)"
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
          </TableBody>
        </Table>

        <!-- 分页 -->
        <div class="border-t border-slate-100 px-6 py-4">
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

    <!-- ========== 创建/编辑对话框 ========== -->
    <Dialog v-model:open="dialogVisible">
      <DialogContent class="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>
            {{ dialogMode === 'create' ? 'Create New Memo' : 'Edit Memo' }}
          </DialogTitle>
          <DialogDescription>
            {{ dialogMode === 'create' ? 'Add a new quick note or thought' : 'Update your memo content and settings' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- 内容输入 -->
          <div class="space-y-2">
            <Label for="content">
              Content <span class="text-red-500">*</span>
            </Label>
            <Textarea
                id="content"
                v-model="formData.content"
                placeholder="Write your memo here... (Markdown supported)"
                class="min-h-50 resize-none"
                :disabled="dialogLoading"
            />
            <p class="text-xs text-slate-400">{{ formData.content.length }} characters</p>
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
              Pin to top <span class="text-red-500">*</span>
            </Label>
          </div>

          <!-- 状态选择 -->
          <div class="space-y-2">
            <Label for="status">
              Status <span class="text-red-500">*</span>
            </Label>
            <Select
                v-model="formData.status"
                :disabled="dialogLoading"
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="1">Published</SelectItem>
                <SelectItem :value="0">Draft</SelectItem>
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
            Cancel
          </Button>
          <Button
              @click="handleSubmit"
              :disabled="dialogLoading"
              class="gap-2"
          >
            <Loader2 v-if="dialogLoading" class="w-4 h-4 animate-spin" />
            {{ dialogMode === 'create' ? 'Create' : 'Update' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ========== 删除确认对话框 ========== -->
    <AlertDialog v-model:open="deleteDialogVisible">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the memo
            <span v-if="deleteTarget" class="font-semibold text-slate-700">
                  "{{ truncateText(deleteTarget.content, 50) }}"
                </span>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleteLoading">Cancel</AlertDialogCancel>
          <AlertDialogAction
              @click="handleDelete"
              :disabled="deleteLoading"
              class="bg-red-600 hover:bg-red-700 gap-2"
          >
            <Loader2 v-if="deleteLoading" class="w-4 h-4 animate-spin" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>