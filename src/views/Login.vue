<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { toast } from 'vue-sonner';
import { Loader2, User, Lock, Eye, EyeOff } from 'lucide-vue-next';

// Shadcn 组件
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

// ========== 状态定义 ==========
const router = useRouter();
const userStore = useUserStore();

const form = ref({
  username: '',
  password: '',
  remember: false,
});

const isLoading = ref(false);
const showPassword = ref(false);

// ========== 方法 ==========

/**
 * 处理登录逻辑
 */
const handleLogin = async () => {
  // 表单验证
  if (!form.value.username || !form.value.password) {
    toast.warning('请输入用户名和密码');
    return;
  }

  isLoading.value = true;

  try {
    // 调用 Store 的登录方法
    await userStore.login({
      username: form.value.username,
      password: form.value.password,
    });

    toast.success('登录成功！');

    // 跳转到首页
    await router.push('/');
  } catch (error) {
    // 错误已在拦截器中处理（弹出 Toast），这里只需重置状态
    console.error('Login failed:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
    <!-- 装饰背景 -->
    <div class="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-size-[32px_32px] opacity-60"></div>

    <!-- 登录卡片 -->
    <Card class="w-full max-w-md shadow-xl z-10 border-slate-200/60 bg-white/95 backdrop-blur-sm">
      <CardHeader class="text-center space-y-2 pb-4 mt-2">
        <!-- Logo -->
        <div class="mx-auto w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl mb-2 shadow-lg">
          K
        </div>
        <CardTitle class="text-2xl font-bold font-serif text-slate-800">Welcome Back</CardTitle>
        <CardDescription class="text-slate-500">Sign in to manage your blog system</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- 用户名输入 -->
        <div class="space-y-2">
          <Label htmlFor="username" class="text-slate-700 font-medium">Account</Label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                id="username"
                v-model="form.username"
                placeholder="Enter your username"
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10"
                :disabled="isLoading"
                @keyup.enter="handleLogin"
            />
          </div>
        </div>

        <!-- 密码输入 -->
        <div class="space-y-2">
          <Label htmlFor="password" class="text-slate-700 font-medium">Password</Label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                placeholder="Enter your password"
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 pr-10"
                :disabled="isLoading"
                @keyup.enter="handleLogin"
            />
            <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                :disabled="isLoading"
            >
              <Eye v-if="!showPassword" class="h-4 w-4" />
              <EyeOff v-else class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- 记住我 -->
        <div class="flex items-center space-x-2 py-1">
          <Checkbox
              id="remember"
              :checked="form.remember"
              @update:checked="(val: boolean) => form.remember = val as boolean"
          />
          <label
              for="remember"
              class="text-sm text-slate-600 font-medium cursor-pointer select-none"
          >
            Remember me
          </label>
        </div>

        <!-- 登录按钮 -->
        <Button
            class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-11 mt-2"
            :disabled="isLoading"
            @click="handleLogin"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </Button>

            <!-- 底部提示 -->
            <p class="text-center text-xs text-slate-400 mt-4">
              Powered by Kome Blog System ·
              <a href="https://your-blog-url.com" target="_blank" class="text-slate-600 hover:text-slate-900 underline transition-colors">
                Visit My Blog
              </a>
            </p>
      </CardContent>
    </Card>
  </div>
</template>