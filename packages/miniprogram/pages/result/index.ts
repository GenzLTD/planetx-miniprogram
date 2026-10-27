/**
 * Result Page - personality test result + share (裂变 / HR 链接)
 */
import { store } from '../../utils/store'
import { gameApi, referralApi } from '../../utils/api'
import { getShareTextMini, hydratePersonality } from '../../constants/quiz'
import { SAAS_BASE } from '../../utils/config'
import { trackMiniEvent } from '../../utils/analytics'
import { ensureConsent } from '../../utils/consent'
import type { PlanetXPersonalityType } from '../../types/index'

Page({
  data: {
    emoji: '',
    name: '',
    tagline: '',
    desc: '',
    traits: [] as string[],
    hasResult: false,
    referralCode: '',
    profileShareCode: '',
    hrShareUrl: '',
    loading: true,
  },

  onLoad() {
    void this.loadResult()
  },

  async loadResult() {
    const personalityType = store.get('personalityType')
    const personalityDetail = store.get('personalityDetail')
    const personalityObj = hydratePersonality(personalityType, personalityDetail)
    
    if (personalityObj) {
      this.applyPersonality(personalityObj)
      await this.ensureReferralCode()
      this.setData({ loading: false })
      return
    }

    try {
      const data = await gameApi.getProfile()
      store.applyGameProfile(data)
      const personalityTypeAfter = store.get('personalityType')
      const personalityDetailAfter = store.get('personalityDetail')
      const hydrated = hydratePersonality(personalityTypeAfter, personalityDetailAfter)
      if (hydrated) {
        this.applyPersonality(hydrated)
        await this.ensureReferralCode()
      }
    } catch {
      /* no backend profile */
    }
    this.setData({ loading: false })
  },

  applyPersonality(p: any) {
    this.setData({
      emoji: p.emoji,
      name: p.name,
      tagline: p.tagline,
      desc: p.desc,
      traits: p.traits,
      hasResult: true,
    })
  },

  async ensureReferralCode() {
    const token = store.get('token')
    if (!token || token === 'dev-mode-token') return
    if (this.data.referralCode) return

    try {
      const refResp = await referralApi.create('referral')
      this.setData({ referralCode: refResp.code })
    } catch {
      /* best-effort */
    }
  },

  async ensureProfileShareCode(): Promise<boolean> {
    const token = store.get('token')
    if (!token || token === 'dev-mode-token') return false

    const allowed = await ensureConsent('profile_share')
    if (!allowed) return false

    if (this.data.profileShareCode) return true

    try {
      const profileResp = await referralApi.create('profile_share')
      const profileShareCode = profileResp.code
      const hrShareUrl = SAAS_BASE ? `${SAAS_BASE.replace(/\/$/, '')}/candidate/share/${profileShareCode}` : ''
      this.setData({ profileShareCode, hrShareUrl })
      return true
    } catch {
      return false
    }
  },

  onShareAppMessage() {
    const personalityType = store.get('personalityType')
    const personalityDetail = store.get('personalityDetail')
    const personalityObj = hydratePersonality(personalityType, personalityDetail)
    const ref = this.data.referralCode
    const path = ref ? `/pages/splash/index?ref=${ref}` : '/pages/splash/index'
    if (!personalityObj) {
      return { title: 'PlanetX - 你的职业飞行器', path }
    }
    return {
      title: `🪐 我的星际人格是「${personalityObj.name}」！测测你是什么星球身份？`,
      path,
    }
  },

  onShareTimeline() {
    const personalityType = store.get('personalityType')
    const personalityDetail = store.get('personalityDetail')
    const personalityObj = hydratePersonality(personalityType, personalityDetail)
    if (!personalityObj) return { title: 'PlanetX - 你的职业飞行器' }
    return {
      title: `🪐 我的星际人格是「${personalityObj.name}」！${personalityObj.tagline}`,
    }
  },

  handleShare() {
    const personalityType = store.get('personalityType')
    const personalityDetail = store.get('personalityDetail')
    const personalityObj = hydratePersonality(personalityType, personalityDetail)
    if (!personalityObj) return
    const ref = this.data.referralCode
    const inviteUrl = ref ? `pages/splash/index?ref=${ref}` : 'pages/splash/index'
    const text = getShareTextMini(personalityObj, inviteUrl)
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '分享文案已复制', icon: 'success' })
        store.completeMission('share')
        gameApi.completeMission('share', 30).catch(() => {})
      },
    })
  },

  async handleCopyHrLink() {
    const ok = await this.ensureProfileShareCode()
    if (!ok) {
      wx.showToast({ title: '需要授权后才能分享 HR 画像链接', icon: 'none' })
      return
    }
    const url = this.data.hrShareUrl
    if (!url) {
      wx.showToast({ title: '链接生成失败，请稍后重试', icon: 'none' })
      return
    }
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: 'HR 画像链接已复制', icon: 'success' })
        trackMiniEvent('share_link_copied', {
          share_code: this.data.profileShareCode,
          properties: { channel: 'hr_link' },
        })
      },
    })
  },

  handleBack() {
    wx.switchTab({ url: '/pages/hub/index' })
  },

  handleTimeline() {
    wx.navigateTo({ url: '/pages/timeline/index' })
  },
})
