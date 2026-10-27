/**
 * Splash Page - entry point
 * P-01：首次启动须同意隐私政策后才发起微信登录。
 */
import { eventBus } from '../../utils/event-bus'
import { store } from '../../utils/store'
import { LEGAL, LEGAL_PRIVACY_SUMMARY } from '@looma/shared-core'

const LOGIN_TIMEOUT_MS = 5000
const PRIVACY_KEY = LEGAL.privacyAcceptedKey
const AGE_KEY = LEGAL.ageConfirmedKey

Page({
  data: {
    loading: true,
    loginFailed: false,
    devMode: false,
    showPrivacyGate: false,
    privacyChecked: false,
    ageChecked: false,
    privacySummary: LEGAL_PRIVACY_SUMMARY,
    operator: LEGAL.operatorName,
    contact: LEGAL.operatorContact,
  },

  _authHandler: null as any,
  _expiredHandler: null as any,
  _timer: null as number | null,

  onLoad(options?: Record<string, string>) {
    if (options?.ref) {
      wx.setStorageSync('pending_ref', options.ref)
    }

    this._authHandler = (data: any) => {
      this.clearTimer()
      if (data.success) {
        wx.switchTab({ url: '/pages/hub/index' })
      } else {
        this.setData({ loading: false, loginFailed: true, devMode: true })
      }
    }
    this._expiredHandler = () => {
      this.clearTimer()
      this.setData({ loading: false, loginFailed: true, devMode: true })
    }
    eventBus.on('auth:login', this._authHandler)
    eventBus.on('auth:expired', this._expiredHandler)

    const token = store.get('token') || wx.getStorageSync('looma_token')
    const privacyOk = !!wx.getStorageSync(PRIVACY_KEY)
    const ageOk = !!wx.getStorageSync(AGE_KEY)

    // 未同意隐私/年龄时必须先出门，不能因残留 token 直接进母舰
    if (!privacyOk || !ageOk) {
      this.setData({ showPrivacyGate: true, loading: false })
      return
    }

    if (token) {
      wx.switchTab({
        url: '/pages/hub/index',
        fail: (err: any) => console.error('[Splash] switchTab failed:', JSON.stringify(err)),
      })
      return
    }

    this._timer = setTimeout(() => {
      this.setData({ loading: false, loginFailed: true, devMode: true })
    }, LOGIN_TIMEOUT_MS)
  },

  onUnload() {
    this.clearTimer()
    if (this._authHandler) eventBus.off('auth:login', this._authHandler)
    if (this._expiredHandler) eventBus.off('auth:expired', this._expiredHandler)
  },

  clearTimer() {
    if (this._timer != null) {
      clearTimeout(this._timer)
      this._timer = null
    }
  },

  onTogglePrivacy() {
    this.setData({ privacyChecked: !this.data.privacyChecked })
  },

  onToggleAge() {
    this.setData({ ageChecked: !this.data.ageChecked })
  },

  handleOpenPrivacy() {
    wx.navigateTo({ url: '/pages/legal/index' })
  },

  handleAgreePrivacy() {
    if (!this.data.privacyChecked) {
      wx.showToast({ title: '请先阅读并同意隐私政策', icon: 'none', duration: 2500 })
      return
    }
    if (!this.data.ageChecked) {
      wx.showToast({ title: '未满14周岁暂不提供服务', icon: 'none', duration: 2500 })
      return
    }
    wx.setStorageSync(PRIVACY_KEY, 1)
    wx.setStorageSync(AGE_KEY, 1)
    const token = store.get('token') || wx.getStorageSync('looma_token')
    if (token) {
      wx.switchTab({ url: '/pages/hub/index' })
      return
    }
    this.setData({ showPrivacyGate: false, loading: true, loginFailed: false })
    this._timer = setTimeout(() => {
      this.setData({ loading: false, loginFailed: true, devMode: true })
    }, LOGIN_TIMEOUT_MS)
    const app = getApp() as any
    app.wechatLogin()
  },

  handleRetryLogin() {
    this.setData({ loading: true, loginFailed: false, devMode: false })
    this._timer = setTimeout(() => {
      this.setData({ loading: false, loginFailed: true, devMode: true })
    }, LOGIN_TIMEOUT_MS)
    const app = getApp() as any
    app.wechatLogin()
  },

  handleSkipLogin() {
    store.set('token', 'dev-mode-token')
    wx.switchTab({ url: '/pages/hub/index' })
  },
})
