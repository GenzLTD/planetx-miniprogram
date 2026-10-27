/**
 * Match Page — 首次星际匹配（阶段二共识三分流）
 *
 * 与 Web MatchScreen 共用 deriveMatchUiState 推断规则。
 * 三种视图：verified（共识共振）、weak（弱共振）、failed（未达标）。
 */
import { store } from '../../utils/store'
import { gameApi } from '../../utils/api'
import { MISSION_XP } from '../../utils/config'
import {
  deriveMatchUiState,
  type FleetMatchResponse,
  type MatchConsensusItem,
  type MatchUiState,
} from '@looma/shared-core'

Page({
  data: {
    phase: 'scanning' as 'scanning' | 'result' | 'error',
    statusText: '正在扫描舰队星轨…',
    errorMessage: '',
    result: null as FleetMatchResponse | null,
    pendingConsensus: [] as MatchConsensusItem[],
    completing: false,
    sharing: false,
    uiState: null as MatchUiState | null,
    // 已达阈值但双向共识未成立：completeMission 会被 403 consensus_required 拒绝
    awaitingPeer: false,
    personalize: true,
  },

  onLoad() {
    const completed = store.get('missionsCompleted') || []
    if (!completed.includes('team')) {
      wx.showToast({ title: '需先完成组建舰队', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
      return
    }
    void this.startMatch()
  },

  async loadPendingConsensus() {
    try {
      const data: any = await gameApi.listConsensus()
      const all: MatchConsensusItem[] = data?.pending ?? []
      // 只展示需要「我」认可的入站请求；自己发起的那条要等对方认可，不在这里给按钮
      this.setData({ pendingConsensus: all.filter((it: any) => it.is_incoming === true) })
    } catch {
      this.setData({ pendingConsensus: [] })
    }
  },

  async startMatch() {
    const usePersonalize = this.data.personalize
    this.setData({
      phase: 'scanning',
      statusText: usePersonalize ? '正在扫描舰队星轨…' : '随机星轨匹配（已关闭个性化）…',
      errorMessage: '',
      result: null,
      pendingConsensus: [],
      uiState: null,
      awaitingPeer: false,
    })

    await new Promise((r) => setTimeout(r, 900))
    this.setData({ statusText: usePersonalize ? '计算人格互补轨道…' : '在舰队范围内随机挑选…' })

    try {
      const data: any = await gameApi.match({ personalize: usePersonalize })
      if (!data?.matched || !data?.match) {
        throw new Error(data?.message || '匹配失败')
      }

      const uiState = deriveMatchUiState(data as FleetMatchResponse)

      this.setData({
        phase: 'result',
        result: data as FleetMatchResponse,
        uiState,
        awaitingPeer: !!uiState.awaitingPeer,
      })

      // 异步加载待认可的共识请求
      void this.loadPendingConsensus()
    } catch (err: any) {
      const msg =
        err?.body?.message ||
        err?.details?.message ||
        err?.message ||
        err?.error ||
        (typeof err === 'string' ? err : '匹配信号中断，请稍后重试')
      const friendly =
        typeof msg === 'string' && msg.startsWith('HTTP ')
          ? err?.details?.message || err?.body?.message || msg
          : msg
      this.setData({
        phase: 'error',
        errorMessage: friendly,
        statusText: '匹配未完成',
      })
    }
  },

  async onConfirm() {
    if (this.data.completing || !this.data.result) return
    const result = this.data.result
    const ui = this.data.uiState
    const canComplete = result.can_complete_mission === true
    if (!canComplete) {
      // 分数过阈值但共识未双向确认时，原因不是「契合度不足」，别给错的引导
      if (this.data.awaitingPeer || ui?.awaitingPeer) {
        wx.showToast({ title: '已达门槛，等待对方确认共识后才能解锁', icon: 'none', duration: 2500 })
        return
      }
      wx.showToast({ title: '契合度未达解锁阈值，可邀请更多舰员后再试', icon: 'none' })
      return
    }
    this.setData({ completing: true })

    const alreadyDone = (store.get('missionsCompleted') || []).includes('match')

    try {
      if (!alreadyDone) {
        const xpReward = MISSION_XP.match
        const data: any = await gameApi.completeMission('match', xpReward)
        store.completeMission('match')
        if (data?.total_xp != null) {
          store.applyGameProfile({
            xp: data.total_xp,
            level: data.level,
            missions_completed: store.get('missionsCompleted'),
          })
        }
        store.setAchievement({
          title: ui?.view === 'verified' ? '共识共振达成！' : '首次星际匹配！',
          desc:
            ui?.view === 'verified'
              ? '舰队共识已验证 · 匹配星图已解锁'
              : '你已与另一位星际公民完成匹配 · 匹配星图已解锁',
        })
      }
      wx.showToast({ title: '匹配星图已解锁', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 900)
    } catch (err: any) {
      const status = err?.status || err?.statusCode
      const code = err?.body?.error || err?.details?.error || err?.error
      // 403 consensus_required：契合度够了，但对方还没认可 —— 切到等待态，不是失败
      if (status === 403 || code === 'consensus_required') {
        this.setData({ awaitingPeer: true })
        wx.showToast({ title: '等待对方确认共识后才能解锁', icon: 'none', duration: 2500 })
        return
      }
      if (status === 409) {
        store.completeMission('match')
        store.setAchievement({
          title: '首次星际匹配！',
          desc: '你已与另一位星际公民完成匹配 · 匹配星图已解锁',
        })
        wx.navigateBack()
        return
      }
      wx.showToast({
        title: err?.message || '回写任务失败',
        icon: 'none',
      })
    } finally {
      this.setData({ completing: false })
    }
  },

  async onShareSpread() {
    if (this.data.sharing) return
    this.setData({ sharing: true })
    try {
      // 使用微信分享能力
      const result = this.data.result
      const selfType = result?.self?.personality_type || '星际公民'
      const selfEmoji = result?.self?.personality_emoji || '🌌'
      const matchType = result?.match?.personality_type || ''
      const score = result?.match?.match_score || 0

      const shareText = `🪐 我在 PlanetX 上被识别为「${selfEmoji} ${selfType}」\n刚与一位「${matchType}」进行了星际匹配（契合度 ${score}）\n快来加入我的舰队，一起探索六域！`
      wx.setClipboardData({
        data: shareText,
        success: () => {
          wx.showToast({ title: '传播文案已复制！分享到微信扩大验证池', icon: 'none', duration: 2000 })
        },
      })
    } catch {
      wx.showToast({ title: '复制失败，请手动分享邀请链接', icon: 'none' })
    } finally {
      this.setData({ sharing: false })
    }
  },

  async onAcknowledge(e: any) {
    const consensusId = e.currentTarget.dataset.id as string
    if (!consensusId) return
    try {
      await gameApi.acknowledgeConsensus(consensusId)
      wx.showToast({ title: '已发送共识确认', icon: 'success' })
      // 刷新共识列表 + 重新匹配
      await this.loadPendingConsensus()
      await this.startMatch()
    } catch (err: any) {
      const msg = err?.body?.message || err?.message || '确认失败，请稍后重试'
      wx.showToast({ title: msg, icon: 'none' })
    }
  },

  onTogglePersonalize() {
    const next = !this.data.personalize
    this.setData({ personalize: next })
    void this.startMatch()
  },

  /** 等待对方确认时手动刷新：重新匹配即可拿到最新 can_complete_mission */
  async onRefreshConsensus() {
    if (this.data.completing) return
    await this.loadPendingConsensus()
    await this.startMatch()
  },

  onRetry() {
    void this.startMatch()
  },

  onBack() {
    wx.navigateBack()
  },

  goToTrust() {
    wx.navigateTo({ url: "/pages/trust/index" })
  },
})
