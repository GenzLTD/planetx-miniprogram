/**
 * Ask Page - TabBar AI Q&A with intent confidence display
 */
import { eventBus } from '../../utils/event-bus'
import { store } from '../../utils/store'
import { askApi } from '../../utils/api'
import { ensureConsent } from '../../utils/consent'
import type { ChatMessage } from '../../types/index'

interface AskMeta {
  intent?: string
  intent_confidence?: number
  source_scores?: string
}

Page({
  data: {
    messages: [
      {
        role: 'assistant',
        content: '你好，探索者！我是 PlanetX 星际导航员。\n\n六大探索域等你开启：职业域、学习域、生活域、社交域、健康域、创意域。\n\n随便聊聊，或者试试问「推荐一句诗」「帮我匹配职位」「我想探索什么」？',
      },
    ] as ChatMessage[],
    metas: [] as (AskMeta | null)[],
    inputText: '',
    loading: false,
    scrollIntoView: '',
  },

  sessionHistory: [] as ChatMessage[],

  onShow() {
    const tabBar = (this as any).getTabBar?.()
    if (tabBar) tabBar.setData({ selected: 1 })
  },

  onInput(e: any) {
    this.setData({ inputText: e.detail.value })
  },

  formatSourceScores(sources?: Array<{ score?: number | null }>): string {
    if (!sources?.length) return '无检索片段'
    return sources
      .map((s, i) => `#${i + 1}:${s.score != null ? s.score.toFixed(3) : 'n/a'}`)
      .join(' ')
  },

  async onSend() {
    const text = this.data.inputText.trim()
    if (!text || this.data.loading) return

    const token = store.get('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const allowed = await ensureConsent('ask_rag')
    if (!allowed) {
      wx.showToast({ title: '需要授权后才能使用 AI 问答', icon: 'none' })
      return
    }

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now().toString() }
    const messages = [...this.data.messages, userMsg]
    const metas = [...this.data.metas, null]
    this.setData({ messages, metas, inputText: '', loading: true })
    this.scrollToBottom()

    try {
      const resp = await askApi.ask({
        query: text,
        session_history: this.sessionHistory
      }) as {
        answer?: string
        intent?: string
        intent_confidence?: number
        sources?: Array<{ score?: number | null }>
      }
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: resp.answer || '抱歉，我没能理解你的问题。',
        sources: resp.sources as any,
        timestamp: Date.now().toString(),
      }
      const meta: AskMeta = {
        intent: resp.intent,
        intent_confidence: resp.intent_confidence,
        source_scores: this.formatSourceScores(resp.sources),
      }
      this.sessionHistory = [...this.sessionHistory, userMsg, aiMsg]
      const newMessages = [...this.data.messages, aiMsg]
      const newMetas = [...this.data.metas, meta]
      this.setData({ messages: newMessages, metas: newMetas, loading: false })
      this.scrollToBottom()
    } catch (err: any) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: err?.message?.includes('配额') ? '今日配额已用尽' : '网络波动，请稍后重试。',
        timestamp: Date.now().toString(),
      }
      this.setData({
        messages: [...this.data.messages, errMsg],
        metas: [...this.data.metas, null],
        loading: false,
      })
      this.scrollToBottom()
    }
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollIntoView: 'msg-bottom' })
    }, 100)
  },

  onShareAppMessage() {
    const ref = wx.getStorageSync('pending_ref') || ''
    return {
      title: 'PlanetX - AI 星际问答，你的职业导航员',
      path: ref ? `/pages/splash/index?ref=${ref}` : '/pages/splash/index',
    }
  },
})
