<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { useSiteStore } from '@/stores/site';
import {
  getAdminLinksApi,
  createLinkApi,
  updateLinkApi,
  deleteLinkApi,
  type LinkResponse,
  type LinkCreateRequest,
  type LinkUpdateRequest,
} from '@/api/link';

import Pagination from '@/components/Pagination.vue';

// 图标
import { Plus, Search, Edit, Trash2, Link as LinkIcon, ExternalLink, Image, Loader2, Globe, Calendar, FileEdit } from 'lucide-vue-next';

// Shadcn 组件
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

const links = ref<LinkResponse[]>([]);
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
  name: '',
  url: '',
  avatar: '',
  description: '',
  status: 1,
});

// 删除确认对话框
const deleteDialogVisible = ref(false);
const deleteTarget = ref<LinkResponse | null>(null);
const deleteLoading = ref(false);

// ========== 生命周期 ==========

onMounted(async () => {
  try {
    // 并行请求统计数据和友链列表
    await Promise.all([
      siteStore.fetchStats(),
      fetchLinks(),
    ]);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
});

// ========== 方法 ==========

/**
 * 获取友链列表
 */
const fetchLinks = async () => {
  loading.value = true;
  try {
    const data = await getAdminLinksApi({
      pageNum: pagination.value.current,
      pageSize: pagination.value.pageSize,
      keyword: searchKeyword.value || undefined,
      status: statusFilter.value,
    });

    links.value = data.records;
    pagination.value.total = data.total;
  } catch (error) {
    console.error('Failed to fetch links:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索处理
 */
const handleSearch = () => {
  pagination.value.current = 1;
  fetchLinks();
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
  fetchLinks();
};

/**
 * 打开创建对话框
 */
const openCreateDialog = () => {
  dialogMode.value = 'create';
  formData.value = {
    id: 0,
    name: '',
    url: '',
    avatar: '',
    description: '',
    status: 1,
  };
  dialogVisible.value = true;
};

/**
 * 打开编辑对话框
 */
const openEditDialog = (link: LinkResponse) => {
  dialogMode.value = 'edit';
  formData.value = {
    id: link.id,
    name: link.name,
    url: link.url,
    avatar: link.avatar || '',
    description: link.description || '',
    status: link.status,
  };
  dialogVisible.value = true;
};

/**
 * 表单验证
 */
const validateForm = (): boolean => {
  if (!formData.value.name.trim()) {
    toast.warning('请输入友链名称');
    return false;
  }

  if (formData.value.name.length > 100) {
    toast.warning('友链名称不能超过 100 个字符');
    return false;
  }

  if (!formData.value.url.trim()) {
    toast.warning('请输入友链地址');
    return false;
  }

  if (formData.value.url.length > 255) {
    toast.warning('友链地址不能超过 255 个字符');
    return false;
  }

  // 简单的 URL 格式验证
  try {
    new URL(formData.value.url);
  } catch {
    toast.warning('请输入有效的 URL 地址');
    return false;
  }

  if (formData.value.avatar && formData.value.avatar.length > 255) {
    toast.warning('头像地址不能超过 255 个字符');
    return false;
  }

  if (formData.value.description && formData.value.description.length > 255) {
    toast.warning('描述不能超过 255 个字符');
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
      const request: LinkCreateRequest = {
        name: formData.value.name.trim(),
        url: formData.value.url.trim(),
        avatar: formData.value.avatar.trim() || undefined,
        description: formData.value.description.trim() || undefined,
        status: formData.value.status,
      };
      await createLinkApi(request);
      toast.success('友链创建成功');
    } else {
      const request: LinkUpdateRequest = {
        name: formData.value.name.trim(),
        url: formData.value.url.trim(),
        avatar: formData.value.avatar.trim() || undefined,
        description: formData.value.description.trim() || undefined,
        status: formData.value.status,
      };
      await updateLinkApi(formData.value.id, request);
      toast.success('友链更新成功');
    }

    dialogVisible.value = false;

    // 刷新列表和统计数据
    await Promise.all([
      fetchLinks(),
      siteStore.refreshStats(), // 强制刷新统计
    ]);
  } catch (error) {
    console.error('Failed to submit link:', error);
  } finally {
    dialogLoading.value = false;
  }
};

/**
 * 打开删除确认对话框
 */
const openDeleteDialog = (link: LinkResponse) => {
  deleteTarget.value = link;
  deleteDialogVisible.value = true;
};

/**
 * 确认删除
 */
const handleDelete = async () => {
  if (!deleteTarget.value) return;

  deleteLoading.value = true;

  try {
    await deleteLinkApi(deleteTarget.value.id);
    toast.success('友链删除成功');
    deleteDialogVisible.value = false;

    // 如果当前页没有数据了，回到上一页
    if (links.value.length === 1 && pagination.value.current > 1) {
      pagination.value.current--;
    }

    // 刷新列表和统计数据
    await Promise.all([
      fetchLinks(),
      siteStore.refreshStats(), // 强制刷新统计
    ]);
  } catch (error) {
    console.error('Failed to delete link:', error);
  } finally {
    deleteLoading.value = false;
  }
};

/**
 * 分页变化
 */
const handlePageChange = (page: number) => {
  pagination.value.current = page;
  fetchLinks();
};

/**
 * 每页数量变化
 */
const handlePageSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.current = 1;
  fetchLinks();
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
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold font-serif tracking-tight text-slate-800">Friend Links</h2>
        <p class="text-slate-500 mt-1">Manage your blog's friendship links</p>
      </div>
      <Button @click="openCreateDialog" class="bg-slate-900 hover:bg-slate-800 gap-2">
        <Plus class="w-4 h-4" />
        New Link
      </Button>
    </div>

    <!-- ========== 统计卡片 ========== -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card class="border-slate-200 hover:shadow-md transition-all duration-300">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-600">Total Links</CardTitle>
          <div class="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
            <LinkIcon class="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-slate-900">{{ siteStore.totalLinks }}</div>
          <p class="text-xs text-slate-400 mt-1">Total friendship links</p>
        </CardContent>
      </Card>

      <Card class="border-slate-200 hover:shadow-md transition-all duration-300">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-600">Published</CardTitle>
          <div class="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Globe class="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-slate-900">{{ siteStore.stats.publishedLinkCount }}</div>
          <p class="text-xs text-slate-400 mt-1">Active on website</p>
        </CardContent>
      </Card>

      <Card class="border-slate-200 hover:shadow-md transition-all duration-300">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-600">Draft</CardTitle>
          <div class="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
            <LinkIcon class="h-4 w-4 text-slate-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-slate-900">{{ siteStore.stats.draftLinkCount }}</div>
          <p class="text-xs text-slate-400 mt-1">Pending links</p>
        </CardContent>
      </Card>
    </div>

    <!-- ========== 友链列表 ========== -->
    <Card class="border-slate-200 shadow-sm">
      <CardHeader class="border-b border-slate-100 py-4">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-lg font-bold text-slate-800">All Links</CardTitle>
            <CardDescription class="mt-1">Manage your friendship links</CardDescription>
          </div>
          <div class="flex items-center gap-3">
            <!-- 状态筛选 -->
            <Select @update:model-value="(value) => handleStatusFilterChange(value as string)">
              <SelectTrigger class="w-[140px] h-9 bg-slate-50 border-slate-200">
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
                  placeholder="Search links..."
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
              <TableHead class="w-[60px] pl-6">ID</TableHead>
              <TableHead class="w-[40%]">Info</TableHead>
              <TableHead class="w-[20%]">Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead class="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <!-- 友链列表 -->
            <TableRow
                v-for="link in links"
                :key="link.id"
                class="hover:bg-slate-50/50 transition-colors border-slate-100"
            >
              <!-- ID 列 -->
              <TableCell class="font-mono text-xs text-slate-500 pl-6">
                #{{ link.id }}
              </TableCell>

              <!-- 名称和URL合并列 -->
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                        v-if="link.avatar"
                        :src="link.avatar"
                        :alt="link.name"
                        class="w-full h-full object-cover"
                        @error="(e) => (e.target as HTMLImageElement).src = ''"
                    />
                    <Image v-else class="w-5 h-5 text-slate-400" />
                  </div>
                  <div class="flex flex-col">
                    <span class="font-semibold text-slate-900 truncate">{{ link.name }}</span>
                    <a
                        :href="link.url"
                        target="_blank"
                        class="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 hover:underline group"
                    >
                      <span class="truncate max-w-[250px]">{{ link.url }}</span>
                      <ExternalLink class="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>
                </div>
              </TableCell>

              <!-- 描述列 -->
              <TableCell>
                  <span class="text-sm text-slate-600 truncate block max-w-[200px]" :title="link.description">
                    {{ link.description || '-' }}
                  </span>
              </TableCell>

              <!-- 状态列 -->
              <TableCell>
                <div
                    class="inline-flex items-center gap-1.5 text-xs"
                    :class="getStatusConfig(link.status).class"
                >
                  <component :is="getStatusConfig(link.status).icon" class="w-3 h-3" />
                  {{ getStatusConfig(link.status).label }}
                </div>
              </TableCell>

              <!-- 创建时间列 -->
              <TableCell>
                <div class="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(link.createTime) }}
                </div>
              </TableCell>

              <!-- 操作列 -->
              <TableCell class="text-right pr-6">
                <div class="flex items-center justify-end gap-2">
                  <Button
                      @click="openEditDialog(link)"
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      title="Edit"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  <Button
                      @click="openDeleteDialog(link)"
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
            <TableRow v-if="!loading && links.length === 0">
              <TableCell colspan="6" class="h-32 text-center">
                <div class="flex flex-col items-center justify-center text-slate-400">
                  <LinkIcon class="w-12 h-12 mb-2 opacity-20" />
                  <p class="text-sm font-medium">
                    {{ searchKeyword || statusFilter !== undefined ? 'No links found' : 'No links yet' }}
                  </p>
                  <p class="text-xs mt-1">
                    {{ searchKeyword || statusFilter !== undefined ? 'Try adjusting your filters' : 'Create your first friendship link' }}
                  </p>
                </div>
              </TableCell>
            </TableRow>

            <!-- 加载状态 -->
            <TableRow v-if="loading">
              <TableCell colspan="6" class="h-32 text-center">
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
            item-name="links"
            @change="handlePageChange"
            @page-size-change="handlePageSizeChange"
        />
      </div>
    </Card>

    <!-- ========== 创建/编辑对话框 ========== -->
    <Dialog v-model:open="dialogVisible">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ dialogMode === 'create' ? 'Create New Link' : 'Edit Link' }}</DialogTitle>
          <DialogDescription>
            {{ dialogMode === 'create' ? 'Add a new friendship link' : 'Update the link information' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <!-- 名称 -->
          <div class="space-y-2">
            <Label htmlFor="link-name">
              Name <span class="text-red-500">*</span>
            </Label>
            <Input
                id="link-name"
                v-model="formData.name"
                placeholder="Enter link name (max 100 characters)"
                maxlength="100"
                :disabled="dialogLoading"
            />
            <p class="text-xs text-slate-500">
              {{ formData.name.length }}/100 characters
            </p>
          </div>

          <!-- URL -->
          <div class="space-y-2">
            <Label htmlFor="link-url">
              URL <span class="text-red-500">*</span>
            </Label>
            <Input
                id="link-url"
                v-model="formData.url"
                placeholder="https://example.com"
                maxlength="255"
                :disabled="dialogLoading"
            />
            <p class="text-xs text-slate-500">
              {{ formData.url.length }}/255 characters
            </p>
          </div>

          <!-- 头像 -->
          <div class="space-y-2">
            <Label htmlFor="link-avatar">Avatar URL</Label>
            <Input
                id="link-avatar"
                v-model="formData.avatar"
                placeholder="https://example.com/avatar.jpg"
                maxlength="255"
                :disabled="dialogLoading"
            />
            <p class="text-xs text-slate-500">
              {{ formData.avatar.length }}/255 characters
            </p>
          </div>

          <!-- 描述 -->
          <div class="space-y-2">
            <Label htmlFor="link-description">Description</Label>
            <Textarea
                id="link-description"
                v-model="formData.description"
                placeholder="Enter a brief description (max 255 characters)"
                maxlength="255"
                rows="3"
                :disabled="dialogLoading"
            />
            <p class="text-xs text-slate-500">
              {{ formData.description.length }}/255 characters
            </p>
          </div>

          <!-- 状态 -->
          <div class="space-y-2">
            <Label htmlFor="link-status">
              Status <span class="text-red-500">*</span>
            </Label>
            <Select v-model="formData.status" :disabled="dialogLoading">
              <SelectTrigger id="link-status">
                <SelectValue />
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
            This will permanently delete the link
            <span class="font-semibold text-slate-900">"{{ deleteTarget?.name }}"</span>.
            This action cannot be undone.
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