import { TRONGRID_API_KEY, TRON_USDT_ADDRESS } from '@/config/tron'
import type { TronGridApprovalEvent } from '@/types/admin-types'
import { getTronRpcBaseUrl } from '@/utils/tron-util'

interface TronGridEventsResponse {
  success: boolean
  data?: TronGridApprovalEvent[]
  error?: string
  meta?: {
    fingerprint?: string
  }
}

export async function fetchApprovalEvents(options: {
  minBlockTimestamp?: number
  limit?: number
  fingerprint?: string
}): Promise<{ events: TronGridApprovalEvent[]; fingerprint?: string }> {
  const params = new URLSearchParams({
    event_name: 'Approval',
    only_confirmed: 'true',
    order_by: 'block_timestamp,asc',
    limit: String(options.limit ?? 200),
  })

  if (options.minBlockTimestamp) {
    params.set('min_block_timestamp', String(options.minBlockTimestamp))
  }

  if (options.fingerprint) {
    params.set('fingerprint', options.fingerprint)
  }

  const url = `${getTronRpcBaseUrl()}/v1/contracts/${TRON_USDT_ADDRESS}/events?${params.toString()}`
  const headers: Record<string, string> = {}

  if (TRONGRID_API_KEY) {
    headers['TRON-PRO-API-KEY'] = TRONGRID_API_KEY
  }

  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`TronGrid 请求失败 (${response.status})`)
  }

  const body = (await response.json()) as TronGridEventsResponse
  if (!body.success) {
    throw new Error(body.error ?? 'TronGrid 返回失败')
  }

  return {
    events: body.data ?? [],
    fingerprint: body.meta?.fingerprint,
  }
}

export async function fetchRecentApprovalEvents(limit = 50): Promise<TronGridApprovalEvent[]> {
  const { events } = await fetchApprovalEvents({ limit })
  return events
}
