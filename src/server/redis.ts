import "server-only";
import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    // Connect on the first command, not at import: importing during `next build` must not dial Redis.
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
