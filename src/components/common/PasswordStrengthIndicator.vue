<!-- PasswordStrengthIndicator.vue - 密码强度指示器组件 -->
<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Check, X } from 'lucide-vue-next';
import type { PasswordChecks, PasswordStrengthState } from '@/composables/usePasswordStrength';

/**
 * Props 定义
 * @property password 当前密码文本
 * @property submitAttempted 是否已触发过提交
 * @property checks 密码规则检查结果
 * @property strength 密码强度等级
 * @property i18nKeyPrefix 密码规则文案的 i18n 前缀
 * @property emptyHint 密码为空时展示的提示文案
 */
const props = defineProps<{
  password: string;
  submitAttempted: boolean;
  checks: PasswordChecks;
  strength: PasswordStrengthState;
  i18nKeyPrefix: string;
  emptyHint?: string;
}>();

const { t } = useI18n();

/**
 * 密码规则文案
 * 根据传入的 i18n 前缀复用不同页面的文案定义
 */
const labels = computed(() => ({
  length: t(`${props.i18nKeyPrefix}.length`),
  letter: t(`${props.i18nKeyPrefix}.letter`),
  number: t(`${props.i18nKeyPrefix}.number`),
  specialChar: t(`${props.i18nKeyPrefix}.specialChar`),
}));

/**
 * 根据提交状态和校验结果返回规则项文字颜色
 */
const getCheckTextClass = (passed: boolean): string => {
  if (passed) return 'text-green-600';
  return props.submitAttempted ? 'text-red-500' : 'text-slate-400';
};
</script>

<template>
  <!-- 密码已输入时显示强度条和规则列表 -->
  <div v-if="password" class="space-y-2">
    <!-- 三段式强度条 -->
    <div class="flex gap-1">
      <div
        v-for="i in 3"
        :key="i"
        class="h-1 flex-1 rounded-full transition-colors"
        :class="i <= strength.level ? strength.color : 'bg-slate-200'"
      />
    </div>

    <!-- 规则列表使用 flex-wrap，保证移动端窄屏下可以自动换行 -->
    <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs">
      <span :class="getCheckTextClass(checks.length)" class="flex items-center gap-1">
        <Check v-if="checks.length" class="h-3 w-3" />
        <X v-else class="h-3 w-3" />
        {{ labels.length }}
      </span>
      <span :class="getCheckTextClass(checks.hasLetter)" class="flex items-center gap-1">
        <Check v-if="checks.hasLetter" class="h-3 w-3" />
        <X v-else class="h-3 w-3" />
        {{ labels.letter }}
      </span>
      <span :class="getCheckTextClass(checks.hasNumber)" class="flex items-center gap-1">
        <Check v-if="checks.hasNumber" class="h-3 w-3" />
        <X v-else class="h-3 w-3" />
        {{ labels.number }}
      </span>
      <span :class="getCheckTextClass(checks.hasSpecial)" class="flex items-center gap-1">
        <Check v-if="checks.hasSpecial" class="h-3 w-3" />
        <X v-else class="h-3 w-3" />
        {{ labels.specialChar }}
      </span>
    </div>
  </div>

  <!-- 密码为空时保留一行弱提示，避免设置页出现突兀留白 -->
  <p v-else-if="emptyHint" class="text-xs text-slate-500">
    {{ emptyHint }}
  </p>
</template>
