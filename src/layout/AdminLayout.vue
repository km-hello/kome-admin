<!--
  AdminLayout.vue - 管理后台主布局

  功能：
  - 组合侧边栏和主内容区
  - 配置导航菜单数据
  - 处理全局事件（如登出）

  结构：
  ┌─────────────────────────────────────┐
  │  Sidebar  │       Header            │
  │           ├─────────────────────────┤
  │           │                         │
  │           │     router-view         │
  │           │                         │
  └───────────┴─────────────────────────┘
-->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { toast } from 'vue-sonner';

// 导航图标
import {
  LayoutDashboard,
  PenTool,
  StickyNote,
  Hash,
  Link as LinkIcon,
  Settings,
} from 'lucide-vue-next';

// 布局子组件
import Sidebar, { type NavGroup } from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const router = useRouter();
const userStore = useUserStore();
const sidebarOpen = ref(false);

/**
 * 导航菜单配置
 * 采用数据驱动方式，便于维护和扩展
 */
const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    title: 'Content',
    items: [
      { to: '/posts', icon: PenTool, label: 'Posts' },
      { to: '/memos', icon: StickyNote, label: 'Memos' },
      { to: '/tags', icon: Hash, label: 'Tags' },
      { to: '/links', icon: LinkIcon, label: 'Links' },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

/**
 * 处理用户登出
 * 清除用户状态并跳转到登录页
 */
const handleLogout = async () => {
  userStore.logout();
  toast.success('已退出登录');
  await router.push('/login');
};
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-background">
    <!-- 桌面端侧边栏 -->
    <Sidebar
        :nav-groups="navGroups"
        :user-avatar="userStore.userInfo.avatar"
        :user-nickname="userStore.userInfo.nickname"
        :user-email="userStore.userInfo.email"
        @logout="handleLogout"
    />

    <!-- 移动端侧边栏抽屉 -->
    <Sheet v-model:open="sidebarOpen">
      <SheetContent side="left" class="w-64 p-0">
        <Sidebar
            :nav-groups="navGroups"
            :user-avatar="userStore.userInfo.avatar"
            :user-nickname="userStore.userInfo.nickname"
            :user-email="userStore.userInfo.email"
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

      <!-- 页面内容区域 -->
      <div class="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 lg:p-8">
        <div class="max-w-7xl mx-auto">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>