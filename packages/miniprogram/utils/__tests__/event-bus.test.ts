import { eventBus } from '../event-bus'

describe('eventBus', () => {
  afterEach(() => {
    // 清空所有订阅，避免用例间串扰
    (eventBus as any).handlers = {}
  })

  it('应该按订阅顺序分发事件', () => {
    const received: number[] = []
    eventBus.on('test:emit', (n: number) => received.push(n))
    eventBus.emit('test:emit', 1)
    eventBus.emit('test:emit', 2)
    expect(received).toEqual([1, 2])
  })

  it('off 应该移除指定 handler', () => {
    const handler = jest.fn()
    eventBus.on('test:off', handler)
    eventBus.off('test:off', handler)
    eventBus.emit('test:off')
    expect(handler).not.toHaveBeenCalled()
  })

  it('handler 抛错不应影响其他 handler', () => {
    const good = jest.fn()
    eventBus.on('test:error', () => {
      throw new Error('boom')
    })
    eventBus.on('test:error', good)
    expect(() => eventBus.emit('test:error')).not.toThrow()
    expect(good).toHaveBeenCalled()
  })

  it('emit 未订阅事件应该安全无操作', () => {
    expect(() => eventBus.emit('nobody:cares')).not.toThrow()
  })
})
