/**
 * 求职 — 与 iOS「求职」同一组 looma 接口：
 * POST /v1/resume/parse · POST /v1/jobs/match · GET /v1/jobs/list
 * 调用前走 jobseeker_core，和小程序 ensureConsent 一致。
 */
import { careerApi } from '../../utils/api'
import { ensureConsent } from '../../utils/consent'
import { store } from '../../utils/store'

Page({
  data: {
    mode: 'parse' as 'parse' | 'match',
    text: '',
    busy: false,
    result: '',
    error: '',
    jobs: [] as Array<{ title: string; company: string; salary: string }>,
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.()
    if (tabBar) tabBar.setData({ selected: 2 })
    this.loadJobs()
  },

  onMode(e: any) {
    this.setData({ mode: e.currentTarget.dataset.mode, result: '', error: '' })
  },

  goTemplates() {
    wx.navigateTo({ url: '/pages/resume/templates/index' })
  },

  goBlacklist() {
    wx.navigateTo({ url: '/pages/resume/blacklist/index' })
  },

  onInput(e: any) {
    this.setData({ text: e.detail.value })
  },

  async loadJobs() {
    try {
      const resp = await careerApi.jobs() as { jobs?: Array<Record<string, string>> }
      const jobs = (resp.jobs || []).slice(0, 20).map((job) => ({
        title: job.title || '未命名职位',
        company: job.company || '',
        salary: job.salary_range || job.salary || '',
      }))
      this.setData({ jobs })
    } catch {
      this.setData({ jobs: [] })
    }
  },

  async onSubmit() {
    const text = this.data.text.trim()
    if (!text || this.data.busy) return
    if (!store.get('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    const allowed = await ensureConsent('jobseeker_core')
    if (!allowed) {
      wx.showToast({ title: '需要授权后才能处理简历', icon: 'none' })
      return
    }
    this.setData({ busy: true, result: '', error: '' })
    try {
      const resp = this.data.mode === 'parse'
        ? await careerApi.parse(text)
        : await careerApi.match(text)
      this.setData({ result: JSON.stringify(resp, null, 2), busy: false })
    } catch (err: any) {
      this.setData({
        error: err?.message || '请求失败',
        busy: false,
      })
    }
  },
})
