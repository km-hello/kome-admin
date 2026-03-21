<!-- Setup.vue - 初始化设置页面 -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSiteStore } from '@/stores/site';
import { useAuthStore } from '@/stores/auth';
import { setupAdminApi, type SetupRequest } from '@/api/site';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { usePasswordStrength } from '@/composables/usePasswordStrength';
import { normalizeStringField } from '@/utils/formNormalizer';
import { Loader2, User, Lock, Mail, Eye, EyeOff, Image, FileText, UserRound, ChevronDown } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue';
import PasswordStrengthIndicator from '@/components/common/PasswordStrengthIndicator.vue';
import WanderingLinesBackground from '@/components/common/WanderingLinesBackground.vue';

const router = useRouter();
const siteStore = useSiteStore();
const authStore = useAuthStore();
const { t } = useI18n();

/**
 * Setup 表单数据类型（扩展 API 请求类型，增加确认密码字段）
 */
type SetupFormData = SetupRequest & { confirmPassword: string };

/**
 * 初始化表单数据
 */
const form = ref<SetupFormData>({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: null,
  avatar: null,
  description: null,
  email: null,
});

/**
 * 加载状态
 */
const isLoading = ref(false);
/**
 * 密码可见性
 */
const showPassword = ref(false);
/**
 * 确认密码可见性
 */
const showConfirmPassword = ref(false);
/**
 * 可选项折叠状态
 */
const showOptional = ref(false);
/**
 * 是否已触发过提交。
 * 用于控制字段级错误提示和错误态的显示时机，避免初始输入即出现红色提示。
 */
const submitAttempted = ref(false);

/**
 * 用户名格式校验规则
 */
const usernamePattern = /^[a-zA-Z0-9_-]+$/;
/**
 * 邮箱格式校验规则
 */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 密码强度状态。
 * 统一计算密码规则检查结果和强度等级，供页面校验与指示器复用。
 */
const {
  checks: passwordChecks,
  strength: passwordStrength,
  isValid: isPasswordValid,
} = usePasswordStrength(() => form.value.password);

/**
 * 校验用户名并返回错误信息；无错误时返回空字符串
 */
const validateUsername = (): string => {
  const username = form.value.username;
  if (!username.trim()) return t('setup.validation.enterUsername');
  if (username.length < 4 || username.length > 50) return t('setup.validation.usernameTooShort');
  if (!usernamePattern.test(username)) return t('setup.validation.usernameInvalid');
  return '';
};

/**
 * 校验密码并返回错误信息；无错误时返回空字符串
 */
const validatePassword = (): string => {
  if (!form.value.password) return t('setup.validation.enterPassword');
  if (!isPasswordValid.value) return t('setup.validation.passwordInvalid');
  return '';
};

/**
 * 校验确认密码并返回错误信息；无错误时返回空字符串
 */
const validateConfirmPassword = (): string => {
  if (!form.value.confirmPassword) return t('setup.validation.enterConfirmPassword');
  if (form.value.password !== form.value.confirmPassword) return t('setup.validation.passwordMismatch');
  return '';
};

/**
 * 校验昵称并返回错误信息；无错误时返回空字符串
 */
const validateNickname = (): string => {
  if (!form.value.nickname) return '';
  if (form.value.nickname.length > 50) return t('setup.validation.nicknameTooLong');
  return '';
};

/**
 * 校验头像 URL 并返回错误信息；无错误时返回空字符串
 */
const validateAvatar = (): string => {
  if (!form.value.avatar) return '';
  if (form.value.avatar.length > 255) return t('setup.validation.avatarTooLong');
  return '';
};

/**
 * 校验邮箱并返回错误信息；无错误时返回空字符串
 */
const validateEmail = (): string => {
  if (!form.value.email) return '';
  if (form.value.email.length > 100) return t('setup.validation.emailTooLong');
  if (!emailPattern.test(form.value.email)) return t('setup.validation.emailInvalid');
  return '';
};

/**
 * 校验个人简介并返回错误信息；无错误时返回空字符串
 */
const validateDescription = (): string => {
  if (!form.value.description) return '';
  if (form.value.description.length > 255) return t('setup.validation.descriptionTooLong');
  return '';
};

/**
 * 用户名字段错误信息
 */
const usernameErrorMessage = computed(() =>
  !submitAttempted.value ? '' : validateUsername()
);

/**
 * 密码字段错误信息
 */
const passwordErrorMessage = computed(() =>
  !submitAttempted.value ? '' : validatePassword()
);

/**
 * 确认密码字段错误信息
 */
const confirmPasswordErrorMessage = computed(() =>
  form.value.confirmPassword ? validateConfirmPassword() : (submitAttempted.value ? validateConfirmPassword() : '')
);

/**
 * 昵称字段错误信息
 */
const nicknameErrorMessage = computed(() =>
  !submitAttempted.value ? '' : validateNickname()
);

/**
 * 头像 URL 字段错误信息
 */
const avatarErrorMessage = computed(() =>
  !submitAttempted.value ? '' : validateAvatar()
);

/**
 * 邮箱字段错误信息
 */
const emailErrorMessage = computed(() =>
  !submitAttempted.value ? '' : validateEmail()
);

/**
 * 个人简介字段错误信息
 */
const descriptionErrorMessage = computed(() =>
  !submitAttempted.value ? '' : validateDescription()
);

/**
 * 当前表单的首个错误信息。
 * 用于提交时统一提示，并保持校验顺序稳定。
 */
const firstValidationError = computed(() =>
  validateUsername() ||
  validatePassword() ||
  validateConfirmPassword() ||
  validateNickname() ||
  validateAvatar() ||
  validateEmail() ||
  validateDescription()
);

/**
 * 处理初始化设置。
 * 验证表单后提交管理员账户设置，成功后跳转到登录页。
 */
const handleSetup = async (): Promise<void> => {
  // 提交后开启字段级错误提示
  submitAttempted.value = true;

  // 折叠区内存在错误时自动展开，避免用户看不到原因
  if (validateAvatar() || validateDescription()) {
    showOptional.value = true;
  }

  if (firstValidationError.value) {
    toast.warning(firstValidationError.value);
    return;
  }

  isLoading.value = true;

  try {
    // 从表单数据构建 API 请求（去掉 confirmPassword）
    const { confirmPassword, ...requestData } = form.value;

    await setupAdminApi({
      ...requestData,
      nickname: normalizeStringField(requestData.nickname),
      avatar: normalizeStringField(requestData.avatar),
      description: normalizeStringField(requestData.description),
      email: normalizeStringField(requestData.email),
    });

    // 更新 store 状态
    siteStore.setInitialized();

    // 清除任何残留的登录状态，确保用户必须使用新账户登录
    authStore.logout();

    toast.success(t('setup.setupComplete'));

    // 跳转到登录页
    await router.push('/login');
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    isLoading.value = false;
  }
};

</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden py-8">
    <WanderingLinesBackground />

    <!-- 设置卡片 -->
    <Card class="w-full max-w-md z-10 bg-white/88 border-white/60 backdrop-blur-md shadow-[0_28px_80px_rgba(15,23,42,0.16)] mx-4 relative">
      <!-- 语言切换 -->
      <div class="absolute top-3 right-3">
        <LanguageSwitcher />
      </div>
      <CardHeader class="text-center space-y-2 pb-4 mt-2">
        <!-- Logo -->
        <div class="mx-auto w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-2 shadow-lg">
          K
        </div>
        <CardTitle class="text-2xl font-bold text-slate-800">{{ t('setup.welcome') }}</CardTitle>
        <CardDescription class="text-slate-500">{{ t('setup.description') }}</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- 用户名输入 -->
        <div class="space-y-2">
          <Label htmlFor="username" class="text-slate-700 font-medium">
            {{ t('setup.username') }} <span class="text-red-500">*</span>
          </Label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                id="username"
                v-model="form.username"
                :placeholder="t('setup.placeholder.username')"
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 placeholder:text-slate-400"
                :class="{ 'border-red-300 focus:border-red-400': Boolean(usernameErrorMessage) }"
                maxlength="50"
                :disabled="isLoading"
            />
          </div>
          <p v-if="usernameErrorMessage" class="text-xs text-red-500">
            {{ usernameErrorMessage }}
          </p>
        </div>

        <!-- 密码输入 -->
        <div class="space-y-2">
          <Label htmlFor="password" class="text-slate-700 font-medium">
            {{ t('setup.password') }} <span class="text-red-500">*</span>
          </Label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                :placeholder="t('setup.placeholder.password')"
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 pr-10 placeholder:text-slate-400"
                :class="{ 'border-red-300 focus:border-red-400': Boolean(passwordErrorMessage) }"
                maxlength="64"
                :disabled="isLoading"
            />
            <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                :disabled="isLoading"
            >
              <Eye v-if="!showPassword" class="h-4 w-4" />
              <EyeOff v-else class="h-4 w-4" />
            </button>
          </div>

          <!-- 密码强度指示器 -->
          <PasswordStrengthIndicator
              :password="form.password"
              :submit-attempted="submitAttempted"
              :checks="passwordChecks"
              :strength="passwordStrength"
              i18n-key-prefix="setup.passwordStrength"
          />
          <p v-if="passwordErrorMessage" class="text-xs text-red-500">
            {{ passwordErrorMessage }}
          </p>
        </div>

        <!-- 确认密码输入 -->
        <div class="space-y-2">
          <Label htmlFor="confirmPassword" class="text-slate-700 font-medium">
            {{ t('setup.confirmPassword') }} <span class="text-red-500">*</span>
          </Label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                id="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="form.confirmPassword"
                :placeholder="t('setup.placeholder.confirmPassword')"
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 pr-10 placeholder:text-slate-400"
                :class="{ 'border-red-300 focus:border-red-400': Boolean(confirmPasswordErrorMessage) }"
                maxlength="64"
                :disabled="isLoading"
            />
            <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                :disabled="isLoading"
            >
              <Eye v-if="!showConfirmPassword" class="h-4 w-4" />
              <EyeOff v-else class="h-4 w-4" />
            </button>
          </div>
          <p v-if="confirmPasswordErrorMessage" class="text-xs text-red-500">
            {{ confirmPasswordErrorMessage }}
          </p>
        </div>

        <!-- 昵称输入 -->
        <div class="space-y-2">
          <Label htmlFor="nickname" class="text-slate-700 font-medium text-sm">{{ t('setup.nickname') }}</Label>
          <div class="relative">
            <UserRound class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                id="nickname"
                :model-value="form.nickname ?? ''"
                @update:model-value="(val) => form.nickname = val as string"
                :placeholder="t('setup.placeholder.nickname')"
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 placeholder:text-slate-400 h-9 text-sm"
                :class="{ 'border-red-300 focus:border-red-400': Boolean(nicknameErrorMessage) }"
                maxlength="50"
                :disabled="isLoading"
            />
          </div>
          <p v-if="nicknameErrorMessage" class="text-xs text-red-500">
            {{ nicknameErrorMessage }}
          </p>
        </div>

        <!-- 邮箱输入 -->
        <div class="space-y-2">
          <Label htmlFor="email" class="text-slate-700 font-medium text-sm">{{ t('setup.email') }}</Label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                id="email"
                type="email"
                :model-value="form.email ?? ''"
                @update:model-value="(val) => form.email = val as string"
                :placeholder="t('setup.placeholder.email')"
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 placeholder:text-slate-400 h-9 text-sm"
                :class="{ 'border-red-300 focus:border-red-400': Boolean(emailErrorMessage) }"
                maxlength="100"
                :disabled="isLoading"
            />
          </div>
          <p v-if="emailErrorMessage" class="text-xs text-red-500">
            {{ emailErrorMessage }}
          </p>
        </div>

        <!-- 可选项折叠区域 -->
        <Collapsible v-model:open="showOptional" class="space-y-2">
          <CollapsibleTrigger class="flex items-center justify-center w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors group">
            <span class="border-t border-slate-200 flex-1"></span>
            <span class="px-3 flex items-center gap-1">
              {{ t('setup.customizeProfile') }}
              <ChevronDown
                  class="h-4 w-4 transition-transform duration-200"
                  :class="{ 'rotate-180': showOptional }"
              />
            </span>
            <span class="border-t border-slate-200 flex-1"></span>
          </CollapsibleTrigger>

          <CollapsibleContent class="space-y-4 pt-2">
            <!-- 个人简介输入 -->
            <div class="space-y-2">
              <Label htmlFor="description" class="text-slate-700 font-medium text-sm">{{ t('setup.bio') }}</Label>
              <div class="relative">
                <FileText class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Textarea
                    id="description"
                    :model-value="form.description ?? ''"
                    @update:model-value="(val) => form.description = val as string"
                    :placeholder="t('setup.placeholder.bio')"
                    rows="2"
                    class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 placeholder:text-slate-400 resize-none text-sm"
                    :class="{ 'border-red-300 focus:border-red-400': Boolean(descriptionErrorMessage) }"
                    maxlength="255"
                    :disabled="isLoading"
                />
              </div>
              <p v-if="descriptionErrorMessage" class="text-xs text-red-500">
                {{ descriptionErrorMessage }}
              </p>
            </div>

            <!-- 头像 URL 输入 -->
            <div class="space-y-2">
              <Label htmlFor="avatar" class="text-slate-700 font-medium text-sm">{{ t('setup.avatarUrl') }}</Label>
              <div class="relative">
                <Image class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    id="avatar"
                    :model-value="form.avatar ?? ''"
                    @update:model-value="(val) => form.avatar = val as string"
                    :placeholder="t('setup.placeholder.avatar')"
                    class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 placeholder:text-slate-400 h-9 text-sm"
                    :class="{ 'border-red-300 focus:border-red-400': Boolean(avatarErrorMessage) }"
                    maxlength="255"
                    :disabled="isLoading"
                />
              </div>
              <p v-if="avatarErrorMessage" class="text-xs text-red-500">
                {{ avatarErrorMessage }}
              </p>
            </div>

          </CollapsibleContent>
        </Collapsible>

        <!-- 设置按钮 -->
        <Button
            class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-11 mt-2 gap-2"
            :disabled="isLoading"
            @click="handleSetup"
        >
          <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
          {{ isLoading ? t('setup.settingUp') : t('setup.completeSetup') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
