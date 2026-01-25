
import request from '@/request';
import type {BaseQuery, PageResult} from '@/types/api.ts';

// ==================== 类型定义 ====================

/**
 * 友链查询参数
 */
export interface LinkQuery extends BaseQuery {
    keyword?: string;     // 搜索关键词
    status?: number;      // 状态筛选 (0: Draft, 1: Published)
}

/**
 * 友链创建请求
 */
export interface LinkCreateRequest {
    name: string;         // 友链名称 (max 100)
    url: string;          // 友链地址 (max 255)
    avatar?: string;      // 头像地址 (max 255)
    description?: string; // 描述 (max 255)
    status: number;       // 状态 (0: Draft, 1: Published)
}

/**
 * 友链更新请求
 */
export interface LinkUpdateRequest {
    name?: string;
    url?: string;
    avatar?: string;
    description?: string;
    status?: number;
}

/**
 * 友链响应数据
 */
export interface LinkResponse {
    id: number;
    name: string;
    url: string;
    avatar?: string;
    description?: string;
    status: number;
    createTime: string;
}

// ==================== API 接口 ====================

/**
 * 获取友链分页列表（管理端）
 * @param params 查询参数
 */
export const getAdminLinksApi = (params: LinkQuery): Promise<PageResult<LinkResponse>> => {
    return request.get<PageResult<LinkResponse>>('/api/admin/links', { params });
};

/**
 * 创建友链
 * @param data 创建请求数据
 */
export const createLinkApi = (data: LinkCreateRequest): Promise<number> => {
    return request.post<number>('/api/admin/links', data);
};

/**
 * 更新友链
 * @param id 友链ID
 * @param data 更新请求数据
 */
export const updateLinkApi = (id: number, data: LinkUpdateRequest): Promise<void> => {
    return request.put<void>(`/api/admin/links/${id}`, data);
};

/**
 * 删除友链
 * @param id 友链ID
 */
export const deleteLinkApi = (id: number): Promise<void> => {
    return request.delete<void>(`/api/admin/links/${id}`);
};