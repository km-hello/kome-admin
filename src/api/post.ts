import request from '@/request';
import type { BaseQuery, PageResult } from '@/types/api.ts';
import type {TagResponse} from "@/api/tag.ts";

/* ========== 类型定义 ========== */


/**
 * 文章简略信息（用于列表展示）。
 * 包含文章基本信息，用于文章管理页面的列表数据展示。
 */
export interface PostSimpleResponse {
    id: number;                // 文章 ID
    title: string;             // 文章标题
    slug: string;              // URL 友好的文章标识
    summary?: string;          // 文章摘要
    coverImage?: string;       // 封面图 URL
    views: number;             // 浏览量
    readTime?: number;         // 预计阅读时间（分钟）
    isPinned: boolean;         // 是否置顶
    status: number;            // 状态: 0=草稿(Draft), 1=已发布(Published)
    createTime: string;        // 创建时间（ISO 格式）
    tags?: TagResponse[];      // 关联标签列表
}

/**
 * 文章详细信息。
 * 包含文章完整内容，用于文章编辑器回填数据。
 */
export interface PostDetailResponse {
    id: number;                // 文章 ID
    title: string;             // 文章标题
    slug: string;              // URL 友好的文章标识
    summary?: string;          // 文章摘要
    content: string;           // 文章正文（Markdown 格式）
    coverImage?: string;       // 封面图 URL
    views: number;             // 浏览量
    readTime?: number;         // 预计阅读时间（分钟）
    isPinned: boolean;         // 是否置顶
    status: number;            // 状态: 0=草稿(Draft), 1=已发布(Published)
    createTime: string;        // 创建时间（ISO 格式）
    updateTime: string;        // 更新时间（ISO 格式）
    tags?: TagResponse[];      // 关联标签列表
}

/**
 * 文章查询参数。
 * 继承基础分页参数，支持关键词搜索、标签筛选和状态筛选。
 */
export interface PostQuery extends BaseQuery {
    keyword?: string;     // 搜索关键词
    tagId?: number;       // 标签筛选
    status?: number;      // 状态筛选: 0=草稿(Draft), 1=已发布(Published)

    ignorePinned?: boolean; // 是否忽略置顶排序
}

/**
 * 文章创建请求。
 * 提交新文章数据，包含标题、正文、标签等字段，支持草稿保存和直接发布。
 */
export interface PostCreateRequest {
    title: string;        // 标题 (max 255)
    slug: string;         // URL slug (max 255, pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$)
    summary?: string;     // 摘要 (max 500)
    content: string;      // 内容 (min 1)
    coverImage?: string;  // 封面图 (max 255)
    isPinned: boolean;    // 是否置顶
    status: number;       // 状态 (0: Draft, 1: Published)
    tagIds?: number[];    // 标签ID列表
}

/**
 * 文章更新请求。
 * 支持部分更新，可单独修改标题、内容、状态等字段。
 */
export interface PostUpdateRequest {
    title?: string;            // 文章标题（max 255）
    slug?: string;             // URL 友好标识（max 255）
    summary?: string;          // 文章摘要（max 500）
    content?: string;          // 文章正文（Markdown 格式）
    coverImage?: string;       // 封面图 URL（max 255）
    isPinned?: boolean;        // 是否置顶
    status?: number;           // 状态: 0=草稿(Draft), 1=已发布(Published)
    tagIds?: number[];         // 关联标签 ID 列表
}

/* ========== API 接口 ========== */

/**
 * 获取文章分页列表（管理端）。
 * 根据查询参数返回符合条件的文章分页数据，支持关键词搜索、标签和状态筛选。
 *
 * @param params 查询参数，包含分页信息、关键词及筛选条件。
 * @returns 文章分页数据。
 */
export const getAdminPostsApi = (params: PostQuery): Promise<PageResult<PostSimpleResponse>> => {
    return request.get<PageResult<PostSimpleResponse>>('/api/admin/posts', { params });
};

/**
 * 获取文章详情（管理端）。
 * 根据文章 ID 获取完整文章内容，用于编辑器回填数据。
 *
 * @param id 文章 ID。
 * @returns 文章详情数据。
 */
export const getPostByIdApi = (id: number): Promise<PostDetailResponse> => {
    return request.get<PostDetailResponse>(`/api/admin/posts/${id}`);
};

/**
 * 创建文章。
 * 提交文章数据到服务端，支持草稿保存和直接发布。
 *
 * @param data 文章创建请求数据。
 * @returns 新创建的文章 ID。
 */
export const createPostApi = (data: PostCreateRequest): Promise<number> => {
    return request.post<number>('/api/admin/posts', data);
};

/**
 * 更新文章。
 * 支持部分更新，可单独修改标题、内容、状态等字段。
 *
 * @param id 文章 ID。
 * @param data 文章更新请求数据。
 */
export const updatePostApi = (id: number, data: PostUpdateRequest): Promise<void> => {
    return request.put<void>(`/api/admin/posts/${id}`, data);
};

/**
 * 删除文章。
 * 根据文章 ID 永久删除文章及其关联数据。
 *
 * @param id 文章 ID。
 */
export const deletePostApi = (id: number): Promise<void> => {
    return request.delete<void>(`/api/admin/posts/${id}`);
};