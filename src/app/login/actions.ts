"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { normalizeIranMobile, toEnglishDigits } from "@/lib/phone";
import { issueOtp, verifyOtp } from "@/server/auth/otp";
import { createSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { enqueueOtp } from "@/server/queue/messages";
import { redis } from "@/server/redis";

export type RequestOtpState = { ok: true; phone: string; resendIn: number } | { ok: false; error: string };

export async function requestOtpAction(rawPhone: string): Promise<RequestOtpState> {
  const phone = normalizeIranMobile(rawPhone);
  if (!phone) return { ok: false, error: "شماره موبایل معتبر نیست." };

  if (!process.env.KAVENEGAR_API_KEY || !process.env.KAVENEGAR_OTP_TEMPLATE) {
    return { ok: false, error: "سرویس پیامک پیکربندی نشده است." };
  }

  // Users are created by an admin; there is no self sign-up in an internal CRM.
  const user = await db.user.findUnique({ where: { phone }, select: { isActive: true } });
  if (!user?.isActive) return { ok: false, error: "این شماره در سیستم ثبت نشده یا غیرفعال است. با مدیر سیستم تماس بگیرید." };

  const issued = await issueOtp(redis, phone);
  if (!issued.ok) return { ok: true, phone, resendIn: issued.retryAfter };

  await enqueueOtp(phone, issued.code);
  return { ok: true, phone, resendIn: 60 };
}

const verifySchema = z.object({ phone: z.string(), code: z.string().regex(/^\d{5}$/) });

export async function verifyOtpAction(input: { phone: string; code: string }): Promise<{ error: string }> {
  const parsed = verifySchema.safeParse({ phone: normalizeIranMobile(input.phone) ?? "", code: toEnglishDigits(input.code) });
  if (!parsed.success) return { error: "کد باید ۵ رقم باشد." };
  const { phone, code } = parsed.data;

  const result = await verifyOtp(redis, phone, code);
  if (result === "invalid") return { error: "کد واردشده اشتباه است." };
  if (result === "expired") return { error: "کد منقضی شده است. دوباره درخواست کنید." };
  if (result === "too_many_attempts") return { error: "تعداد تلاش‌ها زیاد بود. کد جدید بگیرید." };

  const user = await db.user.findUnique({ where: { phone } });
  if (!user?.isActive) return { error: "حساب کاربری غیرفعال است." };

  await createSession(user.id);
  redirect("/");
}
