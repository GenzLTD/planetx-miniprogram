import { decorateBlacklistItem, filterBlacklistRows, type BlacklistRow } from '../blacklist/display'

/**
 * 列表搜索：纯客户端过滤，命中展示名 / 契约键值 / 备注。
 * 空关键字 = 全量；大小写不敏感；关键字 trim。
 */
function row(partial: Partial<BlacklistRow>): BlacklistRow {
  return decorateBlacklistItem({
    id: 'x',
    match: 'exact_name',
    company_name: '',
    ...partial,
  } as any)
}

describe('filterBlacklistRows — blacklist 列表搜索', () => {
  const rows: BlacklistRow[] = [
    row({ id: 'b1', match: 'exact_name', company_name: '某某科技有限公司' }),
    row({ id: 'b2', match: 'credit_code', company_name: '', credit_code: '91440300MA5DXXXX1A' }),
    row({ id: 'b3', match: 'exact_name', company_name: '电梯研究院', note: '前司' }),
    row({ id: 'b4', match: 'enterprise_id', company_name: 'SkyLab', enterprise_id: 'ent_88' }),
  ]

  it('空关键字 / 纯空白 → 原样全量返回（不复制数组也行，但必须等价）', () => {
    expect(filterBlacklistRows(rows, '')).toEqual(rows)
    expect(filterBlacklistRows(rows, '   ')).toEqual(rows)
  })

  it('命中企业名（大小写不敏感）', () => {
    expect(filterBlacklistRows(rows, 'skylab').map((r) => r.id)).toEqual(['b4'])
    expect(filterBlacklistRows(rows, '某某科技').map((r) => r.id)).toEqual(['b1'])
  })

  it('命中信用代码原文（非掩码形态）', () => {
    expect(filterBlacklistRows(rows, '91440300MA5DXXXX1A').map((r) => r.id)).toEqual(['b2'])
  })

  it('命中备注', () => {
    expect(filterBlacklistRows(rows, '前司').map((r) => r.id)).toEqual(['b3'])
  })

  it('不命中 → 空数组', () => {
    expect(filterBlacklistRows(rows, '不存在')).toEqual([])
  })

  it('关键字首尾空白被 trim 再比对', () => {
    expect(filterBlacklistRows(rows, '  电梯  ').map((r) => r.id)).toEqual(['b3'])
  })
})
