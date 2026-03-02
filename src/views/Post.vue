<!-- Post.vue - 文章管理页面 -->

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import i18n from '@/i18n';
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

import { Plus, Search, Edit, Trash2, FileText, Loader2, Pin, Eye, Calendar, Globe, FileEdit } from 'lucide-vue-next';

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

const router = useRouter();
const siteStore = useSiteStore();
const { t } = useI18n();

/**
 *  文章列表数据
 */
const posts = ref<PostSimpleResponse[]>([]);
/**
 * 所有标签（用于筛选下拉）
 */
const allTags = ref<TagResponse[]>([]);
const { sortedData: sortedPosts, toggleSort, getSortOrder, resetSort } = useTableSort(posts);
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
 * 标签筛选值
 */
const tagFilter = ref<number | undefined>(undefined);

/**
 *  分页状态
 */
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

/**
 *  删除确认对话框
 */
const deleteDialogVisible = ref(false);
const deleteTarget = ref<PostSimpleResponse | null>(null);
const deleteLoading = ref(false);


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


/**
 * 获取文章列表。
 * 根据当前分页、搜索关键词、状态和标签筛选条件请求文章数据。
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
    toast.error(t('post.loadFailed'));
  } finally {
    loading.value = false;
  }
};

/**
 * 获取标签列表。
 * 加载所有标签供筛选下拉使用。
 */
const fetchTags = async () => {
  try {
    allTags.value = await getAdminTagListApi();
  } catch (error) {
    console.error('Failed to fetch tags:', error);
  }
};

/**
 * 搜索处理。
 * 重置页码到第一页并重新请求文章列表。
 */
const handleSearch = () => {
  pagination.value.current = 1;
  fetchPosts();
};

/**
 * 状态筛选变化。
 * 将选中值转换为数字状态码，重置页码并刷新列表。
 *
 * @param value 选中的筛选值，'all' 表示全部
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
 * 标签筛选变化。
 * 将选中值转换为标签 ID，重置页码并刷新列表。
 *
 * @param value 选中的筛选值，'all' 表示全部
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
 * 确认删除文章。
 * 删除成功后自动处理末页空数据回退，并刷新列表和统计。
 */
const handleDelete = async () => {
  if (!deleteTarget.value) return;

  deleteLoading.value = true;

  try {
    await deletePostApi(deleteTarget.value.id);
    toast.success(t('post.deleteSuccess'));
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
    toast.error(t('post.deleteFailed'));
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
  fetchPosts();
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
  fetchPosts();
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
 * @param maxLength 最大字符数，默认 60
 */
const truncateText = (text: string, maxLength: number = 60) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <PageHeader :title="t('post.title')" :description="t('post.description')">
      <template #actions>
        <Button @click="goToCreate" class="bg-slate-900 hover:bg-slate-800 gap-2">
          <Plus class="w-4 h-4" />
          {{ t('post.newPost') }}
        </Button>
      </template>
    </PageHeader>

    <!-- 统计卡片（2列 → md 3列，gap 响应式 3 → sm 4） -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
      <StatsCard
          class="col-span-2 md:col-span-1"
          :title="t('statsCard.totalPosts')"
          :value="siteStore.totalPosts"
          :description="t('statsCard.allArticles')"
          :icon="FileText"
          icon-bg-class="bg-blue-50"
          icon-class="text-blue-600"
      />
      <StatsCard
          :title="t('statsCard.published')"
          :value="siteStore.stats.publishedPostCount"
          :description="t('statsCard.liveOnSite')"
          :icon="FileText"
          icon-bg-class="bg-teal-50"
          icon-class="text-teal-600"
      />
      <StatsCard
          :title="t('statsCard.drafts')"
          :value="siteStore.stats.draftPostCount"
          :description="t('statsCard.workInProgress')"
          :icon="FileText"
          icon-bg-class="bg-slate-50"
          icon-class="text-slate-600"
      />
    </div>

    <!-- 文章列表 -->
    <Card class="overflow-hidden">
      <CardHeader class="border-b border-slate-100 py-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle class="text-lg font-bold text-slate-800">{{ t('post.allPosts') }}</CardTitle>
            <CardDescription class="mt-1">{{ t('post.description') }}</CardDescription>
          </div>
          <!-- 筛选和搜索工具栏（< sm 纵向堆叠 / >= sm 水平排列） -->
          <div class="flex flex-wrap items-center gap-2 sm:gap-3">
            <!-- 状态筛选 -->
            <Select @update:model-value="handleStatusFilterChange">
              <SelectTrigger class="w-35 h-9 bg-slate-50 border-slate-200">
                <SelectValue :placeholder="t('post.allStatus')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{{ t('post.allStatus') }}</SelectItem>
                <SelectItem value="0">{{ t('status.draft') }}</SelectItem>
                <SelectItem value="1">{{ t('status.published') }}</SelectItem>
              </SelectContent>
            </Select>

            <!-- 标签筛选 -->
            <Select @update:model-value="handleTagFilterChange">
              <SelectTrigger class="w-35 h-9 bg-slate-50 border-slate-200">
                <SelectValue :placeholder="t('post.allTags')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{{ t('post.allTags') }}</SelectItem>
                <SelectItem v-for="tag in allTags" :key="tag.id" :value="tag.id.toString()">
                  {{ tag.name }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- 搜索框（< sm 全宽 / >= sm 固定 w-64） -->
            <div class="relative w-full sm:w-64">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                  v-model="searchKeyword"
                  :placeholder="t('post.searchPlaceholder')"
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
              <TableHead class="w-[35%]">{{ t('table.title') }}</TableHead>
              <TableHead>{{ t('table.tags') }}</TableHead>
              <SortableHead :sort-order="getSortOrder('views')" @sort="toggleSort('views')">{{ t('table.views') }}</SortableHead>
              <SortableHead :sort-order="getSortOrder('status')" @sort="toggleSort('status')">{{ t('table.status') }}</SortableHead>
              <SortableHead :sort-order="getSortOrder('createTime')" @sort="toggleSort('createTime')">{{ t('table.createdAt') }}</SortableHead>
              <TableHead class="text-right pr-4 sm:pr-6">{{ t('table.actions') }}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <!-- 加载状态 -->
            <TableRow v-if="loading">
              <TableCell colspan="7" class="text-center py-12">
                <div class="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 class="w-5 h-5 animate-spin" />
                  <span>{{ t('post.loadingPosts') }}</span>
                </div>
              </TableCell>
            </TableRow>

            <!-- 空状态 -->
            <TableRow v-else-if="posts.length === 0">
              <TableCell colspan="7" class="h-32 text-center">
                <div class="flex flex-col items-center justify-center text-slate-400">
                  <FileText class="w-12 h-12 mb-2 opacity-20" />
                  <p class="text-sm font-medium">
                    {{ searchKeyword || statusFilter !== undefined ? t('post.noPostsFound') : t('post.noPostsYet') }}
                  </p>
                  <p class="text-xs mt-1">
                    {{ searchKeyword || statusFilter !== undefined ? t('post.tryAdjustingFilters') : t('post.createFirstPost') }}
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
              <TableCell class="font-mono text-xs text-slate-500 pl-4 sm:pl-6 relative">
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
                        <div class="text-xs font-medium text-slate-500 mb-2">{{ t('table.allTags') }}</div>
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
              <TableCell class="text-right pr-4 sm:pr-6">
                <div class="flex items-center justify-end gap-2">
                  <Button
                      @click="goToEdit(post)"
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      :title="t('common.edit')"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  <Button
                      @click="openDeleteDialog(post)"
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

    <!-- 删除确认对话框 -->
    <AlertDialog v-model:open="deleteDialogVisible">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('post.deleteConfirmTitle') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('post.deleteConfirmDesc') }}
            <span v-if="deleteTarget" class="font-semibold text-slate-700">
              "{{ truncateText(deleteTarget.title, 50) }}"
            </span>.
            {{ t('post.deleteCannotUndo') }}
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
