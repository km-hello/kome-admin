<!-- Link.vue - 友链管理页面 -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import i18n from '@/i18n';
import { useSiteStore } from '@/stores/site';
import { useTableSort } from '@/composables/useTableSort';
import { normalizeStringField } from '@/utils/formNormalizer';
import {
  getAdminLinksApi,
  createLinkApi,
  updateLinkApi,
  deleteLinkApi,
  type LinkResponse,
  type LinkCreateRequest,
  type LinkUpdateRequest,
} from '@/api/link';

import Pagination from '@/components/common/Pagination.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatsCard from '@/components/common/StatsCard.vue';
import SortableHead from '@/components/common/SortableHead.vue';

import { Plus, Search, Edit, Trash2, Link as LinkIcon, ExternalLink, Image, Loader2, Globe, Calendar, FileEdit } from 'lucide-vue-next';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const siteStore = useSiteStore();
const { t } = useI18n();

/**
 * 友链列表数据
 */
const links = ref<LinkResponse[]>([]);
const { sortedData: sortedLinks, toggleSort, getSortOrder, resetSort } = useTableSort(links);
/**
 * 加载状态
 */
const loading = ref(true);
/**
 * 搜索关键词
 */
const searchKeyword = ref('');
/**
 * 状态筛选值
 */
const statusFilter = ref<number | undefined>(undefined);

/**
 * 分页状态
 */
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

/**
 * 对话框状态
 */
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const dialogLoading = ref(false);
/**
 * 是否已触发过提交。
 * 用于控制字段级错误提示和错误态的显示时机。
 */
const submitAttempted = ref(false);

/**
 * 友链表单数据类型
 * 基于 API 请求类型，增加 id 字段用于编辑模式
 */
type LinkFormData = LinkCreateRequest & { id: number };

/**
 * 表单数据
 */
const formData = ref<LinkFormData>({
  id: 0,
  name: '',
  url: '',
  avatar: null,
  description: null,
  status: 1,
});

/**
 * 删除确认对话框
 */
const deleteDialogVisible = ref(false);
const deleteTarget = ref<LinkResponse | null>(null);
const deleteLoading = ref(false);

/**
 * 校验友链名称并返回错误信息；无错误时返回空字符串
 */
const validateNameField = (): string => {
  if (!formData.value.name.trim()) return t('link.validation.nameRequired');
  if (formData.value.name.length > 100) return t('link.validation.nameTooLong');
  return '';
};

/**
 * 判断 URL 是否为允许的 http/https 协议
 */
const isAllowedHttpUrl = (value: string): boolean => {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * 校验友链地址并返回错误信息；无错误时返回空字符串
 */
const validateUrlField = (): string => {
  if (!formData.value.url.trim()) return t('link.validation.urlRequired');
  if (formData.value.url.length > 255) return t('link.validation.urlTooLong');
  if (!isAllowedHttpUrl(formData.value.url)) {
    return t('link.validation.urlInvalid');
  }
  return '';
};

/**
 * 校验头像 URL 并返回错误信息；无错误时返回空字符串
 */
const validateAvatarField = (): string => {
  if (formData.value.avatar && formData.value.avatar.trim()) {
    if (formData.value.avatar.length > 255) {
      return t('link.validation.avatarTooLong');
    }
    if (!isAllowedHttpUrl(formData.value.avatar)) {
      return t('link.validation.avatarInvalid');
    }
  }
  return '';
};

/**
 * 校验描述并返回错误信息；无错误时返回空字符串
 */
const validateDescriptionField = (): string => {
  if (formData.value.description && formData.value.description.trim() && formData.value.description.length > 255) {
    return t('link.validation.descriptionTooLong');
  }
  return '';
};

/**
 * 名称字段错误信息
 */
const nameErrorMessage = computed(() =>
  !submitAttempted.value ? '' : validateNameField()
);

/**
 * 地址字段错误信息
 */
const urlErrorMessage = computed(() =>
  !submitAttempted.value ? '' : validateUrlField()
);

/**
 * 头像 URL 字段错误信息
 */
const avatarErrorMessage = computed(() =>
  !submitAttempted.value ? '' : validateAvatarField()
);

/**
 * 描述字段错误信息
 */
const descriptionErrorMessage = computed(() =>
  !submitAttempted.value ? '' : validateDescriptionField()
);

/**
 * 当前表单的首个错误信息。
 * 用于提交时统一提示，并保持校验顺序稳定。
 */
const firstValidationError = computed(() =>
  validateNameField() ||
  validateUrlField() ||
  validateAvatarField() ||
  validateDescriptionField()
);


onMounted(async () => {
  try {
    // 并行请求统计数据和友链列表
    await Promise.all([
      siteStore.fetchStats(),
      fetchLinks(),
    ]);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
});


/**
 * 获取友链列表。
 * 根据当前分页、搜索关键词和状态筛选条件请求友链数据。
 */
const fetchLinks = async () => {
  loading.value = true;
  try {
    const data = await getAdminLinksApi({
      pageNum: pagination.value.current,
      pageSize: pagination.value.pageSize,
      keyword: searchKeyword.value || undefined,
      status: statusFilter.value,
    });

    links.value = data.records;
    pagination.value.total = data.total;
    resetSort();
  } catch (error) {
    console.error('Failed to fetch links:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索处理。
 * 重置页码到第一页并重新请求友链列表。
 */
const handleSearch = () => {
  pagination.value.current = 1;
  fetchLinks();
};

/**
 * 状态筛选变化。
 * 将选中值转换为数字状态码，重置页码并刷新列表。
 *
 * @param value 选中的筛选值，'all' 表示全部
 */
const handleStatusFilterChange = (value: string | null | undefined) => {
  // 处理空值或 'all' 的情况
  if (!value || value === 'all') {
    statusFilter.value = undefined;
  } else {
    statusFilter.value = Number(value);
  }

  // 重置到第一页并刷新数据
  pagination.value.current = 1;
  fetchLinks();
};

/**
 * 打开创建对话框。
 * 重置表单数据并切换到创建模式。
 */
const openCreateDialog = () => {
  dialogMode.value = 'create';
  formData.value = {
    id: 0,
    name: '',
    url: '',
    avatar: null,
    description: null,
    status: 0,
  };
  submitAttempted.value = false;
  dialogVisible.value = true;
};

/**
 * 打开编辑对话框。
 * 将友链数据填充到表单并切换到编辑模式。
 *
 * @param link 待编辑的友链数据
 */
const openEditDialog = (link: LinkResponse) => {
  dialogMode.value = 'edit';
  formData.value = {
    id: link.id,
    name: link.name,
    url: link.url,
    avatar: link.avatar,
    description: link.description,
    status: link.status,
  };
  submitAttempted.value = false;
  dialogVisible.value = true;
};

/**
 * 表单验证。
 * 验证名称、URL、头像和描述的长度与格式要求。
 */
const validateForm = (): boolean => {
  if (firstValidationError.value) {
    toast.warning(firstValidationError.value);
    return false;
  }

  return true;
};

/**
 * 提交表单。
 * 验证后根据对话框模式执行创建或更新操作，成功后刷新列表和统计。
 */
const handleSubmit = async () => {
  submitAttempted.value = true;
  if (!validateForm()) return;

  dialogLoading.value = true;

  try {
    if (dialogMode.value === 'create') {
      const request: LinkCreateRequest = {
        name: formData.value.name.trim(),
        url: formData.value.url.trim(),
        avatar: normalizeStringField(formData.value.avatar),
        description: normalizeStringField(formData.value.description),
        status: formData.value.status,
      };
      await createLinkApi(request);
      toast.success(t('link.createSuccess'));
    } else {
      const request: LinkUpdateRequest = {
        name: formData.value.name.trim(),
        url: formData.value.url.trim(),
        avatar: normalizeStringField(formData.value.avatar),
        description: normalizeStringField(formData.value.description),
        status: formData.value.status,
      };
      await updateLinkApi(formData.value.id, request);
      toast.success(t('link.updateSuccess'));
    }

    dialogVisible.value = false;
    submitAttempted.value = false;

    // 刷新列表和统计数据
    await Promise.all([
      fetchLinks(),
      siteStore.refreshStats(), // 强制刷新统计
    ]);
  } catch (error) {
    console.error('Failed to submit link:', error);
  } finally {
    dialogLoading.value = false;
  }
};

/**
 * 打开删除确认对话框。
 *
 * @param link 待删除的友链数据
 */
const openDeleteDialog = (link: LinkResponse) => {
  deleteTarget.value = link;
  deleteDialogVisible.value = true;
};

/**
 * 确认删除友链。
 * 删除成功后自动处理末页空数据回退，并刷新列表和统计。
 */
const handleDelete = async () => {
  if (!deleteTarget.value) return;

  deleteLoading.value = true;

  try {
    await deleteLinkApi(deleteTarget.value.id);
    toast.success(t('link.deleteSuccess'));
    deleteDialogVisible.value = false;

    // 如果当前页没有数据了，回到上一页
    if (links.value.length === 1 && pagination.value.current > 1) {
      pagination.value.current--;
    }

    // 刷新列表和统计数据
    await Promise.all([
      fetchLinks(),
      siteStore.refreshStats(), // 强制刷新统计
    ]);
  } catch (error) {
    console.error('Failed to delete link:', error);
  } finally {
    deleteLoading.value = false;
  }
};

/**
 * 分页变化。
 *
 * @param page 目标页码
 */
const handlePageChange = (page: number) => {
  pagination.value.current = page;
  fetchLinks();
};

/**
 * 每页数量变化。
 * 更新每页数量并重置到第一页。
 *
 * @param size 每页显示数量
 */
const handlePageSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.current = 1;
  fetchLinks();
};

/**
 * 获取状态配置。
 * 根据状态值返回对应的显示标签、图标组件和样式类名。
 *
 * @param status 状态值 (0: 草稿, 1: 已发布)
 */
const getStatusConfig = (status: number) => {
  const configs = {
    0: { label: t('status.draft'), icon: FileEdit, class: 'text-slate-400' },
    1: { label: t('status.published'), icon: Globe, class: 'text-slate-600' },
  };
  return configs[status as keyof typeof configs] || configs[0];
};

/**
 * 格式化日期为中文格式。
 * 将 ISO 日期字符串转换为 "YYYY/MM/DD HH:mm" 格式。
 *
 * @param dateString ISO 格式的日期字符串
 */
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const locale = (i18n.global.locale as any).value === 'zh-CN' ? 'zh-CN' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <PageHeader :title="t('link.title')" :description="t('link.description')">
      <template #actions>
        <Button @click="openCreateDialog" class="bg-slate-900 hover:bg-slate-800 gap-2">
          <Plus class="w-4 h-4" />
          {{ t('link.newLink') }}
        </Button>
      </template>
    </PageHeader>

    <!-- 统计卡片（2列 → md 3列，gap 响应式 3 → sm 4） -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
      <StatsCard
          class="col-span-2 md:col-span-1"
          :title="t('statsCard.friendLinks')"
          :value="siteStore.totalLinks"
          :description="t('statsCard.totalFriendshipLinks')"
          :icon="LinkIcon"
          icon-bg-class="bg-purple-50"
          icon-class="text-purple-600"
      />
      <StatsCard
          :title="t('statsCard.published')"
          :value="siteStore.stats.publishedLinkCount"
          :description="t('statsCard.activeOnWebsite')"
          :icon="LinkIcon"
          icon-bg-class="bg-teal-50"
          icon-class="text-teal-600"
      />
      <StatsCard
          :title="t('statsCard.draft')"
          :value="siteStore.stats.draftLinkCount"
          :description="t('statsCard.pendingLinks')"
          :icon="LinkIcon"
          icon-bg-class="bg-slate-50"
          icon-class="text-slate-600"
      />
    </div>

    <!-- 友链列表 -->
    <Card class="overflow-hidden">
      <CardHeader class="border-b border-slate-100 py-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle class="text-lg font-bold text-slate-800">{{ t('link.allLinks') }}</CardTitle>
            <CardDescription class="mt-1">{{ t('link.description') }}</CardDescription>
          </div>
          <!-- 筛选和搜索工具栏（< sm 纵向堆叠 / >= sm 水平排列） -->
          <div class="flex flex-wrap items-center gap-2 sm:gap-3">
            <!-- 状态筛选 -->
            <Select @update:model-value="(value) => handleStatusFilterChange(value as string)">
              <SelectTrigger class="w-35 h-9 bg-slate-50 border-slate-200">
                <SelectValue :placeholder="t('link.allStatus')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{{ t('link.allStatus') }}</SelectItem>
                <SelectItem value="1">{{ t('status.published') }}</SelectItem>
                <SelectItem value="0">{{ t('status.draft') }}</SelectItem>
              </SelectContent>
            </Select>

            <!-- 搜索框（< sm 全宽 / >= sm 固定 w-64） -->
            <div class="relative w-full sm:w-64">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                  v-model="searchKeyword"
                  :placeholder="t('link.searchPlaceholder')"
                  class="pl-9 pr-9 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  @keyup.enter="handleSearch"
              />
              <button
                  @click="handleSearch"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  :title="t('common.search')"
              >
                <Search class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-transparent border-slate-100">
              <SortableHead class="w-15 pl-4 sm:pl-6" :sort-order="getSortOrder('id')" @sort="toggleSort('id')">{{ t('table.id') }}</SortableHead>
              <SortableHead class="w-[30%]" :sort-order="getSortOrder('name')" @sort="toggleSort('name')">{{ t('table.info') }}</SortableHead>
              <TableHead class="w-[30%]">{{ t('table.description') }}</TableHead>
              <SortableHead :sort-order="getSortOrder('status')" @sort="toggleSort('status')">{{ t('table.status') }}</SortableHead>
              <SortableHead :sort-order="getSortOrder('createTime')" @sort="toggleSort('createTime')">{{ t('table.createdAt') }}</SortableHead>
              <TableHead class="text-right pr-4 sm:pr-6">{{ t('table.actions') }}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <!-- 友链列表 -->
            <TableRow
                v-for="link in sortedLinks"
                :key="link.id"
                class="hover:bg-slate-50/50 transition-colors border-slate-100"
            >
              <!-- ID 列 -->
              <TableCell class="font-mono text-xs text-slate-500 pl-4 sm:pl-6">
                #{{ link.id }}
              </TableCell>

              <!-- 名称和URL合并列 -->
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    <img
                        v-if="link.avatar"
                        :src="link.avatar"
                        :alt="link.name"
                        class="w-full h-full object-cover"
                        @error="(e) => (e.target as HTMLImageElement).src = ''"
                    />
                    <Image v-else class="w-5 h-5 text-slate-400" />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="font-semibold text-slate-900 truncate" :title="link.name">{{ link.name }}</span>
                    <a
                        :href="link.url"
                        target="_blank"
                        class="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 hover:underline group"
                    >
                      <span class="truncate max-w-62.5">{{ link.url }}</span>
                      <ExternalLink class="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>
                </div>
              </TableCell>

              <!-- 描述列 -->
              <TableCell>
                <span class="text-sm text-slate-600 truncate block" :title="link.description ?? undefined">
                  {{ link.description || '-' }}
                </span>
              </TableCell>

              <!-- 状态列 -->
              <TableCell>
                <div
                    class="inline-flex items-center gap-1.5 text-xs"
                    :class="getStatusConfig(link.status).class"
                >
                  <component :is="getStatusConfig(link.status).icon" class="w-3 h-3" />
                  {{ getStatusConfig(link.status).label }}
                </div>
              </TableCell>

              <!-- 创建时间列 -->
              <TableCell>
                <div class="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(link.createTime) }}
                </div>
              </TableCell>

              <!-- 操作列 -->
              <TableCell class="text-right pr-4 sm:pr-6">
                <div class="flex items-center justify-end gap-2">
                  <Button
                      @click="openEditDialog(link)"
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      :title="t('common.edit')"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  <Button
                      @click="openDeleteDialog(link)"
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      :title="t('common.delete')"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            <!-- 加载状态 -->
            <TableRow v-if="loading">
              <TableCell colspan="6" class="text-center py-12">
                <div class="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 class="w-5 h-5 animate-spin" />
                  <span>{{ t('link.loadingLinks') }}</span>
                </div>
              </TableCell>
            </TableRow>

            <!-- 空状态 -->
            <TableRow v-else-if="links.length === 0">
              <TableCell colspan="6" class="h-32 text-center">
                <div class="flex flex-col items-center justify-center text-slate-400">
                  <LinkIcon class="w-12 h-12 mb-2 opacity-20" />
                  <p class="text-sm font-medium">
                    {{ searchKeyword || statusFilter !== undefined ? t('link.noLinksFound') : t('link.noLinksYet') }}
                  </p>
                  <p class="text-xs mt-1">
                    {{ searchKeyword || statusFilter !== undefined ? t('link.tryAdjustingFilters') : t('link.createFirstLink') }}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- 分页 -->
        <div class="border-t border-slate-100 px-4 sm:px-6 py-4">
          <Pagination
              :current="pagination.current"
              :page-size="pagination.pageSize"
              :total="pagination.total"
              @change="handlePageChange"
              @page-size-change="handlePageSizeChange"
          />
        </div>
      </CardContent>
    </Card>

    <!-- 创建/编辑对话框 -->
    <Dialog v-model:open="dialogVisible">
      <DialogContent class="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{{ dialogMode === 'create' ? t('link.createNewLink') : t('link.editLink') }}</DialogTitle>
          <DialogDescription>
            {{ dialogMode === 'create' ? t('link.addLinkDesc') : t('link.updateLinkDesc') }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          <!-- 名称 -->
          <div class="space-y-2">
            <Label htmlFor="link-name">
              {{ t('link.nameLabel') }} <span class="text-red-500">*</span>
            </Label>
            <Input
                id="link-name"
                v-model="formData.name"
                :placeholder="t('link.namePlaceholder')"
                :class="{ 'border-red-300 focus:border-red-400': Boolean(nameErrorMessage) }"
                maxlength="100"
                :disabled="dialogLoading"
            />
            <p v-if="nameErrorMessage" class="text-xs text-red-500">
              {{ nameErrorMessage }}
            </p>
            <p class="text-xs text-slate-500">
              {{ formData.name.length }}/100
            </p>
          </div>

          <!-- URL -->
          <div class="space-y-2">
            <Label htmlFor="link-url">
              {{ t('link.urlLabel') }} <span class="text-red-500">*</span>
            </Label>
            <Input
                id="link-url"
                v-model="formData.url"
                :placeholder="t('link.urlPlaceholder')"
                :class="{ 'border-red-300 focus:border-red-400': Boolean(urlErrorMessage) }"
                maxlength="255"
                :disabled="dialogLoading"
            />
            <p v-if="urlErrorMessage" class="text-xs text-red-500">
              {{ urlErrorMessage }}
            </p>
            <p class="text-xs text-slate-500">
              {{ formData.url.length }}/255
            </p>
          </div>

          <!-- 头像 -->
          <div class="space-y-2">
            <Label htmlFor="link-avatar">{{ t('link.avatarUrlLabel') }}</Label>
            <Input
                id="link-avatar"
                :model-value="formData.avatar ?? ''"
                @update:model-value="(val) => formData.avatar = val as string"
                :placeholder="t('link.avatarUrlPlaceholder')"
                :class="{ 'border-red-300 focus:border-red-400': Boolean(avatarErrorMessage) }"
                maxlength="255"
                :disabled="dialogLoading"
            />
            <p v-if="avatarErrorMessage" class="text-xs text-red-500">
              {{ avatarErrorMessage }}
            </p>
            <p class="text-xs text-slate-500">
              {{ (formData.avatar ?? '').length }}/255
            </p>
          </div>

          <!-- 描述 -->
          <div class="space-y-2">
            <Label htmlFor="link-description">{{ t('link.descriptionLabel') }}</Label>
            <Textarea
                id="link-description"
                :model-value="formData.description ?? ''"
                @update:model-value="(val) => formData.description = val as string"
                :placeholder="t('link.descriptionPlaceholder')"
                :class="{ 'border-red-300 focus:border-red-400': Boolean(descriptionErrorMessage) }"
                maxlength="255"
                rows="3"
                :disabled="dialogLoading"
            />
            <p v-if="descriptionErrorMessage" class="text-xs text-red-500">
              {{ descriptionErrorMessage }}
            </p>
            <p class="text-xs text-slate-500">
              {{ (formData.description ?? '').length }}/255
            </p>
          </div>

          <!-- 状态 -->
          <div class="space-y-2">
            <Label htmlFor="link-status">
              {{ t('link.statusLabel') }} <span class="text-red-500">*</span>
            </Label>
            <Select v-model="formData.status" :disabled="dialogLoading">
              <SelectTrigger id="link-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="1">{{ t('status.published') }}</SelectItem>
                <SelectItem :value="0">{{ t('status.draft') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
              @click="dialogVisible = false"
              variant="outline"
              :disabled="dialogLoading"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
              @click="handleSubmit"
              class="bg-slate-900 hover:bg-slate-800 gap-2"
              :disabled="dialogLoading"
          >
            <Loader2 v-if="dialogLoading" class="h-4 w-4 animate-spin" />
            {{ dialogMode === 'create' ? t('common.create') : t('common.update') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 删除确认对话框 -->
    <AlertDialog v-model:open="deleteDialogVisible">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('link.deleteConfirmTitle') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('link.deleteConfirmDesc') }}
            <span class="font-semibold text-slate-900">"{{ deleteTarget?.name }}"</span>.
            {{ t('link.deleteCannotUndo') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleteLoading">{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction
              @click="handleDelete"
              class="bg-red-600 hover:bg-red-700 gap-2"
              :disabled="deleteLoading"
          >
            <Loader2 v-if="deleteLoading" class="h-4 w-4 animate-spin" />
            {{ t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
