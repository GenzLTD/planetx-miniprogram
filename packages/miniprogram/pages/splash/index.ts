/**
 * Splash Page - entry point
 * Shows logo, handles auto-login, redirects to hub on success.
 * Dev mode: allows skipping login when API is unreachable.
 */
import { eventBus } from '../../utils/event-bus'
import { store } from '../../utils/store'

// Dev mode timeout: if login takes longer than this, show skip button
const LOGIN_TIMEOUT_MS = 5000

Page({
  data: {
    loading: true,
    loginFailed: false,
    devMode: false, // Show "skip" button when API unreachable
  },

  _authHandler: null as any,
  _expiredHandler: null as any,
  _timer: null as number | null,

  onLoad(options?: Record<string, string>) {
    if (options?.ref) {
      wx.setStorageSync('pending_ref', options.ref)
      console.log('[Splash] Saved pending ref:', options.ref)
    }
    console.log('[Splash] onLoad - starting auth flow')
    
    // Listen for auth events
    this._authHandler = (data: any) => {
      console.log('[Splash] auth:login event:', JSON.stringify(data))
      this.clearTimer()
      if (data.success) {
        // Login succeeded, go to hub
        console.log('[Splash] Login success -> switching to hub')
        wx.switchTab({ url: '/pages/hub/index' })
      } else {
        console.log('[Splash] Login failed:', data.error || 'unknown reason')
        this.setData({ loading: false, loginFailed: true, devMode: true })
      }
    }
    this._expiredHandler = () => {
      console.log('[Splash] auth:expired event')
      this.clearTimer()
      this.setData({ loading: false, loginFailed: true, devMode: true })
    }
    eventBus.on('auth:login', this._authHandler)
    eventBus.on('auth:expired', this._expiredHandler)

    // Check if already logged in (token restored from storage)
    const token = store.get('token')
    if (token) {
      console.log('[Splash] Token found, navigating to hub immediately')
      wx.switchTab({
        url: '/pages/hub/index',
        fail: (err: any) => console.error('[Splash] switchTab failed:', JSON.stringify(err)),
      })
    } else {
      console.log('[Splash] No token, waiting for app.ts wechatLogin...')
      // Set timeout fallback: if no response in 5s, show dev mode option
      this._timer = setTimeout(() => {
        console.warn('[Splash] Login timeout (' + LOGIN_TIMEOUT_MS + 'ms) - showing dev mode')
        this.setData({ loading: false, loginFailed: true, devMode: true })
      }, LOGIN_TIMEOUT_MS)
    }
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

  /** Retry login */
  handleRetryLogin() {
    console.log('[Splash] User clicked retry')
    this.setData({ loading: true, loginFailed: false, devMode: false })
    
    // Reset timer
    this._timer = setTimeout(() => {
      this.setData({ loading: false, loginFailed: true, devMode: true })
    }, LOGIN_TIMEOUT_MS)

    const app = getApp() as any
    app.wechatLogin()
  },

  /** Skip login - enter app directly (dev mode / offline mode) */
  handleSkipLogin() {
    console.log('[Splash] User skipped login - entering dev mode')
    store.set('token', 'dev-mode-token')
    wx.switchTab({ url: '/pages/hub/index' })
  },
})
