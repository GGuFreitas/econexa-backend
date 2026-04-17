/**
 * Cache utilities - Suporta memória local (futuro Redis)
 */
import { createClient, RedisClientType } from 'redis'

// Configurações do Redis (futuro)
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Cliente Redis
let redisClient: RedisClientType | null = null

// Cache em memória (fallback quando Redis não disponível)
const memoryCache = new Map<string, { value: unknown; expiry: number }>()

interface CacheOptions {
  ttl?: number // Time to live em segundos
}

// Inicializar Redis (futuro)
export const initRedis = async (): Promise<boolean> => {
  try {
    redisClient = createClient({ url: REDIS_URL })
    await redisClient.connect()
    console.log('✅ Redis conectado')
    return true
  } catch {
    console.log('⚠️ Redis não disponível, usando cache em memória')
    return false
  }
}

// Verificar se Redis está Connected
const isRedisConnected = (): boolean => {
  return redisClient?.isOpen ?? false
}

// Obter valor do cache
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (isRedisConnected() && redisClient) {
    const value = await redisClient.get(key)
    return value ? JSON.parse(value) : null
  }

  // Fallback memória
  const item = memoryCache.get(key)
  if (!item) return null

  if (Date.now() > item.expiry) {
    memoryCache.delete(key)
    return null
  }

  return item.value as T
}

// Definir valor no cache
export const cacheSet = async <T>(
  key: string,
  value: T,
  options: CacheOptions = {},
): Promise<void> => {
  const { ttl = 300 } = options // Default 5 minutos

  if (isRedisConnected() && redisClient) {
    await redisClient.setEx(key, ttl, JSON.stringify(value))
    return
  }

  // Fallback memória
  memoryCache.set(key, {
    value,
    expiry: Date.now() + ttl * 1000,
  })
}

// Deletar do cache
export const cacheDel = async (key: string): Promise<void> => {
  if (isRedisConnected() && redisClient) {
    await redisClient.del(key)
    return
  }

  memoryCache.delete(key)
}

// Limpar cache (pattern)
export const cacheDelPattern = async (pattern: string): Promise<void> => {
  if (isRedisConnected() && redisClient) {
    const keys = await redisClient.keys(pattern)
    if (keys.length > 0) {
      await redisClient.del(keys)
    }
    return
  }

  // Fallback memória
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      memoryCache.delete(key)
    }
  }
}

// Fechar conexão Redis
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}

export default {
  get: cacheGet,
  set: cacheSet,
  del: cacheDel,
  delPattern: cacheDelPattern,
}