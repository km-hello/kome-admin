<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSiteStore } from '@/stores/site';
import { getAdminPostsApi, type PostSimpleResponse } from '@/api/post';

// 图标
import { Eye, FileText, Hash, Link as LinkIcon, Activity } from 'lucide-vue-next';

// Shadcn 组件
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// ========== 状态定义 ==========

// 使用站点统计 Store
const siteStore = useSiteStore();

// 最近文章列表
const recentPosts = ref<PostSimpleResponse[]>([]);

// 加载状态
const loading = ref(true);

// ========== 生命周期 ==========

/**
 * 组件挂载时获取数据
 */
onMounted(async () => {
  try {
    // 并行请求多个接口，提高加载速度
    await Promise.all([
      siteStore.fetchStats(), // 使用 Store 获取统计数据
      fetchRecentPosts(),
    ]);
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  } finally {
    loading.value = false;
  }
});

// ========== 方法 ==========

/**
 * 获取最近文章
 */
const fetchRecentPosts = async () => {
  const postsData = await getAdminPostsApi({ pageNum: 1, pageSize: 5 });
  recentPosts.value = postsData.records;
};

/**
 * 根据文章状态返回对应的 Badge 样式
 * @param status 文章状态 (0: Draft, 1: Published, 2: Review)
 */
const getStatusConfig = (status: number) => {
  const configs = {
    0: { label: 'Draft', variant: 'secondary' as const },
    1: { label: 'Published', variant: 'default' as const },
    2: { label: 'Review', variant: 'destructive' as const },
  };
  return configs[status as keyof typeof configs] || configs[0];
};

/**
 * 格式化日期
 * @param dateString ISO 日期字符串
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
</script>

<template>
  <div class="space-y-6">
    <!-- ========== 页面标题 ========== -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold font-serif tracking-tight text-slate-800">Dashboard</h2>
        <p class="text-slate-500 mt-1">Welcome back! Here's an overview of your blog.</p>
      </div>
      <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-xs font-medium text-emerald-700">System Online</span>
      </div>
    </div>

    <!-- ========== 统计卡片网格 ========== -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- 文章统计 -->
      <Card class="hover:shadow-md transition-all duration-300 border-slate-200 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle class="text-sm font-medium text-slate-600">Total Posts</CardTitle>
          <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText class="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent class="relative z-10">
          <div class="text-3xl font-bold text-slate-900">{{ siteStore.totalPosts }}</div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-500">Published:</span>
              <span class="text-xs font-semibold text-blue-600">{{ siteStore.stats.publishedPostCount }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-500">Draft:</span>
              <span class="text-xs font-semibold text-slate-600">{{ siteStore.stats.draftPostCount }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 标签统计 -->
      <Card class="hover:shadow-md transition-all duration-300 border-slate-200 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle class="text-sm font-medium text-slate-600">Total Tags</CardTitle>
          <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Hash class="h-5 w-5 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent class="relative z-10">
          <div class="text-3xl font-bold text-slate-900">{{ siteStore.totalTags }}</div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-500">Used:</span>
              <span class="text-xs font-semibold text-emerald-600">{{ siteStore.stats.usedTagCount }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-500">Unused:</span>
              <span class="text-xs font-semibold text-slate-600">{{ siteStore.stats.unusedTagCount }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 备忘录统计 -->
      <Card class="hover:shadow-md transition-all duration-300 border-slate-200 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle class="text-sm font-medium text-slate-600">Total Memos</CardTitle>
          <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Activity class="h-5 w-5 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent class="relative z-10">
          <div class="text-3xl font-bold text-slate-900">{{ siteStore.totalMemos }}</div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-500">Published:</span>
              <span class="text-xs font-semibold text-amber-600">{{ siteStore.stats.publishedMemoCount }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-500">Draft:</span>
              <span class="text-xs font-semibold text-slate-600">{{ siteStore.stats.draftMemoCount }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 友链统计 -->
      <Card class="hover:shadow-md transition-all duration-300 border-slate-200 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle class="text-sm font-medium text-slate-600">Friend Links</CardTitle>
          <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <LinkIcon class="h-5 w-5 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent class="relative z-10">
          <div class="text-3xl font-bold text-slate-900">{{ siteStore.totalLinks }}</div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-500">Published:</span>
              <span class="text-xs font-semibold text-purple-600">{{ siteStore.stats.publishedLinkCount }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-500">Draft:</span>
              <span class="text-xs font-semibold text-slate-600">{{ siteStore.stats.draftLinkCount }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- ========== 最近文章表格 ========== -->
    <Card class="border-slate-200 shadow-sm">
      <CardHeader class="border-b border-slate-100 py-4">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-lg font-bold text-slate-800">Recent Posts</CardTitle>
            <CardDescription class="mt-1">Your latest published and draft articles</CardDescription>
          </div>
          <a
              href="#"
              class="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            View All →
          </a>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-transparent border-slate-100">
              <TableHead class="w-[40%] pl-6">Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead class="text-right pr-6">Created At</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <!-- 文章列表 -->
            <TableRow
                v-for="post in recentPosts"
                :key="post.id"
                class="hover:bg-slate-50/50 transition-colors border-slate-100"
            >
              <!-- 标题列 -->
              <TableCell class="font-medium pl-6">
                <div class="space-y-1">
                  <div class="font-semibold text-slate-900 truncate max-w-[300px]">
                    {{ post.title }}
                  </div>
                  <div class="text-xs text-slate-500 truncate max-w-[300px]">
                    {{ post.summary || 'No summary available' }}
                  </div>
                </div>
              </TableCell>

              <!-- 状态列 -->
              <TableCell>
                <Badge :variant="getStatusConfig(post.status).variant">
                  {{ getStatusConfig(post.status).label }}
                </Badge>
              </TableCell>

              <!-- 浏览量列 -->
              <TableCell>
                <div class="flex items-center gap-1.5 text-slate-600">
                  <Eye class="w-3.5 h-3.5 text-slate-400" />
                  <span class="font-mono text-sm">{{ post.views }}</span>
                </div>
              </TableCell>

              <!-- 日期列 -->
              <TableCell class="text-right pr-6">
                    <span class="font-mono text-xs text-slate-500">
                      {{ formatDate(post.createTime) }}
                    </span>
              </TableCell>
            </TableRow>

            <!-- 空状态 -->
            <TableRow v-if="!loading && recentPosts.length === 0">
              <TableCell colspan="4" class="h-32 text-center">
                <div class="flex flex-col items-center justify-center text-slate-400">
                  <FileText class="w-12 h-12 mb-2 opacity-20" />
                  <p class="text-sm font-medium">No posts found</p>
                  <p class="text-xs mt-1">Start by creating your first article</p>
                </div>
              </TableCell>
            </TableRow>

            <!-- 加载状态 -->
            <TableRow v-if="loading">
              <TableCell colspan="4" class="h-32 text-center">
                <div class="flex items-center justify-center">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>