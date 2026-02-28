/**
 * lib/utils.ts - 通用工具函数
 *
 * 提供 Tailwind CSS 类名合并等常用工具方法。
 */
import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并并去重 Tailwind CSS 类名
 * @param inputs 任意数量的类名值（字符串、对象、数组等）
 * @returns 合并去重后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
