import { ref, computed, type Ref } from 'vue'

/**
 * 排序方向
 * - `'asc'`  — 升序
 * - `'desc'` — 降序
 * - `null`   — 未排序（恢复原始顺序）
 */
export type SortOrder = 'asc' | 'desc' | null

/**
 * 排序状态
 * @property key   - 当前排序的字段名（对应数据对象的属性键）
 * @property order - 当前排序方向
 */
export interface SortState {
  key: string
  order: SortOrder
}

/**
 * 表格客户端排序 Composable
 *
 * 提供三态循环排序（无序 → 升序 → 降序 → 无序），仅对当前页数据进行浅拷贝排序，
 * 不修改原始数组。支持 number / boolean / ISO 日期字符串 / 普通字符串的自动类型推断比较。
 *
 * @typeParam T - 数据行的类型，须为对象
 * @param data - 响应式的数据数组（通常是当前页的列表数据）
 * @returns 排序相关的状态与方法
 */
export function useTableSort<T extends Record<string, any>>(data: Ref<T[]>) {
  /** 当前排序状态 */
  const sortState = ref<SortState>({ key: '', order: null })

  /**
   * 切换指定列的排序方向（三态循环）
   *
   * - 点击新列 → 升序
   * - 点击同列 → null → asc → desc → null（循环）
   *
   * @param key - 要排序的字段名
   */
  const toggleSort = (key: string) => {
    if (sortState.value.key !== key) {
      sortState.value = { key, order: 'asc' }
    } else {
      const next: SortOrder =
        sortState.value.order === null ? 'asc' :
        sortState.value.order === 'asc' ? 'desc' : null
      sortState.value = { key, order: next }
    }
  }

  /**
   * 获取指定列当前的排序方向
   *
   * @param key - 字段名
   * @returns 该列的排序方向，若非当前排序列则返回 `null`
   */
  const getSortOrder = (key: string): SortOrder => {
    return sortState.value.key === key ? sortState.value.order : null
  }

  /**
   * 排序后的数据（计算属性）
   *
   * - 未激活排序时直接返回原数组引用
   * - 激活排序时返回浅拷贝后的排序结果，不影响原数组
   * - `null` / `undefined` 值在升序时排在最前，降序时排在最后
   */
  const sortedData = computed(() => {
    const { key, order } = sortState.value
    if (!key || !order) return data.value

    return [...data.value].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]

      // null / undefined 统一处理
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return order === 'asc' ? -1 : 1
      if (bVal == null) return order === 'asc' ? 1 : -1

      // 运行时类型推断，先提取到变量避免对 any 直接 typeof 检查
      const aType = typeof aVal
      const bType = typeof bVal

      let cmp: number
      if (aType === 'number' && bType === 'number') {
        // 数值比较
        cmp = (aVal as number) - (bVal as number)
      } else if (aType === 'boolean' && bType === 'boolean') {
        // 布尔比较（false=0 < true=1）
        cmp = Number(aVal) - Number(bVal)
      } else {
        // 字符串比较：优先尝试 ISO 日期，否则按字典序
        const aStr = String(aVal)
        const bStr = String(bVal)
        if (isISODate(aStr) && isISODate(bStr)) {
          cmp = new Date(aStr).getTime() - new Date(bStr).getTime()
        } else {
          cmp = aStr.localeCompare(bStr)
        }
      }

      return order === 'asc' ? cmp : -cmp
    })
  })

  /**
   * 重置排序状态为未排序
   *
   * 应在翻页、切换筛选条件、重新请求数据后调用，避免排序状态与新数据不一致。
   */
  const resetSort = () => {
    sortState.value = { key: '', order: null }
  }

  return { sortState, sortedData, toggleSort, getSortOrder, resetSort }
}

/**
 * 判断字符串是否为 ISO 8601 日期格式（以 `YYYY-MM-DD` 开头）
 *
 * @param value - 待检测的字符串
 * @returns 是否匹配 ISO 日期前缀
 */
function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value)
}
