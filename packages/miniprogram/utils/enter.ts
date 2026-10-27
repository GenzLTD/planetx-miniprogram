import { store } from './store'

/** 登录完成后：没有星际身份就先去选择，否则进母舰。 */
export function enterApp() {
  if (!store.get('identity')) {
    wx.redirectTo({ url: '/pages/onboarding/index' })
    return
  }
  wx.switchTab({ url: '/pages/hub/index' })
}
