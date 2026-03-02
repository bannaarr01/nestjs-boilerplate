export type RedisConnectionConfig = {
  host: string;
  port: number;
  db: number;
  username?: string;
  password?: string;
};

export function getRedisConnection(): RedisConnectionConfig {
   return {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      db: Number(process.env.REDIS_DB || 0),
      username: process.env.REDIS_USER || undefined,
      password: process.env.REDIS_PASS || undefined
   };
}
