import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { toast } from 'vue-sonner';
import type { ApiResponse } from '@/api/types';

/**
 * 创建 Axios 实例
 * 配置基础 URL 和超时时间
 */
const service: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * 请求拦截器
 * 功能：自动在请求头中添加 Token
 */
service.interceptors.request.use(
    (config) => {
        // 从 localStorage 获取 token
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

/**
 * 响应拦截器
 * 功能：
 * 1. 统一解包后端数据（返回 data 字段）
 * 2. 统一处理业务错误（弹出 Toast）
 * 3. 处理 Token 过期（跳转登录页）
 */
service.interceptors.response.use(
    (response: AxiosResponse) => {
        // 获取后端返回的完整数据结构
        const res = response.data as ApiResponse;

        // 业务成功（根据后端约定，code === 200 表示成功）
        if (res.code === 200) {
            // ★ 核心：直接返回 data，前端组件无需再写 res.data.data
            return res.data;
        }

        // 业务失败处理
        const errorMessage = res.message || '系统错误';
        toast.error(errorMessage);

        // 特殊状态码处理
        if (res.code === 401) {
            // Token 过期或未登录
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        return Promise.reject(new Error(errorMessage));
    },
    (error) => {
        // HTTP 状态码错误（如 404, 500, 网络断开）
        console.error('Response Error:', error);

        let message = '网络连接异常，请稍后重试';
        if (error.response) {
            switch (error.response.status) {
                case 404:
                    message = '请求的资源不存在';
                    break;
                case 500:
                    message = '服务器内部错误';
                    break;
                case 403:
                    message = '没有权限访问';
                    break;
            }
        }

        toast.error(message);
        return Promise.reject(error);
    }
);

export default service;