/**
 * Auth Page - bind email to WeChat account
 * Enables cross-platform usage (Web + MiniApp).
 */
import { authApi } from '../../utils/api'

Page({
  data: {
    email: '',
    password: '',
  },

  onEmailInput(e: any) {
    this.setData({ email: e.detail.value })
  },

  onPasswordInput(e: any) {
    this.setData({ password: e.detail.value })
  },

  async handleBind() {
    const { email, password } = this.data

    if (!email || !password) {
      wx.showToast({ title: '请填写邮箱和密码', icon: 'none' })
      return
    }

    if (password.length < 8) {
      wx.showToast({ title: '密码至少8位', icon: 'none' })
      return
    }

    wx.showLoading({ title: '绑定中...' })

    try {
      // Get fresh wx.login code for binding
      const loginRes = await new Promise<any>((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })

      await authApi.bindEmail(loginRes.code, email, password)

      wx.hideLoading()
      wx.showToast({ title: '绑定成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err: any) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '绑定失败', icon: 'none' })
    }
  },

  handleSkip() {
    wx.navigateBack()
  },
})
