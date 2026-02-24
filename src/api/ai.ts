import request from '@/request'

export interface AiResultResponse {
  result: string
}

/**
 * 生成文章摘要
 * @param content 文章正文内容
 */
export const generateSummaryApi = (content: string): Promise<AiResultResponse> => {
  return request.post<AiResultResponse>('/api/admin/ai/summary', { content }, { timeout: 30000 })
}

/**
 * 生成文章 URL Slug
 * @param title 文章标题
 */
export const generateSlugApi = (title: string): Promise<AiResultResponse> => {
  return request.post<AiResultResponse>('/api/admin/ai/slug', { title }, { timeout: 30000 })
}
