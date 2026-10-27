/**
 * Device info utility — HarmonyOS compatible.
 * Uses wx.getDeviceInfo() (3.7.0+) instead of deprecated wx.getSystemInfo().
 * @see https://developers.weixin.qq.com/community/develop/doc/00008e041106f0259bb33530164409
 */

export type Platform = 'ios' | 'android' | 'harmony' | 'windows' | 'mac' | 'devtools' | 'unknown'

export interface DeviceInfo {
  platform: Platform
  isHarmony: boolean
  brand: string
  model: string
  system: string
  SDKVersion: string
}

let cachedInfo: DeviceInfo | null = null

/**
 * Get device info using the new 3.7.0+ API.
 * Falls back gracefully on older base libraries.
 */
export function getDeviceInfo(): DeviceInfo {
  if (cachedInfo) return cachedInfo

  let platform: Platform = 'unknown'
  let brand = ''
  let model = ''
  let system = ''
  let SDKVersion = ''

  try {
    // wx.getDeviceInfo is available from 3.7.0
    if (typeof (wx as any).getDeviceInfo === 'function') {
      const info = (wx as any).getDeviceInfo()
      platform = (info.platform || 'unknown') as Platform
      brand = info.brand || ''
      model = info.model || ''
    } else {
      // Fallback for older base libraries (< 3.7.0)
      const info = (wx as any).getSystemInfoSync ? (wx as any).getSystemInfoSync() : {}
      platform = (info.platform || 'unknown') as Platform
      brand = info.brand || ''
      model = info.model || ''
      system = info.system || ''
      SDKVersion = info.SDKVersion || ''
    }

    // Also get system info for SDKVersion (getDeviceInfo doesn't include it)
    if (typeof (wx as any).getSystemSetting === 'function') {
      // 3.7.0+ has getSystemSetting, but SDKVersion is in getWindowInfo or getAppBaseInfo
    }
    if (!SDKVersion && typeof (wx as any).getAppBaseInfo === 'function') {
      const appInfo = (wx as any).getAppBaseInfo()
      SDKVersion = appInfo.SDKVersion || ''
    }
  } catch (e) {
    console.warn('[Device] getDeviceInfo failed:', e)
  }

  // HarmonyOS detection: platform may be 'harmony' or system string contains 'Harmony'
  const isHarmony = platform === 'harmony' || system.toLowerCase().includes('harmony')

  cachedInfo = { platform, isHarmony, brand, model, system, SDKVersion }
  console.log('[Device] Info:', JSON.stringify(cachedInfo))
  return cachedInfo
}

/**
 * Check if running on HarmonyOS.
 */
export function isHarmonyOS(): boolean {
  return getDeviceInfo().isHarmony
}

/**
 * Check if running in WeChat DevTools (not a real device).
 */
export function isDevTools(): boolean {
  return getDeviceInfo().platform === 'devtools'
}
