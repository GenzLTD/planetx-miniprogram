/**
 * Navigation bar metrics — capsule-adaptive navigation heights.
 *
 * 移植自 zervi.test/miniprogram-4 的 app.ts 启动逻辑，收拢为惰性单例：
 * - statusBarHeight: 系统状态栏高度
 * - menuButtonHeight: 胶囊按钮高度（取不到时回退 32）
 * - navigationBarHeight: 与胶囊垂直居中的导航栏高度（Android 48 / iOS 40 兜底）
 * - totalHeight: statusBarHeight + navigationBarHeight，自定义导航占位用
 *
 * 用法（页面内）:
 *   const { totalHeight } = getNavBarMetrics()
 *   <view style="padding-top: {{ navBar.totalHeight }}px">
 */

export interface NavBarMetrics {
  statusBarHeight: number
  navigationBarHeight: number
  menuButtonHeight: number
  totalHeight: number
}

let cached: NavBarMetrics | null = null

const DEFAULT_MENU_BUTTON_HEIGHT = 32
const FALLBACK_NAV_HEIGHT_ANDROID = 48
const FALLBACK_NAV_HEIGHT_IOS = 40

export function getNavBarMetrics(): NavBarMetrics {
  if (cached) return cached

  let statusBarHeight = 20
  let platform = 'devtools'
  let rect: { top: number; height: number } | undefined

  try {
    const windowInfo = wx.getWindowInfo()
    statusBarHeight = windowInfo.statusBarHeight
    const deviceInfo = wx.getDeviceInfo()
    platform = deviceInfo.platform
    rect = wx.getMenuButtonBoundingClientRect()
  } catch {
    // 基础库过低或非微信环境：全部走兜底
  }

  const menuButtonHeight =
    rect && rect.height ? rect.height : DEFAULT_MENU_BUTTON_HEIGHT

  let navigationBarHeight: number
  if (rect && rect.top && rect.top !== 0 && rect.height) {
    // 导航栏高度 = 胶囊上下留白对称展开：(top - statusBar) * 2 + capsuleHeight
    navigationBarHeight = (rect.top - statusBarHeight) * 2 + rect.height
  } else {
    navigationBarHeight =
      platform === 'android'
        ? FALLBACK_NAV_HEIGHT_ANDROID
        : FALLBACK_NAV_HEIGHT_IOS
  }

  cached = {
    statusBarHeight,
    navigationBarHeight,
    menuButtonHeight,
    totalHeight: statusBarHeight + navigationBarHeight,
  }
  return cached
}

/** 测试与热更新场景用：清空缓存，下次调用重新探测 */
export function resetNavBarMetricsCache(): void {
  cached = null
}
