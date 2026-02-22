import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios';
import { toast } from 'vue-sonner';
import type { Result } from '@/types/api.ts';

/**
 * 定义 Axios 服务实例，用于执行 HTTP 请求。
 *
 * 此实例配置了默认的基础路径、超时时间和请求头，以满足通用的网络请求需求。
 */
const service: AxiosInstance = axios.create({
    baseURL: '', // 根据实际情况配置，或留空使用相对路径
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});


/**
 * 请求拦截器
 *
 * 核心逻辑：从 localStorage 或 sessionStorage 中获取 Token，
 * 若 Token 存在，则将其以 Bearer 模式注入到请求头的 Authorization 字段中。
 *
 * @param config - Axios 请求配置对象
 * @returns 处理后的请求配置对象或提交异常
 */
service.interceptors.request.use(
    (config) => {
        // 直接从 storage 读取 userInfo，避免循环依赖
        const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
        if(userInfoStr) {
            try{
                const userInfo = JSON.parse(userInfoStr);
                if(userInfo.token) {
                    config.headers.Authorization = `Bearer ${userInfo.token}`;
                }
            } catch (e) {
                console.error('Failed to parse userInfo:', e);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


/**
 * 响应拦截器
 *
 * 核心逻辑：
 * 1. 业务成功处理：当状态码为 200 时，直接返回解包后的业务数据。
 * 2. 业务失败处理：弹出错误提示并返回 Promise 拒绝状态。
 * 3. 授权失效处理：针对 401 状态码，清除本地存储的 Token 并强制跳转至登录页面。
 * 4. 网络异常处理：对网络连接失败或处理超时等底层错误进行统一封装提示。
 *
 * @param response - Axios 响应对象
 * @param error - Axios 错误对象
 * @returns 业务数据或 Promise 拒绝原因
 */
service.interceptors.response.use(
    (response: AxiosResponse) => {
        const res = response.data as Result;

        // 业务成功
        if (res.code === 200) {
            return res.data;
        }

        // 业务失败
        const errorMessage = res.message || '操作失败';
        toast.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
    },
    (error: AxiosError) => {
        let message = '请求失败';

        if (error.response?.data) {
            const res = error.response.data as Result;
            message = res.message || message;

            // 401 未授权处理
            if (res.code === 401 || error.response.status === 401) {
                // 清除所有可能的 token
                localStorage.removeItem('userInfo');
                sessionStorage.removeItem('userInfo');

                // 强制跳转登录页（避免路由守卫死循环）
                const loginPath = `${import.meta.env.BASE_URL}login`;
                if (!window.location.pathname.endsWith('/login')) {
                    setTimeout(() => window.location.href = loginPath, 500);
                }
            }
        } else {
            // 网络层面的错误
            if (error.message === 'Network Error') message = '网络连接失败';
            else if (error.code === 'ECONNABORTED') message = '请求超时';
        }

        toast.error(message);
        return Promise.reject(error);
    }
);

/**
 * Request 类封装了常见的 HTTP 请求方法，以便于进行网络请求操作。
 * 提供了对 GET、POST、PUT、DELETE 和 PATCH 方法的支持，均基于服务实例 service 实现。
 */
class Request {
    get<T = any>(url: string, config?: any): Promise<T> {
        return service.get(url, config);
    }

    post<T = any>(url: string, data?: any, config?: any): Promise<T> {
        return service.post(url, data, config);
    }

    put<T = any>(url: string, data?: any, config?: any): Promise<T> {
        return service.put(url, data, config);
    }

    delete<T = any>(url: string, config?: any): Promise<T> {
        return service.delete(url, config);
    }

    patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
        return service.patch(url, data, config);
    }
}

export default new Request();