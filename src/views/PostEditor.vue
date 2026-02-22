
<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {toast} from 'vue-sonner';
import {useDebounceFn} from '@vueuse/core';
import {
  createPostApi,
  getPostByIdApi,
  type PostCreateRequest,
  type PostUpdateRequest,
  updatePostApi,
} from '@/api/post';
import {getAdminTagListApi, type TagResponse} from '@/api/tag';

// 图标
import {ArrowLeft, Eye, EyeOff, FileEdit, FileText, Globe, Image as ImageIcon, Loader2, Pin, Save, Tag as TagIcon} from 'lucide-vue-next';

// Shadcn 组件
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';

// 自定义组件
import TagSelector from '@/components/common/TagSelector.vue';
import {useSiteStore} from "@/stores/site.ts";

// ========== 路由和状态 ==========

const route = useRoute();
const router = useRouter();
const siteStore = useSiteStore();

const isEditMode = computed(() => route.params.id !== undefined);
const postId = computed(() => Number(route.params.id));

const loading = ref(true);
const saving = ref(false);
const allTags = ref<TagResponse[]>([]);

// 表单数据
const formData = ref({
  title: '',
  slug: '',
  summary: '',
  content: '',
  coverImage: '',
  isPinned: false,
  status: 0,
  tagIds: [] as number[],
});

// ========== 预览功能 ==========

const showPreview = ref(false);
const previewIframe = ref<HTMLIFrameElement | null>(null);
const previewUrl = import.meta.env.VITE_PREVIEW_URL || '/preview';
const previewOrigin = import.meta.env.VITE_PREVIEW_ORIGIN || window.location.origin;

// 防抖发送预览内容
const sendPreviewContent = useDebounceFn(() => {
  if (!previewIframe.value?.contentWindow) return;
  previewIframe.value.contentWindow.postMessage({
    type: 'preview',
    content: formData.value.content,
  }, previewOrigin);
}, 300);

// 监听内容变化，在预览模式下同步
watch(() => formData.value.content, () => {
  if (showPreview.value) {
    sendPreviewContent();
  }
});

// iframe 加载完成后立即发送当前内容
const onPreviewLoad = () => {
  sendPreviewContent();
};

// 切换预览模式
const togglePreview = () => {
  showPreview.value = !showPreview.value;
  if (showPreview.value) {
    // 切换到预览模式时，等待 iframe 加载后会触发 onPreviewLoad
  }
};

// ========== 拖动分割条 ==========

const editorWidthPercent = ref(50);
const isDragging = ref(false);
const splitContainerRef = ref<HTMLDivElement | null>(null);

const editorStyle = computed(() => ({
  width: showPreview.value ? `${editorWidthPercent.value}%` : '100%',
}));

const previewStyle = computed(() => ({
  width: `${100 - editorWidthPercent.value}%`,
}));

const startDrag = (e: MouseEvent) => {
  e.preventDefault();
  isDragging.value = true;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value || !splitContainerRef.value) return;

  const container = splitContainerRef.value;
  const rect = container.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const containerWidth = rect.width;

  // 计算百分比，限制在 20% - 80% 之间
  let percent = (offsetX / containerWidth) * 100;
  percent = Math.max(20, Math.min(80, percent));

  editorWidthPercent.value = percent;
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});

// ========== 生命周期 ==========

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
    toast.error('加载编辑器失败');
  } finally {
    loading.value = false;
  }
});

// ========== 方法 ==========

/**
 * 获取标签列表
 */
const fetchTags = async () => {
  try {
    allTags.value = await getAdminTagListApi();
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    toast.error('加载标签列表失败');
  }
};

/**
 * 加载文章详情
 */
const loadPost = async () => {
  try {
    const detail = await getPostByIdApi(postId.value);
    formData.value = {
      title: detail.title,
      slug: detail.slug,
      summary: detail.summary || '',
      content: detail.content,
      coverImage: detail.coverImage || '',
      isPinned: detail.isPinned,
      status: detail.status,
      tagIds: detail.tags?.map(t => t.id) || [],
    };
  } catch (error) {
    console.error('Failed to load post:', error);
    toast.error('加载文章失败');
    await router.push('/posts');
  }
};

/**
 * 表单验证
 */
const validateForm = (): boolean => {
  if (!formData.value.title.trim()) {
    toast.warning('请输入文章标题');
    return false;
  }

  if (formData.value.title.length > 255) {
    toast.warning('标题过长（最多255个字符）');
    return false;
  }

  if (!formData.value.slug.trim()) {
    toast.warning('请输入文章 Slug');
    return false;
  }

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(formData.value.slug)) {
    toast.warning('Slug 只能包含小写字母、数字和连字符');
    return false;
  }

  if (formData.value.slug.length > 255) {
    toast.warning('Slug 过长（最多255个字符）');
    return false;
  }

  if (!formData.value.content.trim()) {
    toast.warning('请输入文章内容');
    return false;
  }

  if (formData.value.summary && formData.value.summary.length > 500) {
    toast.warning('摘要过长（最多500个字符）');
    return false;
  }

  if (formData.value.coverImage && formData.value.coverImage.length > 255) {
    toast.warning('封面图片链接过长（最多255个字符）');
    return false;
  }

  return true;
};

/**
 * 保存文章
 */
const handleSave = async () => {
  if (!validateForm()) return;

  saving.value = true;

  try {
    if (isEditMode.value) {
      const request: PostUpdateRequest = {
        title: formData.value.title.trim(),
        slug: formData.value.slug.trim(),
        summary: formData.value.summary.trim() || undefined,
        content: formData.value.content.trim(),
        coverImage: formData.value.coverImage.trim() || undefined,
        isPinned: formData.value.isPinned,
        status: formData.value.status,
        tagIds: formData.value.tagIds.length > 0 ? formData.value.tagIds : undefined,
      };
      await updatePostApi(postId.value, request);
      toast.success('文章更新成功');
    } else {
      const request: PostCreateRequest = {
        title: formData.value.title.trim(),
        slug: formData.value.slug.trim(),
        summary: formData.value.summary.trim() || undefined,
        content: formData.value.content.trim(),
        coverImage: formData.value.coverImage.trim() || undefined,
        isPinned: formData.value.isPinned,
        status: formData.value.status,
        tagIds: formData.value.tagIds.length > 0 ? formData.value.tagIds : undefined,
      };
      await createPostApi(request);
      toast.success('文章创建成功');
    }

    // 标记统计数据已失效，让 Post 页面进入时自动刷新
    siteStore.invalidateStats();

    // 返回列表页
    await router.push('/posts');
  } catch (error) {
    console.error('Failed to save post:', error);
    toast.error('保存文章失败');
  } finally {
    saving.value = false;
  }
};

/**
 * 返回列表
 */
const handleBack = () => {
  router.push('/posts');
};

/**
 * 生成 slug（从标题）
 */
const generateSlug = () => {
  if (!formData.value.title) return;

  formData.value.slug = formData.value.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
};

/**
 * 处理新标签创建
 */
const handleTagCreated = (newTag: TagResponse) => {
  // 将新创建的标签添加到列表中
  allTags.value.push(newTag);
};

/**
 * 获取状态配置
 */
const getStatusConfig = (status: number) => {
  const configs = {
    0: { label: 'Draft', icon: FileEdit, class: 'text-slate-400' },
    1: { label: 'Published', icon: Globe, class: 'text-slate-600' },
  };
  return configs[status as keyof typeof configs] || configs[0];
};

/**
 * 从 Markdown 内容中提取第一张图片的 URL
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
 * 使用内容中的第一张图片作为封面
 */
const useFirstImageAsCover = () => {
  const imageUrl = extractFirstImage(formData.value.content);
  if (imageUrl) {
    formData.value.coverImage = imageUrl;
    toast.success('已从内容中提取封面图片');
  } else {
    toast.warning('内容中未找到图片');
  }
};
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- ========== 顶部操作栏 ========== -->
    <div class="sticky top-0 z-10 px-4 md:px-6 pt-4">
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
              Back
            </Button>
            <div class="h-6 w-px bg-slate-200"></div>
            <h1 class="text-lg md:text-xl font-semibold text-slate-900">
              {{ isEditMode ? 'Edit Post' : 'New Post' }}
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
              {{ saving ? 'Saving...' : 'Save Post' }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 加载状态 ========== -->
    <div v-if="loading" class="flex justify-center items-center gap-2 py-20">
      <Loader2 class="w-8 h-8 animate-spin text-slate-400" />
      <span class="text-sm text-slate-400">Loading...</span>
    </div>

    <!-- ========== 编辑器主体 ========== -->
    <div v-else class="mx-auto px-4 md:px-6 py-6 md:py-8" :class="showPreview ? 'max-w-450' : 'max-w-400'">
      <div class="grid grid-cols-1 gap-6" :class="showPreview ? '' : 'lg:grid-cols-3'">
        <!-- ========== 左侧：内容编辑区 ========== -->
        <div class="space-y-6" :class="showPreview ? '' : 'lg:col-span-2'">
          <!-- 标题 -->
          <Card>
            <CardContent class="pt-6">
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label for="title" class="text-base font-semibold">
                    Title <span class="text-red-500">*</span>
                  </Label>
                  <Input
                      id="title"
                      v-model="formData.title"
                      placeholder="Enter your post title"
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
                      URL Slug <span class="text-red-500">*</span>
                    </Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        @click="generateSlug"
                        class="text-xs h-7"
                    >
                      Generate from title
                    </Button>
                  </div>
                  <Input
                      id="slug"
                      v-model="formData.slug"
                      placeholder="post-url-slug"
                      maxlength="255"
                      class="font-mono text-sm"
                  />
                  <p class="text-xs text-slate-500">
                    {{ formData.slug.length }}/255 · Only lowercase letters, numbers, and hyphens
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- 摘要 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <FileText class="w-4 h-4" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                  v-model="formData.summary"
                  placeholder="Write a brief summary of your post"
                  rows="4"
                  maxlength="500"
                  class="resize-none"
              />
              <p class="text-xs text-slate-500 mt-2">
                {{ formData.summary.length }}/500
              </p>
            </CardContent>
          </Card>

          <!-- 内容 -->
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <CardTitle class="text-base flex items-center gap-2">
                  <FileText class="w-4 h-4" />
                  Content <span class="text-red-500">*</span>
                </CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    @click="togglePreview"
                    class="gap-2"
                >
                  <Eye v-if="!showPreview" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                  {{ showPreview ? 'Hide Preview' : 'Preview' }}
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
                      placeholder="Write your post content here... (Markdown supported)"
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
                {{ formData.content.length }} characters
              </p>
            </CardContent>
          </Card>
        </div>

        <!-- ========== 右侧：设置区（预览时隐藏） ========== -->
        <div v-show="!showPreview" class="space-y-6">
          <!-- 发布设置 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <Eye class="w-4 h-4" />
                Publish Settings
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- 状态 -->
              <div class="space-y-2">
                <Label for="status">
                  Status <span class="text-red-500">*</span>
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
                        Draft
                      </div>
                    </SelectItem>
                    <SelectItem value="1">
                      <div class="flex items-center gap-2">
                        <Globe class="w-3 h-3 text-slate-600" />
                        Published
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
                  Pin to top <span class="text-red-500">*</span>
                </Label>
              </div>
            </CardContent>
          </Card>

          <!-- 封面图片 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <ImageIcon class="w-4 h-4" />
                Cover Image
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <Input
                  v-model="formData.coverImage"
                  placeholder="https://example.com/image.jpg"
                  maxlength="255"
              />
              <p class="text-xs text-slate-500">
                {{ formData.coverImage.length }}/255
              </p>
              <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="useFirstImageAsCover"
                  class="w-full"
              >
                <ImageIcon class="w-4 h-4 mr-2" />
                Use first image from content
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
                Tags
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