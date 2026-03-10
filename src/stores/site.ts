import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getAdminSiteInfoApi, checkInitializedApi, type AdminSiteInfoResponse } from '@/api/site';

/**
 * 站点信息 Store
 * 管理后台站点统计数据与系统初始化状态，提供缓存、失效标记和防并发机制。
 */
export const useSiteStore = defineStore('site', () => {
    /* ========== State ========== */

    /**
     * 系统初始化状态
     * null: 未检查，true: 已初始化，false: 未初始化
     */
    const initialized = ref<boolean | null>(null);

    /**
     * 初始化状态检查中
     */
    const checking = ref(false);

    /**
     * 后台站点统计数据
     */
    const stats = ref<AdminSiteInfoResponse>({
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

    /**
     * 数据是否已失效（需要在下次获取时强制刷新）
     */
    const isStale = ref(false);

    /* ========== Getters ========== */

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
     * 动态总数
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
     * 检查数据是否需要刷新（超过30秒或已标记失效）
     */
    const needsRefresh = computed(() => {
        if (isStale.value) return true;
        const now = Date.now();
        return !lastUpdated.value || now - lastUpdated.value > 30000;
    });

    /* ========== Actions ========== */

    /** 防并发：正在进行的请求 Promise，避免 afterEach 和 onMounted 同时触发重复请求 */
    let fetchPromise: Promise<void> | null = null;

    /**
     * 获取站点统计数据
     * @param forceRefresh 是否强制刷新（忽略缓存）
     */
    const fetchStats = async (forceRefresh = false): Promise<void> => {
        // 如果数据在 30 秒内更新过，且不是强制刷新，且数据未失效，则直接返回缓存
        if (!forceRefresh && !needsRefresh.value) {
            return;
        }

        // 复用正在进行的请求，避免并发重复调用
        if (fetchPromise && !forceRefresh) {
            return fetchPromise;
        }

        fetchPromise = (async () => {
            loading.value = true;
            try {
                stats.value = await getAdminSiteInfoApi();
                lastUpdated.value = Date.now();
                isStale.value = false;
            } catch (error) {
                console.error('Failed to fetch site stats:', error);
                throw error;
            } finally {
                loading.value = false;
                fetchPromise = null;
            }
        })();

        return fetchPromise;
    };

    /**
     * 刷新统计数据（强制刷新）
     */
    const refreshStats = async (): Promise<void> => {
        return fetchStats(true);
    };

    /**
     * 标记数据已失效（下次 fetchStats 时会强制刷新）
     * 适用于：在某个页面修改了数据，但不想立即刷新，让其他页面在进入时自动刷新
     */
    const invalidateStats = (): void => {
        isStale.value = true;
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
        isStale.value = false;
    };

    /**
     * 检查系统是否已初始化
     * 如果已经检查过，直接返回缓存值
     */
    const checkInitialized = async (): Promise<boolean> => {
        if (initialized.value !== null) {
            return initialized.value;
        }

        checking.value = true;
        try {
            initialized.value = await checkInitializedApi();
            return initialized.value;
        } finally {
            checking.value = false;
        }
    };

    /**
     * 设置初始化状态为已完成
     * 在设置向导完成后调用
     */
    const setInitialized = (): void => {
        initialized.value = true;
    };

    /* ========== Return ========== */

    return {
        // State
        initialized,
        checking,
        stats,
        loading,
        lastUpdated,
        isStale,

        // Getters
        totalPosts,
        totalTags,
        totalMemos,
        totalLinks,
        needsRefresh,

        // Actions
        checkInitialized,
        setInitialized,
        fetchStats,
        refreshStats,
        invalidateStats,
        resetStats,
    };
});