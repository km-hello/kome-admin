<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSiteStore } from '@/stores/site';
import { useUserStore } from '@/stores/user';
import { setupAdminApi } from '@/api/site';
import { toast } from 'vue-sonner';
import { Loader2, User, Lock, Mail, Eye, EyeOff, Check, X, Image, FileText, UserCircle, ChevronDown } from 'lucide-vue-next';

// Shadcn 组件
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// ========== 常量 ==========
const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/notionists/svg?seed=kome';
const DEFAULT_NICKNAME = 'Admin';
const DEFAULT_BIO = 'Hello World!';
const DEFAULT_EMAIL = 'admin@example.com';

// ========== 状态定义 ==========
const router = useRouter();
const siteStore = useSiteStore();
const userStore = useUserStore();

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  avatar: '',
  description: '',
  email: '',
});

const isLoading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const showOptional = ref(false);

// ========== 密码强度检查 ==========
const passwordChecks = computed(() => ({
  length: form.value.password.length >= 8 && form.value.password.length <= 64,
  hasLetter: /[a-zA-Z]/.test(form.value.password),
  hasNumber: /\d/.test(form.value.password),
  hasSpecial: /[\W_]/.test(form.value.password),
}));

const passwordStrength = computed(() => {
  const checks = Object.values(passwordChecks.value).filter(Boolean).length;
  if (checks === 0) return { level: 0, text: '', color: '' };
  if (checks <= 2) return { level: 1, text: 'Weak', color: 'bg-red-500' };
  if (checks <= 3) return { level: 2, text: 'Medium', color: 'bg-yellow-500' };
  return { level: 3, text: 'Strong', color: 'bg-green-500' };
});

const isPasswordValid = computed(() =>
  Object.values(passwordChecks.value).every(Boolean)
);

const isFormValid = computed(() =>
  form.value.username.length >= 4 &&
  isPasswordValid.value &&
  form.value.password === form.value.confirmPassword
);

// ========== 方法 ==========
const handleSetup = async (): Promise<void> => {
  // 表单验证
  if (!form.value.username) {
    toast.warning('Please enter a username');
    return;
  }

  if (form.value.username.length < 4) {
    toast.warning('Username must be at least 4 characters');
    return;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(form.value.username)) {
    toast.warning('Username can only contain letters, numbers, underscores and hyphens');
    return;
  }

  if (!isPasswordValid.value) {
    toast.warning('Password must contain letters, numbers, special characters, and be 8-64 characters long');
    return;
  }

  if (form.value.password !== form.value.confirmPassword) {
    toast.warning('Passwords do not match');
    return;
  }

  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    toast.warning('Please enter a valid email address');
    return;
  }

  isLoading.value = true;

  try {
    // 发送时使用默认值填充空字段
    await setupAdminApi({
      username: form.value.username,
      password: form.value.password,
      nickname: form.value.nickname || DEFAULT_NICKNAME,
      avatar: form.value.avatar || DEFAULT_AVATAR,
      description: form.value.description || DEFAULT_BIO,
      email: form.value.email || DEFAULT_EMAIL,
    });

    // 更新 store 状态
    siteStore.setInitialized();

    // 清除任何残留的登录状态，确保用户必须使用新账户登录
    userStore.logout();

    toast.success('Setup completed! Please login with your new account.');

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
    <!-- 装饰背景 -->
    <div class="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-size-[32px_32px] opacity-60"></div>

    <!-- 设置卡片 -->
    <Card class="w-full max-w-md shadow-xl z-10 bg-white/95 backdrop-blur-sm mx-4">
      <CardHeader class="text-center space-y-2 pb-4 mt-2">
        <!-- Logo -->
        <div class="mx-auto w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-2 shadow-lg">
          K
        </div>
        <CardTitle class="text-2xl font-bold text-slate-800">Welcome to Kome</CardTitle>
        <CardDescription class="text-slate-500">Set up your admin account to get started</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- 用户名输入 -->
        <div class="space-y-2">
          <Label htmlFor="username" class="text-slate-700 font-medium">
            Username <span class="text-red-500">*</span>
          </Label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                id="username"
                v-model="form.username"
                placeholder="admin"
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 placeholder:text-slate-400"
                :disabled="isLoading"
            />
          </div>
        </div>

        <!-- 密码输入 -->
        <div class="space-y-2">
          <Label htmlFor="password" class="text-slate-700 font-medium">
            Password <span class="text-red-500">*</span>
          </Label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                placeholder="Create a strong password"
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 pr-10 placeholder:text-slate-400"
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
          <div v-if="form.password" class="space-y-2">
            <div class="flex gap-1">
              <div
                  v-for="i in 3"
                  :key="i"
                  class="h-1 flex-1 rounded-full transition-colors"
                  :class="i <= passwordStrength.level ? passwordStrength.color : 'bg-slate-200'"
              />
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <span :class="passwordChecks.length ? 'text-green-600' : 'text-slate-400'" class="flex items-center gap-1">
                <Check v-if="passwordChecks.length" class="h-3 w-3" />
                <X v-else class="h-3 w-3" />
                8-64 characters
              </span>
              <span :class="passwordChecks.hasLetter ? 'text-green-600' : 'text-slate-400'" class="flex items-center gap-1">
                <Check v-if="passwordChecks.hasLetter" class="h-3 w-3" />
                <X v-else class="h-3 w-3" />
                Letter
              </span>
              <span :class="passwordChecks.hasNumber ? 'text-green-600' : 'text-slate-400'" class="flex items-center gap-1">
                <Check v-if="passwordChecks.hasNumber" class="h-3 w-3" />
                <X v-else class="h-3 w-3" />
                Number
              </span>
              <span :class="passwordChecks.hasSpecial ? 'text-green-600' : 'text-slate-400'" class="flex items-center gap-1">
                <Check v-if="passwordChecks.hasSpecial" class="h-3 w-3" />
                <X v-else class="h-3 w-3" />
                Special char
              </span>
            </div>
          </div>
        </div>

        <!-- 确认密码输入 -->
        <div class="space-y-2">
          <Label htmlFor="confirmPassword" class="text-slate-700 font-medium">
            Confirm Password <span class="text-red-500">*</span>
          </Label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                id="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="form.confirmPassword"
                placeholder="Confirm your password"
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 pr-10 placeholder:text-slate-400"
                :class="{ 'border-red-300 focus:border-red-400': form.confirmPassword && form.password !== form.confirmPassword }"
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
          <p
              v-if="form.confirmPassword && form.password !== form.confirmPassword"
              class="text-xs text-red-500"
          >
            Passwords do not match
          </p>
        </div>

        <!-- 可选项折叠区域 -->
        <Collapsible v-model:open="showOptional" class="space-y-2">
          <CollapsibleTrigger class="flex items-center justify-center w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors group">
            <span class="border-t border-slate-200 flex-1"></span>
            <span class="px-3 flex items-center gap-1">
              Customize Profile
              <ChevronDown
                  class="h-4 w-4 transition-transform duration-200"
                  :class="{ 'rotate-180': showOptional }"
              />
            </span>
            <span class="border-t border-slate-200 flex-1"></span>
          </CollapsibleTrigger>

          <CollapsibleContent class="space-y-4 pt-2">
            <!-- 昵称输入 -->
            <div class="space-y-2">
              <Label htmlFor="nickname" class="text-slate-700 font-medium text-sm">Nickname</Label>
              <div class="relative">
                <UserCircle class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    id="nickname"
                    v-model="form.nickname"
                    :placeholder="DEFAULT_NICKNAME"
                    class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 placeholder:text-slate-400 h-9 text-sm"
                    :disabled="isLoading"
                />
              </div>
            </div>

            <!-- 个人简介输入 -->
            <div class="space-y-2">
              <Label htmlFor="description" class="text-slate-700 font-medium text-sm">Bio</Label>
              <div class="relative">
                <FileText class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Textarea
                    id="description"
                    v-model="form.description"
                    :placeholder="DEFAULT_BIO"
                    rows="2"
                    class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 placeholder:text-slate-400 resize-none text-sm"
                    :disabled="isLoading"
                />
              </div>
            </div>

            <!-- 头像 URL 输入 -->
            <div class="space-y-2">
              <Label htmlFor="avatar" class="text-slate-700 font-medium text-sm">Avatar URL</Label>
              <div class="relative">
                <Image class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    id="avatar"
                    v-model="form.avatar"
                    :placeholder="DEFAULT_AVATAR"
                    class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 placeholder:text-slate-400 h-9 text-sm"
                    :disabled="isLoading"
                />
              </div>
            </div>

            <!-- 邮箱输入 -->
            <div class="space-y-2">
              <Label htmlFor="email" class="text-slate-700 font-medium text-sm">Email</Label>
              <div class="relative">
                <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    id="email"
                    type="email"
                    v-model="form.email"
                    :placeholder="DEFAULT_EMAIL"
                    class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 placeholder:text-slate-400 h-9 text-sm"
                    :disabled="isLoading"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <!-- 设置按钮 -->
        <Button
            class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-11 mt-2 gap-2"
            :disabled="isLoading || !isFormValid"
            @click="handleSetup"
        >
          <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
          {{ isLoading ? 'Setting up...' : 'Complete Setup' }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
