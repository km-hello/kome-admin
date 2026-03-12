/**
 * api/user.ts - 用户资料接口
 *
 * 提供用户资料获取、更新及密码修改，供设置页面使用。
 */
import request from '@/request';

/* ========== 类型定义 ========== */

/**
 * 社交链接。
 * 管理员的社交媒体账号信息，用于个人资料页面展示和编辑。
 */
export interface SocialLink {
    platform: string;      // 社交平台名称（如 GitHub、Twitter）
    url: string;           // 社交链接 URL
}

/**
 * 技能项。
 * 管理员的技术技能信息，支持拖拽排序，用于设置页面的技能管理。
 */
export interface SkillItem {
    name: string;          // 技能名称
    level: number;         // 技能等级: 1=入门(Basic), 2=熟悉(Familiar), 3=精通(Proficient)
    order: number | null;  // 排序序号（拖拽排序）
}

/**
 * 修改用户信息请求参数。
 * All fields must be provided (no partial updates).
 * Use null to explicitly clear nullable fields.
 */
export interface UserUpdateRequest {
    username: string;                    // 用户名 (required)
    nickname: string | null;             // 昵称
    avatar: string | null;               // 头像 URL
    email: string | null;                // 邮箱地址
    description: string | null;          // 个人简介
    socialLinks: SocialLink[] | null;    // 社交链接列表
    skills: SkillItem[] | null;          // 技能列表
}

/**
 * 修改密码请求参数。
 * 需验证当前密码后才可设置新密码，格式与初始化密码一致：8-64 位，至少包含字母、数字和特殊字符。
 */
export interface UserUpdatePasswordRequest {
    oldPassword: string;   // 当前密码
    newPassword: string;   // 新密码（8-64 位，至少包含字母、数字和特殊字符）
}

/**
 * 用户信息。
 * 包含管理员的完整个人资料，用于设置页面回填和 Header 展示。
 */
export interface UserInfoResponse {
    id: number;                          // 用户 ID
    username: string;                    // 用户名
    nickname: string | null;             // 昵称
    avatar: string | null;               // 头像 URL
    email: string | null;                // 邮箱地址
    description: string | null;          // 个人简介
    socialLinks: SocialLink[] | null;    // 社交链接列表
    skills: SkillItem[] | null;          // 技能列表
}

/* ========== API 接口 ========== */

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
 * @param {UserUpdateRequest} req - 包含用户更新信息的请求对象。
 * @returns {Promise<UserInfoResponse>} 返回一个包含用户信息的响应对象的 Promise。
 *
 * 此函数通过 HTTP PUT 请求将用户更新数据发送到后端接口 "/api/admin/user"，
 * 并返回服务器处理后的用户信息。
 */
export const updateUserInfoApi = (req: UserUpdateRequest): Promise<UserInfoResponse> => {
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
