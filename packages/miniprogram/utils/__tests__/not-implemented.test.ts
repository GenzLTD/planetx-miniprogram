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

  it('501 + not_implemented → 真（主判定，不打 warn）', () => {
    expect(isNotImplemented(miniErr(501, 'not_implemented', 'GET', '/v1/resume/r1'))).toBe(true)
    expect(warn).not.toHaveBeenCalled()
  })

  it('501 但 error 不是 not_implemented → 假', () => {
    expect(isNotImplemented(miniErr(501, 'server_error', 'GET', '/v1/resume/r1'))).toBe(false)
  })

  it('405 命中 stub 白名单的 8 个端点 → 降级为真，且每个都打 warn', () => {
    const cases: Array<[string, string]> = [
      ['GET', '/v1/resume/r1'],
      ['PUT', '/v1/resume/r1'],
      ['GET', '/v1/resume/r1/permission'],
      ['PUT', '/v1/resume/r1/permission'],
      ['GET', '/v1/resume/blacklist'],
      ['POST', '/v1/resume/blacklist'],
      ['DELETE', '/v1/resume/blacklist/b1'],
      ['GET', '/v1/resume/templates'],
    ]
    for (const [method, path] of cases) {
      expect(isNotImplemented(miniErr(405, 'method_not_allowed', method, path))).toBe(true)
    }
    expect(warn).toHaveBeenCalledTimes(cases.length)
  })

  it('405 但命中的是已实现端点（/list、/analysis）→ 假，不许吞掉真 bug', () => {
    expect(isNotImplemented(miniErr(405, 'method_not_allowed', 'GET', '/v1/resume/list'))).toBe(false)
    expect(isNotImplemented(miniErr(405, 'method_not_allowed', 'GET', '/v1/resume/analysis'))).toBe(false)
    expect(warn).not.toHaveBeenCalled()
  })

  it('PUT 面不排除静态段：PUT /v1/resume/list 确实未实现 → 降级为真', () => {
    expect(isNotImplemented(miniErr(405, 'method_not_allowed', 'PUT', '/v1/resume/list'))).toBe(true)
  })

  it('405 拿不到 method/path 上下文 → 假（不猜）', () => {
    expect(isNotImplemented({ status: 405, details: { error: 'method_not_allowed' } })).toBe(false)
    expect(warn).not.toHaveBeenCalled()
  })

  it('显式传 req 可补上下文（web 面 ApiClient 不附 __method/__path）', () => {
    const webErr = { status: 405, body: { error: 'method_not_allowed' } }
    expect(isNotImplemented(webErr, { method: 'GET', path: '/v1/resume/templates' })).toBe(true)
    expect(isNotImplemented(webErr, { method: 'GET', path: '/v1/resume/list' })).toBe(false)
  })

  it('path 带 query string 仍能命中白名单', () => {
    expect(isNotImplemented(miniErr(405, 'method_not_allowed', 'GET', '/v1/resume/r1?t=1'))).toBe(true)
  })

  it('404 not_found 不能当未实现（契约明令禁止用 404 表示未上线）', () => {
    expect(isNotImplemented(miniErr(404, 'not_found', 'GET', '/v1/resume/r1'))).toBe(false)
  })

  it('非对象错误 → 假', () => {
    expect(isNotImplemented(null)).toBe(false)
    expect(isNotImplemented('boom')).toBe(false)
    expect(isNotImplemented(undefined)).toBe(false)
  })
})
