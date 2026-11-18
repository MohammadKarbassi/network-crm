import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import type Redis from "ioredis";

export const OTP_TTL_SECONDS = 120;
export const OTP_RESEND_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 5;

const keys = {
  code: (phone: string) => `otp:code:${phone}`,
  tries: (phone: string) => `otp:tries:${phone}`,
  cooldown: (phone: string) => `otp:cooldown:${phone}`,
};

// Only a hash is stored, so a Redis dump does not leak live codes.
const hash = (phone: string, code: string) => createHash("sha256").update(`${phone}:${code}`).digest();

export type IssueResult = { ok: true; code: string } | { ok: false; retryAfter: number };

/** Creates a new code unless one was issued less than OTP_RESEND_SECONDS ago. */
export async function issueOtp(redis: Redis, phone: string): Promise<IssueResult> {
  const free = await redis.set(keys.cooldown(phone), "1", "EX", OTP_RESEND_SECONDS, "NX");
  if (!free) return { ok: false, retryAfter: Math.max(await redis.ttl(keys.cooldown(phone)), 1) };

  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
  await redis
    .multi()
    .set(keys.code(phone), hash(phone, code).toString("hex"), "EX", OTP_TTL_SECONDS)
    .del(keys.tries(phone))
    .exec();
  return { ok: true, code };
}

export type VerifyResult = "ok" | "invalid" | "expired" | "too_many_attempts";

/** Checks a code; it is single-use and burns after OTP_MAX_ATTEMPTS wrong tries. */
export async function verifyOtp(redis: Redis, phone: string, code: string): Promise<VerifyResult> {
  const stored = await redis.get(keys.code(phone));
  if (!stored) return "expired";

  const tries = await redis.incr(keys.tries(phone));
  await redis.expire(keys.tries(phone), OTP_TTL_SECONDS);
  if (tries > OTP_MAX_ATTEMPTS) {
    await redis.del(keys.code(phone));
    return "too_many_attempts";
  }

  const ok = timingSafeEqual(Buffer.from(stored, "hex"), hash(phone, code));
  if (!ok) return "invalid";

  await redis.del(keys.code(phone), keys.tries(phone));
  return "ok";
}
