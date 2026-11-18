"use client";

import { useEffect, useState, useTransition } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { requestOtpAction, verifyOtpAction } from "./actions";

export function LoginForm() {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const requestCode = () =>
    startTransition(async () => {
      const res = await requestOtpAction(phone);
      if (!res.ok) return void toast.error(res.error);
      setPhone(res.phone);
      setResendIn(res.resendIn);
      setStep("code");
      setCode("");
    });

  const verify = (value: string) =>
    startTransition(async () => {
      const res = await verifyOtpAction({ phone, code: value });
      // On success the action redirects; we only get here on error.
      if (res?.error) {
        toast.error(res.error);
        setCode("");
      }
    });

  if (step === "phone") {
    return (
      <form className="flex flex-col gap-4" onSubmit={(e) => (e.preventDefault(), requestCode())}>
        <Field>
          <FieldLabel htmlFor="phone">شماره موبایل</FieldLabel>
          <Input
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="09xxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
            required
          />
        </Field>
        <Button type="submit" disabled={pending || !phone}>
          {pending && <Loader2 className="animate-spin" />}
          دریافت کد ورود
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="otp">کد ورود</FieldLabel>
        <FieldDescription>
          کد ۵ رقمی به <span dir="ltr">{phone}</span> پیامک شد.
        </FieldDescription>
        <div dir="ltr" className="flex justify-center">
          <InputOTP
            id="otp"
            maxLength={5}
            pattern={REGEXP_ONLY_DIGITS}
            value={code}
            onChange={setCode}
            onComplete={verify}
            disabled={pending}
            autoFocus
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      </Field>
      <Button onClick={() => verify(code)} disabled={pending || code.length !== 5}>
        {pending && <Loader2 className="animate-spin" />}
        ورود
      </Button>
      <div className="flex items-center justify-between text-sm">
        <Button variant="link" className="px-0" onClick={() => setStep("phone")} disabled={pending}>
          تغییر شماره
        </Button>
        <Button variant="link" className="px-0" onClick={requestCode} disabled={pending || resendIn > 0}>
          {resendIn > 0 ? `ارسال دوباره تا ${resendIn.toLocaleString("fa-IR")} ثانیه` : "ارسال دوباره کد"}
        </Button>
      </div>
    </div>
  );
}
