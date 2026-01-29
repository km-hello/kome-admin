<!--
  SidebarUserCard.vue - 侧边栏用户信息卡片组件

  功能：
  - 显示当前登录用户的头像、昵称、邮箱
  - 提供登出按钮

  Props:
  - avatar: 用户头像 URL
  - nickname: 用户昵称
  - email: 用户邮箱

  Emits:
  - logout: 用户点击登出按钮
-->
<script setup lang="ts">
import { LogOut } from 'lucide-vue-next';

interface Props {
  /** 用户头像 URL */
  avatar?: string
  /** 用户昵称 */
  nickname?: string
  /** 用户邮箱 */
  email?: string
}

withDefaults(defineProps<Props>(), {
  nickname: 'Administrator',
  email: 'admin@example.com',
});

const emit = defineEmits<{
  /** 登出事件 */
  (e: 'logout'): void
}>();

/** 默认头像（使用 DiceBear 随机生成） */
const defaultAvatar = 'https://api.dicebear.com/7.x/notionists/svg?seed=Admin';
</script>

<template>
  <div class="p-4 border-t border-slate-100 shrink-0">
    <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
      <!-- 用户头像 -->
      <img
          :src="avatar || defaultAvatar"
          class="w-10 h-10 rounded-full bg-white border-2 border-slate-200"
          alt="User Avatar"
      >
      <!-- 用户信息 -->
      <div class="flex-1 min-w-0">
        <div class="text-sm font-bold text-slate-800 truncate">
          {{ nickname }}
        </div>
        <div class="text-xs text-slate-500 truncate">
          {{ email }}
        </div>
      </div>
      <!-- 登出按钮 -->
      <button
          @click="emit('logout')"
          class="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded"
          title="Logout"
      >
        <LogOut class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>