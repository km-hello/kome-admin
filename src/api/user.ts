import request from '@/utils/request';

// ==================== 类型定义 ====================

/**
 * 登录请求参数
 */
export interface LoginParams {
    username: string;
    password?: string;
}

/**
 * 用户信息
 */
export interface UserInfo {
    id?: number;
    username: string;
    nickname: string;
    avatar: string;
    email?: string;
    description?: string;
}

/**
 * 登录响应数据
 */
export interface LoginResult extends UserInfo {
    token: string;        // JWT Token
    expiresIn: number;    // 过期时间（秒）
}

// ==================== API 接口 ====================

/**
 * 用户登录
 * @param data 登录表单数据
 * @returns Promise<LoginResult>
 */
export const loginApi = (data: LoginParams) => {
    return request.post<any, LoginResult>('/api/user/login', data);
};

/**
 * 获取当前登录用户信息
 * @returns Promise<UserInfo>
 */
export const getUserInfoApi = () => {
    return request.get<any, UserInfo>('/api/admin/user');
};

/**
 * 更新用户信息
 * @param data 要更新的字段
 * @returns Promise<UserInfo>
 */
export const updateUserInfoApi = (data: Partial<UserInfo>) => {
    return request.put<any, UserInfo>('/api/admin/user', data);
};