import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loginApi, type LoginParams, type LoginResult } from '@/api/user';

/**
 * 用户状态管理
 * 负责：登录状态、Token 管理、用户信息存储
 */
export const useUserStore = defineStore('user', () => {
    // ========== State ==========
    const token = ref(localStorage.getItem('token') || '');
    const userInfo = ref<Partial<LoginResult>>({});

    // ========== Actions ==========

    /**
     * 登录操作
     * @param form 登录表单
     */
    const login = async (form: LoginParams) => {
        // 调用登录 API（拦截器已自动解包，这里直接拿到 LoginResult）
        const data = await loginApi(form);

        // 保存 Token 和用户信息
        token.value = data.token;
        userInfo.value = data;

        // 持久化到 localStorage
        localStorage.setItem('token', data.token);

        return data;
    };

    /**
     * 退出登录
     */
    const logout = () => {
        token.value = '';
        userInfo.value = {};
        localStorage.removeItem('token');
    };

    /**
     * 检查是否已登录
     */
    const isLoggedIn = () => {
        return !!token.value;
    };

    return {
        token,
        userInfo,
        login,
        logout,
        isLoggedIn,
    };
});