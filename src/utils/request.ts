import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios';
import { toast } from 'vue-sonner';
import type { ApiResponse } from '@/api/types';

/**
 * 创建 Axios 实例
 * 配置基础 URL 和超时时间
 */
const service: AxiosInstance = axios.create({
    baseURL: '',
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

        // 业务失败处理（理论上不会走到这里，因为后端错误会返回非 2xx 状态码）
        const errorMessage = res.message || '操作失败';
        toast.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
    },
    (error: AxiosError) => {
        console.error('Response Error:', error);

        // 如果有响应数据，优先使用后端返回的错误信息
        if (error.response?.data) {
            const res = error.response.data as ApiResponse;
            const message = res.message || '请求失败';
            const code = res.code || error.response.status;

            // 根据状态码进行不同处理
            switch (code) {
                case 401:
                    // 未认证：用户名或密码错误 / Token 过期
                    toast.error(message);
                    localStorage.removeItem('token');
                    // 延迟跳转，让用户看到错误提示
                    setTimeout(() => {
                        if (window.location.pathname !== '/login') {
                            window.location.href = '/login';
                        }
                    }, 1000);
                    break;

                case 403:
                    // 权限不足
                    toast.error(message);
                    break;

                case 404:
                    // 资源不存在
                    toast.error(message);
                    break;

                case 400:
                    // 请求参数错误 / JSON 解析失败 / 参数校验失败
                    toast.error(message);
                    break;

                case 405:
                    // 请求方法不支持
                    toast.error(message);
                    break;

                case 500:
                    // 服务器内部错误
                    toast.error(message);
                    break;

                default:
                    // 其他错误
                    toast.error(message);
            }

            return Promise.reject(error);
        }

        // 网络错误或其他异常（无响应数据）
        let message = '网络连接异常，请稍后重试';

        if (error.message === 'Network Error') {
            message = '网络连接失败，请检查网络设置';
        } else if (error.code === 'ECONNABORTED') {
            message = '请求超时，请稍后重试';
        } else if (error.message) {
            message = error.message;
        }

        toast.error(message);
        return Promise.reject(error);
    }
);

export default service;