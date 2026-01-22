
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
export interface TagQueryRequest extends BaseQuery {
    // 可以扩展其他查询参数
}

// ========== API 函数 ==========

/**
 * 获取管理端 Tag 分页列表
 */
export const getAdminTagsApi = (params: TagQueryRequest) => {
    return request.get<PageResult<TagPostCountResponse>>('/api/admin/tags', { params });
};

/**
 * 获取公开 Tag 列表（无分页）
 */
export const getPublicTagsApi = () => {
    return request.get<TagPostCountResponse[]>('/api/tags');
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