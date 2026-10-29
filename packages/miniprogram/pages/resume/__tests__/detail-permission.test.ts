/**
 * detail 页「谁可看」接线（阶段3 收口后客户端账本第 2 项）。
 *
 * 核心不变量：grants 是全量替换，改 visibility 时必须把已读到的 grants 原样回传，
 * 否则服务端会把已有授权静默清空（契约 permission_semantics）。
 */

jest.mock('../../../utils/api', () => ({
  resumeApi: {
    detail: jest.fn(),
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
  permission: jest.Mock
  setPermission: jest.Mock
}

const DETAIL = {
  id: '42',
  title: '我的简历',
  filename: 'cv.pdf',
  uploaded_at: '2026-10-20T10:00:00Z',
  extracted: { summary: '十年电梯行业' },
  visibility: 'private',
}

const PERM = {
  resume_id: '42',
  visibility: 'private',
  grants: [
    { subject_type: 'enterprise', subject_id: 'ent_1', scope: 'read', expires_at: null },
  ],
  updated_at: '2026-10-29T12:00:00Z',
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('detail 页「谁可看」', () => {
  it('正文加载成功后顺带读授权面，可见性显示中文标签', async () => {
    api.detail.mockResolvedValue(DETAIL)
    api.permission.mockResolvedValue(PERM)

    const page = makePage()
    page.data.resumeId = '42'
    await page.loadDetail()

    expect(api.permission).toHaveBeenCalledWith('42')
    expect(page.data.perm).toEqual(PERM)
    expect(page.data.currentVisibility).toBe('private')
    expect(page.data.visibilityText).toBe('仅自己')
    expect(page.data.grantCount).toBe(1)
    expect(page.data.permUpdatedAt).toBe('2026-10-29T12:00:00Z')
    expect(page.data.loading).toBe(false)
  })

  it('改可见性时把既有 grants 原样回传（不许静默清空授权）', async () => {
    api.detail.mockResolvedValue(DETAIL)
    api.permission.mockResolvedValue(PERM)
    api.setPermission.mockResolvedValue({
      ...PERM,
      visibility: 'everyone',
      updated_at: '2026-10-29T12:05:00Z',
    })

    const page = makePage()
    page.data.resumeId = '42'
    await page.loadDetail()
    await page.applyVisibility('everyone')

    expect(api.setPermission).toHaveBeenCalledWith('42', {
      visibility: 'everyone',
      grants: PERM.grants,
    })
    expect(page.data.currentVisibility).toBe('everyone')
    expect(page.data.visibilityText).toBe('所有人')
    // detail 与 permission 同源，正文卡片的可见性同步
    expect(page.data.detail.visibility).toBe('everyone')
  })

  it('点当前值不发请求', async () => {
    api.detail.mockResolvedValue(DETAIL)
    api.permission.mockResolvedValue(PERM)

    const page = makePage()
    page.data.resumeId = '42'
    await page.loadDetail()
    page.onVisibilityTap({ currentTarget: { dataset: { value: 'private' } } })

    expect(api.setPermission).not.toHaveBeenCalled()
  })

  it('授权面 501 → 整块隐藏，正文不受影响', async () => {
    api.detail.mockResolvedValue(DETAIL)
    api.permission.mockRejectedValue({
      status: 501,
      details: { error: 'not_implemented' },
    })

    const page = makePage()
    page.data.resumeId = '42'
    await page.loadDetail()

    expect(page.data.permBlocked).toBe(true)
    expect(page.data.permError).toBe('')
    expect(page.data.detail).toEqual(DETAIL)
    expect(page.data.error).toBe('')
  })

  it('保存失败 → 保留原可见性并给出错误文案', async () => {
    api.detail.mockResolvedValue(DETAIL)
    api.permission.mockResolvedValue(PERM)
    api.setPermission.mockRejectedValue(new Error('consent_required'))

    const page = makePage()
    page.data.resumeId = '42'
    await page.loadDetail()
    await page.applyVisibility('trusted')

    expect(page.data.currentVisibility).toBe('private')
    expect(page.data.permSaving).toBe(false)
    expect(page.data.permError).toBe('consent_required')
  })

  it('授权面未加载时点击 → 只提示，不发写请求', async () => {
    const page = makePage()
    page.data.resumeId = '42'
    page.onVisibilityTap({ currentTarget: { dataset: { value: 'everyone' } } })

    expect(api.setPermission).not.toHaveBeenCalled()
    expect((global as any).wx.showToast).toHaveBeenCalled()
  })
})
