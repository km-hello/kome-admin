<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { useSiteStore } from '@/stores/site';
import {
  getAdminTagsApi,
  createTagApi,
  updateTagApi,
  deleteTagApi,
  type TagPostCountResponse,
  type TagCreateRequest,
  type TagUpdateRequest,
} from '@/api/tag';

// 图标
import { Plus, Search, Edit, Trash2, Hash, FileText, Loader2, Calendar } from 'lucide-vue-next';

// 通用组件
import PageHeader from '@/components/common/PageHeader.vue';
import StatsCard from '@/components/common/StatsCard.vue';
import Pagination from '@/components/common/Pagination.vue';

// Shadcn 组件
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

// ========== 状态定义 ==========

// 使用站点统计 Store
const siteStore = useSiteStore();

const tags = ref<TagPostCountResponse[]>([]);
const loading = ref(true);
const searchKeyword = ref('');

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
  name: '',
});

// 删除确认对话框
const deleteDialogVisible = ref(false);
const deleteTarget = ref<TagPostCountResponse | null>(null);
const deleteLoading = ref(false);

// ========== 生命周期 ==========

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

// ========== 方法 ==========

/**
 * 获取标签列表
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
  } catch (error) {
    console.error('Failed to fetch tags:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索处理
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
 * 提交表单
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
 * 确认删除
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
 * 分页变化
 */
const handlePageChange = (page: number) => {
  pagination.value.current = page;
  fetchTags();
};

/**
 * 每页数量变化
 */
const handlePageSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.current = 1; // 重置到第一页
  fetchTags();
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
</script>

<template>
  <div class="space-y-6">
    <!-- ========== 页面标题 ========== -->
    <PageHeader title="Tags" description="Manage and organize your content tags">
      <template #actions>
        <Button @click="openCreateDialog" class="bg-slate-900 hover:bg-slate-800 gap-2">
          <Plus class="w-4 h-4" />
          New Tag
        </Button>
      </template>
    </PageHeader>

    <!-- ========== 统计卡片 ========== -->
    <div class="grid gap-4 md:grid-cols-3">
      <StatsCard
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

    <!-- ========== 标签列表 ========== -->
    <Card class="border-slate-200 shadow-sm">
      <CardHeader class="border-b border-slate-100 py-4">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-lg font-bold text-slate-800">All Tags</CardTitle>
            <CardDescription class="mt-1">Manage and organize your content tags</CardDescription>
          </div>
          <div class="flex items-center gap-3">
            <!-- 搜索框 -->
            <div class="relative w-64">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                  v-model="searchKeyword"
                  placeholder="Search tags..."
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
              <TableHead class="w-16 pl-6">ID</TableHead>
              <TableHead class="w-[30%]">Tag Name</TableHead>
              <TableHead>Post Count</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead class="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <!-- 标签列表 -->
            <TableRow
                v-for="tag in tags"
                :key="tag.id"
                class="hover:bg-slate-50/50 transition-colors border-slate-100"
            >
              <!-- ID 列 -->
              <TableCell class="font-mono text-xs text-slate-500 pl-6">
                #{{ tag.id }}
              </TableCell>

              <!-- 标签名称列 -->
              <TableCell>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Hash class="w-4 h-4 text-slate-600" />
                  </div>
                  <span class="font-semibold text-slate-900">{{ tag.name }}</span>
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
              <TableCell class="text-right pr-6">
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

            <!-- 空状态 -->
            <TableRow v-if="!loading && tags.length === 0">
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

            <!-- 加载状态 -->
            <TableRow v-if="loading">
              <TableCell colspan="5" class="h-32 text-center">
                <div class="flex items-center justify-center">
                  <Loader2 class="w-8 h-8 animate-spin text-slate-400" />
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>

      <!-- 分页 -->
      <div class="border-t border-slate-100 px-6 py-4">
        <Pagination
            :current="pagination.current"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            item-name="tags"
            @change="handlePageChange"
            @page-size-change="handlePageSizeChange"
        />
      </div>
    </Card>

    <!-- ========== 创建/编辑对话框 ========== -->
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
              class="bg-slate-900 hover:bg-slate-800"
              :disabled="dialogLoading"
          >
            <Loader2 v-if="dialogLoading" class="mr-2 h-4 w-4 animate-spin" />
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
              class="bg-red-600 hover:bg-red-700"
              :disabled="deleteLoading"
          >
            <Loader2 v-if="deleteLoading" class="mr-2 h-4 w-4 animate-spin" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>