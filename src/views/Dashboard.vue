
<script setup lang="ts">
import {ref, onMounted} from 'vue';
import { useRouter } from 'vue-router';
import { useSiteStore } from '@/stores/site';
import { getAdminPostsApi, type PostSimpleResponse } from '@/api/post';
import { getAdminMemosApi, type MemoResponse } from '@/api/memo';

// 图标
import {
  FileText,
  Hash,
  Link as LinkIcon,
  Pin,
  Calendar,
  Globe,
  FileEdit,
  Activity,
  Loader2,
} from 'lucide-vue-next';

// 通用组件
import PageHeader from '@/components/common/PageHeader.vue';
import StatsCard from '@/components/common/StatsCard.vue';

// Shadcn 组件
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

// ========== 状态定义 ==========

// 使用站点统计 Store
const siteStore = useSiteStore();
const router = useRouter();

// 最近文章列表
const recentPosts = ref<PostSimpleResponse[]>([]);
// 最近备忘录列表
const recentMemos = ref<MemoResponse[]>([]);


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
      fetchRecentMemos(),
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
  const postsData = await getAdminPostsApi({
    pageNum: 1,
    pageSize: 5,
    ignorePinned: true  // 忽略置顶，只按时间排序
  });
  recentPosts.value = postsData.records;
};

/**
 * 获取最近备忘录
 */
const fetchRecentMemos = async () => {
  const memosData = await getAdminMemosApi({
    pageNum: 1,
    pageSize: 5,
    ignorePinned: true  // 忽略置顶，只按时间排序
  });
  recentMemos.value = memosData.records;
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
</script>

<template>
  <div class="space-y-6">
    <!-- ========== 页面标题 ========== -->
    <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your blog."
    />

    <!-- ========== 统计卡片网格 ========== -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
          title="Total Posts"
          :value="siteStore.totalPosts"
          :icon="FileText"
          icon-bg-class="bg-blue-50"
          icon-class="text-blue-600"
      >
        <div class="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span>Published: <span class="font-semibold text-blue-600">{{ siteStore.stats.publishedPostCount }}</span></span>
          <span>Draft: <span class="font-semibold text-slate-600">{{ siteStore.stats.draftPostCount }}</span></span>
        </div>
      </StatsCard>

      <StatsCard
          title="Total Memos"
          :value="siteStore.totalMemos"
          :icon="Activity"
          icon-bg-class="bg-amber-50"
          icon-class="text-amber-600"
      >
        <div class="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span>Published: <span class="font-semibold text-amber-600">{{ siteStore.stats.publishedMemoCount }}</span></span>
          <span>Draft: <span class="font-semibold text-slate-600">{{ siteStore.stats.draftMemoCount }}</span></span>
        </div>
      </StatsCard>

      <StatsCard
          title="Total Tags"
          :value="siteStore.totalTags"
          :icon="Hash"
          icon-bg-class="bg-emerald-50"
          icon-class="text-emerald-600"
      >
        <div class="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span>Used: <span class="font-semibold text-emerald-600">{{ siteStore.stats.usedTagCount }}</span></span>
          <span>Unused: <span class="font-semibold text-slate-600">{{ siteStore.stats.unusedTagCount }}</span></span>
        </div>
      </StatsCard>

      <StatsCard
          title="Friend Links"
          :value="siteStore.totalLinks"
          :icon="LinkIcon"
          icon-bg-class="bg-purple-50"
          icon-class="text-purple-600"
      >
        <div class="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span>Published: <span class="font-semibold text-purple-600">{{ siteStore.stats.publishedLinkCount }}</span></span>
          <span>Draft: <span class="font-semibold text-slate-600">{{ siteStore.stats.draftLinkCount }}</span></span>
        </div>
      </StatsCard>
    </div>

    <!-- ========== 内容列表区域 ========== -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- 最近文章 -->
      <Card>
        <CardHeader class="border-b border-slate-100 py-3">
          <div class="flex items-center justify-between">
            <CardTitle class="text-lg font-bold text-slate-800">Recent Posts</CardTitle>
            <Button
                variant="ghost"
                size="sm"
                class="text-slate-600 hover:text-slate-900"
                @click="router.push('/posts')"
            >
              View All →
            </Button>
          </div>
        </CardHeader>

        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-transparent border-slate-100">
                <TableHead class="w-15 pl-6">ID</TableHead>
                <TableHead class="w-[50%]">Title</TableHead>
                <TableHead class="w-20">Status</TableHead>
                <TableHead class="w-25 text-right pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <!-- 加载状态 -->
              <TableRow v-if="loading">
                <TableCell colspan="4" class="h-32 text-center">
                  <div class="flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 class="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>

              <!-- 空状态 -->
              <TableRow v-else-if="recentPosts.length === 0">
                <TableCell colspan="4" class="h-32 text-center">
                  <div class="flex flex-col items-center justify-center text-slate-400">
                    <FileText class="w-12 h-12 mb-2 opacity-20" />
                    <p class="text-sm font-medium">No posts yet</p>
                    <p class="text-xs mt-1">Create your first post</p>
                  </div>
                </TableCell>
              </TableRow>

              <!-- 文章列表 -->
              <TableRow
                  v-else
                  v-for="post in recentPosts"
                  :key="post.id"
                  class="transition-colors border-slate-100"
                  :class="[
                    post.isPinned ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/50'
                  ]"
              >
                <!-- ID 列 -->
                <TableCell class="font-mono text-xs text-slate-500 pl-6">
                  <div class="flex items-center">
                    <span class="mr-1">#{{ post.id }}</span>
                    <Pin v-if="post.isPinned" class="w-3 h-3 text-amber-500 opacity-70" />
                  </div>
                </TableCell>

                <!-- 标题列 -->
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

                <!-- 日期列 -->
                <TableCell class="text-right pr-6">
                  <div class="flex items-center justify-end gap-1.5 text-xs text-slate-500">
                    <Calendar class="w-3 h-3" />
                    {{ formatDate(post.createTime).split(' ')[0] }}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- 最近备忘录 -->
      <Card>
        <CardHeader class="border-b border-slate-100 py-3">
          <div class="flex items-center justify-between">
            <CardTitle class="text-lg font-bold text-slate-800">Recent Memos</CardTitle>
            <Button
                variant="ghost"
                size="sm"
                class="text-slate-600 hover:text-slate-900"
                @click="router.push('/memos')"
            >
              View All →
            </Button>
          </div>
        </CardHeader>

        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-transparent border-slate-100">
                <TableHead class="w-15 pl-6">ID</TableHead>
                <TableHead class="w-[50%]">Content</TableHead>
                <TableHead class="w-20">Status</TableHead>
                <TableHead class="w-25 text-right pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <!-- 加载状态 -->
              <TableRow v-if="loading">
                <TableCell colspan="4" class="h-32 text-center">
                  <div class="flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 class="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>

              <!-- 空状态 -->
              <TableRow v-else-if="recentMemos.length === 0">
                <TableCell colspan="4" class="h-32 text-center">
                  <div class="flex flex-col items-center justify-center text-slate-400">
                    <Activity class="w-12 h-12 mb-2 opacity-20" />
                    <p class="text-sm font-medium">No memos yet</p>
                    <p class="text-xs mt-1">Create your first memo</p>
                  </div>
                </TableCell>
              </TableRow>

              <!-- 备忘录列表 -->
              <TableRow
                  v-else
                  v-for="memo in recentMemos"
                  :key="memo.id"
                  class="transition-colors border-slate-100"
                  :class="[
                    memo.isPinned ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/50'
                  ]"
              >
                <!-- ID 列 -->
                <TableCell class="font-mono text-xs text-slate-500 pl-6">
                  <div class="flex items-center">
                    <span class="mr-1">#{{ memo.id }}</span>
                    <Pin v-if="memo.isPinned" class="w-3 h-3 text-amber-500 opacity-70" />
                  </div>
                </TableCell>

                <!-- 内容列 -->
                <TableCell class="whitespace-normal">
                  <p class="text-sm text-slate-700 line-clamp-2" :title="memo.content">
                    {{ memo.content }}
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

                <!-- 日期列 -->
                <TableCell class="text-right pr-6">
                  <div class="flex items-center justify-end gap-1.5 text-xs text-slate-500">
                    <Calendar class="w-3 h-3" />
                    {{ formatDate(memo.createTime).split(' ')[0] }}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>