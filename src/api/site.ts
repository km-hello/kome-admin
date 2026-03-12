/**
 * api/site.ts - 后台站点接口
 *
 * 提供后台统计信息获取、初始化状态检查及初始化设置。
 */
import request from '@/request';

/* ========== 类型定义 ========== */

/**
 * 站点统计数据。
 * 包含文章、标签、动态、友链各维度的已发布和草稿数量统计，用于 Dashboard 展示。
 */
export interface AdminSiteInfoResponse {
    publishedPostCount: number;    // 已发布文章数
    draftPostCount: number;        // 草稿文章数
    usedTagCount: number;          // 已使用标签数
    unusedTagCount: number;        // 未使用标签数
    publishedMemoCount: number;    // 已发布动态数
    draftMemoCount: number;        // 草稿动态数
    publishedLinkCount: number;    // 已发布友链数
    draftLinkCount: number;        // 草稿友链数
}


/**
 * 首次设置管理员请求。
 * 系统未初始化时提交的管理员账户创建数据，包含必填的用户名密码和选填的个人资料。
 */
export interface SetupRequest {
    username: string;           // 管理员用户名（必填，4-50 位，仅允许字母、数字、下划线和连字符）
    password: string;           // 管理员密码（必填，8-64 位，至少包含字母、数字和特殊字符）
    nickname: string | null;    // 昵称（选填，最大 50 位）
    avatar: string | null;      // 头像 URL（选填，最大 255 位）
    description: string | null; // 个人简介（选填）
    email: string | null;       // 邮箱地址（选填，最大 100 位）
}

/* ========== API 接口 ========== */

/**
 * 获取站点概览信息
 * 用于 Dashboard 页面展示统计数据
 * @returns Promise<AdminSiteInfoResponse> 后台站点统计数据
 */
export const getAdminSiteInfoApi = () => {
    return request.get<AdminSiteInfoResponse>('/api/admin/site/info');
};

/**
 * 检查系统是否已初始化
 * 用于首次访问时判断是否需要跳转到设置页面
 * @returns Promise<boolean> 是否已初始化
 */
export const checkInitializedApi = () => {
    return request.get<boolean>('/api/site/initialized');
};

/**
 * 首次设置管理员
 * 仅当系统未初始化时可用
 * @param data 设置请求数据
 * @returns Promise<void>
 */
export const setupAdminApi = (data: SetupRequest) => {
    return request.post<void>('/api/site/setup', data);
};
