/**
 * Тесты для системы кэширования
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly CACHE_DURATION = 60 * 60 * 1000 // 1 час
  private readonly MAX_CACHE_SIZE = 50

  private generateKey(prefix: string, params: any): string {
    const paramsString = JSON.stringify(params)
    return `${prefix}:${paramsString}`
  }

  get<T>(prefix: string, params: any): T | null {
    const key = this.generateKey(prefix, params)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(prefix: string, params: any, data: T): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup()
    }

    const key = this.generateKey(prefix, params)
    const now = Date.now()

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    })
  }

  private cleanup(): void {
    const now = Date.now()
    const entriesToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        entriesToDelete.push(key)
      }
    })

    entriesToDelete.forEach((key) => this.cache.delete(key))

    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )

      const toRemove = sortedEntries.slice(0, this.cache.size - this.MAX_CACHE_SIZE + 1)
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

describe('Система кэширования', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager()
  })

  test('должен сохранять и получать данные', () => {
    const testData = { name: 'test', value: 123 }
    cache.set('test', { id: 1 }, testData)

    const result = cache.get('test', { id: 1 })
    expect(result).toEqual(testData)
  })

  test('должен возвращать null для несуществующих ключей', () => {
    const result = cache.get('test', { id: 999 })
    expect(result).toBeNull()
  })

  test('должен генерировать уникальные ключи для разных параметров', () => {
    cache.set('test', { id: 1 }, 'value1')
    cache.set('test', { id: 2 }, 'value2')

    expect(cache.get('test', { id: 1 })).toBe('value1')
    expect(cache.get('test', { id: 2 })).toBe('value2')
  })

  test('должен очищать весь кэш', () => {
    cache.set('test', { id: 1 }, 'value1')
    cache.set('test', { id: 2 }, 'value2')

    cache.clear()

    expect(cache.get('test', { id: 1 })).toBeNull()
    expect(cache.get('test', { id: 2 })).toBeNull()
  })

  test('должен удалять истекшие записи', () => {
    // Создаем запись с истекшим временем
    const key = cache['generateKey']('test', { id: 1 })
    const expiredEntry: CacheEntry<string> = {
      data: 'expired',
      timestamp: Date.now() - 100000,
      expiresAt: Date.now() - 1000, // Истекла 1 секунду назад
    }
    cache['cache'].set(key, expiredEntry)

    const result = cache.get('test', { id: 1 })
    expect(result).toBeNull()
  })
})
