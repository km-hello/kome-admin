<!-- src/views/Settings.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useUserStore } from '@/stores/user';
import {
  getUserInfoApi,
  type UserInfoResponse,
  type UserUpdateRequest,
  type UserUpdatePasswordRequest,
} from '@/api/user';

// 图标
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCog,
  Image,
  FileText,
} from 'lucide-vue-next';

// 通用组件
import PageHeader from '@/components/common/PageHeader.vue';

// Shadcn 组件
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ========== 状态定义 ==========

const router = useRouter();
const userStore = useUserStore();

// 用户信息
const userInfo = ref<UserInfoResponse>({
  id: 0,
  username: '',
  nickname: '',
  avatar: '',
  email: '',
  description: '',
});

// 加载状态
const loading = ref(true);
const profileLoading = ref(false);
const passwordLoading = ref(false);

// 个人资料表单
const profileForm = ref<UserUpdateRequest>({
  username: '',
  nickname: '',
  avatar: '',
  email: '',
  description: '',
});

// 密码表单
const passwordForm = ref<UserUpdatePasswordRequest>({
  oldPassword: '',
  newPassword: '',
});
const confirmPassword = ref('');

// 密码可见性
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// 计算属性：检查个人资料是否有变化
const profileHasChanges = computed(() => {
  return (
      profileForm.value.username !== userInfo.value.username ||
      profileForm.value.nickname !== userInfo.value.nickname ||
      profileForm.value.avatar !== userInfo.value.avatar ||
      profileForm.value.email !== userInfo.value.email ||
      profileForm.value.description !== (userInfo.value.description || '')
  );
});

// ========== 生命周期 ==========

onMounted(async () => {
  await fetchUserInfo();
});

// ========== 方法 ==========

/**
 * 获取用户信息
 */
const fetchUserInfo = async () => {
  loading.value = true;
  try {
    const data = await getUserInfoApi();
    userInfo.value = data;

    // 初始化表单数据
    profileForm.value = {
      username: data.username,
      nickname: data.nickname,
      avatar: data.avatar || '',
      email: data.email || '',
      description: data.description || '',
    };
  } catch (error) {
    console.error('Failed to fetch user info:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 验证个人资料表单
 */
const validateProfileForm = (): boolean => {
  // 用户名验证
  if (!profileForm.value.username?.trim()) {
    toast.warning('用户名不能为空');
    return false;
  }

  if (profileForm.value.username.length < 4 || profileForm.value.username.length > 50) {
    toast.warning('用户名长度需在 4-50 个字符之间');
    return false;
  }

  const usernamePattern = /^[a-zA-Z0-9_-]+$/;
  if (!usernamePattern.test(profileForm.value.username)) {
    toast.warning('用户名只能包含字母、数字、下划线和连字符');
    return false;
  }

  // 昵称验证
  if (profileForm.value.nickname && profileForm.value.nickname.length > 50) {
    toast.warning('昵称长度不能超过 50 个字符');
    return false;
  }

  // 头像 URL 验证
  if (profileForm.value.avatar && profileForm.value.avatar.length > 255) {
    toast.warning('头像地址长度不能超过 255 个字符');
    return false;
  }

  // 邮箱验证
  if (profileForm.value.email) {
    if (profileForm.value.email.length > 100) {
      toast.warning('邮箱长度不能超过 100 个字符');
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(profileForm.value.email)) {
      toast.warning('请输入有效的邮箱地址');
      return false;
    }
  }

  // 描述验证
  if (profileForm.value.description && profileForm.value.description.length > 255) {
    toast.warning('个人简介长度不能超过 255 个字符');
    return false;
  }

  return true;
};

/**
 * 保存个人资料
 */
const handleSaveProfile = async () => {
  if (!validateProfileForm()) return;

  profileLoading.value = true;
  try {
    // 通过 Store 统一更新用户信息
    const data = await userStore.updateProfile({
      username: profileForm.value.username?.trim(),
      nickname: profileForm.value.nickname?.trim() || undefined,
      avatar: profileForm.value.avatar?.trim() || undefined,
      email: profileForm.value.email?.trim() || undefined,
      description: profileForm.value.description?.trim() || undefined,
    });

    // 更新本地页面数据
    userInfo.value = data;
    profileForm.value = {
      username: data.username,
      nickname: data.nickname,
      avatar: data.avatar || '',
      email: data.email || '',
      description: data.description || '',
    };

    toast.success('个人资料更新成功');
  } catch (error) {
    console.error('Failed to update profile:', error);
  } finally {
    profileLoading.value = false;
  }
};

/**
 * 验证密码表单
 */
const validatePasswordForm = (): boolean => {
  if (!passwordForm.value.oldPassword) {
    toast.warning('请输入当前密码');
    return false;
  }

  if (!passwordForm.value.newPassword) {
    toast.warning('请输入新密码');
    return false;
  }

  // 密码格式验证：至少包含字母、数字和特殊字符，长度 8-64
  const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,64}$/;
  if (!passwordPattern.test(passwordForm.value.newPassword)) {
    toast.warning('新密码需要 8-64 位，且包含字母、数字和特殊字符');
    return false;
  }

  if (passwordForm.value.newPassword !== confirmPassword.value) {
    toast.warning('两次输入的新密码不一致');
    return false;
  }

  if (passwordForm.value.oldPassword === passwordForm.value.newPassword) {
    toast.warning('新密码不能与当前密码相同');
    return false;
  }

  return true;
};

/**
 * 修改密码
 */
const handleChangePassword = async () => {
  if (!validatePasswordForm()) return;

  passwordLoading.value = true;
  try {
    // 通过 Store 修改密码（会自动清除登录状态）
    await userStore.updatePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    });

    toast.success('密码修改成功，请重新登录');

    // 跳转到登录页
    await router.push('/login');
  } catch (error) {
    console.error('Failed to change password:', error);
  } finally {
    passwordLoading.value = false;
  }
};

/**
 * 重置个人资料表单
 */
const resetProfileForm = () => {
  profileForm.value = {
    username: userInfo.value.username,
    nickname: userInfo.value.nickname,
    avatar: userInfo.value.avatar || '',
    email: userInfo.value.email || '',
    description: userInfo.value.description || '',
  };
};
</script>


<template>
  <div class="space-y-6">
    <!-- ========== 页面标题 ========== -->
    <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-slate-400" />
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-3">
      <!-- ========== 左侧：设置表单 ========== -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 个人资料设置 -->
        <Card>
          <CardHeader class="border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <UserCog class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle class="text-lg font-bold text-slate-800">Profile Settings</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent class="pt-6 space-y-4">
            <!-- 用户名 -->
            <div class="space-y-2">
              <Label htmlFor="username">
                <div class="flex items-center gap-2">
                  <User class="w-4 h-4 text-slate-500" />
                  Username <span class="text-red-500">*</span>
                </div>
              </Label>
              <Input
                  id="username"
                  v-model="profileForm.username"
                  placeholder="Enter username (4-50 characters)"
                  maxlength="50"
                  :disabled="profileLoading"
              />
              <p class="text-xs text-slate-500">
                Only letters, numbers, underscores and hyphens allowed
              </p>
            </div>

            <!-- 昵称 -->
            <div class="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                  id="nickname"
                  v-model="profileForm.nickname"
                  placeholder="Enter display name"
                  maxlength="50"
                  :disabled="profileLoading"
              />
            </div>

            <!-- 头像 URL -->
            <div class="space-y-2">
              <Label htmlFor="avatar">
                <div class="flex items-center gap-2">
                  <Image class="w-4 h-4 text-slate-500" />
                  Avatar URL
                </div>
              </Label>
              <Input
                  id="avatar"
                  v-model="profileForm.avatar"
                  placeholder="https://example.com/avatar.jpg"
                  maxlength="255"
                  :disabled="profileLoading"
              />
            </div>

            <!-- 邮箱 -->
            <div class="space-y-2">
              <Label htmlFor="email">
                <div class="flex items-center gap-2">
                  <Mail class="w-4 h-4 text-slate-500" />
                  Email
                </div>
              </Label>
              <Input
                  id="email"
                  type="email"
                  v-model="profileForm.email"
                  placeholder="admin@example.com"
                  maxlength="100"
                  :disabled="profileLoading"
              />
            </div>

            <!-- 个人简介 -->
            <div class="space-y-2">
              <Label htmlFor="description">
                <div class="flex items-center gap-2">
                  <FileText class="w-4 h-4 text-slate-500" />
                  Bio
                </div>
              </Label>
              <Textarea
                  id="description"
                  v-model="profileForm.description"
                  placeholder="Tell us about yourself..."
                  maxlength="255"
                  rows="3"
                  :disabled="profileLoading"
              />
              <p class="text-xs text-slate-500">
                {{ profileForm.description?.length || 0 }}/255 characters
              </p>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center justify-end gap-3 pt-2">
              <Button
                  variant="outline"
                  @click="resetProfileForm"
                  :disabled="profileLoading || !profileHasChanges"
              >
                Reset
              </Button>
              <Button
                  class="bg-slate-900 hover:bg-slate-800 gap-2"
                  @click="handleSaveProfile"
                  :disabled="profileLoading || !profileHasChanges"
              >
                <Loader2 v-if="profileLoading" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- 密码设置 -->
        <Card>
          <CardHeader class="border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <ShieldCheck class="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle class="text-lg font-bold text-slate-800">Change Password</CardTitle>
                <CardDescription>Ensure your account is using a strong password</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent class="pt-6 space-y-4">
            <!-- 当前密码 -->
            <div class="space-y-2">
              <Label htmlFor="oldPassword">
                <div class="flex items-center gap-2">
                  <Lock class="w-4 h-4 text-slate-500" />
                  Current Password <span class="text-red-500">*</span>
                </div>
              </Label>
              <div class="relative">
                <Input
                    id="oldPassword"
                    :type="showOldPassword ? 'text' : 'password'"
                    v-model="passwordForm.oldPassword"
                    placeholder="Enter current password"
                    :disabled="passwordLoading"
                    class="pr-10"
                />
                <button
                    type="button"
                    @click="showOldPassword = !showOldPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    :disabled="passwordLoading"
                >
                  <Eye v-if="!showOldPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- 新密码 -->
            <div class="space-y-2">
              <Label htmlFor="newPassword">
                <div class="flex items-center gap-2">
                  <Lock class="w-4 h-4 text-slate-500" />
                  New Password <span class="text-red-500">*</span>
                </div>
              </Label>
              <div class="relative">
                <Input
                    id="newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    v-model="passwordForm.newPassword"
                    placeholder="Enter new password"
                    :disabled="passwordLoading"
                    class="pr-10"
                />
                <button
                    type="button"
                    @click="showNewPassword = !showNewPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    :disabled="passwordLoading"
                >
                  <Eye v-if="!showNewPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
              <p class="text-xs text-slate-500">
                Password must be 8-64 characters and contain letters, numbers, and special characters
              </p>
            </div>

            <!-- 确认新密码 -->
            <div class="space-y-2">
              <Label htmlFor="confirmPassword">
                <div class="flex items-center gap-2">
                  <Lock class="w-4 h-4 text-slate-500" />
                  Confirm New Password <span class="text-red-500">*</span>
                </div>
              </Label>
              <div class="relative">
                <Input
                    id="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    v-model="confirmPassword"
                    placeholder="Confirm new password"
                    :disabled="passwordLoading"
                    class="pr-10"
                />
                <button
                    type="button"
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    :disabled="passwordLoading"
                >
                  <Eye v-if="!showConfirmPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center justify-end pt-2">
              <Button
                  class="bg-amber-600 hover:bg-amber-700 gap-2"
                  @click="handleChangePassword"
                  :disabled="passwordLoading"
              >
                <Loader2 v-if="passwordLoading" class="w-4 h-4 animate-spin" />
                <Lock v-else class="w-4 h-4" />
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- ========== 右侧：用户头像卡片 ========== -->
      <div class="lg:col-span-1">
        <Card class="lg:sticky lg:top-6">
          <CardContent class="pt-6">
            <div class="flex flex-col items-center text-center">
              <!-- 头像 -->
              <div class="relative group">
                <img
                    :src="profileForm.avatar"
                    :alt="userInfo.nickname"
                    class="w-28 h-28 rounded-full bg-slate-100 border-4 border-slate-200 object-cover"
                />
                <div
                    class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Image class="w-6 h-6 text-white" />
                </div>
              </div>

              <!-- 用户信息 -->
              <h3 class="mt-4 text-lg font-bold text-slate-900">
                {{ userInfo.nickname || userInfo.username }}
              </h3>
              <p class="text-sm text-slate-500">@{{ userInfo.username }}</p>

              <!-- 邮箱 -->
              <div v-if="userInfo.email" class="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <Mail class="w-4 h-4" />
                <span>{{ userInfo.email }}</span>
              </div>

              <!-- 简介 -->
              <p v-if="userInfo.description" class="mt-3 text-sm text-slate-600 px-4">
                {{ userInfo.description }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>