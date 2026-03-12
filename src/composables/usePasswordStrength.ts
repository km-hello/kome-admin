/**
 * usePasswordStrength.ts - 密码强度计算 Composable
 *
 * 统一提供密码规则检查、强度等级和完整性判断，
 * 供 Setup、Settings 等表单页面共享，避免重复维护同一套规则。
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue';

/**
 * 密码规则检查结果
 */
export interface PasswordChecks {
  length: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

/**
 * 密码强度展示状态
 */
export interface PasswordStrengthState {
  level: 0 | 1 | 2 | 3;
  color: string;
}

/**
 * 统一计算密码规则检查和强度等级。
 * 支持直接传入字符串、ref 或 getter。
 */
export const usePasswordStrength = (password: MaybeRefOrGetter<string>) => {
  /**
   * 规则检查结果
   */
  const checks = computed<PasswordChecks>(() => {
    // 统一解包普通值、ref 或 getter，减少调用方约束
    const value = toValue(password);

    return {
      // 长度规则与后端校验保持一致
      length: value.length >= 8 && value.length <= 64,
      hasLetter: /[a-zA-Z]/.test(value),
      hasNumber: /\d/.test(value),
      hasSpecial: /[\W_]/.test(value),
    };
  });

  /**
   * 强度等级
   */
  const strength = computed<PasswordStrengthState>(() => {
    // 以满足规则的数量映射三段式强度展示
    const passedCount = Object.values(checks.value).filter(Boolean).length;

    if (passedCount === 0) return { level: 0, color: '' };
    if (passedCount <= 2) return { level: 1, color: 'bg-red-500' };
    if (passedCount <= 3) return { level: 2, color: 'bg-yellow-500' };
    return { level: 3, color: 'bg-green-500' };
  });

  /**
   * 是否满足全部密码规则
   */
  const isValid = computed(() =>
    Object.values(checks.value).every(Boolean)
  );

  return {
    checks,
    strength,
    isValid,
  };
};
