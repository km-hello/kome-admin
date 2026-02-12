import request from '@/request';

// ==================== 类型定义 ====================

/**
 * 站点统计数据
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
 * 站点所有者信息
 */
export interface SiteOwner {
    nickname: string;
    avatar: string;
    description: string;
}

/**
 * 站点信息响应
 */
export interface SiteInfoResponse {
    stats: SiteStats;
    owner: SiteOwner;
}

/**
 * 首次设置管理员请求
 */
export interface SetupRequest {
    username: string;
    password: string;
    nickname?: string;
    avatar?: string;
    description?: string;
    email?: string;
}

// ==================== API 接口 ====================

/**
 * 获取站点概览信息
 * 用于 Dashboard 页面展示统计数据
 * @returns Promise<SiteInfoResult>
 */
export const getAdminSiteInfoApi = () => {
    return request.get<SiteInfoResponse>('/api/admin/site/info');
};

/**
 * 检查系统是否已初始化
 * 用于首次访问时判断是否需要跳转到设置页面
 */
export const checkInitializedApi = () => {
    return request.get<boolean>('/api/site/initialized');
};

/**
 * 首次设置管理员
 * 仅当系统未初始化时可用
 */
export const setupAdminApi = (data: SetupRequest) => {
    return request.post<void>('/api/site/setup', data);
};