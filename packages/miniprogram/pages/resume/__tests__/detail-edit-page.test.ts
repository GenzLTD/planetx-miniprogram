/**
 * detail 页正文编辑 —— saveEdit 只提交有改动字段，成功后退出编辑态。
 */

jest.mock('../../../utils/api', () => ({
  resumeApi: {
    detail: jest.fn(),
    update: jest.fn(),
    permission: jest.fn(),
    setPermission: jest.fn(),
  },
}))

import { resumeApi } from '../../../utils/api'

type AnyCtx = Record<string, any>

let pageConfig: AnyCtx

beforeAll(() => {
  ;(global as any).Page = (cfg: AnyCtx) => {
    pageConfig = cfg
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('../detail/index')
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
  detail: jest.Mock
  update: jest.Mock
  permission: jest.Mock
  setPermission: jest.Mock
}

const DETAIL = {
  id: '42',
  title: '我的简历',
  filename: 'cv.pdf',
  uploaded_at: '2026-10-20T10:00:00Z',
  extracted: { summary: '十年电梯', skills: ['Rust'] },
  markdown: '# 旧',
  visibility: 'private' as const,
}

beforeEach(() => {
  jest.clearAllMocks()
  api.permission.mockResolvedValue({
    resume_id: '42',
    visibility: 'private',
    grants: [],
  })
})

describe('detail 页正文编辑', () => {
  it('无改动点保存 → 不发请求，显示错误', async () => {
    api.detail.mockResolvedValue(DETAIL)
    const page = makePage()
    page.data.resumeId = '42'
    await page.loadDetail()

    page.startEdit()
    await page.saveEdit()

    expect(api.update).not.toHaveBeenCalled()
    expect(page.data.editError).toMatch(/没有需要保存/)
    expect(page.data.editing).toBe(true)
  })

  it('改 title → PUT 只带 title，成功后退出编辑态并刷新 detail', async () => {
    api.detail.mockResolvedValue(DETAIL)
    api.update.mockResolvedValue({
      ...DETAIL,
      title: '新标题',
    })
    const page = makePage()
    page.data.resumeId = '42'
    await page.loadDetail()

    page.startEdit()
    page.onEditTitle({ detail: { value: '新标题' } })
    await page.saveEdit()

    expect(api.update).toHaveBeenCalledWith('42', { title: '新标题' })
    expect(page.data.editing).toBe(false)
    expect(page.data.detail.title).toBe('新标题')
  })

  it('改 summary → PUT extracted 全量替换并保留 skills', async () => {
    api.detail.mockResolvedValue(DETAIL)
    api.update.mockResolvedValue({
      ...DETAIL,
      extracted: { summary: '新摘要', skills: ['Rust'] },
    })
    const page = makePage()
    page.data.resumeId = '42'
    await page.loadDetail()

    page.startEdit()
    page.onEditSummary({ detail: { value: '新摘要' } })
    await page.saveEdit()

    expect(api.update).toHaveBeenCalledWith('42', {
      extracted: { summary: '新摘要', skills: ['Rust'] },
    })
  })

  it('编辑中禁止点「谁可看」', async () => {
    api.detail.mockResolvedValue(DETAIL)
    const page = makePage()
    page.data.resumeId = '42'
    await page.loadDetail()

    page.startEdit()
    page.onVisibilityTap({ currentTarget: { dataset: { value: 'everyone' } } })

    expect(api.setPermission).not.toHaveBeenCalled()
  })
})
