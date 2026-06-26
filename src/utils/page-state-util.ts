/**
 * 页面四态常量
 */

import type { PageState } from '@/types/ui-types'

const PAGE_STATE = {
  LOADING: 'loading',
  NORMAL: 'normal',
  EMPTY: 'empty',
  ERROR: 'error',
} as const satisfies Record<string, PageState>

export default PAGE_STATE
