import request from '@/utils/request';

// ==================== 类型定义 ====================

/**
 * 站点统计数据
 */
export interface SiteStats {
    postCount: number;    // 文章总数
    tagCount: number;     // 标签总数
    memoCount: number;    // 备忘录总数
    linkCount: number;    // 友链总数
}

/**
 * 站点信息响应
 */
export interface SiteInfoResult {
    stats: SiteStats;
    owner?: {
        nickname: string;
        avatar: string;
        description: string;
    };
}

// ==================== API 接口 ====================

/**
 * 获取站点概览信息
 * 用于 Dashboard 页面展示统计数据
 * @returns Promise<SiteInfoResult>
 */
export const getSiteInfoApi = () => {
    return request.get<any, SiteInfoResult>('/api/site/info');
};