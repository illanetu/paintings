/**
 * Утилита для кэширования результатов генерации
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

const CACHE_DURATION = 60 * 60 * 1000 // 1 час в миллисекундах
const MAX_CACHE_SIZE = 50 // Максимальное количество записей в кэше

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()

  /**
   * Генерирует ключ кэша на основе параметров
   */
  private generateKey(prefix: string, params: any): string {
    const paramsString = JSON.stringify(params)
    return `${prefix}:${paramsString}`
  }

  /**
   * Получает данные из кэша
   */
  get<T>(prefix: string, params: any): T | null {
    const key = this.generateKey(prefix, params)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Проверяем, не истек ли кэш
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Сохраняет данные в кэш
   */
  set<T>(prefix: string, params: any, data: T): void {
    // Очищаем старые записи, если кэш переполнен
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.cleanup()
    }

    const key = this.generateKey(prefix, params)
    const now = Date.now()

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
    })
  }

  /**
   * Очищает истекшие записи из кэша
   */
  private cleanup(): void {
    const now = Date.now()
    const entriesToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        entriesToDelete.push(key)
      }
    })

    entriesToDelete.forEach((key) => this.cache.delete(key))

    // Если все еще переполнен, удаляем самые старые записи
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )

      const toRemove = sortedEntries.slice(0, this.cache.size - MAX_CACHE_SIZE + 1)
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  /**
   * Очищает весь кэш
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Удаляет конкретную запись из кэша
   */
  delete(prefix: string, params: any): void {
    const key = this.generateKey(prefix, params)
    this.cache.delete(key)
  }
}

// Экспортируем singleton
export const cacheManager = new CacheManager()
