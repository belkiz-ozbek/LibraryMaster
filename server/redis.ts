import Redis from 'ioredis';

// Railway Redis URL ortam değişkeni genellikle REDIS_URL veya REDIS_TLS_URL olur
// Fallback olarak localhost kullanılır
const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl); 