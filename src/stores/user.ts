import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginApi, type UserLoginRequest, type UserLoginResponse } from '@/api/user';

/**
 * 用户数据管理的全局状态存储。
 *
 * 提供了用户认证的状态管理功能，包括登录、注销、令牌管理等操作。
 * 使用 Pinia 框架定义的 Store 模块，用于管理和维护用户相关的数据状态。
 */
export const useUserStore = defineStore('user', () => {
    // ========== State ==========

    /**
     * 用户信息
     * 从 localStorage 或 sessionStorage 中恢复用户信息
     */
    const userInfo = ref<Partial<UserLoginResponse>>(
        JSON.parse(
            localStorage.getItem('userInfo') ||
            sessionStorage.getItem('userInfo') ||
            '{}'
        )
    );


    // ========== Getters ==========

    /**
     * 检查用户是否已登录
     */
    const isLoggedIn = computed(() => !!userInfo.value.token);


    // ========== Actions ==========

    /**
     * 用户登录方法，用于处理用户的认证与信息存储
     *
     * @param loginForm 包含用户名和密码的登录参数
     * @param remember 是否记住登录状态
     * @returns 返回包含用户信息和 Token 的响应数据
     */
    const login = async (
        loginForm: UserLoginRequest,
        remember: boolean
    ): Promise<UserLoginResponse> => {
        // 1. 调用接口
        const data: UserLoginResponse = await loginApi(loginForm);

        // 2. 保存用户信息（包含 token）
        setUserInfo(data, remember);

        return data;
    };

    /**
     * 注销当前用户会话
     *
     * 清除用户信息和相关的认证令牌，注销后用户需重新登录以恢复会话
     */
    const logout = (): void => {
        clearUserInfo();
    };

    /**
     * 设置用户信息并同步到本地存储或会话存储
     *
     * @param info 用户信息对象
     * @param remember 如果为 true，则将用户信息存储在本地存储；否则存储在会话存储
     */
    const setUserInfo = (info: Partial<UserLoginResponse>, remember: boolean): void => {
        userInfo.value = info;
        const userInfoStr = JSON.stringify(info);

        if (remember) {
            localStorage.setItem('userInfo', userInfoStr);
            sessionStorage.removeItem('userInfo');
        } else {
            sessionStorage.setItem('userInfo', userInfoStr);
            localStorage.removeItem('userInfo');
        }
    };

    /**
     * 清空用户信息
     * 此方法会同时移除本地存储（localStorage）和会话存储（sessionStorage）中的用户信息数据
     */
    const clearUserInfo = (): void => {
        userInfo.value = {};
        localStorage.removeItem('userInfo');
        sessionStorage.removeItem('userInfo');
    };

    // ========== Return ==========

    return {
        // State
        userInfo,

        // Getters
        isLoggedIn,

        // Actions
        login,
        logout
    };
});