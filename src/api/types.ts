/**
 * 后端统一响应结构
 * 所有接口都会包装在这个结构中
 */
export interface ApiResponse<T = any> {
    code: number;        // 业务状态码（200 表示成功）
    message: string;     // 提示信息
    data: T;             // 实际业务数据
    timestamp: number;   // 时间戳
}

/**
 * 分页数据结构
 * 用于列表查询接口
 */
export interface PageResult<T> {
    records: T[];        // 当前页数据
    total: number;       // 总记录数
    size: number;        // 每页大小
    current: number;     // 当前页码
}

/**
 * 基础查询参数
 * 所有分页查询接口的基类
 */
export interface BaseQuery {
    pageNum: number;     // 页码（从 1 开始）
    pageSize: number;    // 每页条数
}