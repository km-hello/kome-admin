
import request from '@/request';
import type {BaseQuery, PageResult} from '@/types/api.ts';

// ==================== 类型定义 ====================

/**
 * 备忘录查询参数
 */
export interface MemoQuery extends BaseQuery {
    keyword?: string;     // 搜索关键词
    status?: number;      // 状态筛选 (0: Draft, 1: Published)
}

/**
 * 备忘录创建请求
 */
export interface MemoCreateRequest {
    content: string;      // 备忘录内容 (min 1)
    isPinned: boolean;    // 是否置顶
    status: number;       // 状态 (0: Draft, 1: Published)
}

/**
 * 备忘录更新请求
 */
export interface MemoUpdateRequest {
    content?: string;
    isPinned?: boolean;
    status?: number;
}

/**
 * 备忘录响应数据
 */
export interface MemoResponse {
    id: number;
    content: string;
    isPinned: boolean;
    status: number;
    createTime: string;
}

// ==================== API 接口 ====================

/**
 * 获取备忘录分页列表（管理端）
 * @param params 查询参数
 */
export const getAdminMemosApi = (params: MemoQuery): Promise<PageResult<MemoResponse>> => {
    return request.get<PageResult<MemoResponse>>('/api/admin/memos', { params });
};

/**
 * 创建备忘录
 * @param data 创建请求数据
 */
export const createMemoApi = (data: MemoCreateRequest): Promise<number> => {
    return request.post<number>('/api/admin/memos', data);
};

/**
 * 更新备忘录
 * @param id 备忘录ID
 * @param data 更新请求数据
 */
export const updateMemoApi = (id: number, data: MemoUpdateRequest): Promise<void> => {
    return request.put<void>(`/api/admin/memos/${id}`, data);
};

/**
 * 删除备忘录
 * @param id 备忘录ID
 */
export const deleteMemoApi = (id: number): Promise<void> => {
    return request.delete<void>(`/api/admin/memos/${id}`);
};