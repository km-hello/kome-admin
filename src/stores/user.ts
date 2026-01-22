import { defineStore } from 'pinia';
import { loginApi, type UserLoginRequest, type UserLoginResponse } from '@/api/user';

/**
 * 用户数据管理的全局状态存储。
 *
 * 提供了用户认证的状态管理功能，包括登录、注销、令牌管理等操作。
 * 使用 Pinia 框架定义的Store模块，用于管理和维护用户相关的数据状态。
 */
export const useUserStore = defineStore('user', {
    // ========== State ==========
    state: () => ({
        userInfo: JSON.parse(localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo') || '{}') as Partial<UserLoginResponse>
    }),

    // ========== Getters ==========
    getters: {
        /**
         * 检查用户是否已登录。
         *
         * @return {boolean} 如果用户已登录则返回 true，否则返回 false。
         */
        isLoggedIn(): boolean {
            return !!this.userInfo.token;
        }
    },

    // ========== Actions ==========
    actions: {
        /**
         * 用户登录方法，用于处理用户的认证与信息存储。
         *
         * @param {UserLoginRequest} loginForm 包含用户名和密码的登录参数。
         * @param {boolean} remember 是否记住登录状态。
         * @return {Promise<object>} 返回包含用户信息和 Token 的响应数据。
         */
        async login(loginForm: UserLoginRequest, remember: boolean): Promise<UserLoginResponse> {
            // 1. 调用接口
            const data: UserLoginResponse = await loginApi(loginForm);

            // 2. 保存用户信息（包含 token）
            this.setUserInfo(data, remember);

            return data;
        },

        /**
         * 注销当前用户会话。
         *
         * 清除用户信息和相关的认证令牌，注销后用户需重新登录以恢复会话。
         *
         * @return {void} 无返回值
         */
        logout(): void {
            this.clearUserInfo();
        },

        /**
         * 设置用户信息并同步到本地存储或会话存储。
         *
         * @param {Partial<UserLoginResponse>} userInfo 用户信息对象。
         * @param {boolean} remember 如果为 true，则将用户信息存储在本地存储；否则存储在会话存储。
         * @return {void} 无返回值。
         */
        setUserInfo(userInfo: Partial<UserLoginResponse>, remember: boolean): void {
            this.userInfo = userInfo;
            const userInfoStr = JSON.stringify(userInfo);

            if (remember) {
                localStorage.setItem('userInfo', userInfoStr);
                sessionStorage.removeItem('userInfo');
            } else {
                sessionStorage.setItem('userInfo', userInfoStr);
                localStorage.removeItem('userInfo');
            }
        },

        /**
         * 清空用户信息。
         * 此方法会同时移除本地存储（localStorage）和会话存储（sessionStorage）中的用户信息数据。
         *
         * @return {void} 无返回值
         */
        clearUserInfo(): void {
            this.userInfo = {};
            localStorage.removeItem('userInfo');
            sessionStorage.removeItem('userInfo');
        }
    }
});