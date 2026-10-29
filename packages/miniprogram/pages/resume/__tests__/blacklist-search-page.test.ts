/**
 * blacklist 页接线 —— 搜索过滤 + 非 exact_name 形态选填展示名映射 body.company_name。
 */

jest.mock('../../../utils/api', () => ({
  resumeApi: {
    blacklist: jest.fn(),
    blacklistAdd: jest.fn(),
    blacklistRemove: jest.fn(),
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
  require('../blacklist/index')
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
  blacklist: jest.Mock
  blacklistAdd: jest.Mock
  blacklistRemove: jest.Mock
}

const LIST = {
  items: [
    { id: 'b1', match: 'exact_name', company_name: '某某科技有限公司' },
    { id: 'b2', match: 'credit_code', company_name: '', credit_code: '91440300MA5DXXXX1A' },
  ],
  total: 2,
}

describe('blacklist 页 —— 列表搜索接线', () => {
  beforeEach(() => {
    api.blacklist.mockReset().mockResolvedValue(LIST)
  })

  it('加载后 applyFilter：keyword 空 → filteredItems = items', async () => {
    const ctx = makePage()
    await ctx.loadBlacklist()
    expect(ctx.data.filteredItems).toHaveLength(2)
    expect(ctx.data.keyword).toBe('')
  })

  it('onSearchInput 过滤 filteredItems，不改动 items / total', async () => {
    const ctx = makePage()
    await ctx.loadBlacklist()
    ctx.onSearchInput({ detail: { value: '某某' } })
    expect(ctx.data.keyword).toBe('某某')
    expect(ctx.data.filteredItems.map((r: any) => r.id)).toEqual(['b1'])
    expect(ctx.data.items).toHaveLength(2)
    expect(ctx.data.total).toBe(2)
  })

  it('clearSearch 清关键字并恢复全量', async () => {
    const ctx = makePage()
    await ctx.loadBlacklist()
    ctx.onSearchInput({ detail: { value: 'skylab' } })
    expect(ctx.data.filteredItems).toHaveLength(0)
    ctx.clearSearch()
    expect(ctx.data.keyword).toBe('')
    expect(ctx.data.filteredItems).toHaveLength(2)
  })

  it('移除后重拉列表，搜索关键字保留且过滤仍生效', async () => {
    api.blacklist.mockReset()
    api.blacklist
      .mockResolvedValueOnce(LIST)
      .mockResolvedValueOnce({ items: LIST.items.filter((i: any) => i.id !== 'b1'), total: 1 })
    api.blacklistRemove.mockResolvedValueOnce({})
    const ctx = makePage()
    await ctx.loadBlacklist()
    ctx.onSearchInput({ detail: { value: '某某' } })
    await ctx.removeItem({ currentTarget: { dataset: { id: 'b1' } } })
    expect(api.blacklist).toHaveBeenCalledTimes(2)
    expect(ctx.data.keyword).toBe('某某')
    expect(ctx.data.filteredItems).toHaveLength(0)
    expect(ctx.data.total).toBe(1)
  })
})

describe('blacklist 页 —— 非 exact_name 形态选填展示名 → body.company_name', () => {
  beforeEach(() => {
    api.blacklist.mockReset().mockResolvedValue(LIST)
    api.blacklistAdd.mockReset().mockResolvedValue({})
  })

  it('credit_code + display_name → body 带 company_name（服务端三形态都落库）', async () => {
    const ctx = makePage()
    ctx.setData({ matchIndex: 1, form: { ...ctx.data.form, credit_code: '91440300MA5DXXXX1A', display_name: '某某科技有限公司' } })
    await ctx.submitAdd()
    expect(api.blacklistAdd).toHaveBeenCalledWith(
      expect.objectContaining({ match: 'credit_code', credit_code: '91440300MA5DXXXX1A', company_name: '某某科技有限公司' })
    )
  })

  it('credit_code 留空 display_name → body 不带 company_name（服务端 best-effort 兜底）', async () => {
    const ctx = makePage()
    ctx.setData({ matchIndex: 1, form: { ...ctx.data.form, credit_code: '91440300MA5DXXXX1A', display_name: '   ' } })
    await ctx.submitAdd()
    const body = api.blacklistAdd.mock.calls[0][0]
    expect(body).not.toHaveProperty('company_name')
  })

  it('exact_name 形态不受 display_name 干扰：主键即 company_name', async () => {
    const ctx = makePage()
    ctx.setData({ matchIndex: 0, form: { ...ctx.data.form, company_name: '某某科技有限公司', display_name: '别的东西' } })
    await ctx.submitAdd()
    const body = api.blacklistAdd.mock.calls[0][0]
    expect(body).toEqual(expect.objectContaining({ match: 'exact_name', company_name: '某某科技有限公司' }))
  })

  it('提交成功后表单重置含 display_name', async () => {
    const ctx = makePage()
    ctx.setData({ matchIndex: 1, form: { ...ctx.data.form, credit_code: 'X', display_name: '某公司' } })
    await ctx.submitAdd()
    expect(ctx.data.form.display_name).toBe('')
    expect(ctx.data.showAdd).toBe(false)
  })
})
