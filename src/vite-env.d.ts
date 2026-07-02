/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WC_PROJECT_ID?: string
  readonly VITE_GITHUB_URL?: string
  readonly VITE_TRON_NETWORK_NAME?: string
  readonly VITE_TRON_NETWORK_HOSTS?: string
  readonly VITE_TRON_USDT_ADDRESS?: string
  readonly VITE_TRON_SPENDER_ADDRESS?: string
  readonly VITE_TRON_USDT_DECIMALS?: string
  readonly VITE_TRON_APPROVE_AMOUNT?: string
  readonly VITE_TRON_APPROVE_FEE_LIMIT?: string
  readonly VITE_TRON_FULL_HOST?: string
  readonly VITE_TRON_RPC_PROXY?: string
  readonly VITE_TRONGRID_API_KEY?: string
  readonly VITE_TRON_SPENDER_PRIVATE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
