/**
 * 语言切换 composable
 */

import { useI18n } from 'vue-i18n'

import { LOCALE_OPTIONS, type AppLocale } from '@/config/i18n'
import { LOCALE_KEY } from '@/utils/storage-keys'
import { setStorageItem } from '@/utils/storage-util'

export function useLocale() {
  const { locale } = useI18n()

  function setLocale(lang: AppLocale): void {
    locale.value = lang
    setStorageItem(LOCALE_KEY, lang)
  }

  return {
    locale,
    setLocale,
    localeOptions: LOCALE_OPTIONS,
  }
}
