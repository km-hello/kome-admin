import request from '@/request'

/* ========== 类型定义 ========== */

/**
 * AI 结果响应。
 * AI 生成接口的统一响应结构，包含生成的文本内容。
 * @property result 生成的结果文本
 */
export interface AiResultResponse {
  result: string           // AI 生成的结果文本
}


/* ========== API 接口 ========== */

/**
 * 生成文章摘要
 * @param content 文章正文内容
 * @returns Promise<AiResultResponse> 包含生成的摘要
 */
export const generateSummaryApi = (content: string): Promise<AiResultResponse> => {
  return request.post<AiResultResponse>('/api/admin/ai/summary', { content }, { timeout: 30000 })
}

/**
 * 生成文章 URL Slug
 * @param title 文章标题
 * @returns Promise<AiResultResponse> 包含生成的 Slug
 */
export const generateSlugApi = (title: string): Promise<AiResultResponse> => {
  return request.post<AiResultResponse>('/api/admin/ai/slug', { title }, { timeout: 30000 })
}
