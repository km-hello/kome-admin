import {defineStore} from 'pinia';
import {ref, computed} from 'vue';
import {
    getAuthInfoApi,
    loginApi,
    type AuthLoginRequest,
    type AuthInfoResponse,
    type AuthLoginResponse,
} from '@/api/auth';

/**
 * 认证会话数据结构。
 * 包含 JWT 令牌信息和当前用户基本资料，用于本地持久化和状态恢复。
 */
interface AuthSession {
    accessToken: string;       // JWT 访问令牌
    expiresAt: number;         // 令牌过期时间戳（毫秒），由后端签发时计算
    user: AuthInfoResponse;    // 当前用户基本信息
}

/** 认证会话在本地存储中的键名 */
const STORAGE_KEY = 'authInfo';

/**
 * 从本地存储中解析已保存的认证会话。
 * 优先读取 localStorage（记住登录），其次 sessionStorage（会话级）。
 *
 * @returns 解析成功返回 AuthSession，否则返回 null
 */
const parseStoredSession = (): AuthSession | null => {
    const raw = localStorage.getItem(STORAGE_KEY)
        || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        if (parsed.accessToken && parsed.user) {
            return parsed as AuthSession;
        }
    } catch (e) {
        console.error('Failed to parse auth session:', e);
    }

    return null;
};

/**
 * 认证状态管理 Store。
 *
 * 管理 JWT 会话生命周期：登录、静默验证、注销、用户信息刷新。
 * 会话数据根据"记住登录"选项持久化到 localStorage 或 sessionStorage。
 */
export const useAuthStore = defineStore('auth', () => {
    /* ========== State ========== */

    /** 当前认证会话，初始化时从本地存储恢复 */
    const authSession = ref<AuthSession | null>(parseStoredSession());

    /** 会话是否已通过后端验证（同一标签页生命周期内只验证一次） */
    const authChecked = ref(false);

    /** 是否正在执行会话验证 */
    const authChecking = ref(false);

    /** 防并发：正在进行的验证 Promise，避免多个路由守卫同时触发重复请求 */
    let validationPromise: Promise<boolean> | null = null;


    /* ========== Getters ========== */

    /** 是否持有 token（不代表已验证，仅用于快速判断） */
    const hasToken = computed(() => !!authSession.value?.accessToken);

    /** 是否已登录（持有 token 且已通过后端验证） */
    const isLoggedIn = computed(() => hasToken.value && authChecked.value);

    /** 当前用户信息（用于后台布局展示） */
    const currentUser = computed<AuthInfoResponse | null>(() => authSession.value?.user ?? null);

    /** 判断认证信息是否存储在 localStorage（记住登录） */
    const isRemembered = computed(() => !!localStorage.getItem(STORAGE_KEY));


    /* ========== Actions ========== */

    /**
     * 用户登录，创建认证会话并持久化。
     *
     * @param loginForm 包含用户名和密码的登录参数
     * @param remember 是否记住登录状态
     * @returns 登录响应数据
     */
    const login = async (
        loginForm: AuthLoginRequest,
        remember: boolean
    ): Promise<AuthLoginResponse> => {
        const data: AuthLoginResponse = await loginApi(loginForm);
        setAuthSession(data, remember);
        return data;
    };

    /**
     * 静默校验当前本地会话。
     * 流程：客户端过期预检 → 去重检查 → 后端验证 → 刷新用户信息。
     * 仅当后端确认 token 仍有效时，才将状态标记为已登录。
     */
    const validateSession = async (): Promise<boolean> => {
        if (!hasToken.value) {
            authChecked.value = false;
            return false;
        }

        // 客户端预检：token 已过期则直接清除，避免发送无效请求
        if (authSession.value && Date.now() > authSession.value.expiresAt) {
            clearAuthSession();
            return false;
        }

        // 同一标签页内已验证过，直接放行
        if (authChecked.value) {
            return true;
        }

        // 防并发：复用正在进行的验证请求
        if (validationPromise) {
            return validationPromise;
        }

        authChecking.value = true;
        validationPromise = (async () => {
            try {
                const data = await getAuthInfoApi({
                    skipAuthRedirect: true,
                    skipErrorToast: true,
                });

                updateAuthInfo(data);
                authChecked.value = true;

                return true;
            } catch {
                clearAuthSession();
                return false;
            } finally {
                authChecking.value = false;
                validationPromise = null;
            }
        })();

        return validationPromise;
    };

    /**
     * 注销当前用户会话。
     * 清除内存状态和本地存储，注销后用户需重新登录。
     */
    const logout = (): void => {
        clearAuthSession();
    };

    /**
     * 更新当前认证信息（仅 user 字段）。
     * 用于守卫校验成功后刷新后台布局展示，或个人资料编辑后同步侧边栏。
     *
     * @param user 最新的认证信息
     */
    const updateAuthInfo = (user: AuthInfoResponse): void => {
        if (!authSession.value) return;
        authSession.value = {
            ...authSession.value,
            user,
        };
        persistAuthSession(isRemembered.value);
    };

    /**
     * 从登录响应中提取会话数据并持久化。
     *
     * @param info 登录响应
     * @param remember 是否记住登录（true → localStorage，false → sessionStorage）
     */
    const setAuthSession = (info: AuthLoginResponse, remember: boolean): void => {
        authSession.value = {
            accessToken: info.accessToken,
            expiresAt: info.expiresAt,
            user: info.user,
        };
        authChecked.value = true;
        persistAuthSession(remember);
    };

    /**
     * 将认证会话持久化到本地存储。
     * 写入目标存储的同时清除另一侧，确保同一时刻只存在于一处。
     *
     * @param remember 是否记住登录（true → localStorage，false → sessionStorage）
     */
    const persistAuthSession = (remember: boolean): void => {
        if (!authSession.value) return;
        const json = JSON.stringify(authSession.value);

        if (remember) {
            localStorage.setItem(STORAGE_KEY, json);
            sessionStorage.removeItem(STORAGE_KEY);
        } else {
            sessionStorage.setItem(STORAGE_KEY, json);
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    /**
     * 清空认证会话。
     * 同时清除内存状态和所有本地存储中的认证数据。
     */
    const clearAuthSession = (): void => {
        authSession.value = null;
        authChecked.value = false;
        authChecking.value = false;
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
    };

    /* ========== Return ========== */

    return {
        // State
        authSession,
        authChecked,
        authChecking,

        // Getters
        hasToken,
        isLoggedIn,
        isRemembered,
        currentUser,

        // Actions
        login,
        validateSession,
        updateAuthInfo,
        logout,
    };
});
