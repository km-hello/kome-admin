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
  Code2,
  LogOut,
  Search,
  Plus,
  Menu
} from 'lucide-vue-next';

// 组件
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NavItem from '@/components/NavItem.vue';

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
        <NavItem :icon="PenTool" label="Posts" />
        <NavItem :icon="StickyNote" label="Memos" />
        <NavItem to="/tags" :icon="Hash" label="Tags" />
        <NavItem :icon="LinkIcon" label="Links" />

        <!-- System 分组 -->
        <div class="px-3 mt-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          System
        </div>

        <NavItem :icon="Settings" label="Settings" />
        <NavItem :icon="Code2" label="Logs" />
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
        <div class="flex items-center gap-2 text-sm">
          <button class="md:hidden p-2 hover:bg-slate-100 rounded-lg">
            <Menu class="w-5 h-5" />
          </button>
          <span class="text-slate-500">Home</span>
          <span class="text-slate-300">/</span>
          <span class="text-slate-900 font-medium">Dashboard</span>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative hidden sm:block">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
                type="search"
                placeholder="Search..."
                class="pl-9 w-48 lg:w-64 h-9 bg-slate-50 border-slate-200 focus:w-72 transition-all"
            />
          </div>

          <Button variant="ghost" size="icon" class="relative">
            <Bell class="w-4 h-4" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" hidden></span>
          </Button>

          <Button class="bg-slate-900 hover:bg-slate-800 gap-2 h-9">
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">New Post</span>
          </Button>
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