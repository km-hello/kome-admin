import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getAdminSiteInfoApi, type SiteStats } from '@/api/site';

/**
 * 站点统计数据 Store
 * 用于全局共享站点统计信息，避免重复请求
 */
export const useSiteStore = defineStore('site', () => {
    // ========== State ==========

    /**
     * 站点统计数据
     */
    const stats = ref<SiteStats>({
        publishedPostCount: 0,
        draftPostCount: 0,
        usedTagCount: 0,
        unusedTagCount: 0,
        publishedMemoCount: 0,
        draftMemoCount: 0,
        publishedLinkCount: 0,
        draftLinkCount: 0,
    });

    /**
     * 加载状态
     */
    const loading = ref(false);

    /**
     * 最后更新时间（时间戳）
     */
    const lastUpdated = ref(0);

    // ========== Getters ==========

    /**
     * 文章总数
     */
    const totalPosts = computed(() =>
        stats.value.publishedPostCount + stats.value.draftPostCount
    );

    /**
     * 标签总数
     */
    const totalTags = computed(() =>
        stats.value.usedTagCount + stats.value.unusedTagCount
    );

    /**
     * 备忘录总数
     */
    const totalMemos = computed(() =>
        stats.value.publishedMemoCount + stats.value.draftMemoCount
    );

    /**
     * 友链总数
     */
    const totalLinks = computed(() =>
        stats.value.publishedLinkCount + stats.value.draftLinkCount
    );

    /**
     * 检查数据是否需要刷新（超过30秒）
     */
    const needsRefresh = computed(() => {
        const now = Date.now();
        return !lastUpdated.value || now - lastUpdated.value > 30000;
    });

    // ========== Actions ==========

    /**
     * 获取站点统计数据
     * @param forceRefresh 是否强制刷新（忽略缓存）
     */
    const fetchStats = async (forceRefresh = false): Promise<void> => {
        // 如果数据在 30 秒内更新过，且不是强制刷新，则直接返回缓存
        if (!forceRefresh && !needsRefresh.value) {
            return;
        }

        loading.value = true;
        try {
            const siteInfo = await getAdminSiteInfoApi();
            stats.value = siteInfo.stats;
            lastUpdated.value = Date.now();
        } catch (error) {
            console.error('Failed to fetch site stats:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    /**
     * 刷新统计数据（强制刷新）
     */
    const refreshStats = async (): Promise<void> => {
        return fetchStats(true);
    };

    /**
     * 重置统计数据
     */
    const resetStats = (): void => {
        stats.value = {
            publishedPostCount: 0,
            draftPostCount: 0,
            usedTagCount: 0,
            unusedTagCount: 0,
            publishedMemoCount: 0,
            draftMemoCount: 0,
            publishedLinkCount: 0,
            draftLinkCount: 0,
        };
        lastUpdated.value = 0;
    };

    // ========== Return ==========

    return {
        // State
        stats,
        loading,
        lastUpdated,

        // Getters
        totalPosts,
        totalTags,
        totalMemos,
        totalLinks,
        needsRefresh,

        // Actions
        fetchStats,
        refreshStats,
        resetStats,
    };
});