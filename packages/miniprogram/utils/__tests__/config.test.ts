/**
 * config 守卫 —— 唯一对外源纪律的自动化钉子。
 *
 * API_ORIGIN 空串 = 「请求会失败，不落 ServBay/腾讯云/另一本账」的铁律。
 * USE_LOCAL_GATEWAY = true 只允许存在于开发者本机未提交的工作区。
 *
 * 拦截分工（实测，非推测）：
 * · 第一条 `API_ORIGIN === ''` 是**唯一**拦开关的断言 —— 置 true 时它必红；
 * · 第二条只校验 API_BASE/SAAS_BASE 与 API_ORIGIN 同源（派生量），
 *   置 true 时它仍绿 —— 它防的是「三个导出各自漂移」，不防开关本身。
 * 故「带着 true 提交」这条纪律，全靠第一条断言（CI 门禁同此口径）。
 * 改动断言前先确认：谁在真正拦开关。
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
