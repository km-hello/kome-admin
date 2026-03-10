/**
 * api/auth.ts - 认证接口
 *
 * 提供后台登录与当前认证信息获取。
 */
import request from '@/request';
import type { RequestConfig } from '@/request';

/* ========== 类型定义 ========== */

/**
 * 认证信息。
 * 用于后台布局展示与会话恢复。
 */
export interface AuthInfoResponse {
    id: number;                // 用户 ID
    username: string;          // 用户名
    nickname: string | null;   // 昵称
    avatar: string | null;     // 头像 URL
    email: string | null;      // 邮箱地址
}

/**
 * 登录请求参数。
 */
export interface AuthLoginRequest {
    username: string;   // 用户名或邮箱
    password: string;   // 密码
}

/**
 * 登录响应数据。
 * 返回会话信息与后台壳子所需的最小认证信息。
 */
export interface AuthLoginResponse {
    accessToken: string;           // JWT 访问令牌
    tokenType: string;             // 令牌类型（Bearer）
    expiresAt: number;             // 令牌过期时间戳（毫秒）
    user: AuthInfoResponse;        // 当前用户基本信息
}

/* ========== API 接口 ========== */

/**
 * 登录接口。
 *
 * @param req 登录请求参数
 * @returns 登录响应，包含 JWT 令牌与当前认证信息
 */
export const loginApi = (req: AuthLoginRequest): Promise<AuthLoginResponse> => {
    return request.post<AuthLoginResponse>('/api/auth/login', req);
};

/**
 * 获取当前认证信息。
 * 用于路由守卫静默校验 token 有效性并刷新用户信息。
 *
 * @param config 请求配置（可选，支持 skipAuthRedirect / skipErrorToast）
 * @returns 当前用户的基本信息
 */
export const getAuthInfoApi = (config?: RequestConfig): Promise<AuthInfoResponse> => {
    return request.get<AuthInfoResponse>('/api/admin/auth/info', config);
};
