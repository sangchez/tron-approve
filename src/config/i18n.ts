/**
 * i18n 常量配置（不含翻译文案）
 */

export const DEFAULT_LOCALE = 'en-US'
export const FALLBACK_LOCALE = 'en-US'

export const SUPPORTED_LOCALES = [
  'en-US',
  'zh-CN',
  'ko-KR',
  'zh-TW',
  'ja-JP',
  'vi-VN',
  'en-TH',
] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_OPTIONS: { label: string; value: AppLocale }[] = [
  { label: 'English', value: 'en-US' },
  { label: '简体中文', value: 'zh-CN' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: '한국어', value: 'ko-KR' },
  { label: '日本語', value: 'ja-JP' },
  { label: 'Tiếng Việt', value: 'vi-VN' },
  { label: 'ไทย', value: 'en-TH' },
]
