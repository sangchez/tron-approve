/**
 * vue-i18n 初始化
 */

import type { I18nOptions } from 'vue-i18n'
import { createI18n, type Composer } from 'vue-i18n'

import { DEFAULT_LOCALE, FALLBACK_LOCALE, type AppLocale } from '@/config/i18n'
import { LOCALE_KEY } from '@/utils/storage-keys'
import { getStorageItem } from '@/utils/storage-util'

import en_TH from './languages/en-TH.json'
import en_US from './languages/en-US.json'
import ja_JP from './languages/ja-JP.json'
import ko_KR from './languages/ko-KR.json'
import vi_VN from './languages/vi-VN.json'
import zh_CN from './languages/zh-CN.json'
import zh_TW from './languages/zh-TW.json'

function resolveInitialLocale(): AppLocale {
  const stored = getStorageItem(LOCALE_KEY)
  if (stored === 'en-US' || stored === 'zh-CN' || stored === 'ko-KR' || stored === 'zh-TW'
    || stored === 'ja-JP' || stored === 'vi-VN' || stored === 'en-TH') {
    return stored
  }
  return DEFAULT_LOCALE
}

const options: I18nOptions = {
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: FALLBACK_LOCALE,
  globalInjection: true,
  messages: {
    'en-US': en_US,
    'zh-CN': zh_CN,
    'ko-KR': ko_KR,
    'zh-TW': zh_TW,
    'ja-JP': ja_JP,
    'vi-VN': vi_VN,
    'en-TH': en_TH,
  },
}

const i18n = createI18n(options)

export const t = (i18n.global as unknown as Composer).t
export default i18n
