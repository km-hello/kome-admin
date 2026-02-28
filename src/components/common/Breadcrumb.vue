<!-- Breadcrumb.vue - 面包屑导航组件 -->
<script setup lang="ts">
import {computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {Menu} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

/**
 * 面包屑项数据结构
 * @property label 显示文字
 * @property path 跳转路径（可选）
 */
interface BreadcrumbItem {
  label: string;
  path?: string;
}

/**
 * 根据当前路由动态生成面包屑数据
 */
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    {label: 'Home', path: '/'}
  ];

  // 获取路由的 matched 数组，生成面包屑路径
  const matched = route.matched.filter(item => item.meta?.breadcrumb !== false);

  matched.forEach((routeRecord) => {
    // 优先使用 meta.title，否则使用路由名称
    const label = (routeRecord.meta?.title as string) || routeRecord.name?.toString() || '';

    if (label && routeRecord.path !== '/') {
      items.push({
        label,
        path: routeRecord.path
      });
    }
  });

  return items;
});

/**
 * 处理面包屑点击事件
 */
const handleClick = (item: BreadcrumbItem) => {
  if (item.path && item.path !== route.path) {
    router.push(item.path);
  }
};

/**
 * 判断是否为最后一项
 */
const isLast = (index: number) => index === breadcrumbs.value.length - 1;
</script>

<template>
  <div class="flex items-center gap-2 text-sm">
    <!-- 移动端侧边栏切换按钮（< md 显示） -->
    <button class="md:hidden p-2 hover:bg-slate-100 rounded-lg" @click="$emit('toggleSidebar')">
      <Menu class="w-5 h-5"/>
    </button>

    <template v-for="(item, index) in breadcrumbs" :key="index">
      <!-- 可点击的面包屑项 -->
      <button
          v-if="!isLast(index)"
          @click="handleClick(item)"
          class="text-slate-500 hover:text-slate-700 transition-colors"
      >
        {{ item.label }}
      </button>
      <!-- 当前页面（最后一项） -->
      <span
          v-else
          class="text-slate-900 font-medium"
      >
        {{ item.label }}
      </span>

      <!-- 分隔符 -->
      <span v-if="!isLast(index)" class="text-slate-300">/</span>
    </template>
  </div>
</template>