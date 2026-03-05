<!-- PostEditor.vue - 文章编辑器页面 -->

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {toast} from 'vue-sonner';
import {useDebounceFn} from '@vueuse/core';
import {useI18n} from 'vue-i18n';
import { normalizeStringField } from '@/utils/formNormalizer';
import {
  createPostApi,
  getPostByIdApi,
  type PostCreateRequest,
  type PostUpdateRequest,
  updatePostApi,
} from '@/api/post';
import {getAdminTagListApi, type TagResponse} from '@/api/tag';
import {generateSummaryApi, generateSlugApi} from '@/api/ai';

import {ArrowLeft, Eye, EyeOff, FileEdit, FileText, Globe, Image as ImageIcon, Loader2, Pin, Save, Sparkles, Tag as TagIcon} from 'lucide-vue-next';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import TagSelector from '@/components/common/TagSelector.vue';
import {useSiteStore} from "@/stores/site.ts";


const route = useRoute();
const router = useRouter();
const siteStore = useSiteStore();
const { t } = useI18n();

/**
 * 是否为编辑模式（路由含 id 参数时为 true）
 */
const isEditMode = computed(() => route.params.id !== undefined);
/**
 * 当前编辑的文章 ID
 */
const postId = computed(() => Number(route.params.id));

/**
 * 加载状态
 */
const loading = ref(true);
/**
 * 保存中状态
 */
const saving = ref(false);
/**
 * AI 摘要生成中
 */
const generatingSummary = ref(false);
/**
 * AI Slug 生成中
 */
const generatingSlug = ref(false);
/**
 * 全部标签列表
 */
const allTags = ref<TagResponse[]>([]);

/**
 * 文章表单数据类型
 * 基于 API 请求类型，增加 tagIds 字段
 */
type PostFormData = Omit<PostCreateRequest, 'tagIds'> & { tagIds: number[] };

/**
 * 文章表单数据
 */
const formData = ref<PostFormData>({
  title: '',
  slug: '',
  summary: null,
  content: '',
  coverImage: null,
  isPinned: false,
  status: 0,
  tagIds: [],
});

/**
 * 是否显示预览面板
 */
const showPreview = ref(false);
/**
 * 预览 iframe 引用
 */
const previewIframe = ref<HTMLIFrameElement | null>(null);
/**
 * 预览页面 URL
 */
const previewUrl = import.meta.env.VITE_PREVIEW_URL || '/preview';
/**
 * 预览 postMessage 的目标 origin
 */
const previewOrigin = import.meta.env.VITE_PREVIEW_ORIGIN || window.location.origin;

/**
 * 防抖发送预览内容
 */
const sendPreviewContent = useDebounceFn(() => {
  if (!previewIframe.value?.contentWindow) return;
  previewIframe.value.contentWindow.postMessage({
    type: 'preview',
    content: formData.value.content,
  }, previewOrigin);
}, 300);

/**
 * 监听内容变化，在预览模式下同步
 */
watch(() => formData.value.content, () => {
  if (showPreview.value) {
    sendPreviewContent();
  }
});

/**
 * iframe 加载完成后立即发送当前内容
 */
const onPreviewLoad = () => {
  sendPreviewContent();
};

/**
 * 切换预览模式。
 * 开启时等待 iframe 加载后自动触发 onPreviewLoad 发送内容。
 */
const togglePreview = () => {
  showPreview.value = !showPreview.value;
  if (showPreview.value) {
    // 切换到预览模式时，等待 iframe 加载后会触发 onPreviewLoad
  }
};

/**
 * 编辑区宽度百分比
 */
const editorWidthPercent = ref(50);
/**
 * 是否正在拖动分割条
 */
const isDragging = ref(false);
/**
 * 分割容器引用
 */
const splitContainerRef = ref<HTMLDivElement | null>(null);

/**
 * 编辑区动态样式
 */
const editorStyle = computed(() => ({
  width: showPreview.value ? `${editorWidthPercent.value}%` : '100%',
}));

/**
 * 预览区动态样式
 */
const previewStyle = computed(() => ({
  width: `${100 - editorWidthPercent.value}%`,
}));

/**
 * 从 Mouse 或 Touch 事件中提取 clientX
 */
const getClientX = (e: MouseEvent | TouchEvent): number => {
  return 'touches' in e ? e.touches[0]!.clientX : e.clientX;
};

/**
 * 开始拖动分割条。
 * 阻止默认行为并注册全局鼠标/触摸事件监听。
 */
const startDrag = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  isDragging.value = true;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchmove', onDrag, { passive: false });
  document.addEventListener('touchend', stopDrag);
};

/**
 * 拖动中处理。
 * 根据指针位置计算编辑区宽度百分比，限制在 20%–80% 之间。
 */
const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value || !splitContainerRef.value) return;
  e.preventDefault();

  const container = splitContainerRef.value;
  const rect = container.getBoundingClientRect();
  const offsetX = getClientX(e) - rect.left;
  const containerWidth = rect.width;

  // 计算百分比，限制在 20% - 80% 之间
  let percent = (offsetX / containerWidth) * 100;
  percent = Math.max(20, Math.min(80, percent));

  editorWidthPercent.value = percent;
};

/**
 * 停止拖动并移除全局事件监听
 */
const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', stopDrag);
};

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', stopDrag);
});


onMounted(async () => {
  try {
    // 加载标签列表
    await fetchTags();

    // 如果是编辑模式，加载文章详情
    if (isEditMode.value) {
      await loadPost();
    }
  } catch (error) {
    console.error('Failed to initialize editor:', error);
    toast.error(t('postEditor.editorInitFailed'));
  } finally {
    loading.value = false;
  }
});


/**
 * 获取标签列表。
 * 请求全部标签数据供标签选择器使用。
 */
const fetchTags = async () => {
  try {
    allTags.value = await getAdminTagListApi();
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    toast.error(t('postEditor.tagsLoadFailed'));
  }
};

/**
 * 加载文章详情。
 * 根据路由中的文章 ID 获取详情并填充表单，失败时跳回列表。
 */
const loadPost = async () => {
  try {
    const detail = await getPostByIdApi(postId.value);
    formData.value = {
      title: detail.title,
      slug: detail.slug,
      summary: detail.summary,
      content: detail.content,
      coverImage: detail.coverImage,
      isPinned: detail.isPinned,
      status: detail.status,
      tagIds: detail.tags?.map((t: TagResponse) => t.id) ?? [],
    };
  } catch (error) {
    console.error('Failed to load post:', error);
    toast.error(t('postEditor.loadFailed'));
    await router.push('/posts');
  }
};

/**
 * 表单验证。
 * 检查标题、Slug、内容、摘要和封面图片的格式及长度限制。
 */
const validateForm = (): boolean => {
  if (!formData.value.title.trim()) {
    toast.warning(t('postEditor.validation.titleRequired'));
    return false;
  }

  if (formData.value.title.length > 255) {
    toast.warning(t('postEditor.validation.titleTooLong'));
    return false;
  }

  if (!formData.value.slug.trim()) {
    toast.warning(t('postEditor.validation.slugRequired'));
    return false;
  }

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(formData.value.slug)) {
    toast.warning(t('postEditor.validation.slugInvalid'));
    return false;
  }

  if (formData.value.slug.length > 255) {
    toast.warning(t('postEditor.validation.slugTooLong'));
    return false;
  }

  if (!formData.value.content.trim()) {
    toast.warning(t('postEditor.validation.contentRequired'));
    return false;
  }

  if (formData.value.summary && formData.value.summary.trim() && formData.value.summary.length > 500) {
    toast.warning(t('postEditor.validation.summaryTooLong'));
    return false;
  }

  if (formData.value.coverImage && formData.value.coverImage.trim() && formData.value.coverImage.length > 255) {
    toast.warning(t('postEditor.validation.coverTooLong'));
    return false;
  }

  return true;
};

/**
 * 保存文章。
 * 验证表单后根据模式执行创建或更新操作，成功后失效统计并跳回列表。
 */
const handleSave = async () => {
  if (!validateForm()) return;

  saving.value = true;

  try {
    if (isEditMode.value) {
      const request: PostUpdateRequest = {
        title: formData.value.title.trim(),
        slug: formData.value.slug.trim(),
        summary: normalizeStringField(formData.value.summary),
        content: formData.value.content.trim(),
        coverImage: normalizeStringField(formData.value.coverImage),
        isPinned: formData.value.isPinned,
        status: formData.value.status,
        tagIds: formData.value.tagIds.length > 0 ? formData.value.tagIds : null,
      };
      await updatePostApi(postId.value, request);
      toast.success(t('postEditor.updateSuccess'));
    } else {
      const request: PostCreateRequest = {
        title: formData.value.title.trim(),
        slug: formData.value.slug.trim(),
        summary: normalizeStringField(formData.value.summary),
        content: formData.value.content.trim(),
        coverImage: normalizeStringField(formData.value.coverImage),
        isPinned: formData.value.isPinned,
        status: formData.value.status,
        tagIds: formData.value.tagIds.length > 0 ? formData.value.tagIds : null,
      };
      await createPostApi(request);
      toast.success(t('postEditor.createSuccess'));
    }

    // 标记统计数据已失效，让 Post 页面进入时自动刷新
    siteStore.invalidateStats();

    // 返回列表页
    await router.push('/posts');
  } catch (error) {
    console.error('Failed to save post:', error);
    toast.error(t('postEditor.saveFailed'));
  } finally {
    saving.value = false;
  }
};

/**
 * 返回文章列表页
 */
const handleBack = () => {
  router.push('/posts');
};

/**
 * AI 生成摘要。
 * 基于文章内容调用 AI 接口生成摘要，截取前 500 字符填入表单。
 */
const aiGenerateSummary = async () => {
  if (!formData.value.content.trim()) {
    toast.warning(t('postEditor.validation.contentFirst'));
    return;
  }
  generatingSummary.value = true;
  try {
    const res = await generateSummaryApi(formData.value.content);
    formData.value.summary = res.result.slice(0, 500);
    toast.success(t('postEditor.summaryGenerated'));
  } catch {
    // 错误已由 request 拦截器 toast 处理
  } finally {
    generatingSummary.value = false;
  }
};

/**
 * AI 生成 Slug。
 * 基于文章标题调用 AI 接口生成 URL-friendly 的 slug。
 */
const aiGenerateSlug = async () => {
  if (!formData.value.title.trim()) {
    toast.warning(t('postEditor.validation.titleFirst'));
    return;
  }
  generatingSlug.value = true;
  try {
    const res = await generateSlugApi(formData.value.title);
    formData.value.slug = res.result;
    toast.success(t('postEditor.slugGenerated'));
  } catch {
    // 错误已由 request 拦截器 toast 处理
  } finally {
    generatingSlug.value = false;
  }
};

/**
 * 处理新标签创建。
 * 将 TagSelector 中新创建的标签追加到本地标签列表。
 *
 * @param newTag 新创建的标签对象
 */
const handleTagCreated = (newTag: TagResponse) => {
  // 将新创建的标签添加到列表中
  allTags.value.push(newTag);
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
 * 从 Markdown 内容中提取第一张图片的 URL。
 * 依次匹配 Markdown 图片语法和 HTML img 标签。
 *
 * @param markdown Markdown 格式的文章内容
 */
const extractFirstImage = (markdown: string): string | null => {
  // 匹配 Markdown 图片语法: ![alt](url)
  const mdImageRegex = /!\[.*?]\((.*?)\)/;
  // 匹配 HTML img 标签: <img src="url" />
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/i;

  const mdMatch = markdown.match(mdImageRegex);
  if (mdMatch) return mdMatch[1] ?? null;

  const htmlMatch = markdown.match(htmlImageRegex);
  if (htmlMatch) return htmlMatch[1] ?? null;

  return null;
};

/**
 * 使用内容中的第一张图片作为封面。
 * 从文章内容提取首张图片 URL 并填入封面字段。
 */
const useFirstImageAsCover = () => {
  const imageUrl = extractFirstImage(formData.value.content);
  if (imageUrl) {
    formData.value.coverImage = imageUrl;
    toast.success(t('postEditor.coverExtracted'));
  } else {
    toast.warning(t('postEditor.noImageInContent'));
  }
};
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部操作栏（px 响应式 4 → md 6） -->
    <div class="sticky top-0 z-10 pt-4">
      <div class="max-w-400 mx-auto bg-white/95 backdrop-blur-sm border border-slate-100 rounded-xl shadow-xs px-4 md:px-6 py-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                size="sm"
                @click="handleBack"
                class="gap-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft class="w-4 h-4" />
              {{ t('postEditor.back') }}
            </Button>
            <div class="h-6 w-px bg-slate-200"></div>
            <h1 class="text-lg md:text-xl font-semibold text-slate-900">
              {{ isEditMode ? t('postEditor.editPost') : t('postEditor.newPost') }}
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <div
                class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50"
                :class="getStatusConfig(formData.status).class"
            >
              <component :is="getStatusConfig(formData.status).icon" class="w-3 h-3" />
              {{ getStatusConfig(formData.status).label }}
            </div>
            <Button
                @click="handleSave"
                :disabled="saving || loading"
                class="bg-slate-900 hover:bg-slate-800 rounded-lg gap-2"
            >
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              {{ saving ? t('postEditor.saving') : t('postEditor.savePost') }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center gap-2 py-20">
      <Loader2 class="w-8 h-8 animate-spin text-slate-400" />
      <span class="text-sm text-slate-400">{{ t('postEditor.loading') }}</span>
    </div>

    <!-- 编辑器主体（py 响应式 6 → md 8，预览时 max-w-450 / 默认 max-w-400） -->
    <div v-else class="mx-auto py-6 md:py-8" :class="showPreview ? 'max-w-450' : 'max-w-400'">
      <div class="grid grid-cols-1 gap-6" :class="showPreview ? '' : 'lg:grid-cols-3'">
        <!-- 内容编辑区（预览时全宽 / 默认 lg 占 2 栏） -->
        <div class="space-y-6" :class="showPreview ? '' : 'lg:col-span-2'">
          <!-- 标题 -->
          <Card>
            <CardContent class="pt-6">
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label for="title" class="text-base font-semibold">
                    {{ t('postEditor.titleLabel') }} <span class="text-red-500">*</span>
                  </Label>
                  <Input
                      id="title"
                      v-model="formData.title"
                      :placeholder="t('postEditor.titlePlaceholder')"
                      class="text-2xl font-bold border-0 px-0 focus-visible:ring-0 placeholder:text-slate-300"
                      maxlength="255"
                  />
                  <p class="text-xs text-slate-500">
                    {{ formData.title.length }}/255
                  </p>
                </div>

                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <Label for="slug" class="text-sm">
                      {{ t('postEditor.slugLabel') }} <span class="text-red-500">*</span>
                    </Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        @click="aiGenerateSlug"
                        :disabled="generatingSlug || !formData.title?.trim()"
                        class="text-xs h-7"
                    >
                      <Loader2 v-if="generatingSlug" class="w-3 h-3 animate-spin mr-1" />
                      <Sparkles v-else class="w-3 h-3 mr-1" />
                      {{ t('postEditor.aiGenerate') }}
                    </Button>
                  </div>
                  <Input
                      id="slug"
                      v-model="formData.slug"
                      :placeholder="t('postEditor.slugPlaceholder')"
                      maxlength="255"
                      class="font-mono text-sm"
                  />
                  <p class="text-xs text-slate-500">
                    {{ formData.slug.length }}/255 · {{ t('postEditor.slugHint') }}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- 摘要 -->
          <Card>
            <CardHeader class="flex flex-row items-center justify-between">
              <CardTitle class="text-base flex items-center gap-2">
                <FileText class="w-4 h-4" />
                {{ t('postEditor.summaryLabel') }}
              </CardTitle>
              <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="aiGenerateSummary"
                  :disabled="generatingSummary || !formData.content?.trim()"
                  class="text-xs h-7"
              >
                <Loader2 v-if="generatingSummary" class="w-3 h-3 animate-spin mr-1" />
                <Sparkles v-else class="w-3 h-3 mr-1" />
                {{ t('postEditor.aiGenerate') }}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                  :model-value="formData.summary ?? ''"
                  @update:model-value="(val) => formData.summary = val as string"
                  :placeholder="t('postEditor.summaryPlaceholder')"
                  rows="4"
                  maxlength="500"
                  class="resize-none"
              />
              <p class="text-xs text-slate-500 mt-2">
                {{ (formData.summary ?? '').length }}/500
              </p>
            </CardContent>
          </Card>

          <!-- 内容 -->
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <CardTitle class="text-base flex items-center gap-2">
                  <FileText class="w-4 h-4" />
                  {{ t('postEditor.contentLabel') }} <span class="text-red-500">*</span>
                </CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    @click="togglePreview"
                    class="gap-2"
                >
                  <Eye v-if="!showPreview" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                  {{ showPreview ? t('postEditor.hidePreview') : t('postEditor.preview') }}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                  ref="splitContainerRef"
                  class="flex"
                  :class="[
                    showPreview ? 'h-[calc(100vh-320px)]' : '',
                    isDragging ? 'select-none' : ''
                  ]"
              >
                <!-- 编辑区 -->
                <div :style="editorStyle">
                  <Textarea
                      v-model="formData.content"
                      :placeholder="t('postEditor.contentPlaceholder')"
                      :rows="showPreview ? undefined : 20"
                      class="font-mono text-sm resize-none scrollbar-thin"
                      :class="showPreview ? 'h-full' : 'max-h-[60vh]'"
                  />
                </div>
                <!-- 拖动分割条 -->
                <div
                    v-if="showPreview"
                    class="w-2 shrink-0 bg-slate-100 hover:bg-slate-200 cursor-col-resize transition-colors flex items-center justify-center group"
                    @mousedown="startDrag"
                    @touchstart="startDrag"
                >
                  <div class="w-0.5 h-8 bg-slate-300 group-hover:bg-slate-400 rounded-full transition-colors"></div>
                </div>
                <!-- 预览区 -->
                <div
                    v-if="showPreview"
                    :style="previewStyle"
                    class="border border-slate-200 rounded-md overflow-hidden"
                >
                  <iframe
                      ref="previewIframe"
                      :src="previewUrl"
                      class="w-full h-full border-0"
                      :class="{ 'pointer-events-none': isDragging }"
                      @load="onPreviewLoad"
                  ></iframe>
                </div>
              </div>
              <p class="text-xs text-slate-500 mt-2">
                {{ formData.content.length }} {{ t('common.characters') }}
              </p>
            </CardContent>
          </Card>
        </div>

        <!-- 设置区（预览时隐藏） -->
        <div v-show="!showPreview" class="space-y-6">
          <!-- 发布设置 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <Eye class="w-4 h-4" />
                {{ t('postEditor.publishSettings') }}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- 状态 -->
              <div class="space-y-2">
                <Label for="status">
                  {{ t('postEditor.statusLabel') }} <span class="text-red-500">*</span>
                </Label>
                <Select
                    :model-value="formData.status.toString()"
                    @update:model-value="(val) => formData.status = Number(val)"
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">
                      <div class="flex items-center gap-2">
                        <FileEdit class="w-3 h-3 text-slate-400" />
                        {{ t('status.draft') }}
                      </div>
                    </SelectItem>
                    <SelectItem value="1">
                      <div class="flex items-center gap-2">
                        <Globe class="w-3 h-3 text-slate-600" />
                        {{ t('status.published') }}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- 置顶 -->
              <div class="flex items-center space-x-2 pt-2">
                <Checkbox
                    id="isPinned"
                    v-model="formData.isPinned"
                />
                <Label
                    for="isPinned"
                    class="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <Pin class="w-4 h-4" />
                  {{ t('postEditor.pinToTop') }}
                </Label>
              </div>
            </CardContent>
          </Card>

          <!-- 封面图片 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <ImageIcon class="w-4 h-4" />
                {{ t('postEditor.coverImage') }}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <Input
                  :model-value="formData.coverImage ?? ''"
                  @update:model-value="(val) => formData.coverImage = val as string"
                  :placeholder="t('postEditor.coverImagePlaceholder')"
                  maxlength="255"
              />
              <p class="text-xs text-slate-500">
                {{ (formData.coverImage ?? '').length }}/255
              </p>
              <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="useFirstImageAsCover"
                  class="w-full"
              >
                <ImageIcon class="w-4 h-4 mr-2" />
                {{ t('postEditor.useFirstImage') }}
              </Button>
              <div
                  v-if="formData.coverImage"
                  class="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
              >
                <img
                    :src="formData.coverImage"
                    alt="Cover preview"
                    class="w-full h-full object-cover"
                    @error="(e) => (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23f1f5f9\' width=\'100\' height=\'100\'/%3E%3Ctext fill=\'%2394a3b8\' font-family=\'sans-serif\' font-size=\'14\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\'%3ENo Image%3C/text%3E%3C/svg%3E'"
                />
              </div>
            </CardContent>
          </Card>

          <!-- 标签 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <TagIcon class="w-4 h-4" />
                {{ t('postEditor.tagsLabel') }}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TagSelector
                  :tags="allTags"
                  v-model:selected-ids="formData.tagIds"
                  @tag-created="handleTagCreated"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
