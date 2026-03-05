/**
 * 表单数据规范化工具函数
 *
 * 在提交前将空字符串转换为 null，确保可空字段的语义明确：
 * - null = 清空字段
 * - value = 更新字段
 */

/**
 * 规范化字符串字段
 * 将空字符串（trim 后）转换为 null
 *
 * @param value - 字符串值或 null
 * @returns 如果为空/空白则返回 null，否则返回 trim 后的字符串
 */
export function normalizeStringField(value: string | null): string | null {
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
}

