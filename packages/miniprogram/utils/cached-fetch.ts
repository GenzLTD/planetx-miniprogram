/**
 * createCachedFetcher — 通用异步缓存 fetcher 工厂。
 *
 * 从 zervi.test/miniprogram-4 的 DictModel 模块级缓存模式提炼：
 * 保留了"同一份数据只拉一次"的核心价值，修掉它的三个缺陷：
 * 1. 缓存永不失效            → 这里支持 TTL（默认 5 分钟）
 * 2. 缓存按"唯一列表"设计    → 这里按 key 分桶，多字典类型互不污染
 * 3. 并发请求重复拉取        → 这里做 in-flight 去重
 *
 * 用法（阶段2 简历模块的字典/模板列表将直接使用）:
 *   const dictFetcher = createCachedFetcher(
 *     (dictTypeId: number) => apiClient.get('/v1/dict/data', { dictTypeId })
 *   )
 *   await dictFetcher.get(3)      // 拉取并缓存
 *   await dictFetcher.get(3)      // 命中缓存
 *   dictFetcher.invalidate(3)     // 手动失效
 */

export interface CachedFetcherOptions {
  /** 缓存存活时间（毫秒），默认 5 分钟；0 表示永不过期 */
  ttl?: number
}

interface CacheEntry<T> {
  value: T
  fetchedAt: number
}

const DEFAULT_TTL_MS = 5 * 60 * 1000

export interface CachedFetcher<TKey, TValue> {
  /** 取数据：命中未过期缓存直接返回，否则调用 loader（并发去重） */
  get(key: TKey): Promise<TValue>
  /** 失效：不传 key 清空全部 */
  invalidate(key?: TKey): void
  /** 同步查看缓存值（含过期判断），仅供调试 */
  peek(key: TKey): TValue | undefined
}

export function createCachedFetcher<TKey, TValue>(
  loader: (key: TKey) => Promise<TValue>,
  options: CachedFetcherOptions = {}
): CachedFetcher<TKey, TValue> {
  const ttl = options.ttl === undefined ? DEFAULT_TTL_MS : options.ttl
  const cache = new Map<TKey, CacheEntry<TValue>>()
  const inflight = new Map<TKey, Promise<TValue>>()

  function isFresh(entry: CacheEntry<TValue>): boolean {
    if (ttl === 0) return true
    return Date.now() - entry.fetchedAt < ttl
  }

  function get(key: TKey): Promise<TValue> {
    const entry = cache.get(key)
    if (entry && isFresh(entry)) {
      return Promise.resolve(entry.value)
    }

    const pending = inflight.get(key)
    if (pending) return pending

    const promise = loader(key)
      .then((value) => {
        cache.set(key, { value, fetchedAt: Date.now() })
        inflight.delete(key)
        return value
      })
      .catch((err) => {
        inflight.delete(key)
        throw err
      })
    inflight.set(key, promise)
    return promise
  }

  function invalidate(key?: TKey): void {
    if (key === undefined) {
      cache.clear()
    } else {
      cache.delete(key)
    }
  }

  function peek(key: TKey): TValue | undefined {
    const entry = cache.get(key)
    return entry && isFresh(entry) ? entry.value : undefined
  }

  return { get, invalidate, peek }
}
