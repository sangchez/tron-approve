/**
 * wagmi + TanStack Query 全局注册
 */

import type { App } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createConfig, http, WagmiPlugin } from '@wagmi/vue'
import { injected, walletConnect } from '@wagmi/connectors'
import { bsc, mainnet, sepolia } from 'viem/chains'

import { supportedChains } from '@/config/chains'

const wcProjectId = import.meta.env.VITE_WC_PROJECT_ID as string | undefined

const connectors = [
  injected(),
  ...(wcProjectId ? [walletConnect({ projectId: wcProjectId })] : []),
]

export const wagmiConfig = createConfig({
  chains: [...supportedChains],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [bsc.id]: http(),
  },
})

const queryClient = new QueryClient()

export function setupWagmi(app: App): void {
  app.use(WagmiPlugin, { config: wagmiConfig })
  app.use(VueQueryPlugin, { queryClient })
}
