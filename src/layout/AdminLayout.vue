<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { toast } from 'vue-sonner';

// 图标
import {
  LayoutDashboard,
  Bell,
  PenTool,
  StickyNote,
  Hash,
  Link as LinkIcon,
  Settings,
  LogOut,
  ExternalLink,
  Sun
} from 'lucide-vue-next';

// 组件
import NavItem from '@/components/NavItem.vue';
import Breadcrumb from "@/components/Breadcrumb.vue";

const router = useRouter();
const userStore = useUserStore();

/**
 * 异步函数，用于处理用户登出逻辑。
 *
 * 功能描述：
 * 1. 调用用户存储模块的登出方法以清除用户状态。
 * 2. 显示成功退出的提示消息。
 * 3. 重定向用户到登录页面。
 */
const handleLogout = async () => {
  userStore.logout();
  toast.success('已退出登录');
  await router.push('/login');
};
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-slate-50">

    <!-- ========== 侧边栏 ========== -->
    <aside class="w-64 bg-white h-full border-r border-slate-200 flex-col hidden md:flex shrink-0">
      <!-- Logo 区域 -->
      <div class="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white text-sm font-serif font-bold shadow-md">
            K
          </div>
          <div class="flex flex-col">
            <span class="font-bold text-slate-800 text-sm tracking-tight">Kome Admin</span>
            <span class="text-[10px] text-slate-400 font-medium">Management System</span>
          </div>
        </div>
      </div>

      <!-- 导航菜单 -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto custom-scroll">
        <!-- Overview 分组 -->
        <div class="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Overview
        </div>
        <NavItem to="/dashboard" :icon="LayoutDashboard" label="Dashboard" />

        <!-- Content 分组 -->
        <div class="px-3 mt-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Content
        </div>
        <NavItem to="/posts" :icon="PenTool" label="Posts" />
        <NavItem to="/memos" :icon="StickyNote" label="Memos" />
        <NavItem to="/tags" :icon="Hash" label="Tags" />
        <NavItem to="/links" :icon="LinkIcon" label="Links" />

        <!-- System 分组 -->
        <div class="px-3 mt-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          System
        </div>

        <NavItem to="/settings" :icon="Settings" label="Settings" />
      </nav>

      <!-- 用户信息区域 -->
      <div class="p-4 border-t border-slate-100 shrink-0">
        <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
          <img
              :src="userStore.userInfo.avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Admin'"
              class="w-10 h-10 rounded-full bg-white border-2 border-slate-200"
              alt="User Avatar"
          >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold text-slate-800 truncate">
              {{ userStore.userInfo.nickname || 'Administrator' }}
            </div>
            <div class="text-xs text-slate-500 truncate">
              {{ userStore.userInfo.email || 'admin@example.com' }}
            </div>
          </div>
          <button
              @click="handleLogout"
              class="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded"
              title="Logout"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- ========== 主内容区 ========== -->
    <main class="flex-1 flex flex-col h-full overflow-hidden">

      <!-- 顶部导航栏 -->
      <header class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10">
        <Breadcrumb />

        <!-- ... existing code ... -->

        <div class="flex items-center gap-1.5">
          <!-- View Site -->
          <a
              href="/"
              target="_blank"
              class="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-sm font-medium text-slate-600
                     hover:bg-slate-100 rounded-lg transition-colors group"
              title="View Site"
          >
            <span class="hidden sm:inline">View Site</span>
            <ExternalLink class="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          <div class="w-px h-5 bg-slate-200 mx-1"></div>

          <!-- Notifications -->
          <button
              class="relative inline-flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Notifications"
          >
            <Bell class="w-4 h-4" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" hidden></span>
          </button>

          <!-- Theme -->
          <button
              class="inline-flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Toggle Theme"
          >
            <Sun class="w-4 h-4" />
          </button>

          <!-- Settings -->
          <button
              class="inline-flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Settings"
              @click="router.push('/settings')"
          >
            <Settings class="w-4 h-4" />
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto custom-scroll p-6 lg:p-8">
        <div class="max-w-7xl mx-auto">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgb(226 232 240);
  border-radius: 4px;
}
</style>