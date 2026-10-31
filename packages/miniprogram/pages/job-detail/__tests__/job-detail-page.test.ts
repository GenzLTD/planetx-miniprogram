/**
 * 职位详情页 —— GET /v1/jobs/:job_id 渲染与降级。
 *
 * 钉子：
 * · 无 id 不发请求（防止从旧列表结构导航进来打空 id 请求）
 * · jd 优先，缺失时回退 description / desc / requirements（服务端无正文 schema，
 *   三种字段形态都实际见过：seed-demo 用 jd、存量库用 desc、解析产物用 description）
 * · 失败保留 jobId 供重试，error 落文案、job 清空
 */
jest.mock('../../../utils/api', () => ({
  careerApi: {
    jobDetail: jest.fn(),
  },
}))

import { careerApi } from '../../../utils/api'

type AnyCtx = Record<string, any>

let pageConfig: AnyCtx

beforeAll(() => {
  ;(global as any).Page = (cfg: AnyCtx) => {
    pageConfig = cfg
  }
  ;(global as any).wx = { navigateBack: jest.fn() }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('../index')
})

function makePage(): AnyCtx {
  const ctx: AnyCtx = {
    data: JSON.parse(JSON.stringify(pageConfig.data)),
    setData(patch: AnyCtx) {
      for (const [key, value] of Object.entries(patch)) {
        if (key.includes('.')) {
          const [head, tail] = key.split('.')
          this.data[head] = { ...(this.data[head] || {}), [tail]: value }
        } else {
          this.data[key] = value
        }
      }
    },
  }
  for (const [key, value] of Object.entries(pageConfig)) {
    if (typeof value === 'function') ctx[key] = (value as Function).bind(ctx)
  }
  return ctx
}

const jobDetail = careerApi.jobDetail as unknown as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('onLoad', () => {
  it('无 id：不发请求，落错误文案', () => {
    const ctx = makePage()
    ctx.onLoad({})
    expect(jobDetail).not.toHaveBeenCalled()
    expect(ctx.data.loading).toBe(false)
    expect(ctx.data.error).toContain('缺少职位 id')
  })

  it('带 id：拉详情并渲染字段', async () => {
    const ctx = makePage()
    jobDetail.mockResolvedValue({
      id: 'demo-1',
      title: '高级前端工程师',
      company: '深伯乐科技',
      location: '深圳',
      salary: '25-40K',
      jd: '负责小程序与 Web 前端，TypeScript/React。',
    })
    await ctx.onLoad({ id: 'demo-1' })
    expect(ctx.data.jobId).toBe('demo-1')
    expect(jobDetail).toHaveBeenCalledWith('demo-1')
    expect(ctx.data.loading).toBe(false)
    expect(ctx.data.error).toBe('')
    expect(ctx.data.job.title).toBe('高级前端工程师')
    expect(ctx.data.jdText).toBe('负责小程序与 Web 前端，TypeScript/React。')
  })

  it('jd 缺失：description + requirements 拼接', async () => {
    const ctx = makePage()
    jobDetail.mockResolvedValue({
      id: 'demo-2',
      title: '产品经理',
      description: '负责 AI 求职产品',
      requirements: '5 年 + 产品经验',
    })
    await ctx.onLoad({ id: 'demo-2' })
    expect(ctx.data.jdText).toBe('负责 AI 求职产品\n\n5 年 + 产品经验')
  })

  it('只有 desc（存量库形态）：回退渲染，不显示暂无 JD', async () => {
    const ctx = makePage()
    jobDetail.mockResolvedValue({
      id: 'legacy-1',
      title: '高级 Rust 后端工程师',
      company: '某科技',
      desc: '负责网关与 resume-service，Rust/Tokio/Postgres。',
    })
    await ctx.onLoad({ id: 'legacy-1' })
    expect(ctx.data.jdText).toBe('负责网关与 resume-service，Rust/Tokio/Postgres。')
  })

  it('description 与 desc 同时存在：取 description，不重复拼接', async () => {
    const ctx = makePage()
    jobDetail.mockResolvedValue({
      id: 'both-1',
      title: '双字段职位',
      description: '主描述',
      desc: '旧描述',
      requirements: '要求 A',
    })
    await ctx.onLoad({ id: 'both-1' })
    expect(ctx.data.jdText).toBe('主描述\n\n要求 A')
  })

  it('请求失败：job 清空、error 落文案、jobId 保留供重试', async () => {
    const ctx = makePage()
    jobDetail.mockRejectedValue(new Error('502'))
    await ctx.onLoad({ id: 'demo-3' })
    expect(ctx.data.loading).toBe(false)
    expect(ctx.data.job).toBeNull()
    expect(ctx.data.error).toBe('502')
    expect(ctx.data.jobId).toBe('demo-3')
  })
})

describe('goBack', () => {
  it('navigateBack delta 1', () => {
    const ctx = makePage()
    ctx.goBack()
    expect((global as any).wx.navigateBack).toHaveBeenCalledWith({ delta: 1 })
  })
})
