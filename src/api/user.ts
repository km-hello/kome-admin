
import request from '@/request';

// ==================== 类型定义 ====================

/**
 * 社交链接
 */
export interface SocialLink {
    platform: string;
    url: string;
}

/**
 * 登录请求参数
 */
export interface UserLoginRequest {
    username: string;
    password?: string;
}

/**
 * 修改用户信息请求参数
 */
export interface UserUpdateRequest {
    username?: string;
    nickname?: string;
    avatar?: string;
    email?: string;
    description?: string;
    socialLinks?: SocialLink[];
}

/**
 * 修改密码请求参数
 */
export interface UserUpdatePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

/**
 * 用户信息
 */
export interface UserInfoResponse {
    id?: number;
    username: string;
    nickname: string;
    avatar: string;
    email: string;
    description?: string;
    socialLinks?: SocialLink[];
}

/**
 * 登录响应数据
 */
export interface UserLoginResponse extends UserInfoResponse {
    token: string;        // JWT Token
    expiresIn: number;    // 过期时间（秒）
}

// ==================== API 接口 ====================

/**
 * 执行用户登录请求的函数。
 *
 * @param {UserLoginRequest} req 包含用户登录所需的请求数据。
 * @returns {Promise<UserLoginResponse>} 返回一个包含用户登录结果的 Promise。
 */
export const loginApi = (req: UserLoginRequest): Promise<UserLoginResponse> => {
    return request.post<UserLoginResponse>('/api/user/login', req);
};

/**
 * 获取用户信息的 API 请求方法。
 *
 * 此方法通过发送 GET 请求到指定的用户信息接口，获取并返回用户信息数据。
 *
 * @returns {Promise<UserInfoResponse>} 返回包含用户信息的响应数据。
 */
export const getUserInfoApi = (): Promise<UserInfoResponse> => {
    return request.get<UserInfoResponse>('/api/admin/user');
};

/**
 * 更新用户信息的 API 调用函数。
 *
 * @param {Partial<UserUpdateRequest>} req - 包含用户更新信息的部分请求对象。
 * @returns {Promise<UserInfoResponse>} 返回一个包含用户信息的响应对象的 Promise。
 *
 * 此函数通过 HTTP PUT 请求将用户更新数据发送到后端接口 "/api/admin/user"，
 * 并返回服务器处理后的用户信息。
 */
export const updateUserInfoApi = (req: Partial<UserUpdateRequest>): Promise<UserInfoResponse> => {
    return request.put<UserInfoResponse>('/api/admin/user', req);
};

/**
 * 更新用户密码的 API 调用函数。
 *
 * @param {UserUpdatePasswordRequest} req - 包含旧密码和新密码的请求对象。
 * @returns {Promise<void>} 返回一个 Promise，操作成功时无返回值。
 *
 * 此函数通过 HTTP PUT 请求将密码更新数据发送到后端接口 "/api/admin/user/password"。
 */
export const updatePasswordApi = (req: UserUpdatePasswordRequest): Promise<void> => {
    return request.put<void>('/api/admin/user/password', req);
};