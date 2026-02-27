
import request from '@/request';
import type {BaseQuery, PageResult} from '@/types/api.ts';

/* ========== 类型定义 ========== */

/**
 * 友链查询参数。
 * 继承基础分页参数，支持关键词搜索和状态筛选。
 */
export interface LinkQuery extends BaseQuery {
    keyword?: string;     // 搜索关键词
    status?: number;      // 状态筛选 (0: 草稿 Draft, 1: 已发布 Published)
}

/**
 * 友链创建请求。
 * 提交新友链数据，包含名称、地址、头像等字段，支持草稿保存和直接发布。
 */
export interface LinkCreateRequest {
    name: string;         // 友链名称 (max 100)
    url: string;          // 友链地址 (max 255)
    avatar?: string;      // 头像地址 (max 255)
    description?: string; // 描述 (max 255)
    status: number;       // 状态 (0: 草稿 Draft, 1: 已发布 Published)
}

/**
 * 友链更新请求。
 * 支持部分更新，可单独修改名称、地址、状态等字段。
 */
export interface LinkUpdateRequest {
    name?: string;         // 友链名称（max 100）
    url?: string;          // 友链地址（max 255）
    avatar?: string;       // 头像 URL（max 255）
    description?: string;  // 友链描述（max 255）
    status?: number;       // 状态: 0=草稿(Draft), 1=已发布(Published)
}

/**
 * 友链响应数据。
 * 包含友链的完整信息，用于友链管理页面的列表和编辑展示。
 */
export interface LinkResponse {
    id: number;            // 友链 ID
    name: string;          // 友链名称
    url: string;           // 友链地址
    avatar?: string;       // 头像 URL
    description?: string;  // 友链描述
    status: number;        // 状态: 0=草稿(Draft), 1=已发布(Published)
    createTime: string;    // 创建时间（ISO 格式）
}

/* ========== API 接口 ========== */

/**
 * 获取友链分页列表（管理端）
 * 支持按关键词、状态筛选，支持分页、排序等通用查询参数
 * @param params 查询参数
 * @returns Promise<PageResult<LinkResponse>> 分页结果
 */
export const getAdminLinksApi = (params: LinkQuery): Promise<PageResult<LinkResponse>> => {
    return request.get<PageResult<LinkResponse>>('/api/admin/links', { params });
};

/**
 * 创建友链
 * 支持草稿和直接发布两种状态
 * @param data 创建请求数据
 * @returns Promise<number> 创建的友链ID
 */
export const createLinkApi = (data: LinkCreateRequest): Promise<number> => {
    return request.post<number>('/api/admin/links', data);
};

/**
 * 更新友链
 * 支持部分更新，可单独修改各字段或发布状态
 * @param id 友链ID
 * @param data 更新请求数据
 * @returns Promise<void>
 */
export const updateLinkApi = (id: number, data: LinkUpdateRequest): Promise<void> => {
    return request.put<void>(`/api/admin/links/${id}`, data);
};

/**
 * 删除友链
 * @param id 友链ID
 * @returns Promise<void>
 */
export const deleteLinkApi = (id: number): Promise<void> => {
    return request.delete<void>(`/api/admin/links/${id}`);
};