
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useSiteStore } from '@/stores/site';
import {
  getAdminPostsApi,
  deletePostApi,
  type PostSimpleResponse,
} from '@/api/post';
import { getAdminTagListApi, type TagResponse } from '@/api/tag';

// 图标
import { Plus, Search, Edit, Trash2, FileText, Loader2, Pin, Eye } from 'lucide-vue-next';

// Shadcn 组件
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// ========== 状态定义 ==========

const router = useRouter();
const siteStore = useSiteStore();

const posts = ref<PostSimpleResponse[]>([]);
const allTags = ref<TagResponse[]>([]);
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
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    toast.error('Failed to load posts');
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
const handleStatusFilterChange = (value: string | null | undefined) => {
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
const handleTagFilterChange = (value: string | null | undefined) => {
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
    toast.success('Post deleted successfully');
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
    toast.error('Failed to delete post');
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
 * 获取状态配置
 */
const getStatusConfig = (status: number) => {
  const configs = {
    0: { label: 'Draft', variant: 'secondary' as const },
    1: { label: 'Published', variant: 'default' as const },
    2: { label: 'Review', variant: 'outline' as const },
  };
  return configs[status as keyof typeof configs] || configs[0];
};

/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * 截断文本
 */
const truncateText = (text: string, maxLength: number = 60) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * 计算总页数
 */
const totalPages = computed(() => {
  return Math.ceil(pagination.value.total / pagination.value.pageSize);
});
</script>

<template>
  <div class="space-y-6">
    <!-- ========== 页面标题 ========== -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold font-serif tracking-tight text-slate-800">Posts</h2>
        <p class="text-slate-500 mt-1">Manage your blog articles and content</p>
      </div>
      <Button @click="goToCreate" class="bg-slate-900 hover:bg-slate-800 gap-2">
        <Plus class="w-4 h-4" />
        New Post
      </Button>
    </div>

    <!-- ========== 统计卡片 ========== -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card class="border-slate-200">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-600">Total Posts</CardTitle>
          <div class="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <FileText class="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-slate-900">{{ siteStore.totalPosts }}</div>
          <p class="text-xs text-slate-400 mt-1">All articles</p>
        </CardContent>
      </Card>

      <Card class="border-slate-200">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-600">Published</CardTitle>
          <div class="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <FileText class="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-slate-900">{{ siteStore.stats.publishedPostCount }}</div>
          <p class="text-xs text-slate-400 mt-1">Live on site</p>
        </CardContent>
      </Card>

      <Card class="border-slate-200">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-600">Drafts</CardTitle>
          <div class="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
            <FileText class="h-4 w-4 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-slate-900">{{ siteStore.stats.draftPostCount }}</div>
          <p class="text-xs text-slate-400 mt-1">Work in progress</p>
        </CardContent>
      </Card>
    </div>

    <!-- ========== 筛选和搜索 ========== -->
    <Card class="border-slate-200">
      <CardContent class="pt-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                  v-model="searchKeyword"
                  placeholder="Search posts by title or content..."
                  class="pl-10"
                  @keyup.enter="handleSearch"
              />
            </div>
          </div>

          <Select :model-value="statusFilter?.toString() || 'all'" @update:model-value="handleStatusFilterChange">
            <SelectTrigger class="w-full md:w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="0">Draft</SelectItem>
              <SelectItem value="1">Published</SelectItem>
              <SelectItem value="2">Review</SelectItem>
            </SelectContent>
          </Select>

          <Select :model-value="tagFilter?.toString() || 'all'" @update:model-value="handleTagFilterChange">
            <SelectTrigger class="w-full md:w-[180px]">
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              <SelectItem v-for="tag in allTags" :key="tag.id" :value="tag.id.toString()">
                {{ tag.name }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button @click="handleSearch" class="bg-slate-900 hover:bg-slate-800">
            <Search class="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- ========== 文章列表 ========== -->
    <Card class="border-slate-200">
      <CardContent class="pt-6">
        <div v-if="loading" class="flex justify-center items-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-slate-400" />
        </div>

        <div v-else-if="posts.length === 0" class="text-center py-12">
          <FileText class="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p class="text-slate-500">No posts found</p>
          <p class="text-sm text-slate-400 mt-1">Create your first post to get started</p>
        </div>

        <div v-else class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[40px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead class="hidden md:table-cell">Slug</TableHead>
                <TableHead class="hidden lg:table-cell">Tags</TableHead>
                <TableHead class="hidden xl:table-cell">Views</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="hidden lg:table-cell">Date</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="post in posts" :key="post.id">
                <TableCell>
                  <Pin v-if="post.isPinned" class="w-4 h-4 text-amber-500" />
                </TableCell>
                <TableCell class="font-medium">
                  <div class="flex flex-col">
                    <span class="text-slate-900">{{ truncateText(post.title, 50) }}</span>
                    <span v-if="post.summary" class="text-xs text-slate-400 mt-1">
                      {{ truncateText(post.summary, 60) }}
                    </span>
                  </div>
                </TableCell>
                <TableCell class="hidden md:table-cell text-slate-600 font-mono text-sm">
                  {{ post.slug }}
                </TableCell>
                <TableCell class="hidden lg:table-cell">
                  <div class="flex flex-wrap gap-1">
                    <Badge
                        v-for="tag in post.tags?.slice(0, 3)"
                        :key="tag.id"
                        variant="outline"
                        class="text-xs"
                    >
                      {{ tag.name }}
                    </Badge>
                    <Badge v-if="post.tags && post.tags.length > 3" variant="outline" class="text-xs">
                      +{{ post.tags.length - 3 }}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell class="hidden xl:table-cell">
                  <div class="flex items-center gap-1 text-slate-600">
                    <Eye class="w-3 h-3" />
                    <span class="text-sm">{{ post.views }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="getStatusConfig(post.status).variant">
                    {{ getStatusConfig(post.status).label }}
                  </Badge>
                </TableCell>
                <TableCell class="hidden lg:table-cell text-slate-600 text-sm">
                  {{ formatDate(post.createTime) }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        @click="goToEdit(post)"
                        class="hover:bg-slate-100"
                    >
                      <Edit class="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        @click="openDeleteDialog(post)"
                        class="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- 分页 -->
        <div v-if="posts.length > 0" class="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
          <div class="text-sm text-slate-600">
            Showing {{ (pagination.current - 1) * pagination.pageSize + 1 }} to
            {{ Math.min(pagination.current * pagination.pageSize, pagination.total) }} of
            {{ pagination.total }} results
          </div>
          <div class="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                :disabled="pagination.current === 1"
                @click="handlePageChange(pagination.current - 1)"
            >
              Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                :disabled="pagination.current >= totalPages"
                @click="handlePageChange(pagination.current + 1)"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- ========== 删除确认对话框 ========== -->
    <AlertDialog v-model:open="deleteDialogVisible">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the post "{{ deleteTarget?.title }}".
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleteLoading">Cancel</AlertDialogCancel>
          <AlertDialogAction
              @click="handleDelete"
              :disabled="deleteLoading"
              class="bg-red-600 hover:bg-red-700"
          >
            <Loader2 v-if="deleteLoading" class="w-4 h-4 mr-2 animate-spin" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>