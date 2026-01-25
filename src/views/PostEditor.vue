
<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {toast} from 'vue-sonner';
import {
  createPostApi,
  getPostByIdApi,
  type PostCreateRequest,
  type PostUpdateRequest,
  updatePostApi,
} from '@/api/post';
import {getAdminTagListApi, type TagResponse} from '@/api/tag';

// 图标
import {ArrowLeft, Eye, FileEdit, FileText, Globe, Image as ImageIcon, Loader2, Pin, Save, Tag as TagIcon} from 'lucide-vue-next';

// Shadcn 组件
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Checkbox} from '@/components/ui/checkbox';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';

// 自定义组件
import TagSelector from '@/components/TagSelector.vue';

// ========== 路由和状态 ==========

const route = useRoute();
const router = useRouter();

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
  status: 1,
  tagIds: [] as number[],
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
    toast.error('Failed to load editor');
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
    toast.error('Failed to load tags');
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
    toast.error('Failed to load post');
    await router.push('/posts');
  }
};

/**
 * 表单验证
 */
const validateForm = (): boolean => {
  if (!formData.value.title.trim()) {
    toast.warning('Please enter post title');
    return false;
  }

  if (formData.value.title.length > 255) {
    toast.warning('Title is too long (max 255 characters)');
    return false;
  }

  if (!formData.value.slug.trim()) {
    toast.warning('Please enter post slug');
    return false;
  }

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(formData.value.slug)) {
    toast.warning('Slug must be lowercase letters, numbers, and hyphens only');
    return false;
  }

  if (formData.value.slug.length > 255) {
    toast.warning('Slug is too long (max 255 characters)');
    return false;
  }

  if (!formData.value.content.trim()) {
    toast.warning('Please enter post content');
    return false;
  }

  if (formData.value.summary && formData.value.summary.length > 500) {
    toast.warning('Summary is too long (max 500 characters)');
    return false;
  }

  if (formData.value.coverImage && formData.value.coverImage.length > 255) {
    toast.warning('Cover image URL is too long (max 255 characters)');
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
      toast.success('Post updated successfully');
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
      toast.success('Post created successfully');
    }

    // 返回列表页
    await router.push('/posts');
  } catch (error) {
    console.error('Failed to save post:', error);
    toast.error('Failed to save post');
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
    toast.success('Cover image set from content');
  } else {
    toast.warning('No image found in content');
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- ========== 顶部操作栏 ========== -->
    <div class="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div class="max-w-[1600px] mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                size="sm"
                @click="handleBack"
                class="gap-2"
            >
              <ArrowLeft class="w-4 h-4" />
              Back
            </Button>
            <div class="h-6 w-px bg-slate-200"></div>
            <h1 class="text-xl font-semibold text-slate-900">
              {{ isEditMode ? 'Edit Post' : 'New Post' }}
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <div
                class="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-slate-100"
                :class="getStatusConfig(formData.status).class"
            >
              <component :is="getStatusConfig(formData.status).icon" class="w-3 h-3" />
              {{ getStatusConfig(formData.status).label }}
            </div>
            <Button
                @click="handleSave"
                :disabled="saving || loading"
                class="bg-slate-900 hover:bg-slate-800 gap-2"
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
    <div v-if="loading" class="flex justify-center items-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-slate-400" />
    </div>

    <!-- ========== 编辑器主体 ========== -->
    <div v-else class="max-w-[1600px] mx-auto px-6 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- ========== 左侧：内容编辑区 ========== -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 标题 -->
          <Card class="border-slate-200">
            <CardContent class="pt-6">
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label for="title" class="text-base font-semibold">Title</Label>
                  <Input
                      id="title"
                      v-model="formData.title"
                      placeholder="Enter your post title..."
                      class="text-2xl font-bold border-0 px-0 focus-visible:ring-0 placeholder:text-slate-300"
                      maxlength="255"
                  />
                </div>

                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <Label for="slug" class="text-sm">URL Slug</Label>
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
                    Only lowercase letters, numbers, and hyphens
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- 摘要 -->
          <Card class="border-slate-200">
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <FileText class="w-4 h-4" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                  v-model="formData.summary"
                  placeholder="Write a brief summary of your post..."
                  rows="4"
                  maxlength="500"
                  class="resize-none"
              />
              <p class="text-xs text-slate-500 text-right mt-2">
                {{ formData.summary.length }} / 500 characters
              </p>
            </CardContent>
          </Card>

          <!-- 内容 -->
          <Card class="border-slate-200">
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <FileText class="w-4 h-4" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                  v-model="formData.content"
                  placeholder="Write your post content here... (Markdown supported)"
                  rows="20"
                  class="font-mono text-sm resize-none"
              />
              <p class="text-xs text-slate-500 mt-2">
                Markdown formatting is supported
              </p>
            </CardContent>
          </Card>
        </div>

        <!-- ========== 右侧：设置区 ========== -->
        <div class="space-y-6">
          <!-- 发布设置 -->
          <Card class="border-slate-200">
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <Eye class="w-4 h-4" />
                Publish Settings
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- 状态 -->
              <div class="space-y-2">
                <Label for="status">Status</Label>
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
                  Pin to top
                </Label>
              </div>
            </CardContent>
          </Card>

          <!-- 封面图片 -->
          <Card class="border-slate-200">
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
              <p class="text-xs text-slate-500">
                Enter the URL of your cover image
              </p>
            </CardContent>
          </Card>

          <!-- 标签 -->
          <Card class="border-slate-200">
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

          <!-- 提示信息 -->
          <Card class="border-slate-200 bg-blue-50/50">
            <CardContent class="pt-6">
              <div class="space-y-2 text-sm text-slate-600">
                <p class="font-medium text-slate-900">💡 Tips</p>
                <ul class="space-y-1 text-xs">
                  <li>• Use Markdown for rich text formatting</li>
                  <li>• Keep your slug URL-friendly</li>
                  <li>• Add relevant tags for better organization</li>
                  <li>• Save as draft to preview before publishing</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>