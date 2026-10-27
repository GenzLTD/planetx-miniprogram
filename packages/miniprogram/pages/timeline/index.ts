import { timelineApi } from '../../utils/api'

const KIND_LABEL: Record<string, string> = {
  initial_hypothesis: '起始画像',
  quiz_completed: '职业画像初测',
  project_record: '项目经历',
  check_in: '本周记录',
  share_authorized: '授权分享',
  match_scan: '匹配扫描',
  resume_ingest: '简历沉淀',
  interaction_log: '对话摘要',
  mission_completed: '任务完成',
  learning_activity: '学习行为',
}

function titleOf(ev: any): string {
  if (ev.event_kind === 'quiz_completed') return '完成职业画像初测'
  if (ev.event_kind === 'check_in' && (!ev.title || ev.title === '本周签到')) return '完成本周记录'
  return ev.title || KIND_LABEL[ev.event_kind] || ev.event_kind
}

Page({
  data: {
    loading: true,
    growthMessage: '',
    items: [] as { id: string; title: string; summary: string; when: string }[],
    panel: '' as '' | 'check_in' | 'project',
    focus: '',
    projectTitle: '',
    projectSummary: '',
    saving: false,
  },

  onShow() {
    void this.reload()
  },

  async reload() {
    this.setData({ loading: true })
    try {
      await timelineApi.backfill().catch(() => undefined)
      const [list, growth] = await Promise.all([
        timelineApi.list({ limit: 50 }),
        timelineApi.growth(),
      ])
      const items = (list.items || []).map((ev: any) => ({
        id: ev.id,
        title: titleOf(ev),
        summary: ev.summary || '',
        when: String(ev.occurred_at || '').slice(0, 10),
      }))
      this.setData({
        loading: false,
        items,
        growthMessage: growth?.message || '',
      })
    } catch {
      this.setData({ loading: false })
      wx.showToast({ title: '时间线加载失败', icon: 'none' })
    }
  },

  openCheckIn() { this.setData({ panel: 'check_in' }) },
  openProject() { this.setData({ panel: 'project' }) },
  closePanel() { this.setData({ panel: '' }) },
  noop() {},
  onFocus(e: any) { this.setData({ focus: e.detail.value }) },
  onProjectTitle(e: any) { this.setData({ projectTitle: e.detail.value }) },
  onProjectSummary(e: any) { this.setData({ projectSummary: e.detail.value }) },

  async submitCheckIn() {
    if (this.data.saving) return
    this.setData({ saving: true })
    try {
      await timelineApi.createEvent({
        event_kind: 'check_in',
        title: '完成本周记录',
        summary: this.data.focus || '记录了本周的行动与状态。',
        payload: { mood: 'focused', focus: this.data.focus || null, blocker: null },
      })
      this.setData({ panel: '', focus: '', saving: false })
      wx.showToast({ title: '已记录本周行动', icon: 'success' })
      await this.reload()
    } catch {
      this.setData({ saving: false })
      wx.showToast({ title: '记录失败', icon: 'none' })
    }
  },

  async submitProject() {
    if (!this.data.projectTitle.trim()) {
      wx.showToast({ title: '请填写项目标题', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      const summary = this.data.projectSummary.trim()
      await timelineApi.createEvent({
        event_kind: 'project_record',
        title: this.data.projectTitle.trim(),
        summary,
        payload: { role: '', outcome: summary, raw_text_chars: summary.length },
      })
      this.setData({ panel: '', projectTitle: '', projectSummary: '', saving: false })
      wx.showToast({ title: '项目已写入时间线', icon: 'success' })
      await this.reload()
    } catch {
      this.setData({ saving: false })
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },
})
