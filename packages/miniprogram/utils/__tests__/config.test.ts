/**
 * config 守卫 —— 唯一对外源纪律的自动化钉子。
 *
 * API_ORIGIN 空串 = 「请求会失败，不落 ServBay/腾讯云/另一本账」的铁律。
 * USE_LOCAL_GATEWAY = true 只允许存在于开发者本机未提交的工作区；
 * 一旦被带着提交，这两条断言就红，逼着提交前改回。
 */
import { API_BASE, API_ORIGIN, SAAS_BASE } from '../config'

describe('唯一对外源守卫（local-dual-origin）', () => {
  it('API_ORIGIN 必须是空串（本地联调开关不得带着提交）', () => {
    expect(API_ORIGIN).toBe('')
  })
  it('API_BASE / SAAS_BASE 与 API_ORIGIN 同源', () => {
    expect(API_BASE).toBe(API_ORIGIN)
    expect(SAAS_BASE).toBe(API_ORIGIN)
  })
})
