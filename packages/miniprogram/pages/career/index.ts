/**
 * 求职 — 与 iOS「求职」同一组 looma 接口：
 * POST /v1/resume/parse · POST /v1/jobs/match · GET /v1/jobs/list
 * 调用前走 jobseeker_core，和小程序 ensureConsent 一致。
 *
 * 求职闭环（career-loop-wire）：解析成功即入库（thin-ingest，extracted
 * 随 body 带 → 服务端 processed），列表点条目进 detail（编辑 + 谁可看）。
 * 匹配结果仍留页内 JSON。
 */
import { careerApi, resumeApi } from '../../utils/api'
import { ensureConsent } from '../../utils/consent'
import { store } from '../../utils/store'
import { buildIngestBody, decorateResumeRow, isNavigable, type ResumeRow } from './loop'

Page({
  data: {
    mode: 'parse' as 'parse' | 'match',
    text: '',
    busy: false,
    result: '',
    error: '',
    jobs: [] as Array<{ title: string; company: string; salary: string }>,
    // 我的简历（GET /v1/resume/list）
    resumes: [] as ResumeRow[],
    resumeTotal: 0,
    resumeError: '',
    resumeEmptyHint: '登录后展示已入库简历。解析成功的简历会自动入库。',
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.()
    if (tabBar) tabBar.setData({ selected: 2 })
    this.loadJobs()
    this.loadResumes()
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

  async loadResumes() {
    if (!store.get('token')) {
      this.setData({
        resumes: [],
        resumeTotal: 0,
        resumeError: '',
        resumeEmptyHint: '登录后展示已入库简历。解析成功的简历会自动入库。',
      })
      return
    }
    try {
      const resp = await resumeApi.list()
      const resumes = (resp.resumes || []).map((r) => decorateResumeRow(r)).filter(isNavigable)
      this.setData({
        resumes,
        resumeTotal: resp.total ?? resumes.length,
        resumeError: '',
        resumeEmptyHint: '暂无入库简历。上方「解析简历」成功后会自动入库。',
      })
    } catch (err: any) {
      this.setData({ resumes: [], resumeTotal: 0, resumeError: err?.message || '列表加载失败' })
    }
  },

  openResume(e: any) {
    const id = String(e?.currentTarget?.dataset?.id || '').trim()
    if (!id) return
    wx.navigateTo({ url: `/pages/resume/detail/index?resume_id=${id}` })
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
      if (this.data.mode === 'match') {
        const resp = await careerApi.match(text)
        this.setData({ result: JSON.stringify(resp, null, 2), busy: false })
        return
      }
      // parse → ingest 闭环：解析成功即入库（extracted 随 body → processed）
      // parse 必须走 careerApi.parse（显式 120s）——resumeApi.parse 走客户端
      // 默认 10s 超时，LLM 解析常超 10s，且服务端可能已扣额度，超时会扣死闭环。
      const parseResp = await careerApi.parse(text) as { extracted?: Record<string, unknown> }
      const body = buildIngestBody(text, parseResp)
      if (!body) {
        // 无 extracted：不入库，解析结果原样展示供排查
        this.setData({ result: JSON.stringify(parseResp ?? {}, null, 2), busy: false })
        return
      }
      try {
        const ingested = await resumeApi.ingest(body) as { resume_id?: string; status?: string }
        this.setData({
          result: `已入库 #${ingested.resume_id ?? '?'}（${ingested.status || 'stored'}）`,
          busy: false,
        })
      } catch (err: any) {
        // 入库失败也回显解析结果：解析已扣额度，避免用户以为白跑而重试再扣
        this.setData({
          result: JSON.stringify(parseResp ?? {}, null, 2),
          error: `解析成功但入库失败：${err?.message || '请求失败'}（下方为解析结果，可复制留存）`,
          busy: false,
        })
        return
      }
      this.loadResumes()
    } catch (err: any) {
      this.setData({
        error: err?.message || '请求失败',
        busy: false,
      })
    }
  },
})
