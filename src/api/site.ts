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

// ==================== API 接口 ====================

/**
 * 获取站点概览信息
 * 用于 Dashboard 页面展示统计数据
 * @returns Promise<SiteInfoResult>
 */
export const getAdminSiteInfoApi = () => {
    return request.get<SiteInfoResponse>('/api/admin/site/info');
};