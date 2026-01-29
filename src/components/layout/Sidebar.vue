
<!--
  Sidebar.vue - 侧边栏主组件

  功能：
  - 组合 Logo、导航菜单、用户信息卡片
  - 响应式隐藏（移动端隐藏）

  Props:
  - navGroups: 导航菜单分组配置
  - userAvatar/userNickname/userEmail: 用户信息

  Emits:
  - logout: 用户点击登出按钮
-->
<script setup lang="ts">
import SidebarLogo from './SidebarLogo.vue';
import SidebarNav, { type NavGroup } from './SidebarNav.vue';
import SidebarUserCard from './SidebarUserCard.vue';

interface Props {
  /** 导航菜单分组配置 */
  navGroups: NavGroup[]
  /** 用户头像 URL */
  userAvatar?: string
  /** 用户昵称 */
  userNickname?: string
  /** 用户邮箱 */
  userEmail?: string
}

defineProps<Props>();

const emit = defineEmits<{
  /** 登出事件 */
  (e: 'logout'): void
}>();
</script>

<template>
  <!-- 侧边栏容器：中等屏幕以上显示，移动端隐藏 -->
  <aside class="w-64 bg-white h-full border-r border-slate-200 flex-col hidden md:flex shrink-0">
    <!-- Logo 区域 -->
    <SidebarLogo />

    <!-- 导航菜单 -->
    <SidebarNav :groups="navGroups" />

    <!-- 用户信息卡片 -->
    <SidebarUserCard
        :avatar="userAvatar"
        :nickname="userNickname"
        :email="userEmail"
        @logout="emit('logout')"
    />
  </aside>
</template>