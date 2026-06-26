// https://primevue.org/

import type { App } from 'vue'
import type { PrimeVueConfiguration } from 'primevue/config'
import PrimeVue from 'primevue/config'
import { ToastService, ConfirmationService } from 'primevue'

import ENSPreset from '@/plugins/primevue/ens-preset'

import 'primeicons/primeicons.css'
import '@/assets/styles/tailwind.css'
import '@/assets/styles/styles.scss'

const config: PrimeVueConfiguration = {
  theme: {
    preset: ENSPreset,
    options: {
      darkModeSelector: '.app-dark',
      cssLayer: false,
    },
  },
  ripple: true,
  inputStyle: 'outlined',
}

export default {
  install(app: App) {
    app.use(PrimeVue, config)
    app.use(ToastService)
    app.use(ConfirmationService)
  },
}
