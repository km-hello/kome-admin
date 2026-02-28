/**
 * api/tag.ts - 标签管理接口
 *
 * 提供标签的增删改查、分页查询及全量列表获取，供后台标签管理页面使用。
 */
import request from '@/request';
import type { PageResult, BaseQuery } from '../types/api.ts';

/* ========== 类型定义 ========== */

/**
 * Tag 基础响应。
 * 标签的最小信息结构，用于文章关联标签的展示。
 */
export interface TagResponse {
    id: number;            // 标签 ID
    name: string;          // 标签名称
}

/**
 * Tag 带文章数量响应。
 * 包含标签关联的文章数量统计，用于标签管理页面的列表展示。
 */
export interface TagPostCountResponse {
    id: number;            // 标签 ID
    name: string;          // 标签名称
    postCount: number;     // 关联文章数量
    createTime: string;    // 创建时间（ISO 格式）
}

/**
 * Tag 创建请求。
 * 提交新标签名称，标签名不可重复。
 */
export interface TagCreateRequest {
    name: string;          // 标签名称（max 50，不可重复）
}

/**
 * Tag 更新请求。
 * 修改指定标签的名称，标签名不可重复。
 */
export interface TagUpdateRequest {
    name: string;          // 标签名称（max 50，不可重复）
}

/**
 * Tag 查询请求。
 * 继承基础分页参数，支持关键词搜索。
 */
export interface TagQuery extends BaseQuery {
    keyword?: string;  // 搜索关键词
}

/* ========== API 函数 ========== */

/**
 * 获取管理端标签分页列表。
 * 返回带文章数量统计的标签分页数据，用于标签管理页面展示。
 *
 * @param params 查询参数，包含分页信息和关键词搜索。
 * @returns 标签分页数据（含文章数量）。
 */
export const getAdminTagsApi = (params: TagQuery) => {
    return request.get<PageResult<TagPostCountResponse>>('/api/admin/tags', { params });
};

/**
 * 获取管理端所有标签（全量列表）。
 * 返回不分页的全部标签数据，用于文章编辑器的标签选择器下拉列表。
 *
 * @returns 标签列表（不含文章数量）。
 */
export const getAdminTagListApi = () => {
    return request.get<TagResponse[]>('/api/admin/tags/all');
};

/**
 * 创建标签。
 * 提交新标签名称到服务端，标签名不可重复。
 *
 * @param data 标签创建请求数据。
 * @returns 新创建的标签对象。
 */
export const createTagApi = (data: TagCreateRequest) => {
    return request.post<TagResponse>('/api/admin/tags', data);
};

/**
 * 更新标签。
 * 修改指定标签的名称。
 *
 * @param id 标签 ID。
 * @param data 标签更新请求数据。
 * @returns 更新后的标签对象。
 */
export const updateTagApi = (id: number, data: TagUpdateRequest) => {
    return request.put<TagResponse>(`/api/admin/tags/${id}`, data);
};

/**
 * 删除标签。
 * 根据标签 ID 永久删除标签，已关联的文章将自动解除关联。
 *
 * @param id 标签 ID。
 */
export const deleteTagApi = (id: number) => {
    return request.delete<void>(`/api/admin/tags/${id}`);
};