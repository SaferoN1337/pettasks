const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 часа в миллисекундах

interface CacheEntry<T> {
  data: T
  timestamp: number
}

export const cacheService = {
  /**
   * Сохранить данные в кэш
   */
  set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    }
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry))
    } catch (e) {
      console.warn('Не удалось записать в кэш:', e)
    }
  },

  /**
   * Получить данные из кэша (null если устарели или отсутствуют)
   */
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(`cache:${key}`)
      if (!raw) return null

      const entry: CacheEntry<T> = JSON.parse(raw)
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        localStorage.removeItem(`cache:${key}`)
        return null
      }
      return entry.data
    } catch {
      return null
    }
  },

  /**
   * Удалить запись из кэша
   */
  remove(key: string): void {
    localStorage.removeItem(`cache:${key}`)
  },
}
