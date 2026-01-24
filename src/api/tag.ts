
import request from '@/request';
import type { PageResult, BaseQuery } from '../types/api.ts';

// ========== 类型定义 ==========

/**
 * Tag 基础响应
 */
export interface TagResponse {
    id: number;
    name: string;
}

/**
 * Tag 带文章数量响应
 */
export interface TagPostCountResponse {
    id: number;
    name: string;
    postCount: number;
}

/**
 * Tag 创建请求
 */
export interface TagCreateRequest {
    name: string;
}

/**
 * Tag 更新请求
 */
export interface TagUpdateRequest {
    name: string;
}

/**
 * Tag 查询请求
 */
export interface TagQuery extends BaseQuery {
    keyword?: string;  // 搜索关键词
}

// ========== API 函数 ==========

/**
 * 获取管理端 Tag 分页列表
 */
export const getAdminTagsApi = (params: TagQuery) => {
    return request.get<PageResult<TagPostCountResponse>>('/api/admin/tags', { params });
};

export const getAdminTagListApi = () => {
    return request.get<TagResponse[]>('/api/admin/tags/all');
};

/**
 * 创建 Tag
 */
export const createTagApi = (data: TagCreateRequest) => {
    return request.post<TagResponse>('/api/admin/tags', data);
};

/**
 * 更新 Tag
 */
export const updateTagApi = (id: number, data: TagUpdateRequest) => {
    return request.put<TagResponse>(`/api/admin/tags/${id}`, data);
};

/**
 * 删除 Tag
 */
export const deleteTagApi = (id: number) => {
    return request.delete<void>(`/api/admin/tags/${id}`);
};