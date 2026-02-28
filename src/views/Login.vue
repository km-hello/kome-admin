<!-- Login.vue - 登录页面 -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { toast } from 'vue-sonner';
import { Loader2, User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const router = useRouter();
const userStore = useUserStore();

/**
 * 登录表单数据
 */
const form = ref({
  username: '',
  password: '',
  remember: false,
});

/**
 * 加载状态
 */
const isLoading = ref(false);

/**
 * 是否显示密码
 */
const showPassword = ref(false);

/**
 * 异步处理用户登录的回调函数。
 *
 * 此函数主要负责表单验证、调用用户登录接口，并根据登录结果更新页面状态。
 *
 * 核心逻辑：
 * 1. 验证表单是否填写用户名和密码，若未填写则提示警告信息并停止执行。
 * 2. 设置加载状态为 `true`，以显示页面加载效果。
 * 3. 调用用户状态管理的 `login` 方法，传递登录凭据和附加选项（如记住登录状态）。
 * 4. 根据登录结果：
 *    - 成功：提示用户登录成功，并跳转到首页。
 *    - 失败：错误处理已在拦截器中实现，此处仅打印错误日志并重置状态。
 * 5. 无论成功或失败，重置页面加载状态。
 *
 * @async
 * @function handleLogin
 * @returns {Promise<void>} 返回一个 Promise，并在异步操作完成时结束。
 */
const handleLogin = async (): Promise<void> => {
  // 表单验证
  if (!form.value.username || !form.value.password) {
    toast.warning('请输入用户名和密码');
    return;
  }

  isLoading.value = true;

  try {
    // 调用 store 的 login 方法，传入 remember 参数
    await userStore.login(
        {
          username: form.value.username,
          password: form.value.password
        },
        form.value.remember
    );

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
  <div class="h-screen w-full flex items-center justify-center bg-background relative overflow-hidden px-5">
    <!-- 装饰背景 -->
    <div class="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-size-[32px_32px] opacity-60"></div>

    <!-- 登录卡片 -->
    <Card class="w-full max-w-md shadow-xl z-10 bg-white/95 backdrop-blur-sm">
      <CardHeader class="text-center space-y-2 pb-4 mt-2">
        <!-- Logo -->
        <div class="mx-auto w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-2 shadow-lg">
          K
        </div>
        <CardTitle class="text-2xl font-bold text-slate-800">Welcome Back</CardTitle>
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
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 placeholder:text-slate-400"
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
                class="bg-slate-50 border-slate-200 focus:border-slate-400 pl-10 pr-10 placeholder:text-slate-400"
                :disabled="isLoading"
                @keyup.enter="handleLogin"
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
        </div>

        <!-- 记住我 -->
        <div class="flex items-center space-x-2 py-1">
          <Checkbox id="remember" v-model="form.remember" />
          <label
              for="remember"
              class="text-sm text-slate-700 font-medium cursor-pointer select-none"
          >
            Remember me for 3 days
          </label>
        </div>

        <!-- 登录按钮 -->
        <Button
            class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-11 mt-2 gap-2"
            :disabled="isLoading"
            @click="handleLogin"
        >
          <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </Button>


        <!-- 底部提示 -->
        <div class="text-center">
          <a
              href="/"
              class="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-800 transition-colors group"
          >
            <ArrowLeft class="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </a>
        </div>
      </CardContent>
    </Card>
  </div>
</template>