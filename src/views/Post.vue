
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useSiteStore } from '@/stores/site';
import { useTableSort } from '@/composables/useTableSort';
import {
  getAdminPostsApi,
  deletePostApi,
  type PostSimpleResponse,
} from '@/api/post';
import { getAdminTagListApi, type TagResponse } from '@/api/tag';
import Pagination from '@/components/common/Pagination.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatsCard from '@/components/common/StatsCard.vue';
import SortableHead from '@/components/common/SortableHead.vue';

// 图标
import { Plus, Search, Edit, Trash2, FileText, Loader2, Pin, Eye, Calendar, Globe, FileEdit } from 'lucide-vue-next';

// Shadcn 组件
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type {AcceptableValue} from "reka-ui";

// ========== 状态定义 ==========

const router = useRouter();
const siteStore = useSiteStore();

const posts = ref<PostSimpleResponse[]>([]);
const allTags = ref<TagResponse[]>([]);
const { sortedData: sortedPosts, toggleSort, getSortOrder, resetSort } = useTableSort(posts);
const loading = ref(true);
const searchKeyword = ref('');
const statusFilter = ref<number | undefined>(undefined);
const tagFilter = ref<number | undefined>(undefined);

// 分页状态
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 删除确认对话框
const deleteDialogVisible = ref(false);
const deleteTarget = ref<PostSimpleResponse | null>(null);
const deleteLoading = ref(false);

// ========== 生命周期 ==========

onMounted(async () => {
  try {
    await Promise.all([
      siteStore.fetchStats(),
      fetchPosts(),
      fetchTags(),
    ]);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
});

// ========== 方法 ==========

/**
 * 获取文章列表
 */
const fetchPosts = async () => {
  loading.value = true;
  try {
    const data = await getAdminPostsApi({
      pageNum: pagination.value.current,
      pageSize: pagination.value.pageSize,
      keyword: searchKeyword.value || undefined,
      status: statusFilter.value,
      tagId: tagFilter.value,
    });

    posts.value = data.records;
    pagination.value.total = data.total;
    resetSort();
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    toast.error('加载文章列表失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 获取标签列表
 */
const fetchTags = async () => {
  try {
    allTags.value = await getAdminTagListApi();
  } catch (error) {
    console.error('Failed to fetch tags:', error);
  }
};

/**
 * 搜索处理
 */
const handleSearch = () => {
  pagination.value.current = 1;
  fetchPosts();
};

/**
 * 状态筛选变化
 */
const handleStatusFilterChange = (value: AcceptableValue) => {
  if (!value || value === 'all') {
    statusFilter.value = undefined;
  } else {
    statusFilter.value = Number(value);
  }
  pagination.value.current = 1;
  fetchPosts();
};

/**
 * 标签筛选变化
 */
const handleTagFilterChange = (value: AcceptableValue) => {
  if (!value || value === 'all') {
    tagFilter.value = undefined;
  } else {
    tagFilter.value = Number(value);
  }
  pagination.value.current = 1;
  fetchPosts();
};

/**
 * 跳转到新建页面
 */
const goToCreate = () => {
  router.push('/posts/new');
};

/**
 * 跳转到编辑页面
 */
const goToEdit = (post: PostSimpleResponse) => {
  router.push(`/posts/edit/${post.id}`);
};

/**
 * 打开删除确认对话框
 */
const openDeleteDialog = (post: PostSimpleResponse) => {
  deleteTarget.value = post;
  deleteDialogVisible.value = true;
};

/**
 * 确认删除
 */
const handleDelete = async () => {
  if (!deleteTarget.value) return;

  deleteLoading.value = true;

  try {
    await deletePostApi(deleteTarget.value.id);
    toast.success('文章删除成功');
    deleteDialogVisible.value = false;

    if (posts.value.length === 1 && pagination.value.current > 1) {
      pagination.value.current--;
    }

    await Promise.all([
      fetchPosts(),
      siteStore.refreshStats(),
    ]);
  } catch (error) {
    console.error('Failed to delete post:', error);
    toast.error('删除文章失败');
  } finally {
    deleteLoading.value = false;
  }
};

/**
 * 分页变化
 */
const handlePageChange = (page: number) => {
  pagination.value.current = page;
  fetchPosts();
};

/**
 * 每页数量变化
 */
const handlePageSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.current = 1;
  fetchPosts();
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
const truncateText = (text: string, maxLength: number = 60) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

</script>

<template>
  <div class="space-y-6">
    <!-- ========== 页面标题 ========== -->
    <PageHeader title="Posts" description="Manage your blog articles and content">
      <template #actions>
        <Button @click="goToCreate" class="bg-slate-900 hover:bg-slate-800 gap-2">
          <Plus class="w-4 h-4" />
          New Post
        </Button>
      </template>
    </PageHeader>

    <!-- ========== 统计卡片 ========== -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
      <StatsCard
          class="col-span-2 md:col-span-1"
          title="Total Posts"
          :value="siteStore.totalPosts"
          description="All articles"
          :icon="FileText"
          icon-bg-class="bg-blue-50"
          icon-class="text-blue-600"
      />
      <StatsCard
          title="Published"
          :value="siteStore.stats.publishedPostCount"
          description="Live on site"
          :icon="FileText"
          icon-bg-class="bg-teal-50"
          icon-class="text-teal-600"
      />
      <StatsCard
          title="Drafts"
          :value="siteStore.stats.draftPostCount"
          description="Work in progress"
          :icon="FileText"
          icon-bg-class="bg-slate-50"
          icon-class="text-slate-600"
      />
    </div>

    <!-- ========== 文章列表 ========== -->
    <Card class="overflow-hidden">
      <CardHeader class="border-b border-slate-100 py-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle class="text-lg font-bold text-slate-800">All Posts</CardTitle>
            <CardDescription class="mt-1">Manage your blog articles and content</CardDescription>
          </div>
          <div class="flex flex-wrap items-center gap-2 sm:gap-3">
            <!-- 状态筛选 -->
            <Select @update:model-value="handleStatusFilterChange">
              <SelectTrigger class="w-35 h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="0">Draft</SelectItem>
                <SelectItem value="1">Published</SelectItem>
              </SelectContent>
            </Select>

            <!-- 标签筛选 -->
            <Select @update:model-value="handleTagFilterChange">
              <SelectTrigger class="w-35 h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                <SelectItem v-for="tag in allTags" :key="tag.id" :value="tag.id.toString()">
                  {{ tag.name }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- 搜索框 -->
            <div class="relative w-full sm:w-64">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                  v-model="searchKeyword"
                  placeholder="Search posts..."
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
              <SortableHead class="w-15 pl-6" :sort-order="getSortOrder('id')" @sort="toggleSort('id')">ID</SortableHead>
              <TableHead class="w-[35%]">Title</TableHead>
              <TableHead>Tags</TableHead>
              <SortableHead :sort-order="getSortOrder('views')" @sort="toggleSort('views')">Views</SortableHead>
              <SortableHead :sort-order="getSortOrder('status')" @sort="toggleSort('status')">Status</SortableHead>
              <SortableHead :sort-order="getSortOrder('createTime')" @sort="toggleSort('createTime')">Created At</SortableHead>
              <TableHead class="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <!-- 加载状态 -->
            <TableRow v-if="loading">
              <TableCell colspan="7" class="text-center py-12">
                <div class="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 class="w-5 h-5 animate-spin" />
                  <span>Loading posts...</span>
                </div>
              </TableCell>
            </TableRow>

            <!-- 空状态 -->
            <TableRow v-else-if="posts.length === 0">
              <TableCell colspan="7" class="h-32 text-center">
                <div class="flex flex-col items-center justify-center text-slate-400">
                  <FileText class="w-12 h-12 mb-2 opacity-20" />
                  <p class="text-sm font-medium">
                    {{ searchKeyword || statusFilter !== undefined ? 'No posts found' : 'No posts yet' }}
                  </p>
                  <p class="text-xs mt-1">
                    {{ searchKeyword || statusFilter !== undefined ? 'Try adjusting your filters' : 'Create your first post to get started' }}
                  </p>
                </div>
              </TableCell>
            </TableRow>

            <!-- 文章列表 -->
            <TableRow
                v-for="post in sortedPosts"
                :key="post.id"
                class="transition-colors border-slate-100 group"
                :class="[
                  post.isPinned ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/50'
                ]"
            >
              <!-- ID 列 -->
              <TableCell class="font-mono text-xs text-slate-500 pl-6 relative">
                <div class="flex items-center">
                  <span class="mr-1">#{{ post.id }}</span>
                  <Pin v-if="post.isPinned" class="w-3 h-3 text-amber-500 opacity-70" />
                </div>
              </TableCell>

              <!-- 标题和 Slug 融合列 -->
              <TableCell>
                <div class="flex flex-col gap-1">
                  <span class="block font-semibold text-slate-900 truncate" :title="post.title">
                    {{ post.title }}
                  </span>
                  <span class="block text-xs text-slate-400 font-mono truncate" :title="post.slug">
                    /{{ post.slug }}
                  </span>
                </div>
              </TableCell>

              <!-- 标签列 -->
              <TableCell>
                <div class="flex flex-wrap items-center gap-1">
                  <template v-if="post.tags && post.tags.length > 0">
                    <Badge
                        v-for="tag in post.tags.slice(0, 3)"
                        :key="tag.id"
                        variant="outline"
                        class="text-xs"
                    >
                      {{ tag.name }}
                    </Badge>
                    <!-- 超过3个标签时显示 Popover -->
                    <Popover v-if="post.tags.length > 3">
                      <PopoverTrigger as-child>
                        <Badge
                            variant="outline"
                            class="text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          +{{ post.tags.length - 3 }}
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent class="w-auto p-3" align="start">
                        <div class="text-xs font-medium text-slate-500 mb-2">All Tags</div>
                        <div class="flex flex-wrap gap-1 max-w-50">
                          <Badge
                              v-for="tag in post.tags"
                              :key="tag.id"
                              variant="outline"
                              class="text-xs"
                          >
                            {{ tag.name }}
                          </Badge>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </template>
                  <span v-else class="text-xs text-slate-400">-</span>
                </div>
              </TableCell>

              <!-- 浏览量列 -->
              <TableCell>
                <div class="flex items-center gap-1.5 text-xs text-slate-500">
                  <Eye class="w-3 h-3" />
                  <span>{{ post.views }}</span>
                </div>
              </TableCell>

              <!-- 状态列 -->
              <TableCell>
                <div
                    class="inline-flex items-center gap-1.5 text-xs"
                    :class="getStatusConfig(post.status).class"
                >
                  <component :is="getStatusConfig(post.status).icon" class="w-3 h-3" />
                  {{ getStatusConfig(post.status).label }}
                </div>
              </TableCell>

              <!-- 创建时间列 -->
              <TableCell>
                <div class="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(post.createTime) }}
                </div>
              </TableCell>

              <!-- 操作列 -->
              <TableCell class="text-right pr-6">
                <div class="flex items-center justify-end gap-2">
                  <Button
                      @click="goToEdit(post)"
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      title="Edit"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  <Button
                      @click="openDeleteDialog(post)"
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

    <!-- ========== 删除确认对话框 ========== -->
    <AlertDialog v-model:open="deleteDialogVisible">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the post
            <span v-if="deleteTarget" class="font-semibold text-slate-700">
              "{{ truncateText(deleteTarget.title, 50) }}"
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