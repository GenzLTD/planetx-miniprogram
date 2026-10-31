/**
 * 职位详情 — GET /v1/jobs/:job_id（job-service，真查库）
 *
 * 列表侧（pages/career）只带 id 进来，正文一律以详情接口为准，
 * 避免列表缓存与库内数据漂移。
 *
 * 字段形态：job-service 对职位正文无 schema —— load_jobs 只归一 id/title，
 * 其余字段从 documents.metadata.parsed 原样透传（routes.rs:477-499），
 * 所以正文名随写入方而变。已知变体：jd（seed-demo）、desc（存量库）、
 * description + requirements（解析产物）→ 按此顺序回退，任一命中即渲染。
 *
 * 匹配入口不放在本页：/v1/jobs/match 是 LLM 即席（不查库），
 * 与本页「库内真实职位」不是同一条链路，混放会误导预期。
 */
import { careerApi } from '../../utils/api'

type JobDetail = {
  id?: string
  title?: string
  company?: string
  location?: string
  salary?: string
  salary_range?: string
  jd?: string
  description?: string
  desc?: string
  requirements?: string
}

Page({
  data: {
    jobId: '',
    job: null as JobDetail | null,
    jdText: '',
    loading: true,
    error: '',
  },

  onLoad(options: Record<string, string | undefined>) {
    const jobId = String(options?.id || '').trim()
    this.setData({ jobId })
    if (!jobId) {
      this.setData({ loading: false, error: '缺少职位 id，无法加载详情' })
      return
    }
    // 返回 promise：页面生命周期不关心，但便于测试 await 首屏拉取
    return this.loadDetail()
  },

  async loadDetail() {
    const jobId = this.data.jobId
    if (!jobId) return
    if (!this.data.loading) this.setData({ loading: true, error: '' })
    try {
      const job = (await careerApi.jobDetail(jobId)) as JobDetail
      const jdText = job.jd || [job.description || job.desc, job.requirements].filter(Boolean).join('\n\n')
      this.setData({ job, jdText, loading: false, error: '' })
    } catch (err: any) {
      this.setData({ job: null, jdText: '', loading: false, error: err?.message || '详情加载失败' })
    }
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },
})
