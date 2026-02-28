/**
 * api/site.ts - 站点信息接口
 *
 * 提供站点信息获取、初始化状态检查及初始化设置，供仪表盘与设置页面使用。
 */
import request from '@/request';

/* ========== 类型定义 ========== */

/**
 * 站点统计数据。
 * 包含文章、标签、动态、友链各维度的已发布和草稿数量统计，用于 Dashboard 展示。
 */
export interface SiteStats {
    publishedPostCount: number;    // 已发布文章数
    draftPostCount: number;        // 草稿文章数
    usedTagCount: number;          // 已使用标签数
    unusedTagCount: number;        // 未使用标签数
    publishedMemoCount: number;    // 已发布备忘录数
    draftMemoCount: number;        // 草稿备忘录数
    publishedLinkCount: number;    // 已发布友链数
    draftLinkCount: number;        // 草稿友链数
}


/**
 * 站点所有者信息。
 * 包含站长的昵称、头像和简介，用于 Dashboard 页面的站长信息展示。
 */
export interface SiteOwner {
    nickname: string;      // 站长昵称
    avatar: string;        // 站长头像 URL
    description: string;   // 站长个人简介
}

/**
 * 站点信息响应。
 * 聚合站点统计数据和所有者信息，作为站点概览接口的响应结构。
 */
export interface SiteInfoResponse {
    stats: SiteStats;      // 站点统计数据
    owner: SiteOwner;      // 站点所有者信息
}

/**
 * 首次设置管理员请求。
 * 系统未初始化时提交的管理员账户创建数据，包含必填的用户名密码和选填的个人资料。
 */
export interface SetupRequest {
    username: string;      // 管理员用户名（必填，min 3, max 20）
    password: string;      // 管理员密码（必填，min 6, max 50）
    nickname?: string;     // 昵称（选填，默认 "Admin"）
    avatar?: string;       // 头像 URL（选填，默认 DiceBear 生成）
    description?: string;  // 个人简介（选填）
    email?: string;        // 邮箱地址（选填）
}

/* ========== API 接口 ========== */

/**
 * 获取站点概览信息
 * 用于 Dashboard 页面展示统计数据
 * @returns Promise<SiteInfoResponse> 站点信息包括统计数据和所有者信息
 */
export const getAdminSiteInfoApi = () => {
    return request.get<SiteInfoResponse>('/api/admin/site/info');
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