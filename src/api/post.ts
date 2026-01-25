import request from '@/request';
import type { BaseQuery, PageResult } from '@/types/api.ts';
import type {TagResponse} from "@/api/tag.ts";

// ==================== 类型定义 ====================


/**
 * 文章简略信息（用于列表展示）
 */
export interface PostSimpleResponse {
    id: number;
    title: string;
    slug: string;
    summary?: string;
    coverImage?: string;
    views: number;
    readTime?: number;
    isPinned: boolean;
    status: number;       // 0: Draft, 1: Published
    createTime: string;
    tags?: TagResponse[];
}

/**
 * 文章详细信息
 */
export interface PostDetailResponse {
    id: number;
    title: string;
    slug: string;
    summary?: string;
    content: string;
    coverImage?: string;
    views: number;
    readTime?: number;
    isPinned: boolean;
    status: number;
    createTime: string;
    updateTime: string;
    tags?: TagResponse[];
}

/**
 * 文章查询参数
 */
export interface PostQuery extends BaseQuery {
    keyword?: string;     // 搜索关键词
    tagId?: number;       // 标签筛选
    status?: number;      // 状态筛选 (0: Draft, 1: Published)
}

/**
 * 文章创建请求
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
 * 文章更新请求
 */
export interface PostUpdateRequest {
    title?: string;
    slug?: string;
    summary?: string;
    content?: string;
    coverImage?: string;
    isPinned?: boolean;
    status?: number;
    tagIds?: number[];
}

// ==================== API 接口 ====================

/**
 * 获取文章分页列表（管理端）
 * @param params 查询参数
 */
export const getAdminPostsApi = (params: PostQuery): Promise<PageResult<PostSimpleResponse>> => {
    return request.get<PageResult<PostSimpleResponse>>('/api/admin/posts', { params });
};

/**
 * 获取文章详情（管理端）
 * @param id 文章ID
 */
export const getPostByIdApi = (id: number): Promise<PostDetailResponse> => {
    return request.get<PostDetailResponse>(`/api/admin/posts/${id}`);
};

/**
 * 创建文章
 * @param data 创建请求数据
 */
export const createPostApi = (data: PostCreateRequest): Promise<number> => {
    return request.post<number>('/api/admin/posts', data);
};

/**
 * 更新文章
 * @param id 文章ID
 * @param data 更新请求数据
 */
export const updatePostApi = (id: number, data: PostUpdateRequest): Promise<void> => {
    return request.put<void>(`/api/admin/posts/${id}`, data);
};

/**
 * 删除文章
 * @param id 文章ID
 */
export const deletePostApi = (id: number): Promise<void> => {
    return request.delete<void>(`/api/admin/posts/${id}`);
};