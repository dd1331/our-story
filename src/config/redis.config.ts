import { CacheModuleOptions } from '@nestjs/cache-manager';

export const redisConfig: CacheModuleOptions = {
  isGlobal: true,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  ttl: 60 * 60 * 24, // 24시간
  // Redis 캐시매니저 설정
  store: 'redis',
  // Redis 연결 옵션
  options: {
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },
};
