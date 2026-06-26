import { mapChainErrorMessage } from '@/utils/chain-error-util'

/** 将 TronLink / TronWeb 错误转为用户可读提示 */
export function mapTronErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('confirmation declined') || msg.includes('user rejected')) {
      return '用户已拒绝签名'
    }
    if (msg.includes('tronlink') && msg.includes('not found')) {
      return '未检测到 TronLink 钱包，请先安装并启用'
    }
    if (msg.includes('cors') || msg.includes('failed to fetch') || msg.includes('network error')) {
      return 'TronGrid 请求失败（CORS/网络错误），请配置 VITE_TRONGRID_API_KEY 并重启 dev 服务'
    }
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return mapTronErrorMessage(new Error(String(error.message)))
  }

  return mapChainErrorMessage(error)
}
