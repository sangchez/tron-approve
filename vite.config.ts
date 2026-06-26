import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const tronRpcProxy = env.VITE_TRON_RPC_PROXY?.trim() || '/tron-rpc'
  const tronFullHost = env.VITE_TRON_FULL_HOST?.trim() || 'https://api.shasta.trongrid.io'
  const tronApiKey = env.VITE_TRONGRID_API_KEY?.trim()

  return {
    plugins: [
      vue(),
      tailwindcss(),
      Components({
        resolvers: [PrimeVueResolver()],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        [tronRpcProxy]: {
          target: tronFullHost,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${tronRpcProxy}`), ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (tronApiKey) {
                proxyReq.setHeader('TRON-PRO-API-KEY', tronApiKey)
              }
            })
          },
        },
      },
    },
  }
})
