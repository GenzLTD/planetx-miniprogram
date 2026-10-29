import { createCachedFetcher } from '../cached-fetch'

describe('createCachedFetcher', () => {
  it('相同 key 只调用一次 loader（命中缓存）', async () => {
    const loader = jest.fn().mockResolvedValue('value-a')
    const fetcher = createCachedFetcher(loader)

    await expect(fetcher.get('a')).resolves.toBe('value-a')
    await expect(fetcher.get('a')).resolves.toBe('value-a')
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('不同 key 各自缓存，互不污染', async () => {
    const loader = jest.fn((k: string) => Promise.resolve(`value-${k}`))
    const fetcher = createCachedFetcher(loader)

    await expect(fetcher.get('a')).resolves.toBe('value-a')
    await expect(fetcher.get('b')).resolves.toBe('value-b')
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('TTL 过期后重新拉取', async () => {
    const loader = jest.fn().mockResolvedValue('v')
    const fetcher = createCachedFetcher(loader, { ttl: 10 })

    await fetcher.get('k')
    await fetcher.get('k')
    expect(loader).toHaveBeenCalledTimes(1)

    await new Promise((r) => setTimeout(r, 15))
    await fetcher.get('k')
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('ttl=0 表示永不过期', async () => {
    const loader = jest.fn().mockResolvedValue('v')
    const fetcher = createCachedFetcher(loader, { ttl: 0 })

    await fetcher.get('k')
    await fetcher.get('k')
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('并发请求去重：同一时刻只打一次 loader', async () => {
    const loader = jest.fn(
      () => new Promise<string>((r) => setTimeout(() => r('slow'), 20))
    )
    const fetcher = createCachedFetcher(loader)

    const [x, y] = await Promise.all([fetcher.get('k'), fetcher.get('k')])
    expect(x).toBe('slow')
    expect(y).toBe('slow')
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('loader 失败不写缓存，下次重试', async () => {
    const loader = jest
      .fn<Promise<string>, [string]>()
      .mockRejectedValueOnce(new Error('net down'))
      .mockResolvedValueOnce('recovered')
    const fetcher = createCachedFetcher(loader)

    await expect(fetcher.get('k')).rejects.toThrow('net down')
    await expect(fetcher.get('k')).resolves.toBe('recovered')
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('invalidate 清除指定 key，未传则清空全部', async () => {
    const loader = jest.fn((k: string) => Promise.resolve(k.toUpperCase()))
    const fetcher = createCachedFetcher(loader)

    await fetcher.get('a')
    await fetcher.get('b')
    fetcher.invalidate('a')
    await fetcher.get('a')
    expect(loader).toHaveBeenCalledTimes(3) // a, b, a(retry)

    fetcher.invalidate()
    await fetcher.get('b')
    expect(loader).toHaveBeenCalledTimes(4)
  })

  it('peek 只看缓存不触发 loader', () => {
    const loader = jest.fn()
    const fetcher = createCachedFetcher(loader)
    expect(fetcher.peek('k')).toBeUndefined()
    expect(loader).not.toHaveBeenCalled()
  })
})
