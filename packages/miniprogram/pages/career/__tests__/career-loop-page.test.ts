/**
 * career 页求职闭环接线 —— parse 成功即 ingest、无 extracted 不入库、
 * 列表加载与条目跳转。页面层 mock 掉 utils/api 与 utils/consent。
 */

jest.mock('../../../utils/api', () => ({
  resumeApi: {
    parse: jest.fn(),
    ingest: jest.fn(),
    list: jest.fn(),
  },
  careerApi: {
    jobs: jest.fn(),
    match: jest.fn(),
  },
}))

jest.mock('../../../utils/consent', () => ({
  ensureConsent: jest.fn(async () => true),
}))

jest.mock('../../../utils/store', () => ({
  store: { get: jest.fn(() => 'tok') },
}))

const mockWx = { navigateTo: jest.fn(), showToast: jest.fn() }
;(global as any).wx = mockWx

import { resumeApi } from '../../../utils/api'
import { ensureConsent } from '../../../utils/consent'
import { store } from '../../../utils/store'

type AnyCtx = Record<string, any>

let pageConfig: AnyCtx

beforeAll(() => {
  ;(global as any).Page = (cfg: AnyCtx) => {
    pageConfig = cfg
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  try {
    require('../index')
  } catch (e) {
    console.error('REQUIRE-ERR:', e)
    throw e
  }
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

const api = resumeApi as unknown as {
  parse: jest.Mock
  ingest: jest.Mock
  list: jest.Mock
}
const consent = ensureConsent as unknown as jest.Mock
const token = store.get as unknown as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  token.mockReturnValue('tok')
  api.list.mockResolvedValue({ resumes: [], total: 0 })
})

describe('loadResumes', () => {
  it('拉列表并装饰；total 用服务端值', async () => {
    api.list.mockResolvedValue({
      resumes: [{ id: '7', title: '主简历', uploaded_at: '2026-10-30T01:00:00Z', extracted: { name: 'a' } }],
      total: 9,
    })
    const ctx = makePage()
    await ctx.loadResumes()
    expect(api.list).toHaveBeenCalledTimes(1)
    expect(ctx.data.resumes).toEqual([
      { id: '7', title: '主简历', dateLabel: '2026-10-30', parsed: true },
    ])
    expect(ctx.data.resumeTotal).toBe(9)
    expect(ctx.data.resumeError).toBe('')
  })
  it('未登录：清空列表不打接口', async () => {
    token.mockReturnValue('')
    const ctx = makePage()
    await ctx.loadResumes()
    expect(api.list).not.toHaveBeenCalled()
    expect(ctx.data.resumes).toEqual([])
  })
  it('失败：resumeError 落消息、列表清空', async () => {
    api.list.mockRejectedValue(new Error('boom'))
    const ctx = makePage()
    await ctx.loadResumes()
    expect(ctx.data.resumeError).toBe('boom')
    expect(ctx.data.resumes).toEqual([])
  })
})

describe('onSubmit parse→ingest 闭环', () => {
  const page = () => {
    const ctx = makePage()
    ctx.setData({ mode: 'parse', text: '  简历原文  ' })
    return ctx
  }

  it('parse 成功 → 组 ingest（原文 trim + extracted）→ 成功展示 + 重拉列表', async () => {
    api.parse.mockResolvedValue({ extracted: { name: '李四' } })
    api.ingest.mockResolvedValue({ resume_id: '42', status: 'processed' })
    const ctx = page()
    await ctx.onSubmit()
    expect(api.parse).toHaveBeenCalledWith('简历原文')
    expect(api.ingest).toHaveBeenCalledWith({
      markdown: '简历原文',
      filename: 'resume-李四.md',
      extracted: { name: '李四' },
    })
    expect(ctx.data.result).toBe('已入库 #42（processed）')
    expect(ctx.data.busy).toBe(false)
    expect(api.list).toHaveBeenCalled()
  })

  it('parse 无 extracted → 不 ingest，解析结果原样 JSON 展示', async () => {
    api.parse.mockResolvedValue({ extracted: null })
    const ctx = page()
    await ctx.onSubmit()
    expect(api.ingest).not.toHaveBeenCalled()
    expect(ctx.data.result).toBe(JSON.stringify({ extracted: null }, null, 2))
    expect(ctx.data.error).toBe('')
  })

  it('ingest 失败 → error 落消息，busy 复位', async () => {
    api.parse.mockResolvedValue({ extracted: { name: 'a' } })
    api.ingest.mockRejectedValue(new Error('ingest boom'))
    const ctx = page()
    await ctx.onSubmit()
    expect(ctx.data.error).toBe('ingest boom')
    expect(ctx.data.busy).toBe(false)
    expect(ctx.data.result).toBe('')
  })

  it('未登录 / 未授权直接拦截', async () => {
    token.mockReturnValue('')
    const ctx = page()
    await ctx.onSubmit()
    expect(mockWx.showToast).toHaveBeenCalled()
    expect(api.parse).not.toHaveBeenCalled()
    token.mockReturnValue('tok')
    consent.mockResolvedValueOnce(false)
    await ctx.onSubmit()
    expect(api.parse).not.toHaveBeenCalled()
  })

  it('match 模式不 ingest，结果仍页内 JSON', async () => {
    const ctx = page()
    ctx.setData({ mode: 'match' })
    const { careerApi } = jest.requireMock('../../../utils/api')
    careerApi.match.mockResolvedValue({ score: 0.8 })
    await ctx.onSubmit()
    expect(careerApi.match).toHaveBeenCalledWith('简历原文')
    expect(api.ingest).not.toHaveBeenCalled()
    expect(ctx.data.result).toBe(JSON.stringify({ score: 0.8 }, null, 2))
  })
})

describe('openResume', () => {
  it('带 id 跳 detail', () => {
    const ctx = makePage()
    ctx.openResume({ currentTarget: { dataset: { id: '42' } } })
    expect(mockWx.navigateTo).toHaveBeenCalledWith({
      url: '/pages/resume/detail/index?resume_id=42',
    })
  })
  it('无 id 不跳', () => {
    const ctx = makePage()
    ctx.openResume({ currentTarget: { dataset: { id: '' } } })
    expect(mockWx.navigateTo).not.toHaveBeenCalled()
  })
})

describe('onShow', () => {
  it('刷职位库 + 简历列表', () => {
    const ctx = makePage()
    ctx.loadJobs = jest.fn()
    ctx.loadResumes = jest.fn()
    ctx.onShow()
    expect(ctx.loadJobs).toHaveBeenCalled()
    expect(ctx.loadResumes).toHaveBeenCalled()
  })
})
