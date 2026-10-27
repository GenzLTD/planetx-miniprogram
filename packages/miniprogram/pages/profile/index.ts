/**
 * Profile Page - TabBar my profile (index 2)
 * User info + game stats + settings + logout
 */
import { eventBus } from '../../utils/event-bus'
import { store } from '../../utils/store'
import { getRankName } from '../../types/index'
import type { User, Tier } from '../../types/index'

const TIER_LABELS: Record<Tier, string> = {
  free: '免费版',
  supporter: '赞助版',
  pro: '专业版',
  enterprise: '企业版',
}

Page({
  data: {
    userName: '探索者',
    userTier: 'free' as Tier,
    tierLabel: '免费版',
    userEmail: '',
    level: 1,
    rankName: '星际新兵',
    isEarlyAdopter: false,
  },

  _profileHandler: null as any,

  onLoad() {
    this._profileHandler = () => this.refreshFromStore()
    eventBus.on('profile:loaded', this._profileHandler)
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.()
    if (tabBar) tabBar.setData({ selected: 2 })
    this.refreshFromStore()
  },

  onUnload() {
    if (this._profileHandler) eventBus.off('profile:loaded', this._profileHandler)
  },

  refreshFromStore() {
    const s = store.getAll()
    const user = s.user
    this.setData({
      userName: user?.name || '探索者',
      userTier: user?.tier || 'free',
      tierLabel: TIER_LABELS[user?.tier || 'free'],
      userEmail: user?.email || '',
      level: s.level,
      rankName: getRankName(s.level),
      isEarlyAdopter: (user as any)?.is_early_adopter || false,
    })
  },

  handleBindEmail() {
    wx.navigateTo({ url: '/pages/auth/index' })
  },

  handleUpgrade() {
    wx.navigateTo({ url: '/pages/pricing/index' })
  },

  handleAbout() {
    wx.showModal({
      title: '关于 PlanetX',
      content: 'PlanetX — 你的职业飞行器\n\nAI 驱动的求职匹配 + 星际人格测试 + 舰队组队系统\n\nVersion: P0 内测版',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#C8FF50',
    })
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号？',
      confirmText: '退出',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          store.reset()
          wx.removeStorageSync('looma_token')
          eventBus.emit('auth:logout')
          wx.reLaunch({ url: '/pages/splash/index' })
        }
      },
    })
  },

  onShareAppMessage() {
    return {
      title: 'PlanetX - 你的职业飞行器，来测测你的星际人格！',
      path: '/pages/splash/index',
    }
  },
})
