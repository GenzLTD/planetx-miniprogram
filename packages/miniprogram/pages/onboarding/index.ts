import { IDENTITY_LABELS } from '../../types/index'
import { store } from '../../utils/store'

type PlanetIdentity = 'explorer' | 'captain' | 'wanderer'

const CARDS: { type: PlanetIdentity; emoji: string; desc: string; tag: string }[] = [
  {
    type: 'explorer',
    emoji: '🚀',
    desc: '正在寻找新的职业星球 · 渴望找到属于自己的轨道',
    tag: '最多人选择',
  },
  {
    type: 'captain',
    emoji: '👨‍✈️',
    desc: '组建你的3人舰队 · 带领船员探索未知星域',
    tag: '组队模式',
  },
  {
    type: 'wanderer',
    emoji: '🌌',
    desc: '不着急着陆 · 先在各个星球间随意漂流看看',
    tag: '佛系模式',
  },
]

Page({
  data: {
    cards: CARDS.map((c) => ({
      ...c,
      title: IDENTITY_LABELS[c.type].split('·')[0].trim(),
    })),
    saving: false,
  },

  async onSelect(e: any) {
    if (this.data.saving) return
    const type = e.currentTarget.dataset.type as PlanetIdentity
    if (!type) return
    this.setData({ saving: true })
    try {
      await store.setIdentity(type)
      wx.switchTab({ url: '/pages/hub/index' })
    } catch (err: any) {
      wx.showToast({ title: err?.message || '身份保存失败', icon: 'none' })
      this.setData({ saving: false })
    }
  },
})
