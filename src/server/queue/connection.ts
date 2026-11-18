import "server-only";
import Redis from "ioredis";

// BullMQ needs its own connection with maxRetriesPerRequest: null (blocking commands).
export const createQueueConnection = () => new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
