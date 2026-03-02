<!-- Settings.vue - 系统设置页面 -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
import {
  getUserInfoApi,
  type UserInfoResponse,
  type UserUpdateRequest,
  type UserUpdatePasswordRequest,
  type SocialLink,
  type SkillItem,
} from '@/api/user';

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
  Link2,
  Plus,
  Trash2,
  Globe,
  Rss,
  Home,
  Link as LinkIcon,
  X,
  Zap,
} from 'lucide-vue-next';
import { IconGithub, IconX } from '@/components/icons/BrandIcons';

import PageHeader from '@/components/common/PageHeader.vue';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * 可选平台列表
 */
const platformOptions = [
  { value: 'github', label: 'GitHub' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'email', label: 'Email' },
  { value: 'homepage', label: 'Homepage' },
  { value: 'website', label: 'Website' },
  { value: 'rss', label: 'RSS' },
];

const { t } = useI18n();

/**
 * 技能等级选项
 */
const skillLevelOptions = computed(() => [
  { value: '1', label: t('settings.skillLevel.basic') },
  { value: '2', label: t('settings.skillLevel.familiar') },
  { value: '3', label: t('settings.skillLevel.proficient') },
]);

/**
 * 平台图标映射（用于预览）
 */
const iconMap: Record<string, any> = {
  github: IconGithub,
  twitter: IconX,
  email: Mail,
  homepage: Home,
  website: Globe,
  rss: Rss,
};

/**
 * 获取平台图标
 */
const getIcon = (platform: string) => iconMap[platform] || LinkIcon;

/**
 * 判断链接是否可点击
 */
const isClickable = (url: string) => url && url !== '#';


const router = useRouter();
const userStore = useUserStore();

/**
 * 用户信息
 */
const userInfo = ref<UserInfoResponse>({
  id: 0,
  username: '',
  nickname: '',
  avatar: '',
  email: '',
  description: '',
  socialLinks: [],
});

/**
 * 加载状态
 */
const loading = ref(true);
const profileLoading = ref(false);
const passwordLoading = ref(false);
const socialLinksLoading = ref(false);
const skillsLoading = ref(false);

/**
 * 个人资料表单
 */
const profileForm = ref<UserUpdateRequest>({
  username: '',
  nickname: '',
  avatar: '',
  email: '',
  description: '',
});

/**
 * 社交链接表单
 */
const socialLinksForm = ref<SocialLink[]>([]);

/**
 * 技能表单
 */
const skillsForm = ref<SkillItem[]>([]);

/**
 * 密码表单
 */
const passwordForm = ref<UserUpdatePasswordRequest>({
  oldPassword: '',
  newPassword: '',
});
const confirmPassword = ref('');

/**
 * 密码可见性
 */
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

/**
 * 计算属性：检查个人资料是否有变化
 */
const profileHasChanges = computed(() => {
  return (
      profileForm.value.username !== userInfo.value.username ||
      profileForm.value.nickname !== userInfo.value.nickname ||
      profileForm.value.avatar !== userInfo.value.avatar ||
      profileForm.value.email !== userInfo.value.email ||
      profileForm.value.description !== (userInfo.value.description || '')
  );
});

/**
 * 计算属性：检查社交链接是否有变化
 */
const socialLinksHasChanges = computed(() => {
  const original = userInfo.value.socialLinks || [];
  const current = socialLinksForm.value;

  if (original.length !== current.length) return true;

  for (let i = 0; i < original.length; i++) {
    const orig = original[i];
    const curr = current[i];
    if (orig?.platform !== curr?.platform || orig?.url !== curr?.url) {
      return true;
    }
  }
  return false;
});

/**
 * 计算属性：检查技能列表是否有变化
 */
const skillsHasChanges = computed(() => {
  const original = userInfo.value.skills || [];
  const current = skillsForm.value;

  if (original.length !== current.length) return true;

  for (let i = 0; i < original.length; i++) {
    const orig = original[i];
    const curr = current[i];
    if (orig?.name !== curr?.name || orig?.level !== curr?.level || orig?.order !== curr?.order) {
      return true;
    }
  }
  return false;
});


onMounted(async () => {
  await fetchUserInfo();
});


/**
 * 获取用户信息。
 * 加载用户数据并初始化个人资料、社交链接和技能表单。
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

    // 初始化社交链接表单（深拷贝）
    socialLinksForm.value = data.socialLinks
        ? data.socialLinks.map(link => ({ ...link }))
        : [];

    // 初始化技能表单（深拷贝）
    skillsForm.value = data.skills
        ? data.skills.map(skill => ({ ...skill }))
        : [];
  } catch (error) {
    console.error('Failed to fetch user info:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 验证个人资料表单。
 * 检查用户名、昵称、头像、邮箱和简介的格式与长度要求。
 */
const validateProfileForm = (): boolean => {
  // 用户名验证
  if (!profileForm.value.username?.trim()) {
    toast.warning(t('settings.validation.usernameRequired'));
    return false;
  }

  if (profileForm.value.username.length < 4 || profileForm.value.username.length > 50) {
    toast.warning(t('settings.validation.usernameLength'));
    return false;
  }

  const usernamePattern = /^[a-zA-Z0-9_-]+$/;
  if (!usernamePattern.test(profileForm.value.username)) {
    toast.warning(t('settings.validation.usernameInvalid'));
    return false;
  }

  // 昵称验证
  if (profileForm.value.nickname && profileForm.value.nickname.length > 50) {
    toast.warning(t('settings.validation.nicknameTooLong'));
    return false;
  }

  // 头像 URL 验证
  if (profileForm.value.avatar && profileForm.value.avatar.length > 255) {
    toast.warning(t('settings.validation.avatarTooLong'));
    return false;
  }

  // 邮箱验证
  if (profileForm.value.email) {
    if (profileForm.value.email.length > 100) {
      toast.warning(t('settings.validation.emailTooLong'));
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(profileForm.value.email)) {
      toast.warning(t('settings.validation.emailInvalid'));
      return false;
    }
  }

  // 描述验证
  if (profileForm.value.description && profileForm.value.description.length > 255) {
    toast.warning(t('settings.validation.descriptionTooLong'));
    return false;
  }

  return true;
};

/**
 * 保存个人资料。
 * 验证后通过 Store 统一更新用户信息并同步本地数据。
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

    toast.success(t('settings.profileUpdateSuccess'));
  } catch (error) {
    console.error('Failed to update profile:', error);
  } finally {
    profileLoading.value = false;
  }
};

/**
 * 验证密码表单。
 * 检查旧密码、新密码格式（8-64 位含字母数字特殊字符）和两次输入一致性。
 */
const validatePasswordForm = (): boolean => {
  if (!passwordForm.value.oldPassword) {
    toast.warning(t('settings.validation.currentPasswordRequired'));
    return false;
  }

  if (!passwordForm.value.newPassword) {
    toast.warning(t('settings.validation.newPasswordRequired'));
    return false;
  }

  // 密码格式验证：至少包含字母、数字和特殊字符，长度 8-64
  const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,64}$/;
  if (!passwordPattern.test(passwordForm.value.newPassword)) {
    toast.warning(t('settings.validation.passwordInvalid'));
    return false;
  }

  if (passwordForm.value.newPassword !== confirmPassword.value) {
    toast.warning(t('settings.validation.passwordMismatch'));
    return false;
  }

  if (passwordForm.value.oldPassword === passwordForm.value.newPassword) {
    toast.warning(t('settings.validation.passwordSameAsOld'));
    return false;
  }

  return true;
};

/**
 * 修改密码。
 * 通过 Store 修改密码（自动清除登录状态），成功后跳转到登录页。
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

    toast.success(t('settings.passwordUpdateSuccess'));

    // 跳转到登录页
    await router.push('/login');
  } catch (error) {
    console.error('Failed to change password:', error);
  } finally {
    passwordLoading.value = false;
  }
};

/**
 * 重置个人资料表单为服务端原始数据
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


/**
 * 添加社交链接。
 * 在表单末尾追加一条默认 GitHub 平台的空链接。
 */
const addSocialLink = () => {
  socialLinksForm.value.push({ platform: 'github', url: '' });
};

/**
 * 删除社交链接。
 *
 * @param index 待删除的链接索引
 */
const removeSocialLink = (index: number) => {
  socialLinksForm.value.splice(index, 1);
};

/**
 * 重置社交链接表单为服务端原始数据
 */
const resetSocialLinksForm = () => {
  socialLinksForm.value = userInfo.value.socialLinks
      ? userInfo.value.socialLinks.map(link => ({ ...link }))
      : [];
};

/**
 * 保存社交链接。
 * 通过 Store 更新社交链接并同步本地数据。
 */
const handleSaveSocialLinks = async () => {
  socialLinksLoading.value = true;
  try {
    const data = await userStore.updateProfile({
      socialLinks: socialLinksForm.value,
    });

    // 更新本地数据
    userInfo.value.socialLinks = data.socialLinks;
    socialLinksForm.value = data.socialLinks
        ? data.socialLinks.map(link => ({ ...link }))
        : [];

    toast.success(t('settings.socialLinksUpdateSuccess'));
  } catch (error) {
    console.error('Failed to update social links:', error);
  } finally {
    socialLinksLoading.value = false;
  }
};


/**
 * 技能等级配置（与 blog 端 SkillCard 保持一致）
 */
const skillLevelConfig = computed(() => [
  {
    level: 3,
    label: t('settings.skillLevel.proficient'),
    tagClass: 'bg-slate-500/15 text-slate-700 border border-slate-300',
    editTextClass: 'text-slate-700',
    dotClass: 'bg-slate-500',
  },
  {
    level: 2,
    label: t('settings.skillLevel.familiar'),
    tagClass: 'bg-slate-400/10 text-slate-500 border border-slate-200',
    editTextClass: 'text-slate-500',
    dotClass: 'bg-slate-300',
  },
  {
    level: 1,
    label: t('settings.skillLevel.basic'),
    tagClass: 'bg-slate-50 text-slate-400 border border-slate-100',
    editTextClass: 'text-slate-400',
    dotClass: 'bg-slate-200',
  },
]);

/**
 * 按等级分组的技能列表（始终显示全部三组作为拖放目标）
 */
const skillLevelGroups = computed(() =>
  skillLevelConfig.value.map(config => ({
    ...config,
    items: skillsForm.value
      .map((skill, index) => ({ skill, index }))
      .filter(item => item.skill.level === config.level),
  }))
);

/**
 * 当前正在编辑的技能索引
 */
const editingSkillIndex = ref<number | null>(null);

/**
 * 拖拽状态
 */
const draggingSkillIndex = ref<number | null>(null);
const dragOverLevel = ref<number | null>(null);
const dropTargetIndex = ref<number | null>(null);
const dropPosition = ref<'before' | 'after' | null>(null);

/**
 * 开始拖拽技能标签。
 *
 * @param index 被拖拽的技能索引
 */
const onDragStart = (index: number) => {
  draggingSkillIndex.value = index;
};

/**
 * 拖拽结束，重置所有拖拽状态
 */
const onDragEnd = () => {
  draggingSkillIndex.value = null;
  dragOverLevel.value = null;
  dropTargetIndex.value = null;
  dropPosition.value = null;
};

/**
 * 拖拽进入等级分组区域。
 *
 * @param level 目标等级
 */
const onDragEnterGroup = (level: number) => {
  dragOverLevel.value = level;
};

/**
 * 拖拽离开等级分组区域。
 * 仅当鼠标真正离开容器时才清除高亮状态。
 *
 * @param e 拖拽事件
 * @param level 当前等级
 */
const onDragLeaveGroup = (e: DragEvent, level: number) => {
  const related = e.relatedTarget as HTMLElement | null;
  const currentTarget = e.currentTarget as HTMLElement;
  if (!related || !currentTarget.contains(related)) {
    if (dragOverLevel.value === level) {
      dragOverLevel.value = null;
    }
    dropTargetIndex.value = null;
    dropPosition.value = null;
  }
};

/**
 * 拖拽经过某个技能标签时计算放置位置。
 * 根据鼠标相对标签中点的位置决定插入到前方或后方。
 *
 * @param e 拖拽事件
 * @param targetIndex 目标技能索引
 */
const onDragOverTag = (e: DragEvent, targetIndex: number) => {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const midX = rect.left + rect.width / 2;
  dropTargetIndex.value = targetIndex;
  dropPosition.value = e.clientX < midX ? 'before' : 'after';
};

/**
 * 放置技能到目标等级分组。
 * 更新技能等级并根据放置位置插入到指定索引，无具体目标时追加到该等级末尾。
 *
 * @param level 目标等级
 */
const onDropToGroup = (level: number) => {
  if (draggingSkillIndex.value === null) return;

  const dragIdx = draggingSkillIndex.value;
  const removed = skillsForm.value.splice(dragIdx, 1);
  const skill = removed[0];
  if (!skill) return;
  skill.level = level;

  if (dropTargetIndex.value !== null && dropPosition.value) {
    // 移除元素后修正目标索引
    let targetIdx = dropTargetIndex.value;
    if (dragIdx < targetIdx) targetIdx--;
    const insertIdx = dropPosition.value === 'after' ? targetIdx + 1 : targetIdx;
    skillsForm.value.splice(insertIdx, 0, skill);
  } else {
    // 无具体目标，追加到该等级最后一项之后
    const lastIdx = skillsForm.value.map((s, i) => ({ s, i }))
      .filter(x => x.s.level === level)
      .pop()?.i;
    if (lastIdx !== undefined) {
      skillsForm.value.splice(lastIdx + 1, 0, skill);
    } else {
      skillsForm.value.push(skill);
    }
  }

  draggingSkillIndex.value = null;
  dragOverLevel.value = null;
  dropTargetIndex.value = null;
  dropPosition.value = null;
};

/**
 * 新技能名称输入
 */
const newSkillName = ref('');
/**
 * 新技能等级选择
 */
const newSkillLevel = ref('2');

/**
 * 快速添加技能。
 * 将输入的技能名称和等级追加到表单末尾。
 */
const addSkillQuick = () => {
  const name = newSkillName.value.trim();
  if (!name) return;
  skillsForm.value.push({ name, level: Number(newSkillLevel.value), order: skillsForm.value.length });
  newSkillName.value = '';
};

/**
 * 删除技能。
 *
 * @param index 待删除的技能索引
 */
const removeSkill = (index: number) => {
  skillsForm.value.splice(index, 1);
};

/**
 * 重置技能表单为服务端原始数据
 */
const resetSkillsForm = () => {
  skillsForm.value = userInfo.value.skills
      ? userInfo.value.skills.map(skill => ({ ...skill }))
      : [];
};

/**
 * 保存技能列表。
 * 自动按数组位置分配排序值，通过 Store 更新并同步本地数据。
 */
const handleSaveSkills = async () => {
  skillsLoading.value = true;
  try {
    // 按数组位置自动分配排序值
    skillsForm.value.forEach((s, i) => s.order = i);

    const data = await userStore.updateProfile({
      skills: skillsForm.value,
    });

    // 更新本地数据
    userInfo.value.skills = data.skills;
    skillsForm.value = data.skills
        ? data.skills.map(skill => ({ ...skill }))
        : [];

    toast.success(t('settings.skillsUpdateSuccess'));
  } catch (error) {
    console.error('Failed to update skills:', error);
  } finally {
    skillsLoading.value = false;
  }
};
</script>


<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <PageHeader
        :title="t('settings.title')"
        :description="t('settings.description')"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center gap-2 py-20">
      <Loader2 class="w-8 h-8 animate-spin text-slate-400" />
      <span class="text-sm text-slate-400">{{ t('settings.loading') }}</span>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-3">
      <!-- 左侧：设置表单（lg 占 2 栏） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 个人资料设置 -->
        <Card>
          <CardHeader class="border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <UserCog class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle class="text-lg font-bold text-slate-800">{{ t('settings.profileSettings') }}</CardTitle>
                <CardDescription>{{ t('settings.profileDescription') }}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent class="space-y-4">
            <!-- 用户名 -->
            <div class="space-y-2">
              <Label htmlFor="username">
                <div class="flex items-center gap-2">
                  <User class="w-4 h-4 text-slate-500" />
                  {{ t('settings.usernameLabel') }} <span class="text-red-500">*</span>
                </div>
              </Label>
              <Input
                  id="username"
                  v-model="profileForm.username"
                  :placeholder="t('settings.usernamePlaceholder')"
                  maxlength="50"
                  :disabled="profileLoading"
              />
              <p class="text-xs text-slate-500">
                {{ t('settings.usernameHint') }}
              </p>
            </div>

            <!-- 昵称 -->
            <div class="space-y-2">
              <Label htmlFor="nickname">{{ t('settings.nicknameLabel') }}</Label>
              <Input
                  id="nickname"
                  v-model="profileForm.nickname"
                  :placeholder="t('settings.nicknamePlaceholder')"
                  maxlength="50"
                  :disabled="profileLoading"
              />
            </div>

            <!-- 头像 URL -->
            <div class="space-y-2">
              <Label htmlFor="avatar">
                <div class="flex items-center gap-2">
                  <Image class="w-4 h-4 text-slate-500" />
                  {{ t('settings.avatarUrlLabel') }}
                </div>
              </Label>
              <Input
                  id="avatar"
                  v-model="profileForm.avatar"
                  :placeholder="t('settings.avatarUrlPlaceholder')"
                  maxlength="255"
                  :disabled="profileLoading"
              />
            </div>

            <!-- 邮箱 -->
            <div class="space-y-2">
              <Label htmlFor="email">
                <div class="flex items-center gap-2">
                  <Mail class="w-4 h-4 text-slate-500" />
                  {{ t('settings.emailLabel') }}
                </div>
              </Label>
              <Input
                  id="email"
                  type="email"
                  v-model="profileForm.email"
                  :placeholder="t('settings.emailPlaceholder')"
                  maxlength="100"
                  :disabled="profileLoading"
              />
            </div>

            <!-- 个人简介 -->
            <div class="space-y-2">
              <Label htmlFor="description">
                <div class="flex items-center gap-2">
                  <FileText class="w-4 h-4 text-slate-500" />
                  {{ t('settings.bioLabel') }}
                </div>
              </Label>
              <Textarea
                  id="description"
                  v-model="profileForm.description"
                  :placeholder="t('settings.bioPlaceholder')"
                  maxlength="255"
                  rows="3"
                  :disabled="profileLoading"
              />
              <p class="text-xs text-slate-500">
                {{ profileForm.description?.length || 0 }}/255 {{ t('common.characters') }}
              </p>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center justify-end gap-3 pt-2">
              <Button
                  variant="outline"
                  @click="resetProfileForm"
                  :disabled="profileLoading || !profileHasChanges"
              >
                {{ t('settings.reset') }}
              </Button>
              <Button
                  class="bg-slate-900 hover:bg-slate-800 gap-2"
                  @click="handleSaveProfile"
                  :disabled="profileLoading || !profileHasChanges"
              >
                <Loader2 v-if="profileLoading" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                {{ t('settings.saveChanges') }}
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- 社交链接设置 -->
        <Card>
          <CardHeader class="border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Link2 class="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle class="text-lg font-bold text-slate-800">{{ t('settings.socialLinks') }}</CardTitle>
                <CardDescription>{{ t('settings.socialLinksDescription') }}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent class="space-y-4">
            <!-- 社交链接列表 -->
            <div v-if="socialLinksForm.length > 0" class="space-y-3">
              <div
                  v-for="(link, index) in socialLinksForm"
                  :key="index"
                  class="flex flex-wrap items-center gap-2 sm:gap-3"
              >
                <!-- 平台选择 -->
                <Select v-model="link.platform" :disabled="socialLinksLoading">
                  <SelectTrigger class="w-full sm:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                        v-for="option in platformOptions"
                        :key="option.value"
                        :value="option.value"
                    >
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <!-- URL 输入 -->
                <Input
                    v-model="link.url"
                    :placeholder="t('settings.socialUrlPlaceholder')"
                    class="flex-1"
                    :disabled="socialLinksLoading"
                />

                <!-- 删除按钮 -->
                <Button
                    variant="ghost"
                    size="icon"
                    @click="removeSocialLink(index)"
                    :disabled="socialLinksLoading"
                    class="text-slate-400 hover:text-red-500"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="py-6 text-center text-slate-400 text-sm">
              {{ t('settings.noSocialLinks') }}
            </div>

            <!-- 添加按钮 -->
            <Button
                variant="outline"
                @click="addSocialLink"
                :disabled="socialLinksLoading"
                class="gap-2"
            >
              <Plus class="w-4 h-4" />
              {{ t('settings.addLink') }}
            </Button>

            <!-- 操作按钮 -->
            <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                  variant="outline"
                  @click="resetSocialLinksForm"
                  :disabled="socialLinksLoading || !socialLinksHasChanges"
              >
                {{ t('settings.reset') }}
              </Button>
              <Button
                  class="bg-slate-900 hover:bg-slate-800 gap-2"
                  @click="handleSaveSocialLinks"
                  :disabled="socialLinksLoading || !socialLinksHasChanges"
              >
                <Loader2 v-if="socialLinksLoading" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                {{ t('settings.saveChanges') }}
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- 技能设置 -->
        <Card>
          <CardHeader class="border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                <Zap class="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <CardTitle class="text-lg font-bold text-slate-800">{{ t('settings.skills') }}</CardTitle>
                <CardDescription>{{ t('settings.skillsDescription') }}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent class="space-y-4">
            <!-- 技能标签展示（按等级分组，支持拖拽） -->
            <div v-if="skillsForm.length > 0 || draggingSkillIndex !== null" class="space-y-3">
              <div
                  v-for="group in skillLevelGroups"
                  :key="group.level"
                  class="rounded-lg p-3 transition-all duration-150"
                  :class="[
                    dragOverLevel === group.level && draggingSkillIndex !== null
                      ? 'bg-slate-100 ring-2 ring-slate-300 ring-dashed'
                      : 'bg-slate-50/50',
                  ]"
                  @dragover.prevent
                  @dragenter.prevent="onDragEnterGroup(group.level)"
                  @dragleave="onDragLeaveGroup($event, group.level)"
                  @drop.prevent="onDropToGroup(group.level)"
              >
                <p class="text-xs font-medium text-slate-400 mb-2">{{ group.label }}</p>
                <div class="flex flex-wrap gap-2 min-h-8">
                  <template v-for="item in group.items" :key="item.index">
                    <!-- Drop indicator before -->
                    <div
                        v-if="dropTargetIndex === item.index && dropPosition === 'before' && draggingSkillIndex !== null"
                        class="w-0.5 self-stretch rounded-full bg-blue-500 -mx-0.5"
                    />
                    <div
                        draggable="true"
                        class="group/tag flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-md transition-all cursor-grab active:cursor-grabbing"
                        :class="[
                          group.tagClass,
                          draggingSkillIndex === item.index ? 'opacity-40 scale-95' : '',
                        ]"
                        @dragstart="onDragStart(item.index)"
                        @dragend="onDragEnd"
                        @dragover.prevent="onDragOverTag($event, item.index)"
                    >
                    <!-- 编辑态 -->
                    <template v-if="editingSkillIndex === item.index">
                      <input
                          ref="skillEditInput"
                          :value="item.skill.name"
                          @input="(e: Event) => item.skill.name = (e.target as HTMLInputElement).value"
                          class="bg-transparent border-none outline-none text-sm font-medium w-20 min-w-0"
                          :class="group.editTextClass"
                          @blur="editingSkillIndex = null"
                          @keydown.enter="editingSkillIndex = null"
                          @keydown.escape="editingSkillIndex = null"
                      />
                    </template>
                    <!-- 展示态 -->
                    <template v-else>
                      <span
                          class="cursor-pointer select-none"
                          @click="editingSkillIndex = item.index"
                          :title="t('settings.clickToEdit')"
                      >
                        {{ item.skill.name || t('settings.unnamed') }}
                      </span>
                    </template>
                    <!-- 删除按钮 -->
                    <button
                        class="opacity-0 group-hover/tag:opacity-100 transition-opacity text-current hover:text-red-500 hover:scale-110"
                        @click="removeSkill(item.index)"
                        :disabled="skillsLoading"
                    >
                      <X class="w-3 h-3" />
                    </button>
                  </div>
                    <!-- Drop indicator after -->
                    <div
                        v-if="dropTargetIndex === item.index && dropPosition === 'after' && draggingSkillIndex !== null"
                        class="w-0.5 self-stretch rounded-full bg-blue-500 -mx-0.5"
                    />
                  </template>
                  <!-- 空组占位 -->
                  <span
                      v-if="group.items.length === 0"
                      class="text-xs text-slate-300 italic py-0.5"
                  >
                    {{ draggingSkillIndex !== null ? t('settings.dropHere') : t('settings.noSkills') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="py-6 text-center text-slate-400 text-sm">
              {{ t('settings.noSkillsConfigured') }}
            </div>

            <!-- 快速添加技能 -->
            <div class="flex items-center gap-2">
              <Input
                  v-model="newSkillName"
                  :placeholder="t('settings.newSkillPlaceholder')"
                  class="flex-1"
                  :disabled="skillsLoading"
                  @keydown.enter="addSkillQuick"
              />
              <Select v-model="newSkillLevel" :disabled="skillsLoading">
                <SelectTrigger class="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                      v-for="option in skillLevelOptions"
                      :key="option.value"
                      :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                  variant="outline"
                  size="icon"
                  @click="addSkillQuick"
                  :disabled="skillsLoading || !newSkillName.trim()"
                  :title="t('settings.addSkill')"
              >
                <Plus class="w-4 h-4" />
              </Button>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                  variant="outline"
                  @click="resetSkillsForm"
                  :disabled="skillsLoading || !skillsHasChanges"
              >
                {{ t('settings.reset') }}
              </Button>
              <Button
                  class="bg-slate-900 hover:bg-slate-800 gap-2"
                  @click="handleSaveSkills"
                  :disabled="skillsLoading || !skillsHasChanges"
              >
                <Loader2 v-if="skillsLoading" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                {{ t('settings.saveChanges') }}
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
                <CardTitle class="text-lg font-bold text-slate-800">{{ t('settings.changePassword') }}</CardTitle>
                <CardDescription>{{ t('settings.changePasswordDescription') }}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent class="space-y-4">
            <!-- 当前密码 -->
            <div class="space-y-2">
              <Label htmlFor="oldPassword">
                <div class="flex items-center gap-2">
                  <Lock class="w-4 h-4 text-slate-500" />
                  {{ t('settings.currentPassword') }} <span class="text-red-500">*</span>
                </div>
              </Label>
              <div class="relative">
                <Input
                    id="oldPassword"
                    :type="showOldPassword ? 'text' : 'password'"
                    v-model="passwordForm.oldPassword"
                    :placeholder="t('settings.currentPasswordPlaceholder')"
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
                  {{ t('settings.newPassword') }} <span class="text-red-500">*</span>
                </div>
              </Label>
              <div class="relative">
                <Input
                    id="newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    v-model="passwordForm.newPassword"
                    :placeholder="t('settings.newPasswordPlaceholder')"
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
                {{ t('settings.newPasswordHint') }}
              </p>
            </div>

            <!-- 确认新密码 -->
            <div class="space-y-2">
              <Label htmlFor="confirmPassword">
                <div class="flex items-center gap-2">
                  <Lock class="w-4 h-4 text-slate-500" />
                  {{ t('settings.confirmNewPassword') }} <span class="text-red-500">*</span>
                </div>
              </Label>
              <div class="relative">
                <Input
                    id="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    v-model="confirmPassword"
                    :placeholder="t('settings.confirmNewPasswordPlaceholder')"
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
                {{ t('settings.updatePassword') }}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 右侧：用户头像卡片（lg sticky 定位） -->
      <div class="lg:col-span-1">
        <Card class="lg:sticky lg:top-6">
          <CardContent>
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

              <!-- 社交链接预览 -->
              <div v-if="socialLinksForm.length > 0" class="mt-5 pt-5 border-t border-slate-100 w-full">
                <p class="text-xs text-slate-400 mb-3">{{ t('settings.socialLinksPreview') }}</p>
                <div class="grid grid-cols-4 gap-2">
                  <div
                      v-for="(link, index) in socialLinksForm"
                      :key="index"
                      class="flex items-center justify-center h-9 rounded-lg border transition-colors"
                      :class="isClickable(link.url)
                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                        : 'bg-slate-50 border-slate-100 text-slate-300'"
                      :title="link.platform + (isClickable(link.url) ? ': ' + link.url : ' (' + t('settings.notConfigured') + ')')"
                  >
                    <component :is="getIcon(link.platform)" class="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>