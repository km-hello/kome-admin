import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
    loginApi,
    updateUserInfoApi,
    updatePasswordApi,
    type UserLoginRequest,
    type UserLoginResponse,
    type UserUpdateRequest,
    type UserUpdatePasswordRequest,
    type UserInfoResponse,
} from '@/api/user';

/**
 * 用户数据管理的全局状态存储。
 *
 * 提供了用户认证的状态管理功能，包括登录、注销、令牌管理等操作。
 * 使用 Pinia 框架定义的 Store 模块，用于管理和维护用户相关的数据状态。
 */
export const useUserStore = defineStore('user', () => {
    /* ========== State ========== */

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


    /* ========== Getters ========== */

    /**
     * 检查用户是否已登录
     */
    const isLoggedIn = computed(() => !!userInfo.value.token);

    /**
     * 判断用户信息是否存储在 localStorage（记住登录）
     */
    const isRemembered = computed(() => !!localStorage.getItem('userInfo'));


    /* ========== Actions ========== */

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
     * 更新用户个人资料
     *
     * @param req 更新请求数据
     * @returns 返回更新后的用户信息
     */
    const updateProfile = async (req: Partial<UserUpdateRequest>): Promise<UserInfoResponse> => {
        const data = await updateUserInfoApi(req);

        // 合并更新后的信息到 userInfo（保留 token 等其他字段）
        const updatedInfo: Partial<UserLoginResponse> = {
            ...userInfo.value,
            username: data.username,
            nickname: data.nickname,
            avatar: data.avatar,
            email: data.email,
        };

        // 同步到状态和存储
        setUserInfo(updatedInfo, isRemembered.value);

        return data;
    };

    /**
     * 修改用户密码
     *
     * @param req 密码修改请求数据
     * @description 密码修改成功后会自动清除登录状态，需要重新登录
     */
    const updatePassword = async (req: UserUpdatePasswordRequest): Promise<void> => {
        await updatePasswordApi(req);

        // 密码修改成功后清除登录状态
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

    /* ========== Return ========== */

    return {
        // State
        userInfo,

        // Getters
        isLoggedIn,
        isRemembered,

        // Actions
        login,
        logout,
        updateProfile,
        updatePassword,
    };
});