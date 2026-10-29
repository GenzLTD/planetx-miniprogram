import { decorateBlacklistItem, maskKey } from '../blacklist/display'

/**
 * 展示兜底：非 exact_name 形态页面只传匹配键，服务端 company_name 落空串，
 * 标题必须仍有可读内容（阶段3 收口后客户端账本第 3 项）。
 */
describe('decorateBlacklistItem — blacklist 卡片展示兜底', () => {
  it('exact_name：名称即标题，无副标题', () => {
    const row = decorateBlacklistItem({
      id: 'b1',
      match: 'exact_name',
      company_name: '某某科技有限公司',
    })
    expect(row.displayName).toBe('某某科技有限公司')
    expect(row.matchLabel).toBe('企业名称')
    expect(row.keyHint).toBe('')
  })

  it('credit_code 且 company_name 为空串 → 标题回落为「信用代码 · 掩码」', () => {
    const row = decorateBlacklistItem({
      id: 'b2',
      match: 'credit_code',
      company_name: '',
      credit_code: '91440300MA5DXXXX1A',
    })
    expect(row.displayName).toBe('信用代码 · 914403…XX1A')
    expect(row.keyHint).toBe('')
  })

  it('enterprise_id 且服务端已补名 → 名称作标题，ID 降为副标题', () => {
    const row = decorateBlacklistItem({
      id: 'b3',
      match: 'enterprise_id',
      company_name: '某某科技有限公司',
      enterprise_id: 'ent_1',
    })
    expect(row.displayName).toBe('某某科技有限公司')
    expect(row.keyHint).toBe('企业 ID · ent_1')
  })

  it('名称与键值都缺 → 不渲染空白，落到「未命名屏蔽项」', () => {
    const row = decorateBlacklistItem({ id: 'b4', match: 'credit_code', company_name: '   ' })
    expect(row.displayName).toBe('未命名屏蔽项')
    expect(row.keyHint).toBe('')
  })

  it('名称首尾空格被 trim，不显示幽灵空白', () => {
    const row = decorateBlacklistItem({
      id: 'b5',
      match: 'exact_name',
      company_name: '  某某科技有限公司  ',
    })
    expect(row.displayName).toBe('某某科技有限公司')
  })

  it('maskKey：≤14 位原样，超长留头 6 尾 4', () => {
    expect(maskKey('ent_1')).toBe('ent_1')
    expect(maskKey('91440300MA5DXXXX1A')).toBe('914403…XX1A')
    expect(maskKey('')).toBe('')
  })
})
