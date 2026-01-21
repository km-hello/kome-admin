import request from '@/utils/request';
import type { PageResult, BaseQuery } from './types';

// ==================== 类型定义 ====================

/**
 * 文章简略信息（用于列表展示）
 */
export interface PostSimple {
    id: number;
    title: string;
    slug: string;
    summary: string;
    coverImage?: string;
    views: number;
    readTime?: number;
    isPinned: boolean;
    status: number;       // 0: Draft, 1: Published, 2: Review
    createTime: string;
    tags?: Array<{ id: number; name: string }>;
}

/**
 * 文章查询参数
 */
export interface PostQuery extends BaseQuery {
    keyword?: string;     // 搜索关键词
    tagId?: number;       // 标签筛选
    status?: number;      // 状态筛选
}

// ==================== API 接口 ====================

/**
 * 获取文章分页列表（管理端）
 * @param params 查询参数
 * @returns Promise<PageResult<PostSimple>>
 */
export const getAdminPostsApi = (params: PostQuery) => {
    return request.get<any, PageResult<PostSimple>>('/api/admin/posts', { params });
};

/**
 * 根据 ID 获取文章详情
 * @param id 文章 ID
 * @returns Promise<PostSimple>
 */
export const getPostByIdApi = (id: number) => {
    return request.get<any, PostSimple>(`/api/admin/posts/${id}`);
};

/**
 * 删除文章
 * @param id 文章 ID
 * @returns Promise<void>
 */
export const deletePostApi = (id: number) => {
    return request.delete<any, void>(`/api/admin/posts/${id}`);
};