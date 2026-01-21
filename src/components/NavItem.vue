<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

interface Props {
  to?: string;
  icon?: any;
  label: string;
  badge?: string | number;
}

const props = defineProps<Props>();
const route = useRoute();

// 判断是否为当前激活路由
const isActive = computed(() => {
  if (!props.to) return false;
  return route.path === props.to;
});

// 动态类名
const linkClass = computed(() => {
  const baseClass = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer';

  if (isActive.value) {
    return `${baseClass} bg-slate-900 text-white shadow-md hover:bg-slate-800`;
  }

  return `${baseClass} text-slate-600 hover:bg-slate-100 hover:text-slate-900`;
});
</script>

<template>
  <component
      :is="to ? 'router-link' : 'a'"
      :to="to"
      :href="to ? undefined : '#'"
      :class="linkClass"
  >
    <component v-if="icon" :is="icon" class="w-4 h-4" />
    <span>{{ label }}</span>
    <span v-if="badge" class="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
      {{ badge }}
    </span>
  </component>
</template>