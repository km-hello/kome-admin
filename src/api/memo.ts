/**
 * api/memo.ts - 动态管理接口
 *
 * 提供动态（Memo）的增删改及分页查询，供后台动态管理页面使用。
 */
import request from '@/request';
import type {BaseQuery, PageResult} from '@/types/api.ts';

/* ========== 类型定义 ========== */

/**
 * 备忘录查询参数。
 * 继承基础分页参数，支持关键词搜索和状态筛选。
 */
export interface MemoQuery extends BaseQuery {
    keyword?: string;     // 搜索关键词
    status?: number;      // 状态筛选 (0: 草稿 Draft, 1: 已发布 Published)

    ignorePinned?: boolean; // 是否忽略置顶排序
}

/**
 * 备忘录创建请求。
 * 提交新动态数据，支持草稿保存和直接发布。
 */
export interface MemoCreateRequest {
    content: string;      // 备忘录内容 (min 1)
    isPinned: boolean;    // 是否置顶
    status: number;       // 状态 (0: 草稿 Draft, 1: 已发布 Published)
}

/**
 * 备忘录更新请求。
 * 支持部分更新，可单独修改内容、置顶状态或发布状态。
 */
export interface MemoUpdateRequest {
    content?: string;      // 动态内容（Markdown 格式）
    isPinned?: boolean;    // 是否置顶
    status?: number;       // 状态: 0=草稿(Draft), 1=已发布(Published)
}

/**
 * 备忘录响应数据。
 * 包含动态的完整信息，用于动态管理页面的列表和编辑展示。
 */
export interface MemoResponse {
    id: number;            // 动态 ID
    content: string;       // 动态内容（Markdown 格式）
    isPinned: boolean;     // 是否置顶
    status: number;        // 状态: 0=草稿(Draft), 1=已发布(Published)
    createTime: string;    // 创建时间（ISO 格式）
}

/* ========== API 接口 ========== */

/**
 * 获取备忘录分页列表（管理端）
 * 支持按关键词、状态筛选，支持分页、排序等通用查询参数
 * @param params 查询参数
 * @returns Promise<PageResult<MemoResponse>> 分页结果
 */
export const getAdminMemosApi = (params: MemoQuery): Promise<PageResult<MemoResponse>> => {
    return request.get<PageResult<MemoResponse>>('/api/admin/memos', { params });
};

/**
 * 创建备忘录
 * 新建备忘录时状态可选择草稿或直接发布
 * @param data 创建请求数据
 * @returns Promise<number> 创建的备忘录ID
 */
export const createMemoApi = (data: MemoCreateRequest): Promise<number> => {
    return request.post<number>('/api/admin/memos', data);
};

/**
 * 更新备忘录
 * 支持部分更新，可单独修改内容、置顶状态或发布状态
 * @param id 备忘录ID
 * @param data 更新请求数据
 * @returns Promise<void>
 */
export const updateMemoApi = (id: number, data: MemoUpdateRequest): Promise<void> => {
    return request.put<void>(`/api/admin/memos/${id}`, data);
};

/**
 * 删除备忘录
 * @param id 备忘录ID
 * @returns Promise<void>
 */
export const deleteMemoApi = (id: number): Promise<void> => {
    return request.delete<void>(`/api/admin/memos/${id}`);
};