/**
 * 链上/钱包错误映射与用户可读异常
 */

import { t } from '@/plugins/i18n'

export type DappErrorType = 'error' | 'warn' | 'success'

/** 将错误码映射为 i18n key */
export function mapErrorCodeToI18nKey(code: string, type: DappErrorType): string {
  let key = `message.${type}.${code}`

  if (type === 'error') {
    switch (code) {
      case 'rpc':
        return 'errors.common.rpc'
      case 'ethereum':
        return 'errors.common.ethereum'
      case 'method':
        return 'errors.common.method'
      case 'network':
        return 'validation.network'
      case 'address':
        return 'validation.invalid-address'
      default:
        return key
    }
  }

  if (type === 'warn') {
    switch (code) {
      case 'ethereum':
        return 'errors.common.ethereum'
      case 'network':
        return 'validation.network'
      default:
        return key
    }
  }

  return key
}

/** 业务侧抛出的可预期 dApp 错误 */
export class DappError extends Error {
  readonly type: DappErrorType
  readonly code: string

  constructor(code: string, type: DappErrorType = 'error') {
    super(t(mapErrorCodeToI18nKey(code, type)))
    this.name = 'DappError'
    this.code = code
    this.type = type
  }
}

/** 表单校验消息（调用时读取当前 locale） */
export function getResolverMessages() {
  return {
    rpcUrl: {
      required: [{ message: t('validation.required-rpc') }],
      invalid: [{ message: t('validation.invalid-rpc') }],
    },
    ensNames: {
      required: [{ message: t('validation.required-domain') }],
      invalid: [{ message: t('validation.invalid-domain') }],
    },
  }
}

/** 将 viem/wagmi 等底层错误转为用户可读中文/多语言提示 */
export function mapChainErrorMessage(error: unknown): string {
  if (error instanceof DappError) {
    return error.message
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('user rejected') || msg.includes('user denied')) {
      return t('errors.common.user-rejected')
    }
    if (msg.includes('insufficient funds')) {
      return t('errors.common.insufficient-funds')
    }
    return error.message
  }

  return t('errors.common.unknown')
}
