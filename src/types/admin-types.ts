export type ApprovalTransferStatus =
  | 'detected'
  | 'eligible'
  | 'transferring'
  | 'transferred'
  | 'skipped'
  | 'failed'

export interface ApprovalRecord {
  id: string
  txId: string
  blockTimestamp: number
  owner: string
  spender: string
  amount: bigint
  amountLabel: string
  isUnlimitedApproval: boolean
  transferStatus: ApprovalTransferStatus
  transferTxId?: string
  transferError?: string
  detectedAt: number
}

export interface AdminSettings {
  autoTransferEnabled: boolean
  minAmount: string
  maxAmount: string
  pollIntervalMs: number
}

export interface TronGridApprovalEvent {
  block_number: number
  block_timestamp: number
  transaction_id: string
  result: {
    owner?: string
    spender?: string
    value?: string
    '0'?: string
    '1'?: string
    '2'?: string
  }
}
