import Redis from "ioredis";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { normalizeIranMobile } from "@/lib/phone";
import { OTP_MAX_ATTEMPTS, issueOtp, verifyOtp } from "./otp";

// Uses the local Redis from docker-compose, on a separate DB index.
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379/15");
const phone = "09120000000";

beforeEach(() => redis.flushdb());
afterAll(() => redis.quit());

describe("normalizeIranMobile", () => {
  it.each([
    ["09121234567", "09121234567"],
    ["+989121234567", "09121234567"],
    ["۰۹۱۲ ۱۲۳ ۴۵۶۷", "09121234567"],
    ["9121234567", "09121234567"],
    ["0212345678", null],
    ["0912123456", null],
  ])("%s -> %s", (input, expected) => expect(normalizeIranMobile(input)).toBe(expected));
});

describe("otp", () => {
  it("accepts the right code once", async () => {
    const r = await issueOtp(redis, phone);
    if (!r.ok) throw new Error("expected code");
    expect(await verifyOtp(redis, phone, r.code)).toBe("ok");
    expect(await verifyOtp(redis, phone, r.code)).toBe("expired");
  });

  it("enforces resend cooldown", async () => {
    await issueOtp(redis, phone);
    const second = await issueOtp(redis, phone);
    expect(second.ok).toBe(false);
  });

  it("burns the code after too many wrong attempts", async () => {
    const r = await issueOtp(redis, phone);
    if (!r.ok) throw new Error("expected code");
    const wrong = r.code === "00000" ? "11111" : "00000";
    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) expect(await verifyOtp(redis, phone, wrong)).toBe("invalid");
    expect(await verifyOtp(redis, phone, r.code)).toBe("too_many_attempts");
    expect(await verifyOtp(redis, phone, r.code)).toBe("expired");
  });
});
