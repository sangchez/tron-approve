/**
 * 全局 Vue 错误处理，统一 Toast 提示
 */

import type { App } from 'vue'
import ToastEventBus from 'primevue/toasteventbus'

import { t } from '@/plugins/i18n'
import { DappError, mapChainErrorMessage } from '@/utils/chain-error-util'

interface WagmiLikeError {
  code?: number
  info?: {
    error?: {
      message?: string
    }
  }
}

function isWagmiLikeError(error: unknown): error is WagmiLikeError {
  return typeof error === 'object' && error !== null && 'info' in error
}

export default {
  install(app: App) {
    app.config.errorHandler = (err: unknown) => {
      let severity: 'error' | 'warn' | 'success' | 'info' = 'error'
      let summary = t('common.tips.error')
      let detail = t('errors.common.unknown')

      if (isWagmiLikeError(err) && err.code && err.info?.error) {
        detail = err.info.error.message || detail
      } else if (err instanceof DappError) {
        severity = err.type === 'warn' ? 'warn' : err.type === 'success' ? 'success' : 'error'
        summary = severity === 'warn'
          ? t('common.tips.warn')
          : severity === 'success'
            ? t('common.tips.success')
            : t('common.tips.error')
        detail = err.message
      } else {
        detail = mapChainErrorMessage(err)
      }

      ToastEventBus.emit('add', {
        severity,
        summary,
        detail,
        life: 3000,
      })

      console.error(detail)
    }
  },
}
