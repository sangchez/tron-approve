/**
 * 主题（明暗模式）持久化与初始化
 */

import { DARK_MODE_KEY } from '@/utils/storage-keys'
import { getStorageItem, setStorageItem } from '@/utils/storage-util'

export function isDarkModeEnabled(): boolean {
  return document.documentElement.classList.contains('app-dark')
}

/** 应用启动前调用，避免闪烁 */
export function initThemeFromStorage(): void {
  if (getStorageItem(DARK_MODE_KEY) === 'true') {
    document.documentElement.classList.add('app-dark')
  }
}

export function setDarkMode(enabled: boolean): void {
  document.documentElement.classList.toggle('app-dark', enabled)
  setStorageItem(DARK_MODE_KEY, String(enabled))
}
