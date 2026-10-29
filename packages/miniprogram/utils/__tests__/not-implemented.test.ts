import { isNotImplemented } from '@looma/shared-core'

/**
 * MiniApiClient 抛出的 ApiError 形态：status 在实例上，
 * error / __method / __path 附在 details 里（见 MiniApiClient.ts）。
 */
function miniErr(status: number, error: string, method: string, path: string) {
  return {
    name: 'ApiError',
    status,
    details: { error, message: `HTTP ${status}`, __method: method, __path: path },
  }
}

describe('isNotImplemented — resume.v1.json#not_implemented_convention', () => {
  let warn: jest.SpyInstance

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('501 + not_implemented → 真（唯一判定口径）', () => {
    expect(isNotImplemented(miniErr(501, 'not_implemented', 'GET', '/v1/resume/r1'))).toBe(true)
    expect(isNotImplemented(miniErr(501, 'not_implemented', 'GET', '/v1/resume/templates'))).toBe(true)
    expect(warn).not.toHaveBeenCalled()
  })

  it('501 但 error 不是 not_implemented → 假', () => {
    expect(isNotImplemented(miniErr(501, 'server_error', 'GET', '/v1/resume/r1'))).toBe(false)
  })

  /**
   * 阶段3 收口后 transition_405.whitelist 已清空并标 closed_at：
   * 405 一律按真实错误处理，客户端不得再降级 —— 否则真 bug 会被静默吞掉，
   * 且再没有到期日把它删掉。
   */
  it('405 一律为假：即便命中过白名单的 8 个旧 stub 端点', () => {
    const formerWhitelist: Array<[string, string]> = [
      ['GET', '/v1/resume/r1'],
      ['PUT', '/v1/resume/r1'],
      ['GET', '/v1/resume/r1/permission'],
      ['PUT', '/v1/resume/r1/permission'],
      ['GET', '/v1/resume/blacklist'],
      ['POST', '/v1/resume/blacklist'],
      ['DELETE', '/v1/resume/blacklist/b1'],
      ['GET', '/v1/resume/templates'],
    ]
    for (const [method, path] of formerWhitelist) {
      expect(isNotImplemented(miniErr(405, 'method_not_allowed', method, path))).toBe(false)
    }
    expect(warn).not.toHaveBeenCalled()
  })

  it('405 对已实现端点（/list、/analysis）→ 假，真 bug 不许被吞', () => {
    expect(isNotImplemented(miniErr(405, 'method_not_allowed', 'PUT', '/v1/resume/list'))).toBe(false)
    expect(isNotImplemented(miniErr(405, 'method_not_allowed', 'GET', '/v1/resume/analysis'))).toBe(false)
  })

  it('405 不再依赖 method/path 上下文，也不再打 warn', () => {
    expect(isNotImplemented({ status: 405, details: { error: 'method_not_allowed' } })).toBe(false)
    expect(
      isNotImplemented(miniErr(405, 'method_not_allowed', 'GET', '/v1/resume/templates?x=1'))
    ).toBe(false)
    expect(warn).not.toHaveBeenCalled()
  })

  it('404 not_found 不能当未实现（契约明令禁止用 404 表示未上线）', () => {
    expect(isNotImplemented(miniErr(404, 'not_found', 'GET', '/v1/resume/r1'))).toBe(false)
  })

  it('web 面 ApiError（body 包裹）同样吃 501', () => {
    expect(isNotImplemented({ status: 501, body: { error: 'not_implemented' } })).toBe(true)
    expect(isNotImplemented({ status: 501, body: { error: 'conversion_failed' } })).toBe(false)
  })

  it('非对象错误 → 假', () => {
    expect(isNotImplemented(null)).toBe(false)
    expect(isNotImplemented('boom')).toBe(false)
    expect(isNotImplemented(undefined)).toBe(false)
  })
})
