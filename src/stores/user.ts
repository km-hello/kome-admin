import { defineStore } from 'pinia';
import { loginApi, type LoginParams, type LoginResult } from '@/api/user';

/**
 * 用户数据管理的全局状态存储。
 *
 * 提供了用户认证的状态管理功能，包括登录、注销、令牌管理等操作。
 * 使用 Pinia 框架定义的Store模块，用于管理和维护用户相关的数据状态。
 */
export const useUserStore = defineStore('user', {
    // ========== State ==========
    state: () => ({
        userInfo: {} as Partial<LoginResult>,
        token: (localStorage.getItem('token') || sessionStorage.getItem('token')) || '',
    }),

    // ========== Getters ==========
    getters: {
        /**
         * 检查用户是否已登录。
         *
         * @return {boolean} 如果用户已登录则返回 true，否则返回 false。
         */
        isLoggedIn(): boolean {
            return !!this.token;
        }
    },

    // ========== Actions ==========
    actions: {
        /**
         * 用户登录方法，用于处理用户的认证与信息存储。
         *
         * @param {LoginParams} loginForm 包含用户名和密码的登录参数。
         * @param {boolean} remember 是否记住登录状态。
         * @return {Promise<object>} 返回包含用户信息和 Token 的响应数据。
         */
        async login(loginForm: LoginParams, remember: boolean): Promise<LoginResult> {
            // 1. 调用接口
            const data = await loginApi(loginForm);

            // 2. 存储 Token (核心逻辑)
            this.setToken(data.token, remember);

            // 3. 保存用户信息
            this.userInfo = data;

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
            this.userInfo = {};
            this.clearToken();
        },

        /**
         * 设置令牌并同步到本地存储或会话存储。
         *
         * @param {string} token 要设置的令牌值。
         * @param {boolean} remember 如果为 true，则将令牌存储在本地存储；否则存储在会话存储。
         * @return {void} 无返回值。
         */
        setToken(token: string, remember: boolean): void {
            this.token = token; // 更新响应式状态

            if (remember) {
                localStorage.setItem('token', token);
                sessionStorage.removeItem('token'); // 互斥清理
            } else {
                sessionStorage.setItem('token', token);
                localStorage.removeItem('token'); // 互斥清理
            }
        },

        /**
         * 清空当前的认证令牌（token）。
         * 此方法会同时移除本地存储（localStorage）和会话存储（sessionStorage）中的 token 数据。
         *
         * @return {void} 无返回值
         */
        clearToken(): void {
            this.token = ''; // 清空响应式状态
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
        }
    }
});