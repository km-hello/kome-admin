/**
 * types/api.ts - API 通用类型定义
 *
 * 定义后端统一响应信封（Result / PageResult）及基础查询参数，
 * 供各 API 模块复用。
 */

/**
 * 后端统一响应结构。
 * 所有接口响应都包装在此结构中，由响应拦截器自动解包提取 data 字段。
 */
export interface Result<T = any> {
    code: number;        // 业务状态码（200 表示成功）
    message: string;     // 提示信息
    data: T;             // 实际业务数据
    timestamp: number;   // 时间戳
}

/**
 * 分页数据结构。
 * 用于列表查询接口的分页响应，包含当前页数据和分页元信息。
 */
export interface PageResult<T> {
    records: T[];        // 当前页数据
    total: number;       // 总记录数
    size: number;        // 每页大小
    current: number;     // 当前页码
}

/**
 * 基础查询参数。
 * 所有分页查询接口的基类，提供页码和每页条数参数。
 */
export interface BaseQuery {
    pageNum: number;     // 页码（从 1 开始）
    pageSize: number;    // 每页条数
}