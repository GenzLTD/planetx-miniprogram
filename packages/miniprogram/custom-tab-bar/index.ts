/**
 * Custom TabBar for PlanetX
 * Dark theme with emoji icons + accent color
 */

Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/hub/index', text: '母舰', icon: '🚀', activeIcon: '🚀' },
      { pagePath: '/pages/ask/index', text: '问答', icon: '💬', activeIcon: '💬' },
      { pagePath: '/pages/profile/index', text: '我的', icon: '🪪', activeIcon: '🪪' },
    ],
  },

  methods: {
    switchTab(e: any) {
      const idx = e.currentTarget.dataset.index
      const path = this.data.list[idx].pagePath
      wx.switchTab({ url: path })
      this.setData({ selected: idx })
    },
  },
})
