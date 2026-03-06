<!-- AdminLayout.vue - 管理后台主布局 -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import {
  LayoutDashboard,
  PenTool,
  StickyNote,
  Hash,
  Link as LinkIcon,
  Settings,
} from 'lucide-vue-next';
import Sidebar, { type NavGroup } from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from 'reka-ui';

const router = useRouter();
const userStore = useUserStore();
const { t } = useI18n();

/**
 * 移动端侧边栏打开状态
 */
const sidebarOpen = ref(false);

/**
 * 导航菜单配置（computed 以响应语言切换）
 */
const navGroups = computed<NavGroup[]>(() => [
  {
    title: t('nav.overview'),
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    ],
  },
  {
    title: t('nav.content'),
    items: [
      { to: '/posts', icon: PenTool, label: t('nav.posts') },
      { to: '/memos', icon: StickyNote, label: t('nav.memos') },
      { to: '/tags', icon: Hash, label: t('nav.tags') },
      { to: '/links', icon: LinkIcon, label: t('nav.links') },
    ],
  },
  {
    title: t('nav.system'),
    items: [
      { to: '/settings', icon: Settings, label: t('nav.settings') },
    ],
  },
]);

/**
 * 处理用户登出
 * 清除用户状态并跳转到登录页
 */
const handleLogout = async () => {
  userStore.logout();
  toast.success(t('logout.success'));
  await router.push('/login');
};
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-background">
    <!-- 桌面端侧边栏（>= md 显示） -->
    <Sidebar
        :nav-groups="navGroups"
        :user-avatar="userStore.userInfo.avatar ?? null"
        :user-nickname="userStore.userInfo.nickname ?? userStore.userInfo.username ?? ''"
        :user-email="userStore.userInfo.email ?? null"
        @logout="handleLogout"
    />

    <!-- 移动端侧边栏抽屉（< md 显示） -->
    <Sheet v-model:open="sidebarOpen">
      <SheetContent side="left" class="w-64 p-0">
        <VisuallyHidden>
          <SheetTitle>{{ t('nav.content') }}</SheetTitle>
          <SheetDescription>{{ t('nav.content') }}</SheetDescription>
        </VisuallyHidden>
        <Sidebar
            :nav-groups="navGroups"
            :user-avatar="userStore.userInfo.avatar ?? null"
            :user-nickname="userStore.userInfo.nickname ?? userStore.userInfo.username ?? ''"
            :user-email="userStore.userInfo.email ?? null"
            mobile
            @logout="handleLogout"
            @navigate="sidebarOpen = false"
        />
      </SheetContent>
    </Sheet>

    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col h-full overflow-hidden min-w-0">
      <!-- 顶部导航栏 -->
      <Header @toggle-sidebar="sidebarOpen = true" />

      <!-- 页面内容区域（padding 响应式 p-4 → md:p-6 → lg:p-8） -->
      <div class="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 lg:p-8">
        <div class="max-w-7xl mx-auto">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>
